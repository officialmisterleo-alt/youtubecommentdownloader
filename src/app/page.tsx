import Link from 'next/link'
import HowItWorksSection from '@/components/HowItWorksSection'
import HomeHeroAnimations from '@/components/HomeHeroAnimations'
import { Download, FileSpreadsheet, Zap, Users, Key, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YouTube Comment Downloader - Export Comments to CSV, Excel, JSON',
  description: 'Download YouTube comments from videos, Shorts, playlists, and channels. Export to CSV, Excel, JSON, TXT, or HTML for research, reporting, and analysis.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com' },
}

const bevel = [
  'bg-gradient-to-br from-[#1c1c1c] to-[#111111]',
  'border border-white/[0.07]',
  'rounded-xl',
  'shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.4)]',
].join(' ')

const features = [
  { icon: Download,        title: 'Bulk Export',       desc: 'Export comments across playlist and channel videos on Business or Enterprise plans.' },
  { icon: FileSpreadsheet, title: '5 Export Formats',  desc: 'Download CSV, Excel, JSON, TXT, or HTML. CSV, Excel, and JSON require an account.' },
  { icon: Zap,             title: 'Choose Your Limit',  desc: 'Start with up to 50 comments without an account, or sign up for a 100-comment monthly free quota.' },
  { icon: Users,           title: 'Team Access',        desc: 'Business includes three team seats for agencies and research teams.' },
  { icon: Key,             title: 'REST API',           desc: 'Enterprise API access supports automated comment export workflows.' },
  { icon: Shield,          title: 'Plan for Your Scale', desc: 'Move from individual exports to larger downloads, bulk sources, and API access as needed.' },
]

const surfaces = ['Video Comments', 'YouTube Shorts', 'Playlists (Business+)', 'Channels (Business+)']

const workflows = [
  { href: '/youtube-comment-scraper', title: 'YouTube Comment Scraper', desc: 'Extract structured comment data without brittle browser scraping.' },
  { href: '/export-youtube-comments-to-csv', title: 'Export Comments to CSV', desc: 'Download spreadsheet-ready CSV files for filtering and analysis.' },
  { href: '/bulk-youtube-comment-export', title: 'Bulk Comment Export', desc: 'Export across playlists and channels on Business or Enterprise.' },
  { href: '/youtube-comment-sentiment-analysis', title: 'Comment Sentiment Analysis', desc: 'Use Pro or higher to turn exported comments into AI-assisted insights.' },
]

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'YouTube Comment Downloader',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  url: 'https://www.youtubecommentdownloader.com',
  description: 'Download and export YouTube comments to CSV, Excel, JSON, TXT, and HTML for research, reporting, and analysis.',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free',
      price: '0',
      priceCurrency: 'USD',
      url: 'https://www.youtubecommentdownloader.com/pricing',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '19',
      priceCurrency: 'USD',
      url: 'https://www.youtubecommentdownloader.com/pricing',
    },
    {
      '@type': 'Offer',
      name: 'Business',
      price: '49',
      priceCurrency: 'USD',
      url: 'https://www.youtubecommentdownloader.com/pricing',
    },
  ],
}

export default function Home() {
  return (
    <div className="flex-1 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-16 sm:pt-28 pb-24 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-red-800/[0.08] blur-[120px] rounded-full pointer-events-none z-0" />
        <HomeHeroAnimations />
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1] mb-2">
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
                <h3 className="font-jakarta text-sm font-semibold text-[#e5e2e1] mb-1">{title}</h3>
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

      {/* ── POPULAR WORKFLOWS ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1] mb-2">
              Popular YouTube comment workflows
            </h2>
            <p className="text-sm text-[#555555] max-w-lg">
              Start with a specific export or analysis task, then scale into bulk research when you need it.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {workflows.map((workflow) => (
              <Link
                key={workflow.href}
                href={workflow.href}
                className={`${bevel} group p-5 transition-colors hover:border-white/[0.15]`}
              >
                <h3 className="font-jakarta text-sm font-semibold text-[#e5e2e1] mb-2 group-hover:text-red-300">
                  {workflow.title}
                </h3>
                <p className="text-xs text-[#555555] leading-relaxed">{workflow.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPORT PREVIEW ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1] mb-3">See the export before you start</h2>
          <p className="text-sm text-[#888888] leading-relaxed mb-5">
            Preview an illustrative comment dataset and its fields, including author, text, likes, date, and source video. Replies are available on Pro or higher.
          </p>
          <Link href="/sample-youtube-comment-export" className="inline-flex rounded-lg border border-white/[0.12] px-5 py-2.5 text-sm font-medium text-[#e5e2e1] transition-colors hover:border-white/25">
            View sample export →
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS — animated state machine ── */}
      <HowItWorksSection />

      {/* ── WHO USES IT ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1] mb-10">Who uses it</h2>
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

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-6 border-t border-white/[0.07]">
        <div className="max-w-2xl mx-auto">
          <div className={`${bevel} rounded-2xl p-10 text-center`}>
            <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1] mb-3">
              Start extracting comments in 30 seconds
            </h2>
            <p className="text-sm text-[#555555] mb-8">
              No credit card required to try. Upgrade when you&apos;re ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/tool"
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-[#e5e2e1] font-semibold px-8 py-2.5 rounded-lg text-sm text-center transition-colors"
              >
                Try Free
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto border border-white/[0.12] hover:border-white/25 text-[#888888] hover:text-[#e5e2e1] font-medium px-8 py-2.5 rounded-lg text-sm text-center transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
