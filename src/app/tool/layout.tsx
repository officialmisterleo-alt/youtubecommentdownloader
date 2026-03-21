import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'YouTube Comment Downloader Tool – Export to CSV, JSON, Excel',
  description: 'Use our free YouTube comment extractor to download and export comments from any YouTube video, playlist, or channel to CSV, JSON, Excel, TXT, or HTML.',
  alternates: { canonical: 'https://youtubecommentdownloader.com/tool' },
  openGraph: {
    title: 'YouTube Comment Downloader Tool – Export to CSV, JSON, Excel',
    description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, or HTML. Fast, free YouTube comments extractor.',
    url: 'https://youtubecommentdownloader.com/tool',
  },
}

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children
}
