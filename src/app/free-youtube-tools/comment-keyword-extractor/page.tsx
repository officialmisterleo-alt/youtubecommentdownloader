import type { Metadata } from 'next'
import KeywordExtractorClient from './KeywordExtractorClient'

export const metadata: Metadata = {
  title: 'YouTube Comment Keyword Extractor - Free Tool',
  description: 'Paste YouTube comment text and quickly find repeated keywords in your browser before exporting or analyzing a larger dataset.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/free-youtube-tools/comment-keyword-extractor' },
  openGraph: {
    title: 'YouTube Comment Keyword Extractor - Free Tool',
    description: 'Paste YouTube comment text and quickly find repeated keywords in your browser before exporting or analyzing a larger dataset.',
    url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/comment-keyword-extractor',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Comment Keyword Extractor - Free Tool',
    description: 'Paste YouTube comment text and quickly find repeated keywords in your browser before exporting or analyzing a larger dataset.',
    images: ['/opengraph-image.jpg'],
  },
}

export default function CommentKeywordExtractorPage() {
  return <KeywordExtractorClient />
}
