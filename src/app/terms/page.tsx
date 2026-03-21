import Navbar from '@/components/Navbar'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — YouTubeCommentDownloader',
  description: 'Terms of Service for YouTubeCommentDownloader.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 sm:p-10 lg:p-14">

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-[#555555] text-sm mb-10">Effective Date: March 2026</p>

          <p className="text-[#888888] leading-relaxed mb-8">
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using YouTubeCommentDownloader (the &ldquo;Service&rdquo;) operated by YouTubeCommentDownloader (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the Service you agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">1. Acceptance of Terms</h2>
            <p className="text-[#888888] leading-relaxed">
              By creating an account, accessing the website, or using any part of the Service you confirm that you are at least 18 years old, have the legal capacity to enter into a binding contract, and agree to these Terms and our Privacy Policy. If you are using the Service on behalf of a company or organisation, you represent that you have authority to bind that entity to these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">2. Description of Service</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              YouTubeCommentDownloader is a web-based tool that allows users to extract, analyse, and export comment data from publicly available YouTube videos, channels, and playlists. The Service uses the YouTube Data API v3 to retrieve comment data and makes that data available for download in various formats including CSV, JSON, Excel, HTML, and plain text.
            </p>
            <p className="text-[#888888] leading-relaxed">
              The Service is subject to the limitations and policies of the YouTube Data API. Features, availability, and export limits may change at any time in response to changes in the YouTube Data API or our infrastructure. We do not guarantee uninterrupted access to any specific feature.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">3. User Accounts and Responsibilities</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              To access certain features you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately via our <Link href="/contact" className="text-red-600 hover:underline">contact page</Link> if you become aware of any unauthorised use of your account.
            </p>
            <p className="text-[#888888] leading-relaxed">
              You must provide accurate and complete information when registering. We reserve the right to suspend or terminate accounts that contain false or misleading information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">4. Acceptable Use Policy</h2>
            <p className="text-[#888888] leading-relaxed mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc list-inside text-[#888888] leading-relaxed space-y-2 mb-3">
              <li>Violate YouTube&apos;s Terms of Service or Community Guidelines, or any applicable law or regulation.</li>
              <li>Conduct automated bulk scraping beyond the limits of your subscription plan or in a manner that circumvents YouTube API rate limits.</li>
              <li>Resell, redistribute, or commercially license raw API data obtained through the Service to third parties without our prior written consent.</li>
              <li>Use the exported data to harass, stalk, or target individual users whose comments appear in exported datasets.</li>
              <li>Attempt to reverse-engineer, decompile, or extract the source code of the Service.</li>
              <li>Use the Service in any way that could damage, overload, or impair our servers or the YouTube API infrastructure.</li>
            </ul>
            <p className="text-[#888888] leading-relaxed">
              We reserve the right to suspend or terminate access without notice if we determine, in our sole discretion, that your use violates these restrictions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">5. Subscriptions and Billing</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              The Service is offered on a free tier and on paid subscription plans billed monthly or annually. Subscription fees are charged in advance. By subscribing you authorise us (via our payment processor, Stripe) to charge your payment method on a recurring basis until you cancel.
            </p>
            <p className="text-[#888888] leading-relaxed mb-3">
              Annual plans are billed as a single charge covering twelve months. You may cancel your subscription at any time from your account dashboard. Cancellation takes effect at the end of your current billing period; you will retain access to paid features until that date.
            </p>
            <p className="text-[#888888] leading-relaxed">
              We reserve the right to change pricing with at least 30 days&apos; notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">6. Refund Policy</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              We offer refunds only under the following limited circumstances: (a) the request is made within 48 hours of the initial purchase; and (b) the Service demonstrably failed to export any data due to a defect on our end (not due to YouTube API rate limits, outages, or restrictions on the video content itself).
            </p>
            <p className="text-[#888888] leading-relaxed mb-3">
              Usage-based fees, charges for API calls already consumed, and fees for subscription periods already in progress are non-refundable. Lifetime plan purchases are non-refundable after 48 hours.
            </p>
            <p className="text-[#888888] leading-relaxed">
              To request a refund, <Link href="/contact" className="text-red-600 hover:underline">contact us</Link> with your account email and a description of the issue.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">7. Data and Privacy</h2>
            <p className="text-[#888888] leading-relaxed">
              Your use of the Service is also governed by our <Link href="/privacy" className="text-red-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. The comment data you export consists of publicly available content from YouTube. You are solely responsible for how you store, process, and use that exported data and for complying with any applicable data protection laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">8. Intellectual Property</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              The software, design, branding, and underlying technology of YouTubeCommentDownloader are owned by us and protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works from our software without express written permission.
            </p>
            <p className="text-[#888888] leading-relaxed">
              You own the data you export. We claim no ownership over comment data you download using the Service. However, you acknowledge that the underlying content (the actual YouTube comments) belongs to the original comment authors and to YouTube, and your use of that content must comply with YouTube&apos;s Terms of Service and applicable law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">9. Disclaimer of Warranties</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="text-[#888888] leading-relaxed">
              We make no warranty that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We are not responsible for YouTube API outages, rate limit changes, YouTube policy changes that restrict data access, or any changes to YouTube&apos;s platform that affect the functionality of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">10. Limitation of Liability</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              To the fullest extent permitted by law, we and our officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, lost data, or business interruption, arising out of or related to your use of or inability to use the Service.
            </p>
            <p className="text-[#888888] leading-relaxed">
              In no event shall our total aggregate liability to you exceed the greater of (a) the amount you paid us in the 12 months preceding the claim or (b) USD $100.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">11. Governing Law</h2>
            <p className="text-[#888888] leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any dispute arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">12. Changes to These Terms</h2>
            <p className="text-[#888888] leading-relaxed">
              We reserve the right to update these Terms at any time. When we do, we will revise the effective date at the top of this page and, where appropriate, notify you by email. Your continued use of the Service after any changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">13. Contact</h2>
            <p className="text-[#888888] leading-relaxed">
              If you have questions about these Terms, please <Link href="/contact" className="text-red-600 hover:underline">contact us</Link>.
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-white/[0.07] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-[#888888] text-xs">© 2025–2026 YouTube Comment Downloader</div>
          <div className="flex flex-wrap gap-4 text-xs text-[#555555]">
            <Link href="/tool" className="hover:text-white transition-colors">Tool</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
