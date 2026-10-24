import Link from 'next/link'
import type { Metadata } from 'next'
import TrackedLink from '@/components/TrackedLink'

export const metadata: Metadata = {
  title: 'Sample YouTube Comment Export - CSV Preview and Field Guide',
  description: 'Preview the fields included in a YouTube comment export, including comment text, author, likes, dates, replies, and source video metadata.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/sample-youtube-comment-export' },
  openGraph: {
    title: 'Sample YouTube Comment Export',
    description: 'See what a YouTube comment export looks like before downloading your own CSV, Excel, or JSON file.',
    url: 'https://www.youtubecommentdownloader.com/sample-youtube-comment-export',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sample YouTube Comment Export',
    description: 'See what a YouTube comment export looks like before downloading your own CSV, Excel, or JSON file.',
    images: ['/opengraph-image.jpg'],
  },
}

const sampleRows = [
  {
    type: 'comment',
    videoTitle: 'Product Launch Demo',
    author: '@viewer_one',
    comment: 'Can this export replies too? That would help our research team.',
    likes: 42,
    date: '7/14/2026',
  },
  {
    type: 'reply',
    videoTitle: 'Product Launch Demo',
    author: '@creator',
    comment: 'Yes, reply threads can be included on supported plans.',
    likes: 8,
    date: '7/14/2026',
  },
  {
    type: 'comment',
    videoTitle: 'Product Launch Demo',
    author: '@agency_researcher',
    comment: 'CSV output makes this much easier to filter by question and topic.',
    likes: 27,
    date: '7/15/2026',
  },
]

const fields = [
  ['Type', 'Shows whether the row is a top-level comment or a reply.'],
  ['VideoTitle', 'Keeps the source video attached to each exported row.'],
  ['VideoURL', 'Included in Excel and multi-video CSV exports to identify the source video.'],
  ['Channel', 'Shows the channel name when available.'],
  ['Author', 'The public display name for the commenter.'],
  ['Comment', 'The decoded comment text, ready for filtering or analysis.'],
  ['Likes', 'The like count returned by YouTube.'],
  ['Date', 'The published date for the comment or reply.'],
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'Sample YouTube Comment Export',
  description: 'Example fields included in YouTube comment CSV, Excel, and JSON exports.',
  url: 'https://www.youtubecommentdownloader.com/sample-youtube-comment-export',
  creator: {
    '@type': 'Organization',
    name: 'YouTube Comment Downloader',
    url: 'https://www.youtubecommentdownloader.com',
  },
}

export default function SampleExportPage() {
  return (
    <main className="flex-1 bg-[#0a0a0a]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-white/[0.07] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-red-400">Sample export</p>
          <h1 className="max-w-3xl font-jakarta text-4xl font-extrabold leading-tight text-[#e5e2e1] sm:text-5xl">
            Sample YouTube Comment Export
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#888888]">
            Preview the structure of a YouTube comment export before downloading your own comments to CSV, Excel, JSON, TXT, or HTML. These rows are illustrative examples, not comments from real customers or videos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/sample-youtube-comments.csv"
              download
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] px-6 py-3 text-sm font-medium text-[#e5e2e1] transition-colors hover:border-white/25"
            >
              Download illustrative CSV
            </a>
            <TrackedLink
              href="/tool"
              eventName="sample_export_cta_click"
              eventProperties={{ destination: '/tool' }}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              Create your export
            </TrackedLink>
            <TrackedLink
              href="/export-youtube-comments-to-csv"
              eventName="sample_export_cta_click"
              eventProperties={{ destination: '/export-youtube-comments-to-csv' }}
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] px-6 py-3 text-sm font-medium text-[#888888] transition-colors hover:border-white/25 hover:text-white"
            >
              CSV export guide
            </TrackedLink>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">CSV preview</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777777]">
            This table shows illustrative rows using the single-video CSV columns. Excel and multi-video exports can also include VideoURL and additional source context.
          </p>
          <div className="mt-6 overflow-x-auto border border-white/[0.07]">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-[#131313] text-[#888888]">
                <tr>
                  {['Type', 'VideoTitle', 'Author', 'Comment', 'Likes', 'Date'].map((header) => (
                    <th key={header} className="px-4 py-3 text-left font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row) => (
                  <tr key={`${row.type}-${row.author}`} className="border-t border-white/[0.07]">
                    <td className="px-4 py-3 text-[#888888]">{row.type}</td>
                    <td className="px-4 py-3 text-[#aaaaaa]">{row.videoTitle}</td>
                    <td className="px-4 py-3 text-[#aaaaaa]">{row.author}</td>
                    <td className="px-4 py-3 text-white">{row.comment}</td>
                    <td className="px-4 py-3 text-[#aaaaaa]">{row.likes}</td>
                    <td className="px-4 py-3 text-[#aaaaaa]">{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">Fields included</h2>
            <p className="mt-3 text-sm leading-6 text-[#777777]">
              Export fields are designed to keep comment text readable while preserving enough metadata for filtering, reporting, and analysis.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(([field, description]) => (
              <div key={field} className="border border-white/[0.07] bg-[#131313] p-4">
                <h3 className="font-jakarta text-sm font-semibold text-white">{field}</h3>
                <p className="mt-2 text-xs leading-5 text-[#777777]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">Related export workflows</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['/download-youtube-comments', 'Download comments'],
              ['/youtube-comments-to-excel', 'Excel export'],
              ['/youtube-comment-sentiment-analysis', 'AI analysis'],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="border border-white/[0.07] bg-[#131313] p-5 text-sm font-medium text-[#aaaaaa] transition-colors hover:border-white/[0.15] hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
