import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  free: 100,
  pro: 100_000,
  business: 1_000_000,
  enterprise: -1,
}

function buildPriceToPlanMap(): Record<string, string> {
  const map: Record<string, string> = {}
  const add = (envVar: string | undefined, plan: string) => {
    if (envVar && envVar !== 'price_...') map[envVar] = plan
  }
  add(process.env.STRIPE_PRICE_PRO_MONTHLY, 'pro')
  add(process.env.STRIPE_PRICE_PRO_ANNUAL, 'pro')
  add(process.env.STRIPE_PRICE_BUSINESS_MONTHLY, 'business')
  add(process.env.STRIPE_PRICE_BUSINESS_ANNUAL, 'business')
  add(process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY, 'enterprise')
  add(process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL, 'enterprise')
  return map
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || stripeKey === 'sk_live_...') {
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
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const priceToPlan = buildPriceToPlanMap()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          mode: string
          metadata: { user_id?: string }
          customer: string
          subscription?: string
        }
        const userId = session.metadata?.user_id
        if (!userId) {
          console.error('checkout.session.completed: missing user_id in metadata')
          break
        }

        if (session.mode === 'payment') {
          // Lifetime deal — one-time payment
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: null,
            plan: 'pro',
            status: 'active',
            lifetime: true,
            current_period_end: null,
          }, { onConflict: 'user_id' })
        } else if (session.mode === 'subscription' && session.subscription) {
          // Recurring subscription — fetch full object to get price & period
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const subData = sub as unknown as {
            id: string
            status: string
            current_period_end: number
            items: { data: Array<{ price: { id: string } }> }
          }
          const priceId = subData.items.data[0]?.price?.id
          const plan = priceToPlan[priceId] || 'pro'
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subData.id,
            plan,
            status: subData.status,
            lifetime: false,
            current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
          }, { onConflict: 'user_id' })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as {
          id: string
          status: string
          current_period_end: number
          items: { data: Array<{ price: { id: string } }> }
        }
        const previousAttrs = (event.data.previous_attributes ?? {}) as {
          items?: { data?: Array<{ price?: { id?: string } }> }
        }
        const newPriceId = sub.items.data[0]?.price?.id
        const oldPriceId = previousAttrs?.items?.data?.[0]?.price?.id

        const newPlan = priceToPlan[newPriceId ?? ''] ?? 'free'
        const oldPlan = priceToPlan[oldPriceId ?? ''] ?? 'free'

        await supabase.from('subscriptions')
          .update({
            plan: newPlan,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)

        // On upgrade: reset monthly usage so the user immediately gets their new quota
        const newLimit = PLAN_MONTHLY_LIMITS[newPlan] ?? 100
        const oldLimit = PLAN_MONTHLY_LIMITS[oldPlan] ?? 100
        if (newLimit > oldLimit || (newLimit === -1 && oldLimit !== -1)) {
          // Look up user_id from the subscription record
          const { data: subRow } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .single()
          if (subRow?.user_id) {
            const month = new Date().toISOString().slice(0, 7)
            await supabase
              .from('monthly_usage')
              .upsert(
                { user_id: subRow.user_id, month, comment_count: 0 },
                { onConflict: 'user_id,month' }
              )
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string }
        await supabase.from('subscriptions')
          .update({ status: 'canceled', plan: 'free', current_period_end: null })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as { subscription?: string }
        if (invoice.subscription) {
          await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription)
        }
        break
      }
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error(`Webhook handler error for ${event.type}:`, msg)
    // Return 200 so Stripe doesn't retry — the error is logged above
  }

  return NextResponse.json({ received: true })
}
