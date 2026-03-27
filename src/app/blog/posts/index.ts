import type { ComponentType } from 'react'
import YouTubeCommentsSEO from './youtube-comments-seo-value'

const posts: Record<string, ComponentType> = {
  'youtube-comments-seo-value': YouTubeCommentsSEO,
}

export function getPostContent(slug: string): ComponentType | null {
  return posts[slug] ?? null
}
