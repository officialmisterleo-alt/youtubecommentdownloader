import { NextRequest, NextResponse } from 'next/server'
import { getPlanFromPriceId, getSubscriptionPeriodEnd } from '@/lib/stripe-prices'
import { syncOwnedTeamPlan } from '@/lib/teams'

export const dynamic = 'force-dynamic'

const PLAN_MONTHLY_LIMITS: Record<string, number> = {
  free: 100,
  pro: 100_000,
  business: 1_000_000,
  enterprise: -1,
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || stripeKey === 'sk_live_...') {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  if (!webhookSecret || webhookSecret === 'whsec_...' || webhookSecret.startsWith('whsec_test')) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
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
          // Lifetime deal — one-time payment. If they also have a live subscription, keep it
          // linked (so its webhooks still match) and just add the lifetime flag.
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id, status')
            .eq('user_id', userId)
            .maybeSingle()
          if (existing?.stripe_subscription_id && existing.status === 'active') {
            await supabase.from('subscriptions').update({ lifetime: true }).eq('user_id', userId)
          } else {
            await supabase.from('subscriptions').upsert({
              user_id: userId,
              stripe_customer_id: session.customer,
              stripe_subscription_id: null,
              plan: 'pro',
              status: 'active',
              lifetime: true,
              current_period_end: null,
            }, { onConflict: 'user_id' })
          }
        } else if (session.mode === 'subscription' && session.subscription) {
          // Recurring subscription — fetch full object to get price & period
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          const subData = sub as unknown as {
            id: string
            status: string
            current_period_end?: number
            items: { data: Array<{ price: { id: string }; current_period_end?: number }> }
          }
          const priceId = subData.items.data[0]?.price?.id
          const plan = priceId ? getPlanFromPriceId(priceId) : 'free'
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: subData.id,
            plan,
            status: subData.status,
            // lifetime is left as-is so a lifetime member who subscribes keeps it
            current_period_end: getSubscriptionPeriodEnd(subData),
          }, { onConflict: 'user_id' })
          await syncOwnedTeamPlan(userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as {
          id: string
          status: string
          current_period_end?: number
          items: { data: Array<{ price: { id: string }; current_period_end?: number }> }
        }
        const previousAttrs = (event.data.previous_attributes ?? {}) as {
          items?: { data?: Array<{ price?: { id?: string } }> }
        }
        const newPriceId = sub.items.data[0]?.price?.id
        const oldPriceId = previousAttrs?.items?.data?.[0]?.price?.id

        const newPlan = newPriceId ? getPlanFromPriceId(newPriceId) : 'free'

        const { data: subRow } = await supabase
          .from('subscriptions')
          .update({
            plan: newPlan,
            status: sub.status,
            current_period_end: getSubscriptionPeriodEnd(sub),
          })
          .eq('stripe_subscription_id', sub.id)
          .select('user_id')
          .maybeSingle()
        if (!subRow?.user_id) break

        // On a real upgrade (the price changed to a higher-quota plan), reset monthly usage so
        // the user immediately gets their new quota. Renewals, cancel toggles and other updates
        // don't include the old price, so they never reset usage.
        const oldPlan = oldPriceId ? getPlanFromPriceId(oldPriceId) : null
        if (oldPlan && oldPriceId !== newPriceId) {
          const newLimit = PLAN_MONTHLY_LIMITS[newPlan] ?? 100
          const oldLimit = PLAN_MONTHLY_LIMITS[oldPlan] ?? 100
          if (oldLimit !== -1 && (newLimit === -1 || newLimit > oldLimit)) {
            const month = new Date().toISOString().slice(0, 7)
            await supabase
              .from('monthly_usage')
              .upsert(
                { user_id: subRow.user_id, month, comment_count: 0 },
                { onConflict: 'user_id,month' }
              )
          }
        }
        await syncOwnedTeamPlan(subRow.user_id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as { id: string }
        const { data: subRow } = await supabase
          .from('subscriptions')
          .select('user_id, lifetime')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()
        if (!subRow) break
        // Lifetime members fall back to their lifetime Pro access
        await supabase.from('subscriptions')
          .update(subRow.lifetime
            ? { status: 'active', plan: 'pro', current_period_end: null }
            : { status: 'canceled', plan: 'free', current_period_end: null })
          .eq('stripe_subscription_id', sub.id)
        await syncOwnedTeamPlan(subRow.user_id)
        break
      }

      case 'invoice.payment_failed': {
        // Newer API versions moved invoice.subscription under parent.subscription_details
        const invoice = event.data.object as {
          subscription?: string
          parent?: { subscription_details?: { subscription?: string } | null } | null
        }
        const subscriptionId = invoice.subscription ?? invoice.parent?.subscription_details?.subscription
        if (subscriptionId) {
          const { data: subRow } = await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId)
            .select('user_id')
            .maybeSingle()
          if (subRow?.user_id) await syncOwnedTeamPlan(subRow.user_id)
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
