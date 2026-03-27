import Link from 'next/link'
import HeroInput from '@/components/HeroInput'
import { Download, FileSpreadsheet, Zap, Users, Key, Shield } from 'lucide-react'

const features = [
  { icon: Download,        title: 'Bulk Export',       desc: 'Download thousands of comments from any video, playlist, or channel in one click.' },
  { icon: FileSpreadsheet, title: '6 Export Formats',  desc: 'CSV, JSON, Excel, TXT and more. Ready to drop into any analytics workflow.' },
  { icon: Zap,             title: 'Instant Results',   desc: '5,000 comments per minute. No queue, no waiting. Results appear as they load.' },
  { icon: Users,           title: 'Team Access',       desc: 'Share exports, manage seats, and collaborate across your agency or research team.' },
  { icon: Key,             title: 'REST API',          desc: 'Full API access for Business and Enterprise. Automate exports and integrate with your stack.' },
  { icon: Shield,          title: 'Enterprise Ready',  desc: 'SOC2-grade infrastructure, SLA guarantees, and dedicated support for large teams.' },
]

const surfaces = ['Video Comments', 'Playlist Comments', 'Channel Comments', 'YouTube Shorts']

const stats = [
  { value: '45k+',      label: 'users' },
  { value: '6',         label: 'export formats' },
  { value: '5k/min',    label: 'comments' },
  { value: 'bulk',      label: 'extraction' },
]

export default function Home() {
  return (
    <div className="flex-1 overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="bg-[#131313] px-6 pt-20 sm:pt-32 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="pl-0 lg:pl-10">
            <span className="text-xs font-semibold tracking-widest text-[#dc2626] uppercase mb-6 block">
              YouTube Comment Downloader
            </span>

            <h1 className="font-jakarta font-extrabold text-[2.75rem] sm:text-[3.5rem] leading-tight tracking-tight text-[#e5e2e1] max-w-2xl mb-6">
              Extract any YouTube<br />comment thread
            </h1>

            <p className="font-sans text-[#a09a99] text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              Bulk export comments from any video, playlist, or channel.
              CSV, JSON, Excel — built for agencies and researchers.
            </p>

            {/* Data-Glance Rail */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 mb-10">
              {stats.map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="font-jakarta font-semibold text-[#e5e2e1] text-lg leading-none">{value}</span>
                  <span className="font-sans text-[#a09a99] text-xs mt-1">{label}</span>
                </div>
              ))}
            </div>

            <HeroInput />

            <div className="flex flex-wrap items-center gap-3 mt-8 mb-16">
              <Link
                href="/tool"
                className="bg-[#dc2626] hover:bg-gradient-to-br hover:from-[#dc2626] hover:to-[#b91c1c] text-white font-semibold px-7 py-3 rounded-[0.75rem] text-sm text-center transition-all"
              >
                Try Free
              </Link>
              <Link
                href="/pricing"
                className="bg-[#2a2929] text-[#e5e2e1] font-medium px-7 py-3 rounded-[0.75rem] text-sm text-center transition-colors hover:bg-[#353534]"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="bg-[#1c1b1b] py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 lg:pl-10">
            <h2 className="font-jakarta font-semibold text-2xl text-[#e5e2e1] mb-2">
              Everything your team needs
            </h2>
            <p className="font-sans text-sm text-[#a09a99] max-w-lg">
              From one-off exports to production API pipelines — built for every use case.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-[#201f1f] rounded-[1rem] p-6">
                <div className="w-10 h-10 bg-[#2a2929] rounded-lg flex items-center justify-center mb-5">
                  <Icon size={18} className="text-[#a09a99]" />
                </div>
                <h3 className="font-jakarta font-semibold text-[#e5e2e1] mb-2">{title}</h3>
                <p className="font-sans text-sm text-[#a09a99] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUPPORTED SOURCES ── */}
      <section className="bg-[#131313] py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-[#a09a99] mb-8">
            Supported Sources
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {surfaces.map(label => (
              <div
                key={label}
                className="bg-[#2a2929] text-[#e5e2e1] rounded-full px-4 py-1.5 text-sm font-medium"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="bg-[#0e0e0e] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#1c1b1b] rounded-[1rem] p-10">
            <blockquote className="font-sans text-xl md:text-2xl font-medium text-[#e5e2e1]/70 italic leading-relaxed mb-5">
              &ldquo;We manage 30+ brand accounts. What used to take a full day now takes
              20 minutes. The bulk channel export changed how we do competitive analysis.&rdquo;
            </blockquote>
            <cite className="font-sans text-[#a09a99] text-sm not-italic">
              — Sarah K., Social Media Manager at MediaWave Agency
            </cite>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[#1c1b1b] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-jakarta font-semibold text-2xl text-[#e5e2e1] mb-12">How it works</h2>
          <div className="space-y-10">
            {[
              { n: '1', title: 'Paste any YouTube URL',  desc: 'Drop in a video, channel, or playlist URL. Works with any public YouTube content.' },
              { n: '2', title: 'Set your options',       desc: 'Choose how many comments, whether to include replies, and your preferred export format.' },
              { n: '3', title: 'Download your data',     desc: 'Export to CSV, Excel, JSON, HTML, or plain text — ready for any analytics tool or pipeline.' },
            ].map(step => (
              <div key={step.n} className="flex gap-6 items-start">
                <span className="font-jakarta font-extrabold text-4xl text-[#dc2626] leading-none w-10 shrink-0 tabular-nums">
                  {step.n}
                </span>
                <div className="pt-1">
                  <h3 className="font-jakarta font-semibold text-[#e5e2e1] text-base mb-2">{step.title}</h3>
                  <p className="font-sans text-[#a09a99] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO USES IT ── */}
      <section className="bg-[#131313] py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-jakarta font-semibold text-2xl text-[#e5e2e1] mb-12">Who uses it</h2>
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
                className={`flex flex-col sm:flex-row gap-4 sm:gap-10 py-8 ${i < 2 ? 'border-b border-[rgba(92,64,60,0.15)]' : ''}`}
              >
                <div className="sm:w-36 shrink-0">
                  <span className="font-jakarta font-semibold text-[#dc2626] text-sm">{u.tag}</span>
                </div>
                <p className="font-sans text-[#a09a99] text-sm leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-[#1c1b1b] py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-jakarta font-extrabold text-[2rem] text-[#e5e2e1] mb-3">
            Start extracting comments in 30 seconds
          </h2>
          <p className="font-sans text-sm text-[#a09a99] mb-10">
            No credit card required to try. Upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/tool"
              className="w-full sm:w-auto bg-[#dc2626] hover:bg-gradient-to-br hover:from-[#dc2626] hover:to-[#b91c1c] text-white font-semibold px-8 py-3 rounded-[0.75rem] text-sm text-center transition-all"
            >
              Try Free
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto bg-[#2a2929] text-[#e5e2e1] font-medium px-8 py-3 rounded-[0.75rem] text-sm text-center transition-colors hover:bg-[#353534]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
