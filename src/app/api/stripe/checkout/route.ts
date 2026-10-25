import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, syncOwnedTeamPlan } from '@/lib/teams'

export const dynamic = 'force-dynamic'

function buildPriceMap(): Record<string, string | undefined> {
  return {
    // Monthly/annual prices — set STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_PRO_ANNUAL in env
    // or fall back to STRIPE_PRICE_PRO for a single price ID used for both intervals
    'pro:monthly': process.env.STRIPE_PRICE_PRO_MONTHLY ?? process.env.STRIPE_PRICE_PRO ?? 'price_1TIiLXEBEUdfEjIQbdIPe0Gv',
    'pro:annual': process.env.STRIPE_PRICE_PRO_ANNUAL ?? process.env.STRIPE_PRICE_PRO,
    'business:monthly': process.env.STRIPE_PRICE_BUSINESS_MONTHLY ?? process.env.STRIPE_PRICE_BUSINESS,
    'business:annual': process.env.STRIPE_PRICE_BUSINESS_ANNUAL ?? process.env.STRIPE_PRICE_BUSINESS,
    'enterprise:monthly': process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? process.env.STRIPE_PRICE_ENTERPRISE,
    'enterprise:annual': process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ?? process.env.STRIPE_PRICE_ENTERPRISE,
    'lifetime': process.env.STRIPE_PRICE_LIFETIME,
  }
}

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey || stripeKey === 'sk_live_...') {
      return NextResponse.json({ error: 'Stripe not configured yet' }, { status: 503 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan, interval, confirmSwitch = false } = await req.json()
    const isLifetime = plan === 'lifetime'
    const mode = isLifetime ? 'payment' : 'subscription'
    const key = isLifetime ? 'lifetime' : `${plan}:${interval}`
    const priceId = buildPriceMap()[key]

    if (!priceId || priceId === 'price_...') {
      return NextResponse.json({ error: `Price not configured for plan: ${key}` }, { status: 400 })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Reuse existing Stripe customer if one exists to avoid duplicates
    const serviceClient = createServiceClient()
    const { data: existingSub } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, plan, lifetime')
      .eq('user_id', user.id)
      .single()
    const existingCustomerId = existingSub?.stripe_customer_id ?? null

    // One subscription per account: if the user already has a live subscription,
    // switch it to the new price instead of creating a second one via Checkout.
    if (existingSub?.stripe_subscription_id) {
      const current = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id)
      const live = ['active', 'trialing', 'past_due'].includes(current.status)
      if (live && isLifetime) {
        return NextResponse.json({
          error: 'You already have an active subscription. Cancel it under Manage Billing first, then buy Lifetime, so you are not charged twice.',
          code: 'has_subscription',
        }, { status: 409 })
      }
      if (live && !isLifetime) {
        const item = current.items.data[0]
        if (item?.price.id === priceId) {
          return NextResponse.json({ error: `You're already on this plan.`, code: 'already_subscribed' }, { status: 409 })
        }

        if (current.status === 'past_due') {
          return NextResponse.json({
            error: 'Your last payment failed. Update your payment method under Manage Billing before changing plans.',
            code: 'past_due',
          }, { status: 402 })
        }

        // Ask the client to confirm before charging the saved card
        if (!confirmSwitch) {
          return NextResponse.json({
            code: 'confirm_switch',
            currentPlan: existingSub.plan,
            newPlan: plan,
          }, { status: 409 })
        }

        // Charges the prorated difference now; the customer.subscription.updated webhook
        // also syncs this, but update the row directly so the new plan applies immediately.
        const updated = await stripe.subscriptions.update(current.id, {
          items: [{ id: item.id, price: priceId }],
          proration_behavior: 'always_invoice',
          payment_behavior: 'error_if_incomplete',
        })
        await serviceClient
          .from('subscriptions')
          .update({ plan, status: updated.status })
          .eq('user_id', user.id)
        await syncOwnedTeamPlan(user.id)

        return NextResponse.json({ url: `${appUrl}/dashboard?upgraded=true` })
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: mode as 'payment' | 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: user.email }),
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    console.error('checkout error:', e)
    // Card declines are safe and useful to show; anything else stays in the logs
    const declined = (e as { type?: string })?.type === 'StripeCardError'
    const msg = declined && e instanceof Error ? e.message : 'Something went wrong starting checkout. Please try again or contact support.'
    return NextResponse.json({ error: msg }, { status: declined ? 402 : 500 })
  }
}
