import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, getUserTeam } from '@/lib/teams'
import { Plus, Key, Users, ExternalLink, FileText, ShieldCheck } from 'lucide-react'
import QuotaBar from '@/components/QuotaBar'
import AdminStatsWidget from '@/components/AdminStatsWidget'
import { getApiKeys } from '@/lib/youtube-api'
import { getErrorLog } from '@/lib/alerts'
import { StatCardSkeleton } from '@/components/skeletons/StatCardSkeleton'
import { TableRowSkeleton } from '@/components/skeletons/TableRowSkeleton'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'

function AdminApiHealthWidget() {
  const configuredKeys = getApiKeys()
  const recentErrors = getErrorLog()
  const lastError = recentErrors[recentErrors.length - 1]

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1] text-sm">API Health</h2>
          <span className="text-xs text-[#555555]">admin</span>
        </div>
        <Link href="/api/admin/api-health" target="_blank" className="text-red-400 hover:text-red-300 text-xs">
          Raw JSON →
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <span className="text-white font-semibold">{configuredKeys.length}</span>
          <span className="text-[#888888] text-xs ml-1">/ 5 keys configured</span>
        </div>
        {lastError && (
          <div className="text-xs text-yellow-500/80 truncate max-w-xs">
            Last alert: {lastError.event} — {lastError.timestamp.slice(0, 16).replace('T', ' ')}
          </div>
        )}
        {!lastError && (
          <div className="text-xs text-green-500/70">No errors logged this session</div>
        )}
      </div>
    </div>
  )
}

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

async function syncFromCheckoutSession(sessionId: string, userId: string) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items']
    })

    if (session.payment_status !== 'paid' && session.status !== 'complete') return
    if (session.metadata?.user_id !== userId) return

    const priceId = session.line_items?.data?.[0]?.price?.id
    const planMap: Record<string, string> = {
      [process.env.STRIPE_PRICE_PRO_MONTHLY || '']: 'pro',
      [process.env.STRIPE_PRICE_PRO_ANNUAL || '']: 'pro',
      [process.env.STRIPE_PRICE_PRO || '']: 'pro',
      [process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '']: 'business',
      [process.env.STRIPE_PRICE_BUSINESS_ANNUAL || '']: 'business',
      [process.env.STRIPE_PRICE_BUSINESS || '']: 'business',
      [process.env.STRIPE_PRICE_LIFETIME || '']: 'lifetime',
    }
    const plan = priceId ? (planMap[priceId] || 'pro') : 'pro'
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

// ── Async data sub-components ──────────────────────────────────────────────

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

  try {
    const serviceClient = createServiceClient()
    const [{ data: sub }, team] = await Promise.all([
      serviceClient.from('subscriptions').select('plan, status, lifetime').eq('user_id', userId).single(),
      getUserTeam(userId),
    ])
    userTeam = team
    if (sub?.lifetime) {
      activePlan = sub.plan || 'pro'
    } else if (sub?.status === 'active' && sub.plan !== 'free') {
      activePlan = sub.plan
    }
    if (userTeam && (activePlan === 'free' || activePlan === 'pro')) {
      const teamPlan = String(userTeam.team?.plan ?? 'free')
      if (teamPlan === 'business' || teamPlan === 'enterprise') {
        activePlan = teamPlan
      }
    }
  } catch { /* non-fatal */ }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">API Key</h2>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mb-3">
          <code className="text-[#888888] text-xs flex-1">••••••••••••••••••••••••••••••</code>
        </div>
        <p className="text-[#888888] text-xs">
          Available on Enterprise plans.{' '}
          <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade</Link>
        </p>
      </div>

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
  const isAdmin = user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

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

        {/* Stats */}
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

        {/* Admin: Stats + API Health */}
        {isAdmin && (
          <>
            <AdminStatsWidget />
            <AdminApiHealthWidget />
          </>
        )}

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
