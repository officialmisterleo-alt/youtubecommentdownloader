import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, countUsedSeats } from '@/lib/teams'
import { sendMemberJoinedEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token } = await req.json() as { token?: string }
    if (!token?.trim()) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    const serviceClient = createServiceClient()

    // Look up the invitation by token
    const { data: invitation } = await serviceClient
      .from('team_invitations')
      .select('*, teams(id, name, plan, max_seats)')
      .eq('token', token.trim())
      .single()

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 })
    }

    if (invitation.status === 'accepted') {
      return NextResponse.json({ error: 'This invitation has already been accepted' }, { status: 409 })
    }

    if (invitation.status === 'revoked') {
      return NextResponse.json({ error: 'This invitation has been revoked' }, { status: 410 })
    }

    if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
      // Mark as expired if not already
      if (invitation.status !== 'expired') {
        await serviceClient
          .from('team_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id)
      }
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 })
    }

    const team = invitation.teams as { id: string; name: string; plan: string; max_seats: number }

    // Check user isn't already in a team
    const { data: existingMembership } = await serviceClient
      .from('team_members')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already part of a team' }, { status: 409 })
    }

    // Check seat availability
    const usedSeats = await countUsedSeats(team.id)
    if (usedSeats >= team.max_seats) {
      return NextResponse.json({ error: 'This team has no available seats' }, { status: 409 })
    }

    // Add user as member
    const { error: memberError } = await serviceClient
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'member',
        status: 'active',
        invited_email: invitation.email,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      return NextResponse.json({ error: 'Failed to join team' }, { status: 500 })
    }

    // Mark invitation as accepted
    await serviceClient
      .from('team_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    // Notify the team owner
    const { data: ownerData } = await serviceClient.auth.admin.getUserById(
      (invitation.teams as { owner_id?: string } & typeof team).owner_id ?? ''
    )
    const ownerEmail = ownerData?.user?.email
    if (ownerEmail && ownerEmail !== user.email) {
      await sendMemberJoinedEmail({
        toEmail: ownerEmail,
        teamName: team.name,
        memberEmail: user.email!,
      })
    }

    return NextResponse.json({ team: { id: team.id, name: team.name, plan: team.plan } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
