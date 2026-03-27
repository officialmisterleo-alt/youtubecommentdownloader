import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '600', '700', '800'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
export const metadata: Metadata = {
  title: 'YouTube Comment Downloader - Export Comments at Scale',
  description: 'Download and export YouTube comments to CSV, Excel, JSON and more. Built for agencies, brands, and researchers.',
  alternates: { canonical: 'https://youtubecommentdownloader.com' },
  openGraph: {
    type: 'website',
    url: 'https://youtubecommentdownloader.com',
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
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans bg-[#131313] text-[#e5e2e1] antialiased min-h-screen flex flex-col">
        <Navbar />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
