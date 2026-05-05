import type { ComponentType } from 'react'
import YouTubeCommentsSEO from './youtube-comments-seo-value'
import YouTubeCommentsMiddleFunnel from './youtube-comments-middle-funnel-use-cases'
import ViralContentIdeasCompetitorsComments from './viral-content-ideas-competitors-youtube-comments'
import YouTubeCommentDownloader from './youtube-comment-downloader'
import ExportYouTubeCommentsCSV from './export-youtube-comments-csv'
import YouTubeCommentScraperFree from './youtube-comment-scraper-free'
import HowToDownloadYouTubeComments from './how-to-download-youtube-comments'
import YouTubeCommentsToSpreadsheet from './youtube-comments-to-spreadsheet'

const posts: Record<string, ComponentType> = {
  'viral-content-ideas-competitors-youtube-comments': ViralContentIdeasCompetitorsComments,
  'youtube-comments-middle-funnel-use-cases': YouTubeCommentsMiddleFunnel,
  'youtube-comments-seo-value': YouTubeCommentsSEO,
  'youtube-comment-downloader': YouTubeCommentDownloader,
  'export-youtube-comments-csv': ExportYouTubeCommentsCSV,
  'youtube-comment-scraper-free': YouTubeCommentScraperFree,
  'how-to-download-youtube-comments': HowToDownloadYouTubeComments,
  'youtube-comments-to-spreadsheet': YouTubeCommentsToSpreadsheet,
}

export function getPostContent(slug: string): ComponentType | null {
  return posts[slug] ?? null
}
