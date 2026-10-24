import type { Metadata } from 'next'
import VideoIdExtractorClient from './VideoIdExtractorClient'

export const metadata: Metadata = {
  title: 'YouTube Video ID Extractor - Free Tool',
  description: 'Paste a YouTube URL and extract the canonical video ID for exports, thumbnails, embeds, and API workflows.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-video-id-extractor' },
  openGraph: {
    title: 'YouTube Video ID Extractor - Free Tool',
    description: 'Paste a YouTube URL and extract the canonical video ID for exports, thumbnails, embeds, and API workflows.',
    url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-video-id-extractor',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Video ID Extractor - Free Tool',
    description: 'Paste a YouTube URL and extract the canonical video ID for exports, thumbnails, embeds, and API workflows.',
    images: ['/opengraph-image.jpg'],
  },
}

export default function YouTubeVideoIdExtractorPage() {
  return <VideoIdExtractorClient />
}
