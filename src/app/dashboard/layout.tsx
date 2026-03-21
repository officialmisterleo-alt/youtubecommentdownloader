import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard – YouTubeCommentDownloader',
  description: 'View your YouTube comment export history, track usage, and manage your YouTubeCommentDownloader account.',
  robots: { index: false, follow: false },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
