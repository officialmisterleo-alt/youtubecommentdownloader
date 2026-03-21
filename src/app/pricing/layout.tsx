import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing – YouTube Comment Downloader',
  description: 'Simple, transparent pricing for YouTubeCommentDownloader. Start free and scale as you grow. Download YouTube comments to CSV, JSON, Excel and more.',
  alternates: { canonical: 'https://youtubecommentdownloader.com/pricing' },
  openGraph: {
    title: 'Pricing – YouTube Comment Downloader',
    description: 'Simple, transparent pricing for YouTubeCommentDownloader. Start free and scale as you grow.',
    url: 'https://youtubecommentdownloader.com/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
