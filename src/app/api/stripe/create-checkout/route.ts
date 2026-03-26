import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey || stripeKey.startsWith('PLACEHOLDER')) {
      return NextResponse.json({ error: 'Stripe not configured yet' }, { status: 503 })
    }
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey)
    const { plan, successUrl, cancelUrl } = await req.json()
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO!,
      business: process.env.STRIPE_PRICE_BUSINESS!,
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceMap[plan], quantity: 1 }],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
