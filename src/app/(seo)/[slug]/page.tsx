import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { allSeoPages, getSeoPage } from '@/lib/seo-pages'
import TrackedLink from '@/components/TrackedLink'

export const dynamicParams = false

export function generateStaticParams() {
  return allSeoPages.map((page) => ({ slug: page.slug }))
}

const pageExamples: Record<string, {
  scenario: string
  fields: string[]
  result: string
  links: Array<{ href: string; label: string }>
}> = {
  'youtube-comment-scraper': {
    scenario: 'Scrape comments from a competitor video, keep reply threads attached, then filter the export for repeated questions, complaints, and phrases viewers use naturally.',
    fields: ['Comment text', 'Author', 'Likes', 'Date', 'Reply count', 'Source video'],
    result: 'You get structured comment data that can be reviewed in a spreadsheet or passed into a research workflow without browser scraping scripts.',
    links: [
      { href: '/export-youtube-comments-to-csv', label: 'CSV exports' },
      { href: '/youtube-comment-api', label: 'API access' },
      { href: '/blog/youtube-comment-scraper-free', label: 'Scraper guide' },
    ],
  },
  'download-youtube-comments': {
    scenario: 'Download comments from a product launch video and archive them before the conversation changes or moderation removes useful feedback.',
    fields: ['Comment text', 'Author', 'Likes', 'Date', 'Replies', 'Channel name'],
    result: 'The export becomes a searchable record your team can review for questions, objections, praise, and content ideas.',
    links: [
      { href: '/tool', label: 'Open the downloader' },
      { href: '/bulk-youtube-comment-export', label: 'Bulk export' },
      { href: '/blog/how-to-download-youtube-comments', label: 'Download guide' },
    ],
  },
  'export-youtube-comments-to-csv': {
    scenario: 'Export a video comment section to CSV, open it in Google Sheets, then sort by likes and filter for question marks or keywords.',
    fields: ['Type', 'Video title', 'Author', 'Comment', 'Likes', 'Date'],
    result: 'You can hand the file to a marketer, analyst, client, or researcher without requiring custom code.',
    links: [
      { href: '/youtube-comments-to-excel', label: 'Excel exports' },
      { href: '/blog/export-youtube-comments-csv', label: 'CSV guide' },
      { href: '/youtube-comment-sentiment-analysis', label: 'AI analysis' },
    ],
  },
  'youtube-comments-to-excel': {
    scenario: 'Move YouTube comments into an Excel workbook so a client or internal team can filter, sort, annotate, and share audience feedback.',
    fields: ['Video title', 'Channel', 'Author', 'Comment', 'Likes', 'Date', 'Replies'],
    result: 'The workbook is ready for review meetings, client reports, and quick manual analysis.',
    links: [
      { href: '/export-youtube-comments-to-csv', label: 'CSV workflow' },
      { href: '/download-youtube-comments', label: 'Download comments' },
      { href: '/pricing', label: 'Compare plans' },
    ],
  },
  'youtube-comment-api': {
    scenario: 'Schedule a script that pulls new comments from a channel, stores them in a database, and checks quota before each run.',
    fields: ['Video metadata', 'Comment ID', 'Author', 'Comment text', 'Likes', 'Replies', 'Quota remaining'],
    result: 'Your team can automate recurring reporting without relying on manual exports.',
    links: [
      { href: '/docs', label: 'API reference' },
      { href: '/bulk-youtube-comment-export', label: 'Bulk workflows' },
      { href: '/contact', label: 'Enterprise setup' },
    ],
  },
  'bulk-youtube-comment-export': {
    scenario: 'Export comments across a playlist, campaign, or competitor channel and compare which videos generate the strongest viewer feedback.',
    fields: ['Source video', 'Video URL', 'Channel', 'Author', 'Comment', 'Likes', 'Date'],
    result: 'The consolidated dataset keeps each comment tied to the video it came from, making cross-video analysis practical.',
    links: [
      { href: '/youtube-comment-api', label: 'Automate exports' },
      { href: '/youtube-comment-scraper', label: 'Comment scraper' },
      { href: '/youtube-comment-sentiment-analysis', label: 'Analyze comments' },
    ],
  },
  'youtube-comment-sentiment-analysis': {
    scenario: 'Run AI analysis after an export to summarize sentiment, repeated objections, content requests, audience segments, and emerging topics.',
    fields: ['Sentiment', 'Topics', 'Audience segments', 'Feedback themes', 'Trends'],
    result: 'The raw comments become a structured report your team can use for content planning, product feedback, and market research.',
    links: [
      { href: '/download-youtube-comments', label: 'Export first' },
      { href: '/export-youtube-comments-to-csv', label: 'CSV analysis' },
      { href: '/pricing', label: 'Analysis limits' },
    ],
  },
}

function getSecondaryCtaHref(label: string) {
  if (label === 'View pricing' || label === 'Compare plans') return '/pricing'
  if (label === 'View export formats') return '/blog/youtube-comment-downloader#export-formats'
  if (label === 'Read the CSV guide') return '/blog/export-youtube-comments-csv'
  if (label === 'Try CSV export') return '/export-youtube-comments-to-csv'
  if (label === 'Generate an API key') return '/dashboard'
  if (label === 'View API docs') return '/docs'
  if (label === 'Export comments first') return '/download-youtube-comments'
  if (label === 'See sample export') return '/sample-youtube-comment-export'
  return '/tool'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = getSeoPage(slug)
  if (!page) return {}

  const url = `https://www.youtubecommentdownloader.com/${page.slug}`
  return {
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.metaTitle,
      description: page.description,
      url,
      type: 'website',
      images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle,
      description: page.description,
      images: ['/opengraph-image.jpg'],
    },
  }
}

export default async function SeoLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = getSeoPage(slug)
  if (!page) notFound()

  const url = `https://www.youtubecommentdownloader.com/${page.slug}`
  const relatedPages = page.related
    .map((relatedSlug) => getSeoPage(relatedSlug))
    .filter(Boolean)
  const example = pageExamples[page.slug]

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      description: page.description,
      url,
      isPartOf: {
        '@type': 'WebSite',
        name: 'YouTube Comment Downloader',
        url: 'https://www.youtubecommentdownloader.com',
      },
      about: {
        '@type': 'SoftwareApplication',
        name: 'YouTube Comment Downloader',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: page.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.youtubecommentdownloader.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: page.title,
          item: url,
        },
      ],
    },
  ]

  return (
    <main className="flex-1 bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-white/[0.07] px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-red-400">
              {page.eyebrow}
            </p>
            <h1 className="max-w-3xl font-jakarta text-4xl font-extrabold leading-tight text-[#e5e2e1] sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#888888]">
              {page.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <TrackedLink
                href={page.primaryCta === 'View API docs' ? '/docs' : '/tool'}
                eventName="seo_primary_cta_click"
                eventProperties={{ slug: page.slug, label: page.primaryCta }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
              >
                {page.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </TrackedLink>
              {page.secondaryCta && (
                <TrackedLink
                  href={getSecondaryCtaHref(page.secondaryCta)}
                  eventName="seo_secondary_cta_click"
                  eventProperties={{ slug: page.slug, label: page.secondaryCta }}
                  className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] px-6 py-3 text-sm font-medium text-[#888888] transition-colors hover:border-white/25 hover:text-white"
                >
                  {page.secondaryCta}
                </TrackedLink>
              )}
            </div>
          </div>

          <div className="border border-white/[0.07] bg-[#131313] p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.04)]">
            <div className="rounded-lg border border-white/[0.07] bg-[#0a0a0a] p-4">
              <div className="mb-4 flex items-center justify-between border-b border-white/[0.07] pb-3">
                <span className="text-sm font-semibold text-white">What you get</span>
                <span className="rounded-full border border-red-600/30 bg-red-600/15 px-2.5 py-1 text-xs font-semibold text-red-300">Web tool</span>
              </div>
              <div className="space-y-3">
                {page.heroPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span className="text-sm leading-6 text-[#aaaaaa]">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {page.sections.map((section) => (
            <div key={section.title} className="border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="font-jakarta text-base font-bold text-[#e5e2e1]">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#777777]">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">How it works</h2>
            <p className="mt-3 text-sm leading-6 text-[#777777]">
              The workflow is designed for fast one-off exports and repeatable research.
            </p>
          </div>
          <ol className="space-y-3">
            {page.steps.map((step, index) => (
              <li key={step} className="flex gap-4 border border-white/[0.07] bg-[#131313] p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-[#aaaaaa]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {example && (
        <section className="border-b border-white/[0.07] px-6 py-14">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">Example workflow</h2>
              <p className="mt-3 text-sm leading-6 text-[#777777]">{example.scenario}</p>
              <p className="mt-4 text-sm leading-6 text-[#aaaaaa]">{example.result}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {example.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-xs font-medium text-[#888888] transition-colors hover:border-white/[0.15] hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border border-white/[0.07] bg-[#131313] p-5">
              <h3 className="font-jakarta text-sm font-semibold text-white">Export fields</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {example.fields.map((field) => (
                  <div key={field} className="border border-white/[0.07] bg-[#0a0a0a] px-3 py-2 text-xs text-[#aaaaaa]">
                    {field}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {page.comparison && (
        <section className="border-b border-white/[0.07] px-6 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 max-w-3xl">
              <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">{page.comparison.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#777777]">{page.comparison.intro}</p>
            </div>
            <div className="overflow-x-auto border border-white/[0.07]">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[#131313]">
                  <tr>
                    <th className="w-[24%] px-4 py-3 text-left font-medium text-[#888888]">Criteria</th>
                    <th className="px-4 py-3 text-left font-medium text-[#888888]">{page.comparison.columns[0]}</th>
                    <th className="px-4 py-3 text-left font-medium text-[#888888]">{page.comparison.columns[1]}</th>
                  </tr>
                </thead>
                <tbody>
                  {page.comparison.rows.map((row) => (
                    <tr key={row.criterion} className="border-t border-white/[0.07]">
                      <td className="px-4 py-4 font-medium text-white">{row.criterion}</td>
                      <td className="px-4 py-4 leading-6 text-[#aaaaaa]">{row.first}</td>
                      <td className="px-4 py-4 leading-6 text-[#777777]">{row.second}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center font-jakarta text-2xl font-bold text-[#e5e2e1]">Frequently asked questions</h2>
          <div className="space-y-3">
            {page.faq.map((item) => (
              <div key={item.question} className="border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="font-jakarta text-sm font-semibold text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[#777777]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">Related workflows</h2>
              <p className="mt-2 text-sm text-[#777777]">Explore adjacent ways to export and analyze YouTube comments.</p>
            </div>
            <Link href="/tool" className="hidden text-sm font-medium text-red-400 hover:text-red-300 sm:inline">
              Try the tool
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {relatedPages.map((related) => related && (
              <Link
                key={related.slug}
                href={`/${related.slug}`}
                className="group border border-white/[0.07] bg-[#131313] p-5 transition-colors hover:border-white/[0.15]"
              >
                <h3 className="font-jakarta text-sm font-semibold text-[#e5e2e1] group-hover:text-red-300">
                  {related.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#777777]">{related.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
