import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

// GET — list pending invitations for the current user's team (admin only)
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createServiceClient()

    // Must be an admin
    const { data: membership } = await serviceClient
      .from('team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Not a team admin' }, { status: 403 })
    }

    const { data: invitations } = await serviceClient
      .from('team_invitations')
      .select('id, email, status, created_at, expires_at, token')
      .eq('team_id', membership.team_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const enriched = (invitations ?? []).map(inv => ({
      ...inv,
      joinUrl: `${appUrl}/join?token=${inv.token}`,
    }))

    return NextResponse.json({ invitations: enriched })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
