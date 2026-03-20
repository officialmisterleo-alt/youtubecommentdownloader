import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!stripeKey || stripeKey.startsWith('PLACEHOLDER')) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeKey)
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')!
    let event
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret!)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 })
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as { customer: string; id: string; status: string; current_period_end: number; items: { data: Array<{ price: { id: string } }> } }
        const planMap: Record<string, string> = {
          [process.env.STRIPE_PRICE_PRO!]: 'pro',
          [process.env.STRIPE_PRICE_BUSINESS!]: 'business',
          [process.env.STRIPE_PRICE_ENTERPRISE!]: 'enterprise',
        }
        const plan = planMap[sub.items.data[0]?.price?.id] || 'pro'
        await supabase.from('subscriptions').upsert({
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' })
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string }
        await supabase.from('subscriptions').update({ status: 'canceled', plan: 'free' }).eq('stripe_subscription_id', sub.id)
        break
      }
    }
    return NextResponse.json({ received: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
