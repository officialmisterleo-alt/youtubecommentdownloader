import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.07] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
          <div>
            <div className="text-[#e5e2e1] font-bold text-sm mb-1">YouTubeCommentDownloader</div>
            <div className="text-[#555555] text-xs max-w-xs">
              Export YouTube comments from videos and Shorts. Business plans add playlist and channel exports.
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-[#555555] sm:grid-cols-4">
            <div className="flex flex-col gap-3">
              <Link href="/tool"      className="hover:text-white transition-colors">Try the Tool</Link>
              <Link href="/pricing"   className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/free-youtube-tools" className="hover:text-white transition-colors">Free Tools</Link>
              <Link href="/blog"      className="hover:text-white transition-colors">Blog</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/youtube-comment-scraper" className="hover:text-white transition-colors">Comment Scraper</Link>
              <Link href="/download-youtube-comments" className="hover:text-white transition-colors">Download Comments</Link>
              <Link href="/youtube-comment-analysis-tool" className="hover:text-white transition-colors">Analysis Tool</Link>
              <Link href="/export-youtube-comments-to-csv" className="hover:text-white transition-colors">Export to CSV</Link>
              <Link href="/youtube-comments-to-excel" className="hover:text-white transition-colors">Excel Export</Link>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/bulk-youtube-comment-export" className="hover:text-white transition-colors">Bulk Export</Link>
              <Link href="/youtube-comment-sentiment-analysis" className="hover:text-white transition-colors">Sentiment Analysis</Link>
              <Link href="/sample-youtube-comment-export" className="hover:text-white transition-colors">Sample Export</Link>
              <Link href="/youtube-comments-to-google-sheets" className="hover:text-white transition-colors">Google Sheets</Link>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/youtube-comment-downloader-for-researchers" className="hover:text-white transition-colors">For Researchers</Link>
              <Link href="/youtube-comment-api" className="hover:text-white transition-colors">API Overview</Link>
              <Link href="/docs" className="hover:text-white transition-colors">API Docs</Link>
              <Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.07] pt-6 text-[#555555] text-xs">
          © 2026 YouTubeCommentDownloader.com
        </div>
      </div>
    </footer>
  )
}
