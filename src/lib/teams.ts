import { createServerClient } from '@supabase/ssr'

/** Creates a service-role Supabase client that bypasses RLS */
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

/**
 * Returns the effective plan for a user, factoring in team membership.
 * If the user has no active personal subscription but is an active member
 * of a Business/Enterprise team, they inherit that team's plan.
 */
export async function getEffectivePlan(userId: string): Promise<string> {
  const serviceClient = createServiceClient()

  // Check user's own subscription first
  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('plan, status, lifetime')
    .eq('user_id', userId)
    .single()

  let ownPlan = sub?.status === 'active' ? sub.plan : 'free'
  // Lifetime deal guarantees at least Pro, even if a later subscription lapses
  if (sub?.lifetime) ownPlan = higherPlan(ownPlan, 'pro')
  if (ownPlan === 'business' || ownPlan === 'enterprise') return ownPlan

  // Check if user is an active member of a business/enterprise team
  const { data: membership } = await serviceClient
    .from('team_members')
    .select('status, teams(plan)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (membership?.status === 'active') {
    const teamPlan = (membership.teams as { plan?: string } | null)?.plan
    if (teamPlan === 'business' || teamPlan === 'enterprise') return higherPlan(ownPlan, teamPlan)
  }

  return ownPlan
}

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2, enterprise: 3 }

function higherPlan(a: string, b: string): string {
  return (PLAN_RANK[b] ?? 0) > (PLAN_RANK[a] ?? 0) ? b : a
}

export const PLAN_MAX_SEATS: Record<string, number> = {
  business: 3,
  enterprise: 10,
}

/**
 * Teams take their owner's personal plan. Call after any change to the owner's
 * subscription so a cancelled or downgraded owner stops granting Business /
 * Enterprise to the team (getEffectivePlan ignores team plans below Business).
 */
export async function syncOwnedTeamPlan(ownerId: string): Promise<void> {
  const serviceClient = createServiceClient()
  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', ownerId)
    .maybeSingle()
  const plan = sub?.status === 'active' ? sub.plan : 'free'

  const { data: teams } = await serviceClient
    .from('teams')
    .select('id, plan, max_seats')
    .eq('owner_id', ownerId)

  for (const team of teams ?? []) {
    if (team.plan === plan) continue
    // Enterprise seat counts can be custom, so only reset them when dropping to Business
    const maxSeats = plan === 'business' ? PLAN_MAX_SEATS.business : team.max_seats
    await serviceClient
      .from('teams')
      .update({ plan, max_seats: maxSeats, updated_at: new Date().toISOString() })
      .eq('id', team.id)
  }
}

/** Returns the team where the user is an admin (or null) */
export async function getAdminTeam(userId: string) {
  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('team_members')
    .select('team_id, role, teams(*)')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('status', 'active')
    .single()
  return data ? (data.teams as unknown as Record<string, unknown> | null) : null
}

/** Returns the team the user belongs to (any role), or null */
export async function getUserTeam(userId: string) {
  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('team_members')
    .select('role, status, teams(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  return data
    ? { role: data.role as string, status: data.status as string, team: data.teams as unknown as Record<string, unknown> | null }
    : null
}

/** Counts active (non-deactivated) seats used in a team */
export async function countUsedSeats(teamId: string): Promise<number> {
  const serviceClient = createServiceClient()
  const { count } = await serviceClient
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('status', 'active')
  return count ?? 0
}
