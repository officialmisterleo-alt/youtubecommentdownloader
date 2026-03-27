import type { ComponentType } from 'react'

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  tags: string[]
  Content: ComponentType
}

// Registry of all posts — sorted by date desc
const posts: Omit<BlogPost, 'Content'>[] = [
  {
    slug: 'youtube-comments-middle-funnel-use-cases',
    title: 'What to Do With Downloaded YouTube Comments',
    description:
      'Most people download YouTube comments and stop there. Here are five research-backed ways to turn that data into better landing pages, sharper positioning, and content your audience actually wants.',
    date: '2025-02-10',
    readTime: '7 min read',
    tags: ['YouTube Strategy', 'Content Marketing', 'Audience Research'],
  },
  {
    slug: 'youtube-comments-seo-value',
    title: 'The Hidden SEO Value of YouTube Comments',
    description:
      'Most creators think comments are just community feedback. New research reveals they may quietly shape how YouTube — and even Google — discovers and ranks your videos.',
    date: '2025-01-15',
    readTime: '8 min read',
    tags: ['YouTube SEO', 'Content Strategy', 'Algorithm Insights'],
  },
]

export function getAllPosts(): Omit<BlogPost, 'Content'>[] {
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPostMeta(
  slug: string
): Omit<BlogPost, 'Content'> | undefined {
  return posts.find((p) => p.slug === slug)
}
