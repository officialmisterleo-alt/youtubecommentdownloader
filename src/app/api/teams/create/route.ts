import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, PLAN_MAX_SEATS } from '@/lib/teams'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    // Must have an active Business or Enterprise subscription
    const { data: sub } = await serviceClient
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    const plan = sub?.status === 'active' ? sub.plan : 'free'
    if (plan !== 'business' && plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'Team creation requires a Business or Enterprise plan' },
        { status: 403 }
      )
    }

    // Check if the user already owns or belongs to a team
    const { data: existing } = await serviceClient
      .from('team_members')
      .select('id, teams(id)')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You are already part of a team' }, { status: 409 })
    }

    // One team per subscription: an owner who left their team (e.g. after handing admin to
    // someone else) can't create another one and multiply seats
    const { count: ownedTeams } = await serviceClient
      .from('teams')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
    if ((ownedTeams ?? 0) > 0) {
      return NextResponse.json({ error: 'You already own a team. Contact support if you need to move it.' }, { status: 409 })
    }

    const { name } = await req.json() as { name?: string }
    const teamName = (name?.trim()) || (user.email?.split('@')[0] ?? 'My Team') + "'s Team"

    const maxSeats = PLAN_MAX_SEATS[plan] ?? 3

    // Create team
    const { data: team, error: teamError } = await serviceClient
      .from('teams')
      .insert({
        name: teamName,
        owner_id: user.id,
        plan,
        max_seats: maxSeats,
      })
      .select()
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
    }

    // Add owner as admin member
    const { error: memberError } = await serviceClient
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'admin',
        status: 'active',
        invited_email: user.email,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      // Rollback team creation
      await serviceClient.from('teams').delete().eq('id', team.id)
      return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
    }

    return NextResponse.json({ team })
  } catch (e) {
    // Log the real error; don't send internal details to the browser
    console.error('/api/teams/create error:', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
