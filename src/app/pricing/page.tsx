'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Check, X, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Free', monthlyPrice: 0, annualPrice: 0,
    desc: 'Perfect for trying out the tool',
    features: ['100 comments per export', 'All export formats', 'No account required', 'Basic sorting'],
    notIncluded: ['AI Analysis', 'Reply threads', 'Bulk exports', 'API access', 'Team seats', 'Scheduled exports'],
    cta: 'Start Free Trial', href: '/auth/signup?plan=free', highlight: false, badge: null, note: 'No credit card required.',
  },
  {
    name: 'Pro', monthlyPrice: 29, annualPrice: 24,
    desc: 'For individual power users',
    features: ['Up to 10,000 comments per export', 'All export formats', 'Reply thread capture', 'Email support', 'Priority processing', 'Basic sorting & filtering', 'AI Analysis (up to 10,000 comments)'],
    notIncluded: ['Bulk channel exports', 'REST API access', 'Team seats', 'Scheduled exports'],
    cta: 'Start Pro', href: '/auth/signup?plan=pro', highlight: false, badge: null, note: null,
  },
  {
    name: 'Business', monthlyPrice: 79, annualPrice: 65,
    desc: 'For agencies and growing teams',
    features: ['Up to 100,000 comments per export', 'All export formats', 'Bulk channel/playlist', 'Scheduled exports', 'REST API access', '3 team seats', 'Priority email support', 'AI Analysis (up to 50,000 comments)'],
    notIncluded: ['SSO / SAML', 'White-label', 'Dedicated API quota'],
    cta: 'Start Business', href: '/auth/signup?plan=business', highlight: true, badge: 'Most Popular', note: null,
  },
  {
    name: 'Enterprise', monthlyPrice: 299, annualPrice: 249,
    desc: 'For large teams and enterprise use',
    features: ['Unlimited comments', 'Dedicated API quota', '10 team seats', 'SSO / SAML', 'White-label exports', 'Custom data retention', '99.9% SLA', 'Priority phone support', 'Custom onboarding', 'AI Analysis (up to 100,000 comments)'],
    notIncluded: [],
    cta: 'Contact Sales', href: '/contact', highlight: false, badge: null, note: null,
  },
]

const comparisonFeatures = [
  { label: 'Comments per export', free: '100', pro: '10,000', business: '100,000', enterprise: 'Unlimited' },
  { label: 'Export formats', free: 'All 6', pro: 'All 6', business: 'All 6', enterprise: 'All 6' },
  { label: 'Reply threads', free: false, pro: true, business: true, enterprise: true },
  { label: 'Bulk channel/playlist', free: false, pro: false, business: true, enterprise: true },
  { label: 'Scheduled exports', free: false, pro: false, business: true, enterprise: true },
  { label: 'REST API access', free: false, pro: false, business: true, enterprise: true },
  { label: 'Team seats', free: '1', pro: '1', business: '3', enterprise: '10' },
  { label: 'SSO / SAML', free: false, pro: false, business: false, enterprise: true },
  { label: 'White-label exports', free: false, pro: false, business: false, enterprise: true },
  { label: 'AI Analysis', free: false, pro: '10,000 comments', business: '50,000 comments', enterprise: '100,000 comments' },
  { label: 'SLA guarantee', free: false, pro: false, business: false, enterprise: true },
]

const faqs = [
  { q: 'Is there a free trial for paid plans?', a: 'Yes — Pro and Business plans include a 7-day free trial. No credit card required to start. Cancel anytime.' },
  { q: 'What counts as a "comment"?', a: 'Each unique top-level comment counts as 1 comment. Replies to comments also count individually when you enable the "Include Replies" option.' },
  { q: 'Can I upgrade or downgrade my plan at any time?', a: 'Absolutely. You can change your plan at any time from your dashboard. Upgrades take effect immediately. Downgrades take effect at the end of your billing cycle.' },
  { q: 'Is the YouTube API key required?', a: 'For the free web tool, no — we handle API access on our end. If you use the REST API on Business/Enterprise, you can optionally bring your own YouTube API key for higher quota.' },
  { q: 'Do you offer refunds?', a: 'Refunds are considered only within 48 hours of initial purchase, and only if the tool demonstrably failed to function as described. Usage fees for successfully completed exports are non-refundable. We strongly recommend testing the free tier before upgrading.' },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-4 py-16">
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

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
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
              <Link href={plan.href} className={`block text-center py-3 rounded-xl font-semibold text-sm transition-colors mb-2 ${plan.highlight ? 'bg-red-600 hover:bg-red-700 text-white' : 'border border-white/[0.07] hover:border-white/20 text-[#888888] hover:text-white'}`}>
                {plan.cta}
              </Link>
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
            <p className="text-[#888888] text-sm">Everything in Business, forever. One payment, no recurring fees. Perfect for freelancers and indie hackers.</p>
          </div>
          <Link href="/auth/signup?plan=lifetime" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors whitespace-nowrap">
            Get Lifetime Access →
          </Link>
        </div>

        {/* Comparison table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Full Feature Comparison</h2>
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="text-left px-6 py-4 text-[#888888] font-medium w-1/3">Feature</th>
                  {['Free', 'Pro', 'Business', 'Enterprise'].map(p => (
                    <th key={p} className="px-4 py-4 text-center text-white font-semibold">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr key={row.label} className={`border-b border-white/[0.07] ${i % 2 === 0 ? 'bg-[#0a0a0a]' : ''}`}>
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
      <Footer />
    </div>
  )
}
