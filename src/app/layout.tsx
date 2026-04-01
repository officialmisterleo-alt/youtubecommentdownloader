import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' })
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
export const metadata: Metadata = {
  title: 'YouTube Comment Downloader - Export Comments at Scale',
  description: 'Download and export YouTube comments to CSV, Excel, JSON and more. Built for agencies, brands, and researchers.',
  metadataBase: new URL('https://www.youtubecommentdownloader.com'),
  alternates: { canonical: 'https://www.youtubecommentdownloader.com' },
  openGraph: {
    type: 'website',
    url: 'https://www.youtubecommentdownloader.com',
    title: 'YouTube Comment Downloader — Export Comments at Scale',
    description: 'Download and export YouTube comments to CSV, Excel, JSON and more. Built for agencies, brands, and researchers.',
    siteName: 'YouTube Comment Downloader',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Comment Downloader — Export Comments at Scale',
    description: 'Download and export YouTube comments to CSV, Excel, JSON and more.',
    images: ['/opengraph-image.jpg'],
  },
  verification: {
    google: '1dR23onHLgwcg4rDcweR9Iw0AkfsUPGiNvAJp_t8pY4',
  },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.className} ${jakarta.variable} bg-[#131313] text-[#e5e2e1] antialiased min-h-screen flex flex-col`}>
        <Navbar />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
