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
