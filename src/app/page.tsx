import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* HERO */}
      <section className="px-4 pt-16 pb-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div>
            <p className="text-red-500 text-sm font-semibold uppercase tracking-widest mb-4">YouTube Comment Downloader</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
              Extract &amp; export<br />
              <span className="relative inline-block">
                <span className="relative z-10">any comment thread</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-red-600/30 -z-0 rounded" />
              </span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-md">
              Bulk downloads, 6 export formats, REST API — built for agencies, researchers, and teams who need comment data at scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/tool" className="bg-red-600 hover:bg-red-700 text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-base text-center">
                Start Extracting
              </Link>
              <Link href="/pricing" className="border border-[#1f1f2e] text-gray-300 hover:border-gray-500 font-medium px-7 py-3.5 rounded-xl transition-colors text-base text-center">
                View pricing
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>45k+ users</span>
              <span className="text-gray-800">·</span>
              <span>6 export formats</span>
              <span className="text-gray-800">·</span>
              <span>5k comments/min</span>
            </div>
          </div>

          {/* Right: mock comment preview */}
          <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl overflow-hidden">
            <div className="bg-[#0d0d14] px-4 py-3 flex items-center gap-2 border-b border-[#1f1f2e]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-gray-600 text-xs ml-2 truncate">youtube.com/watch?v=dQw4w9WgXcQ</span>
            </div>
            <div className="p-4 space-y-3">
              {[
                { author: '@techreviewer99', text: 'This is exactly what I needed! Super clear tutorial.', likes: 342 },
                { author: '@marketingpro_sarah', text: 'Great content as always. Follow-up video please?', likes: 187 },
                { author: '@dataanalyst_mike', text: 'Been using this method for 6 months, works great for our agency.', likes: 156 },
                { author: '@researcher_2024', text: 'Downloaded 50k comments in under 10 minutes. Incredible.', likes: 98 },
                { author: '@agencyfounder', text: 'We replaced 3 tools with this. The API is seamless.', likes: 54 },
              ].map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#1f1f2e] flex items-center justify-center text-xs text-gray-500 shrink-0 font-bold">
                    {c.author[1].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-blue-400 text-xs font-medium">{c.author}</span>
                      <span className="text-gray-700 text-xs">👍 {c.likes}</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed truncate">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1f1f2e] flex items-center justify-between">
                <span className="text-gray-600 text-xs">1,247 comments fetched</span>
                <span className="text-green-500 text-xs font-medium">✓ Ready to export</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — single full-width quote */}
      <section className="border-y border-[#1f1f2e] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <blockquote className="text-xl sm:text-2xl font-medium text-white/80 italic leading-relaxed mb-4">
            &ldquo;We manage 30+ brand accounts. What used to take a full day now takes 20 minutes. The bulk channel export changed how we do competitive analysis.&rdquo;
          </blockquote>
          <cite className="text-gray-500 text-sm not-italic">— Sarah K., Social Media Manager at MediaWave Agency</cite>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">How it works</h2>
          <div className="space-y-10">
            {[
              { n: '1', title: 'Paste any YouTube URL', desc: 'Drop in a video, channel, or playlist URL. Works with any public YouTube content.' },
              { n: '2', title: 'Set your options', desc: 'Choose how many comments, whether to include replies, and your preferred export format.' },
              { n: '3', title: 'Download your data', desc: 'Export to CSV, Excel, JSON, HTML, or plain text — ready for any analytics tool or pipeline.' },
            ].map(step => (
              <div key={step.n} className="flex gap-6 items-start">
                <span className="text-5xl font-extrabold text-red-600 leading-none w-12 shrink-0">{step.n}</span>
                <div className="pt-1">
                  <h3 className="text-white font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO USES IT */}
      <section className="py-20 px-4 border-t border-[#1f1f2e]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-12">Who uses it</h2>
          <div>
            {[
              {
                tag: 'For Agencies',
                desc: 'Monitor competitor channels at scale. Track sentiment trends across entire channel libraries. Deliver data-backed reports to clients without hours of manual work.',
              },
              {
                tag: 'For Brands',
                desc: 'Mine your own comments for product feedback, feature requests, and support issues. Understand what your audience actually thinks — not just what the algorithm shows.',
              },
              {
                tag: 'For Researchers',
                desc: 'Build large-scale comment datasets for NLP, sentiment analysis, and social science research. Structured exports ready for Python, R, or any data pipeline.',
              },
            ].map((u, i) => (
              <div key={u.tag} className={`flex flex-col sm:flex-row gap-4 sm:gap-10 py-8 ${i < 2 ? 'border-b border-[#1f1f2e]' : ''}`}>
                <div className="sm:w-36 shrink-0">
                  <span className="text-red-500 font-semibold text-sm">{u.tag}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4 border-t border-[#1f1f2e]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            Start pulling comments<br />in under 60 seconds.
          </h2>
          <Link href="/tool" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
            Start Extracting — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1f1f2e] py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="text-gray-700 text-sm">© 2025 YouTube Comment Downloader</div>
          <div className="flex flex-wrap gap-6 text-sm text-gray-600">
            <Link href="/tool" className="hover:text-white transition-colors">Tool</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
