'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have',
  'he', 'her', 'his', 'i', 'if', 'in', 'is', 'it', 'its', 'just', 'me', 'my', 'not',
  'of', 'on', 'or', 'our', 'so', 'that', 'the', 'their', 'this', 'to', 'too', 'was',
  'we', 'were', 'what', 'when', 'where', 'who', 'why', 'with', 'you', 'your',
])

function extractKeywords(text: string) {
  const counts = new Map<string, number>()
  text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/^'+|'+$/g, ''))
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1))

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
}

export default function CommentKeywordExtractorPage() {
  const [text, setText] = useState('')
  const keywords = useMemo(() => extractKeywords(text), [text])

  return (
    <main className="flex-1 bg-[#0a0a0a] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/free-youtube-tools" className="text-sm text-[#777] transition-colors hover:text-white">
          Back to free tools
        </Link>
        <h1 className="mt-8 font-jakarta text-4xl font-extrabold text-[#e5e2e1]">
          YouTube Comment Keyword Extractor
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#888888]">
          Paste comment text to find repeated words before you run a larger export or AI analysis. This runs locally in your browser.
        </p>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-white/[0.08] bg-[#131313] p-5">
            <label htmlFor="comment-text" className="text-sm font-semibold text-white">
              Comment text
            </label>
            <textarea
              id="comment-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste YouTube comments here..."
              className="mt-3 min-h-80 w-full resize-y rounded-lg border border-white/[0.1] bg-[#0a0a0a] p-4 text-sm leading-6 text-white outline-none transition-colors placeholder:text-[#555] focus:border-red-500/60"
            />
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-[#131313] p-5">
            <h2 className="font-jakarta text-xl font-bold text-[#e5e2e1]">Top keywords</h2>
            <div className="mt-4 space-y-2">
              {keywords.length ? (
                keywords.map(([word, count]) => (
                  <div key={word} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-3 py-2">
                    <span className="break-all text-sm font-medium text-[#e5e2e1]">{word}</span>
                    <span className="ml-3 rounded-full border border-red-600/30 bg-red-600/15 px-2.5 py-1 text-xs font-semibold text-red-300">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[#888888]">Paste comments to see repeated keywords.</p>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/tool" className="rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500">
            Export more comments
          </Link>
          <Link href="/youtube-comment-analysis-tool" className="rounded-lg border border-white/[0.12] px-5 py-3 text-sm font-medium text-[#888] transition-colors hover:text-white">
            AI analysis
          </Link>
        </div>
      </div>
    </main>
  )
}
