import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, getEffectivePlan } from '@/lib/teams'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()
    const effectivePlan = await getEffectivePlan(user.id)

    const { data: membership } = await serviceClient
      .from('team_members')
      .select('id, role, status, teams(id, name, plan, owner_id)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    let teamMembership = null
    if (membership) {
      const team = membership.teams as unknown as { id: string; name: string; plan: string; owner_id: string } | null
      let ownerName: string | null = null
      if (team?.owner_id) {
        try {
          const { data: { user: ownerUser } } = await serviceClient.auth.admin.getUserById(team.owner_id)
          ownerName = ownerUser?.user_metadata?.full_name
            || ownerUser?.user_metadata?.name
            || ownerUser?.email?.split('@')[0]
            || null
        } catch { /* non-fatal */ }
      }
      teamMembership = {
        memberId: membership.id,
        teamName: team?.name ?? null,
        role: membership.role,
        ownerName,
      }
    }

    return NextResponse.json({ effectivePlan, teamMembership })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
