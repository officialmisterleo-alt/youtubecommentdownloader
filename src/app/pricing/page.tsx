'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TrackedLink from '@/components/TrackedLink'
import { trackEvent } from '@/lib/analytics'

type Plan = {
  name: string
  monthlyPrice: number | null
  annualPrice: number | null
  desc: string
  features: string[]
  notIncluded: string[]
  cta: string
  href: string | null
  checkoutPlan: string | null
  highlight: boolean
  badge: string | null
  note: string | null
}

const plans: Plan[] = [
  {
    name: 'Free', monthlyPrice: 0, annualPrice: 0,
    desc: 'Perfect for trying out the tool',
    features: ['Up to 50 comments per download without an account', 'Up to 100 comments per download with a free account', '100 comments/month with a free account', 'TXT and HTML without an account', 'CSV, Excel, and JSON with a free account', 'Basic sorting'],
    notIncluded: ['AI Analysis', 'Reply threads', 'Bulk exports', 'API access', 'Team seats', 'Scheduled exports'],
    cta: 'Use Now', href: '/tool', checkoutPlan: null, highlight: false, badge: null, note: 'No credit card required.',
  },
  {
    name: 'Pro', monthlyPrice: 19, annualPrice: 16,
    desc: 'For individual power users',
    features: ['10,000 comments per download', '100,000 comments/month', 'All export formats', 'Reply thread capture', 'Email support', 'Priority processing', 'Basic sorting & filtering', 'AI Analysis (up to 10,000 comments)'],
    notIncluded: ['Bulk channel exports', 'REST API access', 'Team seats', 'Scheduled exports'],
    cta: 'Get Started', href: null, checkoutPlan: 'pro', highlight: true, badge: 'Most Popular', note: null,
  },
  {
    name: 'Business', monthlyPrice: 49, annualPrice: 41,
    desc: 'For agencies and growing teams',
    features: ['100,000 comments per download', '1,000,000 comments/month', 'All export formats', 'Reply thread capture', 'Bulk channel/playlist', '3 team seats', 'Priority email support', 'AI Analysis (up to 50,000 comments)'],
    notIncluded: ['Scheduled exports', 'REST API access', 'White-label', 'Dedicated API quota'],
    cta: 'Get Started', href: null, checkoutPlan: 'business', highlight: false, badge: null, note: null,
  },
  {
    name: 'Enterprise', monthlyPrice: null, annualPrice: null,
    desc: 'For large teams and enterprise use',
    features: ['1,000,000 comments per download', 'Unlimited monthly quota', 'Dedicated API quota', 'Reply thread capture', '10 team seats', 'Custom seat count', 'Priority email support', 'Dedicated onboarding call', 'All export formats', 'AI Analysis (up to 100,000 comments)', 'Custom onboarding'],
    notIncluded: [],
    cta: 'Contact Sales', href: '/contact', checkoutPlan: null, highlight: false, badge: null, note: 'Contact us for a quote.',
  },
]

const comparisonFeatures = [
  { label: 'Comments per download', free: '50 anonymous / 100 signed in', pro: '10k', business: '100k', enterprise: '1M' },
  { label: 'Monthly quota', free: '100 signed in', pro: '100k', business: '1M', enterprise: 'Unlimited' },
  { label: 'Export formats', free: '5 (account for CSV, Excel, JSON)', pro: 'All 5', business: 'All 5', enterprise: 'All 5' },
  { label: 'AI Analysis', free: false, pro: '10k comments', business: '50k comments', enterprise: '100k comments' },
  { label: 'Reply threads', free: false, pro: true, business: true, enterprise: true },
  { label: 'Bulk channel/playlist', free: false, pro: false, business: true, enterprise: true },
  { label: 'REST API access', free: false, pro: false, business: false, enterprise: true },
  { label: 'Team seats', free: '1', pro: '1', business: '3', enterprise: '10' },
]

const faqs = [
  { q: 'What counts toward the comment quota?', a: 'The current quota counts top-level comments returned by an export. Reply capture is available on Pro and higher, and replies may be incomplete if YouTube does not return them.' },
  { q: 'Can I upgrade or downgrade my plan at any time?', a: 'Absolutely. You can change your plan at any time from your dashboard. Upgrades take effect immediately. Downgrades take effect at the end of your billing cycle.' },
  { q: 'Is a YouTube API key required?', a: 'No key is needed to use the web tool. Programmatic access requires an Enterprise plan and an API key generated for your account.' },
  { q: 'Do you offer refunds?', a: 'Refunds are considered only within 48 hours of initial purchase, and only if the tool demonstrably failed to function as described. Usage fees for successfully completed exports are non-refundable. We strongly recommend testing the free tier before upgrading.' },
]

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2, enterprise: 3 }

function getPlanAction(
  cardPlan: string,
  userPlan: string | null,
  isSignedIn: boolean | null,
): 'default' | 'current' | 'upgrade' | 'downgrade' | 'lifetime' {
  if (!isSignedIn) return 'default'
  const effectivePlan = userPlan ?? 'free'
  if (effectivePlan === 'lifetime') return 'lifetime'
  if (cardPlan === effectivePlan) return 'current'
  const cardRank = PLAN_RANK[cardPlan] ?? -1
  const userRank = PLAN_RANK[effectivePlan] ?? 0
  return cardRank < userRank ? 'downgrade' : 'upgrade'
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null)
  const [userPlan, setUserPlan] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadSession() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setIsSignedIn(true)
        const res = await fetch('/api/quota')
        if (res.ok) {
          const quota = await res.json()
          setUserPlan(quota.plan ?? 'free')
        } else {
          setUserPlan('free')
        }
      } else {
        setIsSignedIn(false)
        setUserPlan(null)
      }
    }
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { setIsSignedIn(false); setUserPlan(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleCheckout(plan: string, interval: string, confirmSwitch = false) {
    trackEvent('checkout_start', { plan, interval })
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval, confirmSwitch }),
      })
      const data = await res.json()
      if (data.code === 'confirm_switch') {
        // User already has a subscription — switch it in place instead of buying a second one
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
        const ok = window.confirm(
          `Switch your ${cap(data.currentPlan)} plan to ${cap(data.newPlan)}? The change takes effect now and replaces your current plan (it is not added). Any extra cost for the rest of this billing period is charged to your card on file today; unused time becomes credit on your next invoice.`
        )
        if (ok) return handleCheckout(plan, interval, true)
        setLoadingPlan(null)
        return
      }
      if (data.url) {
        trackEvent('checkout_redirect', { plan, interval })
        window.location.href = data.url
      } else {
        trackEvent('checkout_error', { plan, interval, message: data.error ?? 'unknown' })
        console.error('Checkout error:', data.error)
        if (data.error) window.alert(data.error)
        setLoadingPlan(null)
      }
    } catch {
      setLoadingPlan(null)
    }
  }

  async function handlePortal() {
    trackEvent('billing_portal_start')
    setLoadingPlan('portal')
    try {
      const res = await fetch('/api/stripe/portal')
      const data = await res.json()
      if (data.url) {
        trackEvent('billing_portal_redirect')
        window.location.href = data.url
      }
      else setLoadingPlan(null)
    } catch {
      setLoadingPlan(null)
    }
  }

  const ctaClass = (highlight: boolean) =>
    `block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors mb-2 disabled:opacity-60 disabled:cursor-not-allowed ${
      highlight
        ? 'bg-red-600 hover:bg-red-700 text-[#e5e2e1]'
        : 'border border-white/[0.07] hover:border-white/20 text-[#888888] hover:text-white'
    }`

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-jakarta text-[#e5e2e1] mb-4">Simple, transparent pricing</h1>
          <p className="text-[#888888] text-lg mb-3">Start with 50 comments without an account. A free account adds CSV, Excel, and JSON exports plus a 100-comment monthly quota.</p>
          <p className="text-[#777777] text-sm mb-8">Pro adds larger downloads, replies, filters, and AI analysis. Business adds playlist and channel exports. Enterprise adds the REST API.</p>
          <div className="inline-flex items-center gap-1 bg-[#171717] border border-white/[0.07] rounded-xl p-1">
            <button onClick={() => { trackEvent('pricing_interval_select', { interval: 'monthly' }); setAnnual(false) }} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${!annual ? 'bg-red-600 text-[#e5e2e1]' : 'text-[#888888] hover:text-white'}`}>Monthly</button>
            <button onClick={() => { trackEvent('pricing_interval_select', { interval: 'annual' }); setAnnual(true) }} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${annual ? 'bg-red-600 text-[#e5e2e1]' : 'text-[#888888] hover:text-white'}`}>
              Annual <span className={`text-xs px-2 py-0.5 rounded-full ${annual ? 'bg-red-900 text-red-200' : 'bg-white/[0.07] text-[#888888]'}`}>Save 2 months</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-6 border flex flex-col ${plan.highlight ? 'bg-red-950/20 border-red-700 ring-1 ring-red-700' : 'bg-[#171717] border-white/[0.07]'}`}>
              {plan.badge && <div className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold uppercase tracking-widest mb-3"><Zap className="w-3 h-3" /> {plan.badge}</div>}
              <div className="font-bold text-[#e5e2e1] text-xl mb-1">{plan.name}</div>
              <div className="mb-4">
                {plan.name === 'Enterprise' ? (
                  <>
                    <span className="text-2xl font-extrabold text-[#e5e2e1]">Custom pricing</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-extrabold text-[#e5e2e1]">${annual ? plan.annualPrice : plan.monthlyPrice}</span>
                    {plan.monthlyPrice !== null && plan.monthlyPrice > 0 && <span className="text-[#555555] text-sm">/mo</span>}
                    {annual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && <div className="text-[#555555] text-xs mt-1">Billed annually</div>}
                  </>
                )}
              </div>
              <p className="text-[#888888] text-sm mb-6">{plan.desc}</p>

              {(() => {
                const action = getPlanAction(plan.name.toLowerCase(), userPlan, isSignedIn)
                const disabledClass = 'block w-full text-center py-3 rounded-xl font-semibold text-sm border border-white/20 text-[#555555] cursor-not-allowed opacity-60 mb-2'
                if (action === 'current') {
                  return <button disabled className={disabledClass}>Current Plan</button>
                }
                if (action === 'lifetime') {
                  return <button disabled className={disabledClass}>Lifetime Member</button>
                }
                if (action === 'downgrade') {
                  // Paid → paid downgrades switch the subscription in place; → Free means cancelling in the portal
                  if (plan.checkoutPlan) {
                    return (
                      <button
                        onClick={() => handleCheckout(plan.checkoutPlan!, annual ? 'annual' : 'monthly')}
                        disabled={loadingPlan === plan.checkoutPlan}
                        className={ctaClass(false)}
                      >
                        {loadingPlan === plan.checkoutPlan ? 'Switching...' : 'Downgrade'}
                      </button>
                    )
                  }
                  return (
                    <button onClick={handlePortal} disabled={loadingPlan === 'portal'} className={ctaClass(false)}>
                      {loadingPlan === 'portal' ? 'Redirecting...' : 'Downgrade'}
                    </button>
                  )
                }
                // upgrade or default
                if (plan.checkoutPlan) {
                  return isSignedIn ? (
                    <button
                      onClick={() => handleCheckout(plan.checkoutPlan!, annual ? 'annual' : 'monthly')}
                      disabled={loadingPlan === plan.checkoutPlan}
                      className={ctaClass(plan.highlight)}
                    >
                      {loadingPlan === plan.checkoutPlan ? 'Redirecting...' : plan.cta}
                    </button>
                  ) : (
                    <TrackedLink
                      href="/auth/login?next=/pricing"
                      eventName="pricing_auth_cta_click"
                      eventProperties={{ plan: plan.name.toLowerCase(), interval: annual ? 'annual' : 'monthly' }}
                      className={ctaClass(plan.highlight)}
                    >
                      {isSignedIn === null ? plan.cta : 'Sign In to Get Started'}
                    </TrackedLink>
                  )
                }
                return (
                  <div>
                    <TrackedLink
                      href={plan.href!}
                      eventName={plan.name === 'Enterprise' ? 'contact_sales_click' : 'pricing_plan_cta_click'}
                      eventProperties={{ plan: plan.name.toLowerCase(), interval: annual ? 'annual' : 'monthly' }}
                      className={ctaClass(plan.highlight)}
                    >
                      {plan.cta}
                    </TrackedLink>
                    {plan.name === 'Enterprise' && (
                      <div className="text-center mt-1">
                        <TrackedLink
                          href="/docs"
                          eventName="api_docs_cta_click"
                          eventProperties={{ location: 'pricing_enterprise_card' }}
                          className="text-xs text-[#888888] hover:text-white transition-colors"
                        >
                          View API Documentation →
                        </TrackedLink>
                      </div>
                    )}
                  </div>
                )
              })()}

              {plan.note && <p className="text-[#555555] text-xs text-center mb-4">{plan.note}</p>}
              {!plan.note && <div className="mb-4" />}
              <div className="space-y-2.5 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[#888888]">{f}</span>
                  </div>
                ))}
                {plan.notIncluded.map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <X className="w-4 h-4 text-white/20 flex-shrink-0 mt-0.5" />
                    <span className="text-[#555555]">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Lifetime */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 mb-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-1">One-time purchase</div>
            <div className="text-[#e5e2e1] font-bold text-xl mb-1">Lifetime Deal — $99</div>
            <p className="text-[#888888] text-sm">Everything in Pro, forever. One payment, no recurring fees. 10,000 comments per download, 100,000 comments/month, AI analysis up to 10,000 comments. Perfect for freelancers and indie hackers.</p>
          </div>
          {userPlan === 'lifetime' ? (
            <button disabled className="w-full sm:w-auto border border-white/20 text-[#555555] cursor-not-allowed opacity-60 font-bold px-6 py-3 rounded-xl text-sm text-center whitespace-nowrap">
              Lifetime Member
            </button>
          ) : isSignedIn ? (
            <button
              onClick={() => handleCheckout('lifetime', 'one_time')}
              disabled={loadingPlan === 'lifetime'}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-[#e5e2e1] font-bold px-6 py-3 rounded-xl text-sm transition-colors text-center whitespace-nowrap"
            >
              {loadingPlan === 'lifetime' ? 'Redirecting...' : 'Get Lifetime Access →'}
            </button>
          ) : (
            <Link
              href="/auth/login?next=/pricing"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-[#e5e2e1] font-bold px-6 py-3 rounded-xl text-sm transition-colors text-center whitespace-nowrap"
            >
              {isSignedIn === null ? 'Get Lifetime Access →' : 'Sign In to Get Lifetime Access →'}
            </Link>
          )}
        </div>

        {/* Comparison table — scrollable on mobile */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold font-jakarta text-[#e5e2e1] mb-6 text-center">Full Feature Comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#171717]">
                  <th className="text-left px-6 py-4 text-[#888888] font-medium w-2/5">Feature</th>
                  {['Free', 'Pro', 'Business', 'Enterprise'].map(p => (
                    <th key={p} className="px-4 py-4 text-center text-[#e5e2e1] font-semibold">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr key={row.label} className={`border-b border-white/[0.07] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#171717]'}`}>
                    <td className="px-6 py-3.5 text-[#888888]">{row.label}</td>
                    {[row.free, row.pro, row.business, row.enterprise].map((v, j) => (
                      <td key={j} className="px-4 py-3.5 text-center">
                        {typeof v === 'boolean' ? (
                          v ? <Check className="w-4 h-4 text-red-500 mx-auto" /> : <X className="w-4 h-4 text-white/20 mx-auto" />
                        ) : (
                          <span className="text-[#888888]">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-jakarta text-[#e5e2e1] mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.q} className="bg-[#171717] border border-white/[0.07] rounded-xl p-6">
                <div className="font-semibold text-[#e5e2e1] mb-2">{faq.q}</div>
                <p className="text-[#888888] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
