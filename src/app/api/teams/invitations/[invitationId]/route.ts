import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

type RouteContext = { params: Promise<{ invitationId: string }> }

// DELETE — revoke a pending invitation
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { invitationId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    // Find the invitation
    const { data: invitation } = await serviceClient
      .from('team_invitations')
      .select('id, team_id, status')
      .eq('id', invitationId)
      .single()

    if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })

    // Verify caller is an admin of this team
    const { data: adminMembership } = await serviceClient
      .from('team_members')
      .select('id')
      .eq('team_id', invitation.team_id)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .single()

    if (!adminMembership) {
      return NextResponse.json({ error: 'Not a team admin' }, { status: 403 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending invitations can be revoked' }, { status: 409 })
    }

    await serviceClient
      .from('team_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
