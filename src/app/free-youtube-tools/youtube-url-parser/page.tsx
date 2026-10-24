import type { Metadata } from 'next'
import UrlParserClient from './UrlParserClient'

export const metadata: Metadata = {
  title: 'YouTube URL Parser - Free Tool',
  description: 'Paste a YouTube URL and detect whether it is a video, Short, playlist, channel, handle, or youtu.be link.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-url-parser' },
  openGraph: {
    title: 'YouTube URL Parser - Free Tool',
    description: 'Paste a YouTube URL and detect whether it is a video, Short, playlist, channel, handle, or youtu.be link.',
    url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-url-parser',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube URL Parser - Free Tool',
    description: 'Paste a YouTube URL and detect whether it is a video, Short, playlist, channel, handle, or youtu.be link.',
    images: ['/opengraph-image.jpg'],
  },
}

export default function YouTubeUrlParserPage() {
  return <UrlParserClient />
}
