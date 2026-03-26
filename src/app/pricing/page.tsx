'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Plan = {
  name: string
  monthlyPrice: number
  annualPrice: number
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
    features: ['100 comments per download', '100 comments/month', 'No account required', 'Basic sorting'],
    notIncluded: ['AI Analysis', 'Reply threads', 'Bulk exports', 'API access', 'Team seats', 'Scheduled exports'],
    cta: 'Use Now', href: '/auth/signup?plan=free', checkoutPlan: null, highlight: false, badge: null, note: 'No credit card required.',
  },
  {
    name: 'Pro', monthlyPrice: 29, annualPrice: 24,
    desc: 'For individual power users',
    features: ['10,000 comments per download', '100,000 comments/month', 'All export formats', 'Reply thread capture', 'Email support', 'Priority processing', 'Basic sorting & filtering', 'AI Analysis (up to 10,000 comments)'],
    notIncluded: ['Bulk channel exports', 'REST API access', 'Team seats', 'Scheduled exports'],
    cta: 'Get Started', href: null, checkoutPlan: 'pro', highlight: false, badge: null, note: null,
  },
  {
    name: 'Business', monthlyPrice: 79, annualPrice: 65,
    desc: 'For agencies and growing teams',
    features: ['100,000 comments per download', '1,000,000 comments/month', 'All export formats', 'Bulk channel/playlist', '3 team seats', 'Priority email support', 'AI Analysis (up to 50,000 comments)'],
    notIncluded: ['Scheduled exports', 'REST API access', 'SSO / SAML', 'White-label', 'Dedicated API quota'],
    cta: 'Get Started', href: null, checkoutPlan: 'business', highlight: true, badge: 'Most Popular', note: null,
  },
  {
    name: 'Enterprise', monthlyPrice: 299, annualPrice: 249,
    desc: 'For large teams and enterprise use',
    features: ['1,000,000 comments per download', 'Unlimited monthly quota', 'Dedicated API quota', '10 team seats', 'SSO / SAML', 'White-label exports', 'Custom data retention', '99.9% SLA', 'Priority phone support', 'Custom onboarding', 'AI Analysis (up to 100,000 comments)'],
    notIncluded: [],
    cta: 'Contact Sales', href: '/contact', checkoutPlan: null, highlight: false, badge: null, note: null,
  },
]

const comparisonFeatures = [
  { label: 'Comments per download', free: '100', pro: '10k', business: '100k', enterprise: '1M' },
  { label: 'Monthly quota', free: '100', pro: '100k', business: '1M', enterprise: 'Unlimited' },
  { label: 'Export formats', free: 'All 6', pro: 'All 6', business: 'All 6', enterprise: 'All 6' },
  { label: 'AI Analysis', free: false, pro: '10k comments', business: '50k comments', enterprise: '100k comments' },
  { label: 'Reply threads', free: false, pro: true, business: true, enterprise: true },
  { label: 'Bulk channel/playlist', free: false, pro: false, business: true, enterprise: true },
  { label: 'REST API access', free: false, pro: false, business: false, enterprise: true },
  { label: 'Team seats', free: '1', pro: '1', business: '3', enterprise: '10' },
  { label: 'SSO / SAML', free: false, pro: false, business: false, enterprise: true },
  { label: 'White-label exports', free: false, pro: false, business: false, enterprise: true },
  { label: 'SLA guarantee', free: false, pro: false, business: false, enterprise: true },
]

const faqs = [
  { q: 'What counts as a "comment"?', a: 'Each unique top-level comment counts as 1 comment. Replies to comments also count individually when you enable the "Include Replies" option.' },
  { q: 'Can I upgrade or downgrade my plan at any time?', a: 'Absolutely. You can change your plan at any time from your dashboard. Upgrades take effect immediately. Downgrades take effect at the end of your billing cycle.' },
  { q: 'Is the YouTube API key required?', a: 'For the free web tool, no — we handle API access on our end. If you use the REST API on Business/Enterprise, you can optionally bring your own YouTube API key for higher quota.' },
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
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan, status, lifetime')
          .eq('user_id', data.session.user.id)
          .single()
        if (sub?.lifetime) setUserPlan('lifetime')
        else if (sub?.status === 'active' && sub.plan && sub.plan !== 'free') setUserPlan(sub.plan)
        else setUserPlan('free')
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

  async function handleCheckout(plan: string, interval: string) {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data.error)
        setLoadingPlan(null)
      }
    } catch {
      setLoadingPlan(null)
    }
  }

  async function handlePortal() {
    setLoadingPlan('portal')
    try {
      const res = await fetch('/api/stripe/portal')
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setLoadingPlan(null)
    } catch {
      setLoadingPlan(null)
    }
  }

  const ctaClass = (highlight: boolean) =>
    `block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors mb-2 disabled:opacity-60 disabled:cursor-not-allowed ${
      highlight
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'border border-white/[0.07] hover:border-white/20 text-[#888888] hover:text-white'
    }`

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-[#888888] text-lg mb-8">Start free. Scale as you grow. No hidden fees.</p>
          <div className="inline-flex items-center gap-1 bg-[#171717] border border-white/[0.07] rounded-xl p-1">
            <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${!annual ? 'bg-red-600 text-white' : 'text-[#888888] hover:text-white'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${annual ? 'bg-red-600 text-white' : 'text-[#888888] hover:text-white'}`}>
              Annual <span className={`text-xs px-2 py-0.5 rounded-full ${annual ? 'bg-red-900 text-red-200' : 'bg-white/[0.07] text-[#888888]'}`}>Save 2 months</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-2xl p-6 border flex flex-col ${plan.highlight ? 'bg-red-950/20 border-red-700 ring-1 ring-red-700' : 'bg-[#171717] border-white/[0.07]'}`}>
              {plan.badge && <div className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold uppercase tracking-widest mb-3"><Zap className="w-3 h-3" /> {plan.badge}</div>}
              <div className="font-bold text-white text-xl mb-1">{plan.name}</div>
              <div className="mb-4">
                <span className="text-4xl font-extrabold text-white">${annual ? plan.annualPrice : plan.monthlyPrice}</span>
                {plan.monthlyPrice > 0 && <span className="text-[#555555] text-sm">/mo</span>}
                {annual && plan.monthlyPrice > 0 && <div className="text-[#555555] text-xs mt-1">Billed annually</div>}
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
                    <Link href="/auth/login?next=/pricing" className={ctaClass(plan.highlight)}>
                      {isSignedIn === null ? plan.cta : 'Sign In to Get Started'}
                    </Link>
                  )
                }
                return <Link href={plan.href!} className={ctaClass(plan.highlight)}>{plan.cta}</Link>
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
            <div className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-1">⚡ Limited Time Offer</div>
            <div className="text-white font-bold text-xl mb-1">Lifetime Deal — $149</div>
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
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors text-center whitespace-nowrap"
            >
              {loadingPlan === 'lifetime' ? 'Redirecting...' : 'Get Lifetime Access →'}
            </button>
          ) : (
            <Link
              href="/auth/login?next=/pricing"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors text-center whitespace-nowrap"
            >
              {isSignedIn === null ? 'Get Lifetime Access →' : 'Sign In to Get Lifetime Access →'}
            </Link>
          )}
        </div>

        {/* Comparison table — scrollable on mobile */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Full Feature Comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#171717]">
                  <th className="text-left px-6 py-4 text-[#888888] font-medium w-2/5">Feature</th>
                  {['Free', 'Pro', 'Business', 'Enterprise'].map(p => (
                    <th key={p} className="px-4 py-4 text-center text-white font-semibold">{p}</th>
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
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.q} className="bg-[#171717] border border-white/[0.07] rounded-xl p-6">
                <div className="font-semibold text-white mb-2">{faq.q}</div>
                <p className="text-[#888888] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
