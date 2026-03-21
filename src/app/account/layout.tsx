import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account – YouTubeCommentDownloader',
  description: 'Manage your YouTubeCommentDownloader account settings, billing, and subscription.',
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
