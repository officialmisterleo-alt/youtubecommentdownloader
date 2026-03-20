import Link from 'next/link'
import Navbar from '@/components/Navbar'
import HeroInput from '@/components/HeroInput'
import Footer from '@/components/Footer'
import { Download, FileSpreadsheet, Zap, Users, Key, Shield } from 'lucide-react'

// Bevel card class — reused across all cards
const bevel = [
  'bg-gradient-to-br from-[#1c1c1c] to-[#111111]',
  'border border-white/[0.07]',
  'rounded-xl',
  'shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.4)]',
].join(' ')

const features = [
  { icon: Download,       title: 'Bulk Export',       desc: 'Download thousands of comments from any video, playlist, or channel in one click.' },
  { icon: FileSpreadsheet, title: '6 Export Formats', desc: 'CSV, JSON, Excel, TXT and more. Ready to drop into any analytics workflow.' },
  { icon: Zap,            title: 'Instant Results',   desc: '5,000 comments per minute. No queue, no waiting. Results appear as they load.' },
  { icon: Users,          title: 'Team Access',       desc: 'Share exports, manage seats, and collaborate across your agency or research team.' },
  { icon: Key,            title: 'REST API',          desc: 'Full API access for Business and Enterprise. Automate exports and integrate with your stack.' },
  { icon: Shield,         title: 'Enterprise Ready',  desc: 'SOC2-grade infrastructure, SLA guarantees, and dedicated support for large teams.' },
]

const surfaces = ['Video Comments', 'Playlist Comments', 'Channel Comments', 'YouTube Shorts']

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden text-white">
      <Navbar />

      {/* ── HERO — centered, no split ── */}
      <section className="flex flex-col items-center text-center px-6 pt-16 sm:pt-28 pb-24">
        <span className="text-xs font-semibold tracking-widest text-red-500 uppercase mb-6">
          YouTube Comment Downloader
        </span>

        <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight max-w-4xl mb-6">
          Extract any YouTube<br />comment thread
        </h1>

        <p className="text-[#888888] text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
          Bulk export comments from any video, playlist, or channel.
          CSV, JSON, Excel — built for agencies and researchers.
        </p>

        <HeroInput />

        <div className="flex items-center gap-6 mt-10 text-sm text-[#555555]">
          <span>45k+ users</span>
          <span className="text-[#333]">·</span>
          <span>6 export formats</span>
          <span className="text-[#333]">·</span>
          <span>5k comments/min</span>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              Everything your team needs
            </h2>
            <p className="text-sm text-[#555555] max-w-lg">
              From one-off exports to production API pipelines — built for every use case.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={`${bevel} p-5`}>
                <div className="w-9 h-9 bg-white/[0.05] rounded-lg flex items-center justify-center mb-4">
                  <Icon size={18} className="text-white/60" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                <p className="text-xs text-[#555555] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORTED SOURCES ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#555555] mb-6">
            Supported Sources
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {surfaces.map(label => (
              <div
                key={label}
                className="bg-[#171717] border border-white/[0.07] rounded-full px-4 py-2 text-xs text-[#888888] font-medium"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-3xl mx-auto">
          <blockquote className="text-xl md:text-2xl font-medium text-white/70 italic leading-relaxed mb-4">
            &ldquo;We manage 30+ brand accounts. What used to take a full day now takes
            20 minutes. The bulk channel export changed how we do competitive analysis.&rdquo;
          </blockquote>
          <cite className="text-[#555555] text-sm not-italic">
            — Sarah K., Social Media Manager at MediaWave Agency
          </cite>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-10">How it works</h2>
          <div className="space-y-8">
            {[
              { n: '1', title: 'Paste any YouTube URL',  desc: 'Drop in a video, channel, or playlist URL. Works with any public YouTube content.' },
              { n: '2', title: 'Set your options',       desc: 'Choose how many comments, whether to include replies, and your preferred export format.' },
              { n: '3', title: 'Download your data',     desc: 'Export to CSV, Excel, JSON, HTML, or plain text — ready for any analytics tool or pipeline.' },
            ].map(step => (
              <div key={step.n} className="flex gap-6 items-start">
                <span className="text-4xl font-bold text-red-600 leading-none w-10 shrink-0 tabular-nums">
                  {step.n}
                </span>
                <div className="pt-1">
                  <h3 className="text-white font-semibold text-base mb-1">{step.title}</h3>
                  <p className="text-[#555555] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO USES IT ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-10">Who uses it</h2>
          <div>
            {[
              {
                tag: 'For Agencies',
                desc: 'Monitor competitor channels at scale. Track sentiment trends across entire channel libraries. Deliver data-backed reports to clients without hours of manual work.',
              },
              {
                tag: 'For Brands',
                desc: 'Mine your own comments for product feedback, feature requests, and support issues. Understand what your audience actually thinks — not just what the algorithm shows.',
              },
              {
                tag: 'For Researchers',
                desc: 'Build large-scale comment datasets for NLP, sentiment analysis, and social science research. Structured exports ready for Python, R, or any data pipeline.',
              },
            ].map((u, i) => (
              <div
                key={u.tag}
                className={`flex flex-col sm:flex-row gap-4 sm:gap-10 py-7 ${i < 2 ? 'border-b border-white/[0.07]' : ''}`}
              >
                <div className="sm:w-32 shrink-0">
                  <span className="text-red-500 font-semibold text-sm">{u.tag}</span>
                </div>
                <p className="text-[#888888] text-sm leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — bevel card ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-2xl mx-auto">
          <div className={`${bevel} rounded-2xl p-10 text-center`}>
            <h2 className="text-2xl font-bold text-white mb-3">
              Start extracting comments in 30 seconds
            </h2>
            <p className="text-sm text-[#555555] mb-8">
              No credit card required to try. Upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/tool"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-2.5 rounded-lg text-sm text-center transition-colors"
              >
                Try Free
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto border border-white/[0.12] hover:border-white/25 text-[#888888] hover:text-white font-medium px-8 py-2.5 rounded-lg text-sm text-center transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
