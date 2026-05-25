import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

export async function POST(req: NextRequest) {
  // ── Auth guard (admin only) ──────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse & validate body ─────────────────────────────────────────────────
  let body: { email?: string; teamName?: string; seats?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email, teamName, seats } = body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
  }
  if (!seats || typeof seats !== 'number' || seats < 1) {
    return NextResponse.json({ error: 'seats must be a positive number' }, { status: 400 })
  }

  const service = createServiceClient()
  const normalizedEmail = email.toLowerCase()

  // ── Check if user already exists ──────────────────────────────────────────
  let existingUserId: string | null = null
  try {
    const { data: usersData, error: listError } = await service.auth.admin.listUsers({
      perPage: 1000,
      page: 1,
    })

    if (listError) {
      return NextResponse.json({ error: `Failed to list users: ${listError.message}` }, { status: 500 })
    }

    const existing = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    )

    if (existing) {
      existingUserId = existing.id
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: `User lookup failed: ${msg}` }, { status: 500 })
  }

  // ── Path A: user exists → attach enterprise immediately ───────────────────
  if (existingUserId) {
    const userId = existingUserId

    const periodEnd = new Date()
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)

    const { error: subError } = await service
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan: 'enterprise',
          status: 'active',
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (subError) {
      return NextResponse.json(
        { error: `Failed to upsert subscription: ${subError.message}` },
        { status: 500 }
      )
    }

    const { data: team, error: teamError } = await service
      .from('teams')
      .insert({
        name: teamName.trim(),
        owner_id: userId,
        plan: 'enterprise',
        max_seats: seats,
      })
      .select()
      .single()

    if (teamError || !team) {
      await service.from('subscriptions').delete().eq('user_id', userId)
      return NextResponse.json(
        { error: `Failed to create team: ${teamError?.message ?? 'Unknown error'}` },
        { status: 500 }
      )
    }

    const { error: memberError } = await service
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'admin',
        status: 'active',
        invited_email: normalizedEmail,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      await service.from('teams').delete().eq('id', team.id)
      await service.from('subscriptions').delete().eq('user_id', userId)
      return NextResponse.json(
        { error: `Failed to add team member: ${memberError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      isPending: false,
      userId,
      teamId: team.id,
      message: `Enterprise activated for ${normalizedEmail}.`,
    })
  }

  // ── Path B: user doesn't exist → create a pending provision slot ──────────
  const { error: provisionError } = await service
    .from('enterprise_provisions')
    .upsert(
      {
        email: normalizedEmail,
        team_name: teamName.trim(),
        max_seats: seats,
        claimed: false,
      },
      { onConflict: 'email' }
    )

  if (provisionError) {
    return NextResponse.json(
      { error: `Failed to create pending slot: ${provisionError.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    isPending: true,
    message: `Pending slot created — enterprise will be granted when they sign up with this email.`,
  })
}
