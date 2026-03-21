import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In – YouTubeCommentDownloader',
  description: 'Sign in or create a free account to download and export YouTube comments to CSV, JSON, Excel, and more.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
