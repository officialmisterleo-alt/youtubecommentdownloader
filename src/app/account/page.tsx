import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'
import { User as UserIcon, CreditCard, Users } from 'lucide-react'
import { SignOutButton } from '@/components/account/SignOutButton'
import { ManageBillingButton } from '@/components/account/ManageBillingButton'
import { SecuritySection } from '@/components/account/SecuritySection'
import { LeaveTeamSection } from '@/components/account/LeaveTeamSection'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'

// ── Async data sub-components ──────────────────────────────────────────────

async function AccountPlanCard({ userId }: { userId: string }) {
  let planLabel = 'Free'
  let effectivePlan = 'free'
  let isLifetime = false
  let isPaidActive = false
  let periodEnd: string | null = null
  let isTeamMember = false

  try {
    const serviceClient = createServiceClient()

    // Get own subscription
    const { data: sub } = await serviceClient
      .from('subscriptions')
      .select('plan, status, current_period_end, lifetime')
      .eq('user_id', userId)
      .single()

    isLifetime = sub?.lifetime === true
    const ownPlan = (sub?.status === 'active' ? sub.plan : 'free') ?? 'free'
    effectivePlan = ownPlan
    isPaidActive = !!(sub && sub.plan !== 'free' && sub.status === 'active')
    if (isPaidActive && sub?.current_period_end) {
      periodEnd = new Date(sub.current_period_end).toLocaleDateString()
    }

    // Check team membership for effective plan
    const { data: membership } = await serviceClient
      .from('team_members')
      .select('id, role, status, teams(id, name, plan, owner_id)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membership) {
      const team = membership.teams as unknown as { id: string; name: string; plan: string } | null
      const teamPlan = team?.plan ?? 'free'
      isTeamMember = membership.role === 'member'
      if ((effectivePlan === 'free' || effectivePlan === 'pro') && (teamPlan === 'business' || teamPlan === 'enterprise')) {
        effectivePlan = teamPlan
      }
    }

    // Build plan label
    if (isLifetime) {
      planLabel = 'Pro (Lifetime)'
    } else if (isTeamMember && effectivePlan !== ownPlan) {
      const ep = effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1)
      const team = (await serviceClient
        .from('team_members')
        .select('teams(name)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()).data
      const teamName = (team?.teams as unknown as { name?: string } | null)?.name ?? 'team'
      planLabel = `${ep} (via ${teamName})`
    } else {
      planLabel = effectivePlan.charAt(0).toUpperCase() + effectivePlan.slice(1)
    }
  } catch { /* non-fatal */ }

  return (
    <div className="px-6 py-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <CreditCard className="w-4 h-4 text-[#555555] shrink-0" />
        <div>
          <div className="text-xs text-[#555555] mb-0.5">Current Plan</div>
          <div className="text-white text-sm">{planLabel}</div>
          {isPaidActive && (
            <div className="text-xs text-[#555555] mt-0.5">
              Status: active{periodEnd ? ` · Renews ${periodEnd}` : ''}
            </div>
          )}
        </div>
      </div>
      {effectivePlan === 'free' && !isTeamMember ? (
        <Link
          href="/pricing"
          className="inline-flex items-center text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Upgrade
        </Link>
      ) : !isLifetime && !isTeamMember ? (
        <ManageBillingButton />
      ) : null}
    </div>
  )
}

async function AccountTeamCard({ userId }: { userId: string }) {
  let memberId: string | null = null
  let teamName: string | null = null
  let role: string | null = null

  try {
    const serviceClient = createServiceClient()
    const { data: membership } = await serviceClient
      .from('team_members')
      .select('id, role, status, teams(id, name, plan, owner_id)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membership) {
      memberId = membership.id as string
      role = membership.role as string
      const team = membership.teams as unknown as { name?: string } | null
      teamName = team?.name ?? null
    }
  } catch { /* non-fatal */ }

  if (!memberId) return null

  const isTeamMember = role === 'member'

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
      <div className="p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-[#555555] shrink-0" />
          <div>
            <div className="text-xs text-[#555555] mb-0.5">Team</div>
            {isTeamMember ? (
              <div className="text-white text-sm">
                {teamName ?? 'Your Team'}
                <span className="text-[#555555] ml-2 text-xs capitalize">{role}</span>
              </div>
            ) : (
              <div className="text-white text-sm">{teamName ?? 'Your Team'}</div>
            )}
          </div>
        </div>
        {isTeamMember ? (
          <LeaveTeamSection memberId={memberId} />
        ) : (
          <Link
            href="/dashboard/team"
            className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Manage Team →
          </Link>
        )}
      </div>
    </div>
  )
}

function PlanRowSkeleton() {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-white/5 animate-pulse rounded" />
        <div>
          <div className="h-3 w-20 bg-white/5 animate-pulse rounded mb-1" />
          <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function AccountPage() {
  // Auth check — must complete before any streaming starts
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || null
  const initials = displayName ? displayName[0].toUpperCase() : (user.email?.[0]?.toUpperCase() ?? 'U')
  const isGoogleUser = user.app_metadata?.provider === 'google'

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold font-jakarta text-[#e5e2e1] mb-8">Account</h1>

        {/* Profile + Plan card — profile renders immediately, plan row streams in */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
          {/* Profile header — renders immediately */}
          <div className="p-6 border-b border-white/[0.07] flex items-center gap-4">
            <div className="w-14 h-14 bg-red-900 rounded-full flex items-center justify-center text-red-200 text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <div className="text-white font-medium">{displayName || user.email}</div>
              <div className="text-[#555555] text-xs mt-0.5">{isGoogleUser ? 'Signed in with Google' : 'Signed in with email'}</div>
            </div>
          </div>

          {/* Email row — renders immediately */}
          <div className="px-6 py-4 flex items-center gap-3 border-b border-white/[0.07]">
            <UserIcon className="w-4 h-4 text-[#555555] shrink-0" />
            <div>
              <div className="text-xs text-[#555555] mb-0.5">Email</div>
              <div className="text-white text-sm">{user.email}</div>
            </div>
          </div>

          {/* Plan row — streams in */}
          <Suspense fallback={<PlanRowSkeleton />}>
            <AccountPlanCard userId={user.id} />
          </Suspense>
        </div>

        {/* Security card — no data fetch needed, renders immediately (email/password users only) */}
        {!isGoogleUser && <SecuritySection />}

        {/* Team card — streams in (only shown if user is a team member) */}
        <Suspense fallback={null}>
          <AccountTeamCard userId={user.id} />
        </Suspense>

        {/* Sign out */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-sm font-semibold font-jakarta text-[#e5e2e1] mb-1">Sign Out</h2>
          <p className="text-[#555555] text-xs mb-4">You&apos;ll be redirected to the home page.</p>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
