import Link from 'next/link'
import type { ReactNode } from 'react'
import TableOfContents from './TableOfContents'

type TocItem = { id: string; label: string; level: 2 | 3 }

export default function BlogPostLayout({
  title,
  description,
  date,
  readTime,
  tags,
  toc,
  children,
}: {
  title: string
  description: string
  date: string
  readTime: string
  tags: string[]
  toc?: TocItem[]
  children: ReactNode
}) {
  const formatted = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-[#0a0a0a] py-16 px-4">
      {/* Hero */}
      <div className="max-w-3xl mx-auto mb-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-[#555] hover:text-[#999] transition-colors mb-8"
        >
          <span>←</span> All posts
        </Link>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-[#888]"
            >
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
          {title}
        </h1>
        <p className="text-lg text-[#888] leading-relaxed mb-6">{description}</p>

        <div className="flex items-center gap-3 text-sm text-[#555]">
          <span>{formatted}</span>
          <span className="w-1 h-1 rounded-full bg-[#333]" />
          <span>{readTime}</span>
        </div>

        <div className="mt-8 border-t border-white/[0.06]" />
      </div>

      {/* Content area with optional TOC sidebar */}
      <div className="max-w-[1100px] mx-auto flex gap-16 items-start justify-center">
        <article className="max-w-3xl w-full min-w-0 prose-custom">{children}</article>
        {toc && toc.length > 0 && <TableOfContents items={toc} />}
      </div>

      {/* CTA footer */}
      <div className="max-w-3xl mx-auto mt-16 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Ready to analyze your comments?
        </h3>
        <p className="text-sm text-[#888] mb-6">
          Export, analyze, and mine your YouTube comments for SEO gold — with one click.
        </p>
        <Link
          href="/tool"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
        >
          Try the tool free
        </Link>
      </div>
    </main>
  )
}
