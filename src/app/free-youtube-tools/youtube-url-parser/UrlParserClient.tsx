'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { parseYouTubeUrl } from '@/lib/youtube/url-parser'

function getSummary(input: string) {
  const parsed = parseYouTubeUrl(input)
  if (parsed.type === 'video') return { type: 'Video', id: parsed.id, note: 'Ready for a standard comment export.' }
  if (parsed.type === 'short') return { type: 'Short', id: parsed.id, note: 'Ready for a Shorts comment export.' }
  if (parsed.type === 'playlist') return { type: 'Playlist', id: parsed.id, note: parsed.videoId ? `Includes video ${parsed.videoId}.` : 'Playlist export support depends on your plan.' }
  if (parsed.type === 'channel') return { type: 'Channel', id: parsed.id, note: `Detected as ${parsed.idType.replace('_', ' ')}. Channel exports depend on your plan.` }
  return { type: 'Unknown', id: '', note: 'Paste a YouTube video, Shorts, playlist, channel, handle, or youtu.be URL.' }
}

export default function YouTubeUrlParserPage() {
  const [input, setInput] = useState('')
  const summary = useMemo(() => getSummary(input), [input])

  return (
    <main className="flex-1 bg-[#0a0a0a] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/free-youtube-tools" className="text-sm text-[#777] transition-colors hover:text-white">
          Back to free tools
        </Link>
        <h1 className="mt-8 font-jakarta text-4xl font-extrabold text-[#e5e2e1]">
          YouTube URL Parser
        </h1>
        <p className="mt-4 text-base leading-7 text-[#888888]">
          Check whether a YouTube URL points to a video, Short, playlist, or channel before starting a comment export.
        </p>

        <section className="mt-8 rounded-lg border border-white/[0.08] bg-[#131313] p-5">
          <label htmlFor="youtube-url-parser" className="text-sm font-semibold text-white">
            YouTube URL
          </label>
          <input
            id="youtube-url-parser"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="https://www.youtube.com/@channelname"
            className="mt-3 h-12 w-full rounded-lg border border-white/[0.1] bg-[#0a0a0a] px-4 text-sm text-white outline-none transition-colors placeholder:text-[#555] focus:border-red-500/60"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]">Detected type</p>
              <p className="mt-2 font-jakarta text-2xl font-bold text-[#e5e2e1]">{summary.type}</p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#555]">Detected ID</p>
              <p className="mt-2 break-all font-mono text-sm text-[#e5e2e1]">{summary.id || 'No ID detected yet'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#888888]">{summary.note}</p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tool" className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500">
            Export comments
          </Link>
          <Link href="/bulk-youtube-comment-export" className="rounded-lg border border-white/[0.12] px-5 py-3 text-sm font-medium text-[#888] transition-colors hover:text-white">
            Bulk export guide
          </Link>
        </div>
      </div>
    </main>
  )
}
