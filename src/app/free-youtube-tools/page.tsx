import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileText, Hash, Search, Table2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free YouTube Comment Tools - Export Utilities',
  description: 'Free browser-based YouTube comment tools for parsing URLs, extracting video IDs, preparing CSV exports, and finding repeated comment keywords.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/free-youtube-tools' },
  openGraph: {
    title: 'Free YouTube Comment Tools - Export Utilities',
    description: 'Free browser-based YouTube comment utilities for creators, researchers, marketers, and agencies.',
    url: 'https://www.youtubecommentdownloader.com/free-youtube-tools',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free YouTube Comment Tools - Export Utilities',
    description: 'Free browser-based YouTube comment utilities for creators, researchers, marketers, and agencies.',
    images: ['/opengraph-image.jpg'],
  },
}

const tools = [
  {
    href: '/free-youtube-tools/youtube-video-id-extractor',
    title: 'YouTube Video ID Extractor',
    description: 'Paste any YouTube video URL and pull out the canonical 11-character video ID.',
    icon: Hash,
  },
  {
    href: '/free-youtube-tools/youtube-url-parser',
    title: 'YouTube URL Parser',
    description: 'Identify whether a URL is a video, Short, playlist, or channel before exporting comments.',
    icon: Search,
  },
  {
    href: '/free-youtube-tools/youtube-comment-csv-template',
    title: 'YouTube Comment CSV Template',
    description: 'See the fields a structured YouTube comment export should include for clean analysis.',
    icon: Table2,
  },
  {
    href: '/free-youtube-tools/comment-keyword-extractor',
    title: 'Comment Keyword Extractor',
    description: 'Paste comment text and quickly find repeated terms before running deeper analysis.',
    icon: FileText,
  },
]

export default function FreeYouTubeToolsPage() {
  return (
    <main className="flex-1 bg-[#0a0a0a]">
      <section className="border-b border-white/[0.07] px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-red-400">
            Free YouTube comment utilities
          </p>
          <h1 className="max-w-3xl font-jakarta text-4xl font-extrabold leading-tight text-[#e5e2e1] sm:text-5xl">
            Free YouTube comment tools for research and exports
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#888888]">
            Small browser-based tools that help creators, researchers, agencies, and marketers clean up YouTube URLs, prepare exports, and inspect comment text before downloading full datasets.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tool"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              Download comments
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
            <Link
              href="/sample-youtube-comment-export"
              className="inline-flex items-center justify-center rounded-lg border border-white/[0.12] px-6 py-3 text-sm font-medium text-[#888888] transition-colors hover:border-white/25 hover:text-white"
            >
              View sample export
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-lg border border-white/[0.08] bg-[#131313] p-6 transition-colors hover:border-red-500/40"
              >
                <div className="mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-red-300">
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                <h2 className="font-jakarta text-xl font-bold text-[#e5e2e1]">
                  {tool.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#888888]">{tool.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-300">
                  Open tool
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
