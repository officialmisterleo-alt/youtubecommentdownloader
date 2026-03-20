import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.07] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
          <div>
            <div className="text-white font-bold text-sm mb-1">YTCommentDownloader</div>
            <div className="text-[#555555] text-xs max-w-xs">
              Bulk YouTube comment extraction for agencies, brands, and researchers.
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-x-10 gap-y-3 text-sm text-[#555555]">
            <div className="flex flex-col gap-3">
              <Link href="/tool"      className="hover:text-white transition-colors">Try the Tool</Link>
              <Link href="/pricing"   className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <a
                href="mailto:support@youtubecommentdownloader.com"
                className="hover:text-white transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.07] pt-6 text-[#555555] text-xs">
          © 2025–2026 YouTube Comment Downloader. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
