import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function buildPriceMap(): Record<string, string | undefined> {
  return {
    // Monthly/annual prices — set STRIPE_PRICE_PRO_MONTHLY and STRIPE_PRICE_PRO_ANNUAL in env
    // or fall back to STRIPE_PRICE_PRO for a single price ID used for both intervals
    'pro:monthly': process.env.STRIPE_PRICE_PRO_MONTHLY ?? process.env.STRIPE_PRICE_PRO,
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

    const { plan, interval } = await req.json()
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

    const session = await stripe.checkout.sessions.create({
      mode: mode as 'payment' | 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url: `${appUrl}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
