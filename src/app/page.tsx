import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Download, FileText, GitBranch, Clock, Code2, Users, BarChart2, Search, Zap } from 'lucide-react'

const features = [
  { icon: Download, title: 'Bulk Channel Downloads', desc: 'Download all comments from entire channels or playlists in one click. No manual effort.' },
  { icon: FileText, title: 'All Export Formats', desc: 'Export to CSV, Excel, JSON, HTML, or plain text. Compatible with every analytics tool.' },
  { icon: GitBranch, title: 'Full Thread Structure', desc: 'Capture nested reply threads with parent-child relationships preserved.' },
  { icon: Clock, title: 'Scheduled Exports', desc: 'Set automated exports to run daily, weekly, or monthly. Always have fresh data.' },
  { icon: Code2, title: 'REST API Access', desc: 'Integrate with your own tools via our documented REST API. Build custom pipelines.' },
  { icon: Users, title: 'Team Seats & SSO', desc: 'Collaborate with your team. Enterprise plans include SSO and role-based access.' },
]

const useCases = [
  { icon: BarChart2, title: 'Agencies', subtitle: 'Monitor competitor content at scale', desc: 'Track sentiment across competitor channels, benchmark engagement, and deliver data-driven reports to clients — without spending hours copy-pasting.' },
  { icon: Search, title: 'Brands', subtitle: 'Understand what your audience is saying', desc: 'Mine YouTube comments for product feedback, feature requests, and customer sentiment. Turn raw comments into actionable insights for your team.' },
  { icon: Zap, title: 'Researchers', subtitle: 'Build datasets from any public channel', desc: 'Compile large-scale comment datasets for NLP, sentiment analysis, or social science research. Export structured data ready for Python, R, or SPSS.' },
]

const testimonials = [
  { name: 'Sarah K.', role: 'Social Media Manager, MediaWave Agency', quote: "We manage 30+ brand accounts and this tool has completely changed how we do competitive analysis. What used to take a full day now takes 20 minutes. The bulk channel export is a game-changer." },
  { name: 'Dr. James Liu', role: 'PhD Researcher, Stanford NLP Lab', quote: "I needed 500k comments for my dissertation research on political discourse. YTCommentDownloader handled it flawlessly. The JSON export with full metadata is exactly what I needed for my pipeline." },
  { name: 'Marcus T.', role: 'Founder, GrowthStack Agency', quote: "We've white-labeled this for three of our enterprise clients. The API is clean, the rate limits are generous, and the support team actually responds. Worth every penny of the Enterprise plan." },
]

const stats = [
  { label: 'Comments/minute', value: '5,000' },
  { label: 'Teams using YTComment', value: '50,000+' },
  { label: 'Export formats', value: '6' },
  { label: 'Uptime SLA', value: '99.9%' },
]

const pricingPreview = [
  { name: 'Free', price: '$0', desc: '500 comments/export · CSV only', cta: 'Start Free', href: '/tool', highlight: false },
  { name: 'Pro', price: '$29/mo', desc: '100k comments · All formats', cta: 'Start Pro', href: '/pricing', highlight: false },
  { name: 'Business', price: '$79/mo', desc: '1M comments · API + Teams', cta: 'Start Business', href: '/pricing', highlight: true },
  { name: 'Enterprise', price: '$299/mo', desc: 'Unlimited · SSO · White-label', cta: 'Contact Sales', href: 'mailto:enterprise@youtubecommentdownloader.com', highlight: false },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-red-950/40 border border-red-900/40 rounded-full px-4 py-1.5 text-red-400 text-sm mb-6">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Now with REST API & Team Collaboration
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-white">Extract, Analyze &</span>
            <br />
            <span className="bg-gradient-to-r from-white to-red-500 bg-clip-text text-transparent">Export YouTube Comments</span>
            <br />
            <span className="text-white">at Scale</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            The #1 tool for agencies, brands, and researchers. Download full comment threads, bulk exports, and API access — built for teams who need data fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
            <input
              type="text"
              placeholder="Paste YouTube URL..."
              className="flex-1 bg-[#13131a] border border-[#1f1f2e] rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 text-sm"
            />
            <Link href="/tool" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors whitespace-nowrap text-sm">
              Start Free Export →
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span>✓ No credit card required</span>
            <span>✓ 500 free comments</span>
            <span>✓ Used by 50,000+ teams</span>
          </div>
        </div>
      </section>

      {/* Logos strip */}
      <section className="py-10 border-y border-[#1f1f2e]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-600 font-semibold text-sm">
            {['MediaWave', 'GrowthStack', 'DataHarvest', 'BrandIQ', 'NLP Systems', 'SocialPulse'].map(c => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 bg-[#13131a]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map(s => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-gray-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything your team needs</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Built for power users who need reliable, fast, and structured comment data at any scale.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6 hover:border-red-900/50 transition-colors">
                <div className="bg-red-950/40 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-[#0d0d14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for every use case</h2>
            <p className="text-gray-400 max-w-xl mx-auto">From social media agencies to academic researchers — YTCommentDownloader scales with your needs.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map(u => (
              <div key={u.title} className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-8">
                <u.icon className="w-8 h-8 text-red-500 mb-4" />
                <div className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-2">{u.title}</div>
                <h3 className="font-bold text-white text-lg mb-3">{u.subtitle}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Loved by 50,000+ teams</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6">
                <p className="text-gray-300 text-sm leading-relaxed mb-6">&quot;{t.quote}&quot;</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 bg-[#0d0d14]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400">Start free. Scale as you grow.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {pricingPreview.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.highlight ? 'bg-red-950/30 border-red-700' : 'bg-[#13131a] border-[#1f1f2e]'}`}>
                {p.highlight && <div className="text-red-400 text-xs font-semibold uppercase tracking-widest mb-3">Most Popular</div>}
                <div className="font-bold text-white text-lg mb-1">{p.name}</div>
                <div className="text-2xl font-extrabold text-white mb-2">{p.price}</div>
                <p className="text-gray-500 text-xs mb-4">{p.desc}</p>
                <Link href={p.href} className={`block text-center text-sm font-semibold py-2 rounded-lg transition-colors ${p.highlight ? 'bg-red-600 hover:bg-red-700 text-white' : 'border border-[#1f1f2e] hover:border-gray-600 text-gray-300'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/pricing" className="text-red-400 hover:text-red-300 text-sm transition-colors">View full pricing & feature comparison →</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1f1f2e] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-red-600 rounded p-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.47 12.06 12.06 0 00-8.42 5.46 13.79 13.79 0 00-1.4 8.09 12.06 12.06 0 008.42 5.46A4.83 4.83 0 0022 21.31a13.79 13.79 0 00-2.41-14.62z"/></svg>
              </div>
              <span className="font-bold text-sm">YTCommentDownloader</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link href="/tool" className="hover:text-white transition-colors">Tool</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
            <div className="text-gray-600 text-sm">© 2025 YouTube Comment Downloader</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
