import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog — YouTube Comment Downloader',
  description:
    'Insights on YouTube SEO, content strategy, and getting more from your comments.',
  openGraph: {
    title: 'Blog — YouTube Comment Downloader',
    description:
      'Insights on YouTube SEO, content strategy, and getting more from your comments.',
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-[#0a0a0a] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-14">
          <h1 className="text-4xl font-bold text-white mb-3">Blog</h1>
          <p className="text-[#888] text-lg">
            Insights on YouTube SEO, content strategy, and the hidden value of
            your comments.
          </p>
        </div>

        {/* Post list */}
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all p-6"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-[#666]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-red-300 transition-colors leading-snug">
                {post.title}
              </h2>
              <p className="text-[#777] text-sm leading-relaxed mb-4">
                {post.description}
              </p>

              <div className="flex items-center gap-3 text-xs text-[#555]">
                <span>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#333]" />
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
