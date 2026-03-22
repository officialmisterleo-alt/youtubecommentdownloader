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

  // Lifetime deal counts as active pro
  if (sub?.lifetime) return 'pro'

  const ownPlan = sub?.status === 'active' ? sub.plan : 'free'
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
    if (teamPlan === 'business' || teamPlan === 'enterprise') return teamPlan
  }

  return ownPlan
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
  return count ?? 0
}
