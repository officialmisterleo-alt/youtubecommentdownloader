import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, getUserTeam, getEffectivePlan } from '@/lib/teams'
import { getPlanFromPriceId } from '@/lib/stripe-prices'
import { Plus, Users, ExternalLink, FileText, ShieldCheck, Building2, BarChart3 } from 'lucide-react'
import QuotaBar from '@/components/QuotaBar'
import { getApiKeys } from '@/lib/youtube-api'
import { getErrorLog } from '@/lib/alerts'
import { StatCardSkeleton } from '@/components/skeletons/StatCardSkeleton'
import { TableRowSkeleton } from '@/components/skeletons/TableRowSkeleton'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'
import ApiKeyCard from '@/app/dashboard/ApiKeyCard'
import EnterpriseBanner from '@/app/dashboard/EnterpriseBanner'
import ProvisionForm from '@/app/admin/ProvisionForm'
import CopyEmailsButton from '@/app/dashboard/CopyEmailsButton'

// ── Admin types ────────────────────────────────────────────────────────────

type PlanBreakdown = Record<string, number>

type AdminStats = {
  totalUsers: number
  newUsersThisMonth: number
  activeUsersThisMonth: number
  totalExports: number
  exportsThisMonth: number
  totalComments: number
  activeSubscriptions: number
  planBreakdown: PlanBreakdown
  lastUpdated: string
}

type EnterpriseTeam = {
  id: string
  name: string
  owner_id: string
  owner_email: string | null
  created_at: string
  max_seats: number
  active_seats: number
  pending_invitations: number
  subscription: {
    plan: string
    status: string
    current_period_end: string | null
    stripe_customer_id: string | null
  } | null
  monthly_comments: number
}

type PendingProvision = {
  id: string
  email: string
  team_name: string
  max_seats: number
  created_at: string
}

// ── User-facing types ──────────────────────────────────────────────────────

type ExportRecord = {
  id: string
  video_url: string
  video_title: string
  channel_name: string
  comment_count: number
  format: string
  created_at: string
}

const FORMAT_COLORS: Record<string, string> = {
  CSV: 'text-green-400 bg-green-900/20 border-green-900/40',
  JSON: 'text-blue-400 bg-blue-900/20 border-blue-900/40',
  Excel: 'text-emerald-400 bg-emerald-900/20 border-emerald-900/40',
  HTML: 'text-orange-400 bg-orange-900/20 border-orange-900/40',
  TXT: 'text-[#888888] bg-white/[0.04] border-white/[0.07]',
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Admin data fetchers ────────────────────────────────────────────────────

async function fetchAdminStats(): Promise<AdminStats | null> {
  try {
    const service = createServiceClient()
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

    const [
      totalExportsRes,
      exportsThisMonthRes,
      totalCommentsRes,
      activeUsersRes,
      activeSubsRes,
      planBreakdownRes,
      usersRes,
    ] = await Promise.all([
      service.from('exports').select('*', { count: 'exact', head: true }),
      service.from('exports').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      service.from('exports').select('comment_count'),
      service.from('exports').select('user_id').gte('created_at', startOfMonth),
      service.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      service.from('subscriptions').select('plan').eq('status', 'active'),
      service.auth.admin.listUsers({ perPage: 1, page: 1 }),
    ])

    const totalComments = (totalCommentsRes.data ?? []).reduce(
      (sum: number, row: { comment_count?: number }) => sum + (row.comment_count ?? 0),
      0
    )

    const activeUserIds = new Set((activeUsersRes.data ?? []).map((r: { user_id: string }) => r.user_id))

    const planCounts: PlanBreakdown = {}
    for (const row of planBreakdownRes.data ?? []) {
      const plan = (row as { plan?: string }).plan ?? 'unknown'
      planCounts[plan] = (planCounts[plan] ?? 0) + 1
    }

    const totalUsers = (usersRes.data as any)?.total ?? (usersRes.data?.users?.length ?? 0)

    let newUsersThisMonth = 0
    const pageSize = 1000
    const totalPages = Math.ceil(totalUsers / pageSize)
    const startMs = new Date(startOfMonth).getTime()
    const pagePromises = []
    for (let p = 1; p <= Math.min(totalPages, 10); p++) {
      pagePromises.push(service.auth.admin.listUsers({ perPage: pageSize, page: p }))
    }
    const pages = await Promise.all(pagePromises)
    for (const page of pages) {
      for (const u of page.data?.users ?? []) {
        if (new Date(u.created_at).getTime() >= startMs) newUsersThisMonth++
      }
    }

    return {
      totalUsers,
      newUsersThisMonth,
      activeUsersThisMonth: activeUserIds.size,
      totalExports: totalExportsRes.count ?? 0,
      exportsThisMonth: exportsThisMonthRes.count ?? 0,
      totalComments,
      activeSubscriptions: activeSubsRes.count ?? 0,
      planBreakdown: planCounts,
      lastUpdated: now.toISOString().slice(0, 10),
    }
  } catch {
    return null
  }
}

async function fetchEnterpriseData(): Promise<{ teams: EnterpriseTeam[]; pending: PendingProvision[] }> {
  try {
    const service = createServiceClient()
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

    const [teamsRes, pendingRes] = await Promise.all([
      service
        .from('teams')
        .select('id, name, owner_id, plan, max_seats, created_at')
        .eq('plan', 'enterprise')
        .order('created_at', { ascending: false }),
      service
        .from('enterprise_provisions')
        .select('id, email, team_name, max_seats, created_at')
        .eq('claimed', false)
        .order('created_at', { ascending: false }),
    ])

    const pending: PendingProvision[] = (pendingRes.data ?? []).map((p: {
      id: string; email: string; team_name: string; max_seats: number; created_at: string
    }) => ({
      id: p.id,
      email: p.email,
      team_name: p.team_name,
      max_seats: p.max_seats,
      created_at: p.created_at,
    }))

    if (teamsRes.error || !teamsRes.data || teamsRes.data.length === 0) {
      return { teams: [], pending }
    }

    const teams = teamsRes.data
    const teamIds = teams.map((t: { id: string }) => t.id)
    const ownerIds = Array.from(new Set(teams.map((t: { owner_id: string }) => t.owner_id).filter(Boolean))) as string[]

    const [membersRes, subsRes, usageRes] = await Promise.all([
      service.from('team_members').select('team_id, status').in('team_id', teamIds),
      service.from('subscriptions').select('user_id, plan, status, current_period_end, stripe_customer_id').in('user_id', ownerIds),
      service.from('exports').select('user_id, comment_count').in('user_id', ownerIds).gte('created_at', startOfMonth),
    ])

    const ownerEmails: Record<string, string> = {}
    await Promise.all(
      ownerIds.map(async (ownerId) => {
        try {
          const { data } = await service.auth.admin.getUserById(ownerId)
          if (data?.user?.email) ownerEmails[ownerId] = data.user.email
        } catch { /* non-fatal */ }
      })
    )

    const membersByTeam: Record<string, { active: number; pending: number }> = {}
    for (const m of membersRes.data ?? []) {
      const entry = membersByTeam[m.team_id] ?? { active: 0, pending: 0 }
      if (m.status === 'active') entry.active++
      else if (m.status === 'pending' || m.status === 'invited') entry.pending++
      membersByTeam[m.team_id] = entry
    }

    const subsByOwner: Record<string, EnterpriseTeam['subscription']> = {}
    for (const s of subsRes.data ?? []) {
      subsByOwner[s.user_id] = {
        plan: s.plan,
        status: s.status,
        current_period_end: s.current_period_end ?? null,
        stripe_customer_id: s.stripe_customer_id ?? null,
      }
    }

    const usageByOwner: Record<string, number> = {}
    for (const e of usageRes.data ?? []) {
      usageByOwner[e.user_id] = (usageByOwner[e.user_id] ?? 0) + (e.comment_count ?? 0)
    }

    const hydratedTeams: EnterpriseTeam[] = teams.map((team: { id: string; name: string; owner_id: string; plan: string; max_seats: number; created_at: string }) => ({
      id: team.id,
      name: team.name,
      owner_id: team.owner_id,
      owner_email: ownerEmails[team.owner_id] ?? null,
      created_at: team.created_at,
      max_seats: team.max_seats ?? 10,
      active_seats: membersByTeam[team.id]?.active ?? 0,
      pending_invitations: membersByTeam[team.id]?.pending ?? 0,
      subscription: subsByOwner[team.owner_id] ?? null,
      monthly_comments: usageByOwner[team.owner_id] ?? 0,
    }))

    return { teams: hydratedTeams, pending }
  } catch {
    return { teams: [], pending: [] }
  }
}

// ── Stripe sync ────────────────────────────────────────────────────────────

async function syncFromCheckoutSession(sessionId: string, userId: string) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items']
    })

    if (session.payment_status !== 'paid' && session.status !== 'complete') return
    if (session.metadata?.user_id !== userId) return

    const priceId = session.line_items?.data?.[0]?.price?.id
    const plan = priceId ? getPlanFromPriceId(priceId) : 'pro'
    const isLifetime = plan === 'lifetime'

    const supabase = createServiceClient()
    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan: isLifetime ? 'pro' : plan,
      status: 'active',
      lifetime: isLifetime,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
      stripe_subscription_id: typeof session.subscription === 'string' ? session.subscription : (session.subscription as Stripe.Subscription | null)?.id ?? null,
    }, { onConflict: 'user_id' })
  } catch (e) {
    console.error('syncFromCheckoutSession error:', e)
  }
}

// ── Admin sub-components ───────────────────────────────────────────────────

function AdminStatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-xl p-5">
      <div className="text-2xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[#888888] text-xs">{label}</div>
      {sub && <div className="text-[#555555] text-xs mt-1">{sub}</div>}
    </div>
  )
}

function AdminStatCardSkeleton() {
  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-xl p-5 animate-pulse">
      <div className="h-7 w-20 bg-white/[0.07] rounded mb-2" />
      <div className="h-3 w-28 bg-white/[0.05] rounded" />
    </div>
  )
}

const PLAN_COLORS: Record<string, string> = {
  free: 'text-[#888888]',
  pro: 'text-blue-400',
  business: 'text-purple-400',
  enterprise: 'text-yellow-400',
  lifetime: 'text-green-400',
}
const PLAN_ORDER = ['free', 'pro', 'business', 'enterprise', 'lifetime']

async function TopStatsSection() {
  const stats = await fetchAdminStats()

  if (!stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <AdminStatCardSkeleton key={i} />)}
      </div>
    )
  }

  const planSummary = PLAN_ORDER
    .filter(p => (stats.planBreakdown[p] ?? 0) > 0)
    .map(p => `${stats.planBreakdown[p]} ${p}`)
    .join(' · ')

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <AdminStatCard label="Total Users" value={stats.totalUsers} sub={`+${stats.newUsersThisMonth} this month`} />
        <AdminStatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          sub={planSummary || undefined}
        />
        <AdminStatCard label="Exports This Month" value={stats.exportsThisMonth} sub={`${stats.totalExports.toLocaleString()} all-time`} />
        <AdminStatCard label="Comments Downloaded" value={stats.totalComments} />
      </div>

      {/* Plan breakdown row */}
      {Object.keys(stats.planBreakdown).length > 0 && (
        <div className="bg-[#171717] border border-white/[0.07] rounded-xl px-5 py-4 flex flex-wrap items-center gap-5">
          <span className="text-[#888888] text-xs font-medium">Plan Breakdown</span>
          {PLAN_ORDER.filter(p => (stats.planBreakdown[p] ?? 0) > 0).map(plan => (
            <div key={plan} className="flex items-baseline gap-1">
              <span className={`text-sm font-bold ${PLAN_COLORS[plan] ?? 'text-white'}`}>
                {stats.planBreakdown[plan]}
              </span>
              <span className="text-[#555555] text-xs capitalize">{plan}</span>
            </div>
          ))}
          {Object.keys(stats.planBreakdown)
            .filter(p => !PLAN_ORDER.includes(p))
            .map(plan => (
              <div key={plan} className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white">{stats.planBreakdown[plan]}</span>
                <span className="text-[#555555] text-xs capitalize">{plan}</span>
              </div>
            ))}
          <span className="ml-auto text-[#444444] text-xs">Updated {stats.lastUpdated}</span>
        </div>
      )}
    </div>
  )
}

function SubStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'text-green-400 bg-green-900/20 border-green-900/40',
    past_due: 'text-yellow-400 bg-yellow-900/20 border-yellow-900/40',
    canceled: 'text-red-400 bg-red-900/20 border-red-900/40',
    trialing: 'text-blue-400 bg-blue-900/20 border-blue-900/40',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${styles[status] ?? 'text-[#888888] bg-white/[0.04] border-white/[0.07]'}`}>
      {status}
    </span>
  )
}

async function EnterpriseSection() {
  const { teams, pending } = await fetchEnterpriseData()
  const totalCount = teams.length + pending.length

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
      <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">Enterprise Accounts</h2>
          <span className="text-xs text-[#555555]">admin</span>
          {totalCount > 0 && (
            <span className="text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-900/40 px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
          {pending.length > 0 && (
            <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded-full">
              {pending.length} pending
            </span>
          )}
        </div>
        <Link href="/api/admin/enterprise" target="_blank" className="text-red-400 hover:text-red-300 text-xs">
          Raw JSON →
        </Link>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 bg-[#0a0a0a] border border-white/[0.07] rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-5 h-5 text-[#555555]" />
          </div>
          <p className="text-[#888888] text-sm font-medium mb-1">No Enterprise accounts yet</p>
          <p className="text-[#555555] text-xs">Enterprise teams will appear here once created.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a]">
              <tr>
                {['Team Name', 'Owner', 'Seats', 'Plan Status', 'Renewal', 'Stripe Customer', 'Usage / mo'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#888888] font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Active enterprise teams */}
              {teams.map(team => {
                const seatPct = team.max_seats > 0 ? Math.min((team.active_seats / team.max_seats) * 100, 100) : 0
                const stripeId = team.subscription?.stripe_customer_id ?? null
                const truncatedStripe = stripeId ? stripeId.slice(0, 14) + '…' : '—'

                return (
                  <tr key={team.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white text-xs font-medium">{team.name}</div>
                      <div className="text-[#555555] text-xs">{timeAgo(team.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <span className="text-[#aaaaaa] text-xs truncate block" title={team.owner_email ?? undefined}>
                        {team.owner_email ?? team.owner_id.slice(0, 8) + '…'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 bg-white/[0.05] rounded-full h-1.5 min-w-[48px]">
                          <div
                            className="bg-yellow-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${seatPct}%` }}
                          />
                        </div>
                        <span className="text-xs text-white whitespace-nowrap">
                          {team.active_seats}
                          <span className="text-[#555555]">/{team.max_seats}</span>
                        </span>
                      </div>
                      {team.pending_invitations > 0 && (
                        <div className="text-[#666666] text-xs mt-0.5">{team.pending_invitations} pending</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {team.subscription ? (
                        <SubStatusBadge status={team.subscription.status} />
                      ) : (
                        <span className="text-[#555555] text-xs">No subscription</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#888888] text-xs whitespace-nowrap">
                      {formatDate(team.subscription?.current_period_end ?? null)}
                    </td>
                    <td className="px-4 py-3">
                      {stripeId ? (
                        <span className="text-[#888888] text-xs font-mono" title={stripeId}>
                          {truncatedStripe}
                        </span>
                      ) : (
                        <span className="text-[#555555] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#888888] text-xs whitespace-nowrap">
                      {team.monthly_comments > 0
                        ? team.monthly_comments.toLocaleString() + ' cmts'
                        : '—'}
                    </td>
                  </tr>
                )
              })}

              {/* Pending provision slots */}
              {pending.map(provision => (
                <tr key={provision.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors opacity-70">
                  <td className="px-4 py-3">
                    <div className="text-white text-xs font-medium">{provision.team_name}</div>
                    <div className="text-[#555555] text-xs">{timeAgo(provision.created_at)}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <span className="text-[#aaaaaa] text-xs truncate block" title={provision.email}>
                      {provision.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#888888] text-xs">0/{provision.max_seats}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded border text-blue-400 bg-blue-900/20 border-blue-900/40">
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#555555] text-xs">—</td>
                  <td className="px-4 py-3 text-[#555555] text-xs">—</td>
                  <td className="px-4 py-3 text-[#555555] text-xs">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ApiHealthSection() {
  const configuredKeys = getApiKeys()
  const recentErrors = getErrorLog()
  const lastError = recentErrors[recentErrors.length - 1]

  const keyDetails = []
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`YOUTUBE_API_KEY_${i}`]
    keyDetails.push({
      index: i,
      configured: Boolean(key && key.trim() !== '' && !key.startsWith('PLACEHOLDER')),
    })
  }

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">API Health</h2>
          <span className="text-xs text-[#555555]">admin</span>
        </div>
        <Link href="/api/admin/api-health" target="_blank" className="text-red-400 hover:text-red-300 text-xs">
          Raw JSON →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Key status */}
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-[#888888] mb-3">YouTube API Keys</div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-white">{configuredKeys.length}</span>
            <span className="text-[#555555] text-xs">/ 5 configured</span>
          </div>
          <div className="flex gap-1.5">
            {keyDetails.map(k => (
              <div
                key={k.index}
                title={`Key ${k.index}: ${k.configured ? 'active' : 'not set'}`}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                  k.configured
                    ? 'bg-green-900/30 border border-green-900/50 text-green-400'
                    : 'bg-white/[0.03] border border-white/[0.05] text-[#333333]'
                }`}
              >
                {k.index}
              </div>
            ))}
          </div>
        </div>

        {/* Error log */}
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-[#888888] mb-3">Recent Errors</div>
          {recentErrors.length === 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-500/80 text-xs">No errors logged this session</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {[...recentErrors].reverse().slice(0, 5).map((err, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1 shrink-0" />
                  <div>
                    <div className="text-yellow-400/80 text-xs font-medium">{err.event}</div>
                    <div className="text-[#555555] text-xs">{err.timestamp.slice(0, 16).replace('T', ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentErrors.length > 5 && (
            <div className="text-[#444444] text-xs mt-2">{recentErrors.length - 5} more errors</div>
          )}
        </div>
      </div>

      {lastError && (
        <div className="mt-3 text-xs text-[#555555]">
          Last alert: <span className="text-yellow-500/70">{lastError.event}</span>
          {' '}at {lastError.timestamp.slice(0, 16).replace('T', ' ')}
          {lastError.endpoint && <> · endpoint: <code className="text-[#777777]">{lastError.endpoint}</code></>}
        </div>
      )}
    </div>
  )
}

function AdminRawDataLinks() {
  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[#888888]" />
        <h2 className="font-semibold font-jakarta text-[#e5e2e1] text-sm">Raw Data</h2>
        <span className="text-xs text-[#555555]">admin</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          { href: '/api/admin/stats', label: 'Stats JSON' },
          { href: '/api/admin/enterprise', label: 'Enterprise JSON' },
          { href: '/api/admin/api-health', label: 'API Health JSON' },
          { href: '/api/admin/free-users', label: 'Free Users JSON' },
        ].map(link => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            className="text-xs text-red-400 hover:text-red-300 bg-red-900/10 border border-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            {link.label} →
          </Link>
        ))}
        <CopyEmailsButton />
      </div>
    </div>
  )
}

// ── Admin skeleton wrappers ────────────────────────────────────────────────

function TopStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => <AdminStatCardSkeleton key={i} />)}
    </div>
  )
}

function EnterpriseSkeleton() {
  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
      <div className="p-5 border-b border-white/[0.07]">
        <div className="h-5 w-44 bg-white/5 animate-pulse rounded" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a]">
            <tr>
              {['Team Name', 'Owner', 'Seats', 'Plan Status', 'Renewal', 'Stripe Customer', 'Usage / mo'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[#888888] font-medium text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-t border-white/[0.05]">
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-4 py-4">
                    <div className="h-3 bg-white/[0.05] rounded animate-pulse" style={{ width: '75%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── User-facing async data sub-components ─────────────────────────────────

async function PastDueBanner({ userId }: { userId: string }) {
  try {
    const serviceClient = createServiceClient()
    const { data: sub } = await serviceClient
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .single()
    if (sub?.status !== 'past_due') return null
  } catch {
    return null
  }

  return (
    <div className="bg-yellow-950/50 border border-yellow-700/40 text-yellow-300 rounded-xl px-5 py-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 text-sm font-medium">
        Your payment failed. Please update your billing info to restore access.
      </div>
      <Link
        href="/api/stripe/portal"
        className="shrink-0 bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        Update billing →
      </Link>
    </div>
  )
}

async function PlanBadge({ userId }: { userId: string }) {
  let planLabel = 'Free Plan'
  try {
    const serviceClient = createServiceClient()
    const [{ data: sub }, userTeam] = await Promise.all([
      serviceClient.from('subscriptions').select('plan, status, lifetime').eq('user_id', userId).single(),
      getUserTeam(userId),
    ])
    if (sub?.lifetime) {
      planLabel = 'Lifetime'
    } else if (sub?.status === 'active' && sub.plan !== 'free') {
      planLabel = sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) + ' Plan'
      if (userTeam && (sub.plan === 'free' || sub.plan === 'pro')) {
        const teamPlan = String(userTeam.team?.plan ?? 'free')
        if (teamPlan === 'business' || teamPlan === 'enterprise') {
          planLabel = teamPlan.charAt(0).toUpperCase() + teamPlan.slice(1) + ' Plan'
        }
      }
    } else if (userTeam) {
      const teamPlan = String(userTeam.team?.plan ?? 'free')
      if (teamPlan === 'business' || teamPlan === 'enterprise') {
        planLabel = teamPlan.charAt(0).toUpperCase() + teamPlan.slice(1) + ' Plan'
      }
    }
  } catch { /* non-fatal */ }

  return (
    <span className="bg-[#171717] border border-white/[0.07] text-[#888888] text-xs px-3 py-1 rounded-full">
      {planLabel}
    </span>
  )
}

async function DashboardStats({ userId }: { userId: string }) {
  const supabase = await createClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let exportsThisMonth = 0
  let commentsThisMonth = 0
  let totalExports = 0

  try {
    const [countAllRes, countMonthRes, sumMonthRes] = await Promise.all([
      supabase.from('exports').select('*', { count: 'exact', head: true }),
      supabase.from('exports').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
      supabase.from('exports').select('comment_count').gte('created_at', startOfMonth),
    ])
    totalExports = countAllRes.count ?? 0
    exportsThisMonth = countMonthRes.count ?? 0
    commentsThisMonth = (sumMonthRes.data ?? []).reduce((s, e) => s + (e.comment_count ?? 0), 0)
  } catch { /* non-fatal */ }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {[
        { label: 'Exports This Month', value: exportsThisMonth.toLocaleString() },
        { label: 'Comments Downloaded', value: commentsThisMonth.toLocaleString() },
        { label: 'Total Exports', value: totalExports.toLocaleString() },
      ].map(s => (
        <div key={s.label} className="bg-[#171717] border border-white/[0.07] rounded-xl p-5">
          <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
          <div className="text-[#888888] text-xs">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

async function DashboardExports({ userId }: { userId: string }) {
  const supabase = await createClient()
  let recentExports: ExportRecord[] = []
  let totalExports = 0

  try {
    const [{ data }, countRes] = await Promise.all([
      supabase.from('exports').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('exports').select('*', { count: 'exact', head: true }),
    ])
    recentExports = (data as ExportRecord[]) ?? []
    totalExports = countRes.count ?? 0
  } catch { /* table may not exist yet */ }

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
      <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
        <h2 className="font-semibold font-jakarta text-[#e5e2e1]">Recent Exports</h2>
        {totalExports > 10 && (
          <span className="text-[#888888] text-xs">{totalExports.toLocaleString()} total</span>
        )}
      </div>

      {recentExports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 bg-[#0a0a0a] border border-white/[0.07] rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-[#888888]" />
          </div>
          <p className="text-[#888888] text-sm font-medium mb-1">No exports yet</p>
          <p className="text-[#888888] text-xs mb-5">Head to the Tool to export your first comment thread.</p>
          <Link href="/tool" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
            Go to Tool
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0a0a0a]">
              <tr>
                {['Video', 'Channel', 'Comments', 'Format', 'When'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#888888] font-medium text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentExports.map(e => (
                <tr key={e.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 max-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs truncate" title={e.video_title || e.video_url}>
                        {e.video_title || e.video_url || '—'}
                      </span>
                      {e.video_url && (
                        <a href={e.video_url} target="_blank" rel="noopener noreferrer" className="text-[#555555] hover:text-[#888888] shrink-0">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#888888] text-xs whitespace-nowrap max-w-[140px] truncate">
                    {e.channel_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-white text-xs whitespace-nowrap font-medium">
                    {(e.comment_count ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${FORMAT_COLORS[e.format] ?? FORMAT_COLORS.TXT}`}>
                      {e.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#888888] text-xs whitespace-nowrap">
                    {timeAgo(e.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

async function DashboardTeamSection({
  userId,
  displayName,
  userEmail,
}: {
  userId: string
  displayName: string | null
  userEmail: string | undefined
}) {
  let activePlan = 'free'
  let userTeam: Awaited<ReturnType<typeof getUserTeam>> = null
  let existingKey: { prefix: string; createdAt: string; lastUsedAt: string | null } | null = null

  try {
    const serviceClient = createServiceClient()
    const [effectivePlan, team, keyRes] = await Promise.all([
      getEffectivePlan(userId),
      getUserTeam(userId),
      serviceClient
        .from('api_keys')
        .select('key_prefix, created_at, last_used_at')
        .eq('user_id', userId)
        .maybeSingle(),
    ])
    activePlan = effectivePlan
    userTeam = team
    if (keyRes.data) {
      existingKey = {
        prefix: keyRes.data.key_prefix as string,
        createdAt: keyRes.data.created_at as string,
        lastUsedAt: (keyRes.data.last_used_at as string | null) ?? null,
      }
    }
  } catch { /* non-fatal */ }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ApiKeyCard effectivePlan={activePlan} existingKey={existingKey} />

      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">Team Members</h2>
        </div>
        <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 mb-3">
          <div className="w-8 h-8 bg-red-900 rounded-full flex items-center justify-center text-red-200 text-xs font-bold">
            {displayName?.[0]?.toUpperCase() || userEmail?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-white text-sm">{displayName || userEmail || 'Your Account'}</div>
            <div className="text-[#888888] text-xs">{userTeam?.role === 'member' ? 'Member' : 'Owner'}</div>
          </div>
        </div>
        {userTeam?.role === 'member' ? (
          <div>
            <p className="text-[#888888] text-xs mb-2">You&apos;re a member of {String(userTeam.team?.name ?? 'a team')}</p>
            <Link href="/dashboard/team" className="text-red-400 hover:text-red-300 text-xs">View team →</Link>
          </div>
        ) : (activePlan === 'business' || activePlan === 'enterprise') ? (
          <Link href="/dashboard/team" className="text-red-400 hover:text-red-300 text-xs">
            {userTeam ? 'Manage team →' : 'Set up your team →'}
          </Link>
        ) : (
          <p className="text-[#888888] text-xs">
            Team seats available on Business &amp; Enterprise.{' '}
            <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade</Link>
          </p>
        )}
      </div>
    </div>
  )
}

// ── Skeleton fallbacks ─────────────────────────────────────────────────────

function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  )
}

function ExportsSkeleton() {
  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
      <div className="p-5 border-b border-white/[0.07]">
        <div className="h-5 w-32 bg-white/5 animate-pulse rounded" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0a0a0a]">
            <tr>
              {['Video', 'Channel', 'Comments', 'Format', 'When'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[#888888] font-medium text-xs whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TeamSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string; session_id?: string }
}) {
  // Auth check — must complete before any streaming starts
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Side effect: sync Stripe session if redirected from checkout
  if (searchParams.upgraded === 'true' && searchParams.session_id) {
    await syncFromCheckoutSession(searchParams.session_id, user.id)
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || null
  const firstName = displayName ? displayName.split(' ')[0] : null
  const isAdmin = user.email === process.env.ADMIN_EMAIL

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">

        {/* Header — renders immediately */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-jakarta text-[#e5e2e1]">
                Welcome back{firstName ? `, ${firstName}` : (user?.email ? `, ${user.email.split('@')[0]}` : '')}
              </h1>
              <Suspense fallback={<span className="h-6 w-20 bg-white/5 animate-pulse rounded-full inline-block" />}>
                <PlanBadge userId={user.id} />
              </Suspense>
            </div>
            <p className="text-[#888888] text-sm mt-1">Here&apos;s your export activity</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/tool" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Download Comments
            </Link>
          </div>
        </div>

        {/* Past-due warning */}
        <Suspense fallback={null}>
          <PastDueBanner userId={user.id} />
        </Suspense>

        {/* Enterprise status banner */}
        <Suspense fallback={null}>
          <EnterpriseBanner userId={user.id} />
        </Suspense>

        {/* Admin sections — full platform view, rendered before personal stats */}
        {isAdmin && (
          <>
            {/* Admin section header */}
            <div className="flex items-center gap-3 mt-4 mb-6 pt-6 border-t border-white/[0.07]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-jakarta text-[#e5e2e1]">Admin Overview</h2>
                  <span className="bg-yellow-900/30 text-yellow-400 border border-yellow-900/40 text-xs px-2.5 py-1 rounded-full font-medium">admin</span>
                </div>
                <p className="text-[#888888] text-xs mt-0.5">Platform overview</p>
              </div>
            </div>

            {/* Top stats: 4-column grid + plan breakdown */}
            <Suspense fallback={<TopStatsSkeleton />}>
              <TopStatsSection />
            </Suspense>

            {/* Enterprise accounts table */}
            <Suspense fallback={<EnterpriseSkeleton />}>
              <EnterpriseSection />
            </Suspense>

            {/* Provision enterprise account form */}
            <ProvisionForm />

            {/* API health — synchronous, reads env vars and in-memory log */}
            <ApiHealthSection />

            {/* Raw data links */}
            <AdminRawDataLinks />
          </>
        )}

        {/* Personal stats */}
        <Suspense fallback={<StatsRowSkeleton />}>
          <DashboardStats userId={user.id} />
        </Suspense>

        {/* Quota */}
        <div className="mb-8">
          <QuotaBar />
        </div>

        {/* Recent Exports */}
        <Suspense fallback={<ExportsSkeleton />}>
          <DashboardExports userId={user.id} />
        </Suspense>

        {/* API Key + Team */}
        <Suspense fallback={<TeamSectionSkeleton />}>
          <DashboardTeamSection
            userId={user.id}
            displayName={displayName}
            userEmail={user.email}
          />
        </Suspense>

      </div>
    </div>
  )
}
