import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

type RouteContext = { params: Promise<{ memberId: string }> }

async function getAdminContext(userId: string, memberId: string) {
  const serviceClient = createServiceClient()

  // Verify caller is an admin in some team
  const { data: callerMembership } = await serviceClient
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('status', 'active')
    .single()

  if (!callerMembership) return { error: 'Not a team admin', status: 403 }

  // Verify target member belongs to the same team
  const { data: targetMember } = await serviceClient
    .from('team_members')
    .select('id, user_id, role, status, team_id')
    .eq('id', memberId)
    .eq('team_id', callerMembership.team_id)
    .single()

  if (!targetMember) return { error: 'Member not found', status: 404 }

  return { callerMembership, targetMember, serviceClient }
}

async function countAdmins(teamId: string, serviceClient: ReturnType<typeof createServiceClient>) {
  const { count } = await serviceClient
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .eq('role', 'admin')
    .eq('status', 'active')
  return count ?? 0
}

// PATCH — update status or role
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { memberId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const context = await getAdminContext(user.id, memberId)
    if ('error' in context) return NextResponse.json({ error: context.error }, { status: context.status })

    const { callerMembership, targetMember, serviceClient } = context
    const body = await req.json() as { status?: string; role?: string }

    // Prevent self-demotion/deactivation if last admin
    if (targetMember.user_id === user.id) {
      const adminCount = await countAdmins(callerMembership.team_id, serviceClient)
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot modify yourself — you are the only admin. Assign another admin first.' },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, string> = { updated_at: new Date().toISOString() }

    if (body.status === 'active' || body.status === 'deactivated') {
      updates.status = body.status
    }
    if (body.role === 'admin' || body.role === 'member') {
      updates.role = body.role
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: updated, error } = await serviceClient
      .from('team_members')
      .update(updates)
      .eq('id', memberId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    return NextResponse.json({ member: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE — remove member from team
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { memberId } = await ctx.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const context = await getAdminContext(user.id, memberId)
    if ('error' in context) return NextResponse.json({ error: context.error }, { status: context.status })

    const { callerMembership, targetMember, serviceClient } = context

    // Prevent self-removal if last admin
    if (targetMember.user_id === user.id) {
      const adminCount = await countAdmins(callerMembership.team_id, serviceClient)
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove yourself — you are the only admin. Assign another admin first.' },
          { status: 409 }
        )
      }
    }

    const { error } = await serviceClient
      .from('team_members')
      .delete()
      .eq('id', memberId)

    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
