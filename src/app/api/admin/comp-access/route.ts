import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

/**
 * Toggles comped lifetime Pro access for the configured admin account.
 *
 * This is intentionally narrow: it only affects the currently signed-in user
 * when their email exactly matches ADMIN_EMAIL. It does not accept a target
 * email or arbitrary plan, so it cannot modify customer subscriptions.
 *
 * Writes the same shape as the Stripe lifetime-deal path: plan=pro,
 * status=active, lifetime=true, current_period_end=null.
 */

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user }
}

export async function GET() {
  const auth = await requireAdminUser()
  if (auth.error) return auth.error

  const service = createServiceClient()
  const { data: sub, error } = await service
    .from('subscriptions')
    .select('plan, status, lifetime')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: `Failed to fetch subscription: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({
    plan: sub?.lifetime ? 'pro' : (sub?.status === 'active' ? sub.plan : 'free') ?? 'free',
    subscription: sub ?? null,
  })
}

export async function POST() {
  const auth = await requireAdminUser()
  if (auth.error) return auth.error

  const service = createServiceClient()

  // ── Upsert the admin's comp subscription row ────────────────────────────
  const { data: sub, error: subError } = await service
    .from('subscriptions')
    .upsert(
      {
        user_id: auth.user.id,
        plan: 'pro',
        status: 'active',
        lifetime: true,
        current_period_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      { onConflict: 'user_id' }
    )
    .select('user_id, plan, status, lifetime')
    .single()

  if (subError) {
    return NextResponse.json({ error: `Failed to upsert subscription: ${subError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    plan: 'pro',
    message: `Lifetime Pro access granted to ${auth.user.email}.`,
    subscription: sub,
  })
}

export async function DELETE() {
  const auth = await requireAdminUser()
  if (auth.error) return auth.error

  const service = createServiceClient()

  const { data: sub, error: subError } = await service
    .from('subscriptions')
    .upsert(
      {
        user_id: auth.user.id,
        plan: 'free',
        status: 'inactive',
        lifetime: false,
        current_period_end: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      { onConflict: 'user_id' }
    )
    .select('user_id, plan, status, lifetime')
    .single()

  if (subError) {
    return NextResponse.json({ error: `Failed to revoke comp access: ${subError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    plan: 'free',
    message: `Admin account set back to Free for ${auth.user.email}.`,
    subscription: sub,
  })
}
