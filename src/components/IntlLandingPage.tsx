import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import TrackedLink from '@/components/TrackedLink'
import { getIntlPage, intlPages, type IntlLang } from '@/lib/intl-pages'

const SITE = 'https://www.youtubecommentdownloader.com'

export default function IntlLandingPage({ lang }: { lang: IntlLang }) {
  const page = getIntlPage(lang)
  const url = `${SITE}${page.path}`

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      description: page.description,
      url,
      inLanguage: page.hreflang,
      isPartOf: { '@type': 'WebSite', name: 'YouTube Comment Downloader', url: SITE },
      about: {
        '@type': 'SoftwareApplication',
        name: 'YouTube Comment Downloader',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: page.hreflang,
      mainEntity: page.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ]

  const cta = (location: string) => (
    <TrackedLink
      href="/tool"
      eventName="intl_cta_click"
      eventProperties={{ lang: page.lang, location }}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-500"
    >
      {page.cta}
      <ArrowRight className="h-4 w-4" />
    </TrackedLink>
  )

  return (
    <main lang={page.hreflang} className="flex-1 bg-[#0a0a0a]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="border-b border-white/[0.07] px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-red-400">{page.eyebrow}</p>
            <h1 className="max-w-3xl font-jakarta text-4xl font-extrabold leading-tight text-[#e5e2e1] sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#888888]">{page.intro}</p>
            <div className="mt-8">{cta('hero')}</div>
          </div>

          <div className="border border-white/[0.07] bg-[#131313] p-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.04)]">
            <div className="rounded-lg border border-white/[0.07] bg-[#0a0a0a] p-4">
              <div className="mb-4 border-b border-white/[0.07] pb-3">
                <span className="text-sm font-semibold text-white">{page.heroLabel}</span>
              </div>
              <div className="space-y-3">
                {page.heroPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span className="text-sm leading-6 text-[#aaaaaa]">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          {page.sections.map((section) => (
            <div key={section.title} className="border border-white/[0.07] bg-white/[0.02] p-5">
              <h2 className="font-jakarta text-base font-bold text-[#e5e2e1]">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#777777]">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">{page.stepsTitle}</h2>
          <ol className="space-y-3">
            {page.steps.map((step, index) => (
              <li key={step} className="flex gap-4 border border-white/[0.07] bg-[#131313] p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-[#aaaaaa]">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-6 font-jakarta text-2xl font-bold text-[#e5e2e1]">{page.plansTitle}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {page.plans.map((plan) => (
              <div key={plan.name} className="border border-white/[0.07] bg-[#131313] p-5">
                <h3 className="font-jakarta text-sm font-semibold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#777777]">{plan.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/[0.07] px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center font-jakarta text-2xl font-bold text-[#e5e2e1]">{page.faqTitle}</h2>
          <div className="space-y-3">
            {page.faq.map((item) => (
              <div key={item.question} className="border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="font-jakarta text-sm font-semibold text-white">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[#777777]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">{page.closingTitle}</h2>
          <p className="mt-3 text-sm text-[#777777]">{page.closingBody}</p>
          <div className="mt-6">{cta('closing')}</div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#555555]">
            <Link href="/" lang="en" className="transition-colors hover:text-white">English</Link>
            {intlPages.filter((p) => p.lang !== page.lang).map((p) => (
              <Link key={p.lang} href={p.path} lang={p.hreflang} className="transition-colors hover:text-white">
                {p.languageName}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
