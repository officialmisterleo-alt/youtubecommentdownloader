import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

export async function GET() {
  // Auth check — same pattern as /api/admin/stats
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  // 1. Get all enterprise teams
  const { data: teams, error: teamsError } = await service
    .from('teams')
    .select('id, name, owner_id, plan, max_seats, created_at')
    .eq('plan', 'enterprise')
    .order('created_at', { ascending: false })

  if (teamsError) {
    return NextResponse.json({ error: teamsError.message }, { status: 500 })
  }

  // 2. Get unclaimed pending provisions
  const { data: pendingProvisions } = await service
    .from('enterprise_provisions')
    .select('id, email, team_name, max_seats, created_at')
    .eq('claimed', false)
    .order('created_at', { ascending: false })

  if (!teams || teams.length === 0) {
    return NextResponse.json({
      teams: [],
      pending: pendingProvisions ?? [],
      lastUpdated: now.toISOString().slice(0, 10),
    })
  }

  const teamIds = teams.map((t: { id: string }) => t.id)
  const ownerIds = Array.from(new Set(teams.map((t: { owner_id: string }) => t.owner_id).filter(Boolean))) as string[]

  // 3. Batch-fetch everything in parallel
  const [membersRes, subsRes, usageRes] = await Promise.all([
    // All team_members for these teams (active + pending)
    service
      .from('team_members')
      .select('team_id, status')
      .in('team_id', teamIds),
    // Subscriptions for team owners
    service
      .from('subscriptions')
      .select('user_id, plan, status, current_period_end, stripe_customer_id')
      .in('user_id', ownerIds as string[]),
    // Monthly comment usage from exports (sum comment_count by user_id)
    service
      .from('exports')
      .select('user_id, comment_count')
      .in('user_id', ownerIds as string[])
      .gte('created_at', startOfMonth),
  ])

  // 4. Fetch owner emails via admin API
  const ownerEmails: Record<string, string> = {}
  await Promise.all(
    (ownerIds as string[]).map(async (ownerId: string) => {
      try {
        const { data } = await service.auth.admin.getUserById(ownerId)
        if (data?.user?.email) {
          ownerEmails[ownerId] = data.user.email
        }
      } catch {
        // non-fatal
      }
    })
  )

  // 5. Build lookup maps
  // Members: active count + pending count per team
  const membersByTeam: Record<string, { active: number; pending: number }> = {}
  for (const m of membersRes.data ?? []) {
    const entry = membersByTeam[m.team_id] ?? { active: 0, pending: 0 }
    if (m.status === 'active') entry.active++
    else if (m.status === 'pending' || m.status === 'invited') entry.pending++
    membersByTeam[m.team_id] = entry
  }

  // Subscriptions by owner user_id
  const subsByOwner: Record<string, {
    plan: string
    status: string
    current_period_end: string | null
    stripe_customer_id: string | null
  }> = {}
  for (const s of subsRes.data ?? []) {
    subsByOwner[s.user_id] = {
      plan: s.plan,
      status: s.status,
      current_period_end: s.current_period_end ?? null,
      stripe_customer_id: s.stripe_customer_id ?? null,
    }
  }

  // Monthly usage (sum comment_count) by owner user_id
  const usageByOwner: Record<string, number> = {}
  for (const e of usageRes.data ?? []) {
    usageByOwner[e.user_id] = (usageByOwner[e.user_id] ?? 0) + (e.comment_count ?? 0)
  }

  // 6. Assemble result
  const result = teams.map((team: {
    id: string
    name: string
    owner_id: string
    plan: string
    max_seats: number
    created_at: string
  }) => ({
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

  return NextResponse.json({
    teams: result,
    pending: pendingProvisions ?? [],
    lastUpdated: now.toISOString().slice(0, 10),
  })
}
