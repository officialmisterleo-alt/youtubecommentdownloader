import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing – YouTube Comment Downloader',
  description: 'Simple, transparent pricing for YouTubeCommentDownloader. Start free and scale as you grow. Download YouTube comments to CSV, JSON, Excel and more.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/pricing' },
  openGraph: {
    title: 'Pricing – YouTube Comment Downloader',
    description: 'Simple, transparent pricing for YouTubeCommentDownloader. Start free and scale as you grow.',
    url: 'https://www.youtubecommentdownloader.com/pricing',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing – YouTube Comment Downloader',
    description: 'Simple, transparent pricing for YouTubeCommentDownloader. Start free and scale as you grow.',
    images: ['/opengraph-image.jpg'],
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
