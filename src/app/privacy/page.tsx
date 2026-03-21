import Navbar from '@/components/Navbar'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — YouTubeCommentDownloader',
  description: 'Privacy Policy for YouTubeCommentDownloader.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 sm:p-10 lg:p-14">

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-[#555555] text-sm mb-10">Effective Date: March 2026</p>

          <p className="text-[#888888] leading-relaxed mb-8">
            This Privacy Policy explains how YouTubeCommentDownloader (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, stores, and protects information about you when you use our website and Service. By using the Service you agree to the practices described in this policy.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">1. Information We Collect</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              We collect the following categories of information:
            </p>
            <ul className="list-disc list-inside text-[#888888] leading-relaxed space-y-2">
              <li><strong>Account information:</strong> your name and email address when you register or sign in with Google OAuth.</li>
              <li><strong>Authentication tokens:</strong> Google OAuth tokens used to authenticate your session. These are stored securely and used only to maintain your logged-in state.</li>
              <li><strong>Usage and export history:</strong> records of URLs you have submitted, export options selected, and the number of comments retrieved. This data is used to enforce plan limits and display your export history.</li>
              <li><strong>Payment information:</strong> billing details (card type, last four digits, billing address) collected and stored by our payment processor, Stripe. We do not store full card numbers on our servers.</li>
              <li><strong>Technical data:</strong> IP address, browser type, device type, and pages visited, collected automatically via server logs and analytics. This is used for security monitoring and service improvement.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">2. How We Use Your Information</h2>
            <p className="text-[#888888] leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-[#888888] leading-relaxed space-y-2">
              <li>Provide, operate, and improve the Service.</li>
              <li>Authenticate your identity and maintain your session.</li>
              <li>Process subscription payments and manage your billing account.</li>
              <li>Enforce plan limits and prevent abuse of the YouTube Data API quota.</li>
              <li>Send transactional emails such as receipts, password resets, and service notifications.</li>
              <li>Investigate and respond to security incidents or violations of our Terms of Service.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">3. Data Retention</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              We retain your account information and export history for as long as your account is active. If you delete your account we will delete your personal data within 30 days, except where we are required to retain it for legal, tax, or accounting purposes (typically up to 7 years for billing records).
            </p>
            <p className="text-[#888888] leading-relaxed">
              Server logs containing IP addresses and technical data are retained for up to 90 days and then deleted.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">4. Third-Party Services</h2>
            <p className="text-[#888888] leading-relaxed mb-3">We rely on the following trusted third-party services to operate:</p>
            <ul className="list-disc list-inside text-[#888888] leading-relaxed space-y-2">
              <li><strong>Supabase</strong> — authentication and database hosting. Your account data and export history are stored in Supabase-managed infrastructure. Supabase is SOC 2 Type II certified.</li>
              <li><strong>Stripe</strong> — payment processing. Stripe stores your payment method details under PCI DSS compliance. We receive only tokenised references to your payment method.</li>
              <li><strong>Vercel</strong> — website hosting and serverless functions. Your requests are processed on Vercel&apos;s infrastructure. Vercel is SOC 2 Type II certified.</li>
              <li><strong>YouTube Data API v3</strong> — comment retrieval. When you submit a YouTube URL, we make requests to the YouTube Data API on your behalf. This is subject to <a href="https://policies.google.com/privacy" className="text-red-600 hover:underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.</li>
            </ul>
            <p className="text-[#888888] leading-relaxed mt-3">
              We do not sell your personal data to any third party. We share data with third-party services only to the extent necessary to operate the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">5. Cookies</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              We use session cookies to maintain your authenticated state. These cookies are essential to the operation of the Service and are set only after you log in. They expire when your session ends or after 7 days of inactivity.
            </p>
            <p className="text-[#888888] leading-relaxed">
              We do not use tracking cookies, advertising cookies, or any third-party analytics cookies that monitor your behaviour across other websites. We do not serve or participate in behavioural advertising.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">6. Your Rights</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              Depending on your jurisdiction you may have the following rights with respect to your personal data:
            </p>
            <ul className="list-disc list-inside text-[#888888] leading-relaxed space-y-2 mb-3">
              <li><strong>Access:</strong> request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> request that we correct inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> request deletion of your personal data (subject to retention obligations).</li>
              <li><strong>Portability:</strong> request an export of your data in a machine-readable format.</li>
              <li><strong>Objection or restriction:</strong> object to certain processing or ask us to restrict it.</li>
            </ul>
            <p className="text-[#888888] leading-relaxed">
              To exercise any of these rights, email us at <a href="mailto:support@youtubecommentdownloader.com" className="text-red-600 hover:underline">support@youtubecommentdownloader.com</a>. We will respond within 30 days.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">7. Security</h2>
            <p className="text-[#888888] leading-relaxed">
              We implement industry-standard security measures including HTTPS encryption for all data in transit, secure storage of credentials via Supabase (bcrypt hashing for passwords), and access controls limiting who within our team can access production data. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">8. GDPR and CCPA</h2>
            <p className="text-[#888888] leading-relaxed mb-3">
              <strong>GDPR (EU/EEA users):</strong> Our lawful bases for processing are performance of a contract (to provide the Service you signed up for), compliance with legal obligations, and our legitimate interests (security monitoring and abuse prevention). You have the right to lodge a complaint with your local data protection authority.
            </p>
            <p className="text-[#888888] leading-relaxed">
              <strong>CCPA (California residents):</strong> We do not sell your personal information. California residents have the right to know what personal information is collected, the right to delete personal information, and the right not to be discriminated against for exercising these rights. To submit a request, contact <a href="mailto:support@youtubecommentdownloader.com" className="text-red-600 hover:underline">support@youtubecommentdownloader.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">9. Children&apos;s Privacy</h2>
            <p className="text-[#888888] leading-relaxed">
              The Service is not directed to children under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">10. Changes to This Policy</h2>
            <p className="text-[#888888] leading-relaxed">
              We may update this Privacy Policy from time to time. When we do, we will revise the effective date at the top of this page and, where required by law, notify you by email. Your continued use of the Service after any update constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/[0.07]">11. Contact</h2>
            <p className="text-[#888888] leading-relaxed">
              For privacy-related questions or requests, contact us at{' '}
              <a href="mailto:support@youtubecommentdownloader.com" className="text-red-600 hover:underline">
                support@youtubecommentdownloader.com
              </a>.
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
            <a href="mailto:support@youtubecommentdownloader.com" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
