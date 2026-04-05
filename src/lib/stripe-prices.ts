/**
 * Shared Stripe price-ID → plan mapping.
 * Single source of truth used by checkout, webhook, and dashboard.
 */
export function getPlanFromPriceId(priceId: string): string {
  const map: Record<string, string> = {}
  const add = (envVar: string | undefined, plan: string) => {
    if (envVar && envVar !== 'price_...') map[envVar] = plan
  }
  add('price_1TIi1WEBEUdfEjIQDVmkkKzg', 'pro')
  add(process.env.STRIPE_PRICE_PRO_ANNUAL, 'pro')
  add(process.env.STRIPE_PRICE_PRO, 'pro')
  add(process.env.STRIPE_PRICE_BUSINESS_MONTHLY, 'business')
  add(process.env.STRIPE_PRICE_BUSINESS_ANNUAL, 'business')
  add(process.env.STRIPE_PRICE_BUSINESS, 'business')
  add(process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY, 'enterprise')
  add(process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL, 'enterprise')
  add(process.env.STRIPE_PRICE_ENTERPRISE, 'enterprise')
  add(process.env.STRIPE_PRICE_LIFETIME, 'lifetime')
  return map[priceId] ?? 'free'
}
