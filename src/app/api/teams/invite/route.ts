import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, countUsedSeats } from '@/lib/teams'
import { sendTeamInviteEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { email } = await req.json() as { email?: string }
    if (!email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const normalizedEmail = email.trim().toLowerCase()

    const serviceClient = createServiceClient()

    // Find the team where this user is an admin
    const { data: membership } = await serviceClient
      .from('team_members')
      .select('team_id, role, teams(id, name, max_seats, plan)')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'You are not a team admin' }, { status: 403 })
    }

    const team = membership.teams as unknown as { id: string; name: string; max_seats: number; plan: string }
    const usedSeats = await countUsedSeats(team.id)

    if (usedSeats >= team.max_seats) {
      return NextResponse.json(
        { error: `Seat limit reached (${team.max_seats} seats). Remove a member or upgrade to invite more.` },
        { status: 409 }
      )
    }

    // Check if the invited email is already a member
    const { data: existingMember } = await serviceClient
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('invited_email', normalizedEmail)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a team member' }, { status: 409 })
    }

    // Upsert invitation (allow re-inviting if previous was revoked/expired)
    const { data: invitation, error: inviteError } = await serviceClient
      .from('team_invitations')
      .upsert(
        {
          team_id: team.id,
          invited_by: user.id,
          email: normalizedEmail,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'team_id,email' }
      )
      .select()
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const joinUrl = `${appUrl}/join?token=${invitation.token}`

    await sendTeamInviteEmail({
      toEmail: normalizedEmail,
      teamName: team.name,
      inviterEmail: user.email!,
      joinUrl,
    })

    return NextResponse.json({ invitation: { ...invitation, joinUrl } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
