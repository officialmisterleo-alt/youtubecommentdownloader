import type { Metadata } from 'next'
import { toolFaqs } from '@/lib/tool-faqs'

export const metadata: Metadata = {
  title: 'YouTube Comment Downloader Tool – Export to CSV, JSON, Excel',
  description: 'Use our free YouTube comment extractor to download and export comments from any YouTube video, playlist, or channel to CSV, JSON, Excel, TXT, or HTML.',
  alternates: { canonical: 'https://www.youtubecommentdownloader.com/tool' },
  openGraph: {
    title: 'YouTube Comment Downloader Tool – Export to CSV, JSON, Excel',
    description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, or HTML. Fast, free YouTube comments extractor.',
    url: 'https://www.youtubecommentdownloader.com/tool',
    type: 'website',
    images: [{ url: '/opengraph-image.jpg', width: 1200, height: 675 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YouTube Comment Downloader Tool – Export to CSV, JSON, Excel',
    description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, or HTML.',
    images: ['/opengraph-image.jpg'],
  },
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'YouTube Comment Downloader',
  description: 'Download and export YouTube comments to CSV, JSON, Excel, TXT, or HTML.',
  url: 'https://www.youtubecommentdownloader.com/tool',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: toolFaqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
