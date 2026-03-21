import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://youtubecommentdownloader.com'),
  title: {
    default: 'YouTube Comment Downloader – Export & Analyze Comments',
    template: '%s | YouTubeCommentDownloader',
  },
  description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, and HTML. Analyze comments with AI. Fast YouTube comments extractor for agencies, brands, and researchers.',
  keywords: [
    'youtube comment downloader',
    'download youtube comments',
    'export youtube comments',
    'youtube comments to csv',
    'youtube comments extractor',
    'youtube comment analyzer',
    'youtube comment export',
    'youtube data export',
  ],
  authors: [{ name: 'YouTubeCommentDownloader', url: 'https://youtubecommentdownloader.com' }],
  creator: 'YouTubeCommentDownloader',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://youtubecommentdownloader.com',
    siteName: 'YouTubeCommentDownloader',
    title: 'YouTube Comment Downloader – Export & Analyze Comments',
    description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, and HTML. Analyze comments with AI.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'YouTubeCommentDownloader' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Comment Downloader – Export & Analyze Comments',
    description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, and HTML. Analyze comments with AI.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://youtubecommentdownloader.com',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'YouTubeCommentDownloader',
  url: 'https://youtubecommentdownloader.com',
  description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, and HTML. Analyze comments with AI.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="canonical" href="https://youtubecommentdownloader.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>{children}<Analytics /></body>
    </html>
  )
}
