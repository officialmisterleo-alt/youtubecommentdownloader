import type { ComponentType } from 'react'
import YouTubeCommentsSEO from './youtube-comments-seo-value'
import YouTubeCommentsMiddleFunnel from './youtube-comments-middle-funnel-use-cases'
import ViralContentIdeasCompetitorsComments from './viral-content-ideas-competitors-youtube-comments'

const posts: Record<string, ComponentType> = {
  'viral-content-ideas-competitors-youtube-comments': ViralContentIdeasCompetitorsComments,
  'youtube-comments-middle-funnel-use-cases': YouTubeCommentsMiddleFunnel,
  'youtube-comments-seo-value': YouTubeCommentsSEO,
}

export function getPostContent(slug: string): ComponentType | null {
  return posts[slug] ?? null
}
