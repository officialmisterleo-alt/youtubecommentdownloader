import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | YouTubeCommentDownloader',
  description:
    'Get in touch with the YouTubeCommentDownloader team. We typically respond within 1 business day.',
}

export default function ContactPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Contact Us</h1>
            <p className="text-[#888888] text-sm">
              We typically respond within 1 business day.
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
