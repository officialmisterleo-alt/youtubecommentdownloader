import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'YouTube Comment CSV Template - Export Fields',
  description: 'A simple YouTube comment CSV template showing the fields that make comment exports useful in spreadsheets and analysis tools.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-comment-csv-template' },
  openGraph: {
    title: 'YouTube Comment CSV Template - Export Fields',
    description: 'A simple YouTube comment CSV template showing the fields that make comment exports useful in spreadsheets and analysis tools.',
    url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-comment-csv-template',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Comment CSV Template - Export Fields',
    description: 'A simple YouTube comment CSV template showing the fields that make comment exports useful in spreadsheets and analysis tools.',
    images: ['/opengraph-image.jpg'],
  },
}

const columns = [
  ['type', 'Top-level comment or reply'],
  ['video_title', 'The source YouTube video title'],
  ['video_url', 'The source video URL'],
  ['author', 'Comment author display name'],
  ['comment', 'The comment text'],
  ['likes', 'Like count when available'],
  ['published_at', 'Comment publish date'],
  ['parent_comment_id', 'Parent ID for replies'],
]

export default function YouTubeCommentCsvTemplatePage() {
  return (
    <main className="flex-1 bg-[#0a0a0a] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/free-youtube-tools" className="text-sm text-[#777] transition-colors hover:text-white">
          Back to free tools
        </Link>
        <h1 className="mt-8 font-jakarta text-4xl font-extrabold text-[#e5e2e1]">
          YouTube Comment CSV Template
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#888888]">
          A useful YouTube comment export should keep comment text and source context together. These columns make the file easier to filter, analyze, share, and audit.
        </p>

        <section className="mt-8 overflow-hidden rounded-lg border border-white/[0.08]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#131313] text-[#e5e2e1]">
              <tr>
                <th className="border-b border-white/[0.08] px-4 py-3 font-semibold">Column</th>
                <th className="border-b border-white/[0.08] px-4 py-3 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08] bg-[#0f0f0f] text-[#888888]">
              {columns.map(([column, purpose]) => (
                <tr key={column}>
                  <td className="px-4 py-3 font-mono text-[#e5e2e1]">{column}</td>
                  <td className="px-4 py-3">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 rounded-lg border border-white/[0.08] bg-[#131313] p-5">
          <h2 className="font-jakarta text-xl font-bold text-[#e5e2e1]">Example CSV header</h2>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-4 text-sm text-[#d6d3d1]">
            type,video_title,video_url,author,comment,likes,published_at,parent_comment_id
          </pre>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tool" className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500">
            Export real comments
          </Link>
          <Link href="/sample-youtube-comment-export" className="rounded-lg border border-white/[0.12] px-5 py-3 text-sm font-medium text-[#888] transition-colors hover:text-white">
            View sample export
          </Link>
        </div>
      </div>
    </main>
  )
}
