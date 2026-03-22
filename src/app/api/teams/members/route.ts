import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    // Find the user's team
    const { data: userMembership } = await serviceClient
      .from('team_members')
      .select('team_id, role, teams(id, name, plan, max_seats)')
      .eq('user_id', user.id)
      .single()

    if (!userMembership) {
      return NextResponse.json({ error: 'You are not part of a team' }, { status: 404 })
    }

    const team = userMembership.teams as unknown as { id: string; name: string; plan: string; max_seats: number }

    // Get all members with their auth user email via a join
    const { data: members } = await serviceClient
      .from('team_members')
      .select('id, user_id, role, status, invited_email, joined_at, created_at')
      .eq('team_id', team.id)
      .order('created_at', { ascending: true })

    // Enrich with user metadata from auth.users via profiles
    const enriched = await Promise.all(
      (members ?? []).map(async (m) => {
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('email, full_name')
          .eq('id', m.user_id)
          .single()
        return {
          ...m,
          email: profile?.email ?? m.invited_email ?? null,
          full_name: profile?.full_name ?? null,
        }
      })
    )

    return NextResponse.json({
      team,
      members: enriched,
      userRole: userMembership.role,
      usedSeats: members?.length ?? 0,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
