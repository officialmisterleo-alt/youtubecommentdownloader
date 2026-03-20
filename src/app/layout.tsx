import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'YouTube Comment Downloader - Export Comments at Scale',
  description: 'Download and export YouTube comments to CSV, Excel, JSON and more. Built for agencies, brands, and researchers.',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>{children}</body>
    </html>
  )
}
