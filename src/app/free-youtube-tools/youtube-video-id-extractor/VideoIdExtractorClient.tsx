'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { parseYouTubeUrl } from '@/lib/youtube/url-parser'

export default function YouTubeVideoIdExtractorPage() {
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    const parsed = parseYouTubeUrl(input)
    if (parsed.type === 'video' || parsed.type === 'short') return parsed.id
    if (parsed.type === 'playlist' && parsed.videoId) return parsed.videoId
    return ''
  }, [input])

  return (
    <main className="flex-1 bg-[#0a0a0a] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/free-youtube-tools" className="text-sm text-[#777] transition-colors hover:text-white">
          Back to free tools
        </Link>
        <h1 className="mt-8 font-jakarta text-4xl font-extrabold text-[#e5e2e1]">
          YouTube Video ID Extractor
        </h1>
        <p className="mt-4 text-base leading-7 text-[#888888]">
          Paste a YouTube watch, Shorts, embed, or youtu.be URL and extract the video ID used by exports, thumbnails, embeds, and API workflows.
        </p>

        <section className="mt-8 rounded-lg border border-white/[0.08] bg-[#131313] p-5">
          <label htmlFor="youtube-url" className="text-sm font-semibold text-white">
            YouTube URL
          </label>
          <input
            id="youtube-url"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            className="mt-3 h-12 w-full rounded-lg border border-white/[0.1] bg-[#0a0a0a] px-4 text-sm text-white outline-none transition-colors placeholder:text-[#555] focus:border-red-500/60"
          />
          <div className="mt-5 rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#555]">Video ID</p>
            <p className="mt-2 break-all font-mono text-lg text-[#e5e2e1]">
              {result || 'Paste a video URL to extract the ID'}
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tool" className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500">
            Download comments
          </Link>
          <Link href="/youtube-comment-api" className="rounded-lg border border-white/[0.12] px-5 py-3 text-sm font-medium text-[#888] transition-colors hover:text-white">
            API overview
          </Link>
        </div>
      </div>
    </main>
  )
}
