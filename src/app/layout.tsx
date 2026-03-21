import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}
export const metadata: Metadata = {
  title: 'YouTube Comment Downloader - Export Comments at Scale',
  description: 'Download and export YouTube comments to CSV, Excel, JSON and more. Built for agencies, brands, and researchers.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased min-h-screen flex flex-col`}>
        <Navbar />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
