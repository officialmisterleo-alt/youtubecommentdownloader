'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Lock, RefreshCw, ChevronDown, ChevronUp, Download } from 'lucide-react'

type Reply = { id: string; author: string; text: string; likes: number; date: string }
type Comment = { id: string; author: string; text: string; likes: number; date: string; replies: number; replyList?: Reply[]; videoTitle?: string; channelName?: string }

type AnalysisType = 'sentiment' | 'audience' | 'topics' | 'feedback' | 'trends'

const ANALYSIS_TYPES: { id: AnalysisType; label: string; description: string; icon: string }[] = [
  { id: 'sentiment', label: 'Sentiment', description: 'Positive/negative breakdown & emotional themes', icon: '😊' },
  { id: 'audience', label: 'Audience', description: 'Who is watching and why', icon: '👥' },
  { id: 'topics', label: 'Topics', description: 'What people are actually talking about', icon: '💬' },
  { id: 'feedback', label: 'Feedback', description: 'Praise, requests & actionable insights', icon: '💡' },
  { id: 'trends', label: 'Trends', description: 'Viral phrases & high-impact comments', icon: '🔥' },
]

const TIER_LIMITS: Record<string, { comments: number; label: string }> = {
  pro: { comments: 500, label: 'Pro' },
  business: { comments: 2000, label: 'Business' },
  enterprise: { comments: 10000, label: 'Enterprise' },
}

// ── Result renderers ──────────────────────────────────────────────────────────

function SentimentResult({ data }: { data: { overall: string; positive: number; neutral: number; negative: number; positiveThemes: string[]; negativeThemes: string[]; summary: string } }) {
  const bars = [
    { label: 'Positive', value: data.positive, color: 'bg-green-500' },
    { label: 'Neutral', value: data.neutral, color: 'bg-[#444444]' },
    { label: 'Negative', value: data.negative, color: 'bg-red-500' },
  ]
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold ${data.overall === 'Positive' ? 'text-green-400' : data.overall === 'Negative' ? 'text-red-400' : 'text-yellow-400'}`}>{data.overall}</span>
        <span className="text-[#888888] text-sm">overall sentiment</span>
      </div>
      <div className="space-y-2.5">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="text-xs text-[#888888] w-14 shrink-0">{b.label}</span>
            <div className="flex-1 bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
              <div className={`${b.color} h-full rounded-full transition-all duration-700`} style={{ width: `${b.value}%` }} />
            </div>
            <span className="text-xs text-white font-medium w-8 text-right">{b.value}%</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">What they love</div>
          <div className="flex flex-wrap gap-1.5">
            {data.positiveThemes?.map((t, i) => <span key={i} className="bg-green-900/30 text-green-400 text-xs px-2.5 py-1 rounded-full border border-green-900/50">{t}</span>)}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Pain points</div>
          <div className="flex flex-wrap gap-1.5">
            {data.negativeThemes?.map((t, i) => <span key={i} className="bg-red-900/30 text-red-400 text-xs px-2.5 py-1 rounded-full border border-red-900/50">{t}</span>)}
          </div>
        </div>
      </div>
      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
    </div>
  )
}

function AudienceResult({ data }: { data: { profile: string; expertise: string; useCases: string[]; context: string; motivations: string[]; summary: string } }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
        <div className="text-xs text-[#888888] mb-1.5 font-medium">Audience Profile</div>
        <p className="text-white text-sm">{data.profile}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-[#888888] mb-1.5 font-medium">Expertise Level</div>
          <div className="text-white text-sm font-medium">{data.expertise}</div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-[#888888] mb-1.5 font-medium">Context</div>
          <div className="text-white text-sm">{data.context}</div>
        </div>
      </div>
      <div>
        <div className="text-xs text-[#888888] mb-2 font-medium">Why they watch</div>
        <div className="flex flex-wrap gap-1.5">
          {data.motivations?.map((m, i) => <span key={i} className="bg-[#0a0a0a] border border-white/[0.07] text-[#aaaaaa] text-xs px-2.5 py-1 rounded-full">{m}</span>)}
        </div>
      </div>
      <div>
        <div className="text-xs text-[#888888] mb-2 font-medium">Top use cases</div>
        <div className="flex flex-wrap gap-1.5">
          {data.useCases?.map((u, i) => <span key={i} className="bg-red-900/20 border border-red-900/40 text-red-400 text-xs px-2.5 py-1 rounded-full">{u}</span>)}
        </div>
      </div>
      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
    </div>
  )
}

function TopicsResult({ data }: { data: { topics: Array<{ name: string; percentage: number; description: string; example: string }>; summary: string } }) {
  return (
    <div className="space-y-3">
      {data.topics?.map((t, i) => (
        <div key={i} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">{t.name}</span>
            <span className="text-[#888888] text-xs font-medium">{t.percentage}%</span>
          </div>
          <div className="bg-[#171717] rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="bg-red-600 h-full rounded-full transition-all duration-700" style={{ width: `${t.percentage}%` }} />
          </div>
          <p className="text-[#888888] text-xs mb-1.5">{t.description}</p>
          {t.example && <p className="text-[#555555] text-xs italic">&ldquo;{t.example}&rdquo;</p>}
        </div>
      ))}
      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
    </div>
  )
}

function FeedbackResult({ data }: { data: { praise: string[]; requests: string[]; insights: Array<{ action: string; reason: string }>; summary: string } }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-green-400 mb-2 font-medium">👏 What they praise</div>
          <ul className="space-y-1.5">
            {data.praise?.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#aaaaaa]">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs text-yellow-400 mb-2 font-medium">💬 What they want</div>
          <ul className="space-y-1.5">
            {data.requests?.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#aaaaaa]">
                <span className="text-yellow-500 mt-0.5 shrink-0">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <div className="text-xs text-[#888888] mb-2 font-medium">Actionable insights</div>
        <div className="space-y-2">
          {data.insights?.map((ins, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3">
              <div className="text-white text-sm font-medium mb-1">{ins.action}</div>
              <div className="text-[#888888] text-xs">{ins.reason}</div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
    </div>
  )
}

function TrendsResult({ data }: { data: { phrases: string[]; viralComments: Array<{ text: string; reason: string }>; keywords: string[]; summary: string } }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-[#888888] mb-2 font-medium">Trending phrases</div>
        <div className="flex flex-wrap gap-1.5">
          {data.phrases?.map((p, i) => <span key={i} className="bg-[#0a0a0a] border border-white/[0.07] text-white text-xs px-3 py-1.5 rounded-full">&ldquo;{p}&rdquo;</span>)}
        </div>
      </div>
      <div>
        <div className="text-xs text-[#888888] mb-2 font-medium">High-impact comments</div>
        <div className="space-y-2">
          {data.viralComments?.map((c, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3.5">
              <p className="text-white text-sm mb-1.5 leading-relaxed">&ldquo;{c.text}&rdquo;</p>
              <p className="text-[#888888] text-xs">🔥 {c.reason}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs text-[#888888] mb-2 font-medium">Top keywords</div>
        <div className="flex flex-wrap gap-1.5">
          {data.keywords?.map((k, i) => <span key={i} className="bg-red-900/20 border border-red-900/40 text-red-400 text-xs px-2.5 py-1 rounded-full">{k}</span>)}
        </div>
      </div>
      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AnalysisPanel({ comments, isSignedIn }: { comments: Comment[]; isSignedIn: boolean }) {
  const [activeType, setActiveType] = useState<AnalysisType>('sentiment')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [resultType, setResultType] = useState<AnalysisType | null>(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(true)

  // For now everyone who is signed in gets Pro limits; tier enforcement comes with subscriptions
  const tier = 'pro'
  const { comments: limit, label: tierLabel } = TIER_LIMITS[tier]
  const sampleSize = Math.min(comments.length, limit)

  function exportReport() {
    if (!result || !resultType) return
    const typeInfo = ANALYSIS_TYPES.find(t => t.id === resultType)
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const renderSection = (label: string, value: string) =>
      `<div class="section"><div class="label">${label}</div><div class="value">${value}</div></div>`

    let bodyContent = ''
    if (resultType === 'sentiment') {
      const d = result as Parameters<typeof SentimentResult>[0]['data']
      bodyContent = `
        ${renderSection('Overall Sentiment', d.overall)}
        ${renderSection('Breakdown', `Positive: ${d.positive}% &nbsp;|&nbsp; Neutral: ${d.neutral}% &nbsp;|&nbsp; Negative: ${d.negative}%`)}
        ${renderSection('What they love', d.positiveThemes?.join(', '))}
        ${renderSection('Pain points', d.negativeThemes?.join(', '))}
        ${renderSection('Summary', d.summary)}`
    } else if (resultType === 'audience') {
      const d = result as Parameters<typeof AudienceResult>[0]['data']
      bodyContent = `
        ${renderSection('Audience Profile', d.profile)}
        ${renderSection('Expertise Level', d.expertise)}
        ${renderSection('Context', d.context)}
        ${renderSection('Why they watch', d.motivations?.join(', '))}
        ${renderSection('Top use cases', d.useCases?.join(', '))}
        ${renderSection('Summary', d.summary)}`
    } else if (resultType === 'topics') {
      const d = result as Parameters<typeof TopicsResult>[0]['data']
      bodyContent = d.topics?.map(t =>
        renderSection(`${t.name} (${t.percentage}%)`, `${t.description}${t.example ? `<br><em>"${t.example}"</em>` : ''}`)
      ).join('') + renderSection('Summary', d.summary)
    } else if (resultType === 'feedback') {
      const d = result as Parameters<typeof FeedbackResult>[0]['data']
      bodyContent = `
        ${renderSection('What they praise', d.praise?.join('<br>• '))}
        ${renderSection('What they want', d.requests?.join('<br>• '))}
        ${d.insights?.map(ins => renderSection(ins.action, ins.reason)).join('')}
        ${renderSection('Summary', d.summary)}`
    } else if (resultType === 'trends') {
      const d = result as Parameters<typeof TrendsResult>[0]['data']
      bodyContent = `
        ${renderSection('Trending phrases', d.phrases?.map(p => `"${p}"`).join(', '))}
        ${d.viralComments?.map(c => renderSection(`"${c.text}"`, `🔥 ${c.reason}`)).join('')}
        ${renderSection('Top keywords', d.keywords?.join(', '))}
        ${renderSection('Summary', d.summary)}`
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${typeInfo?.label} Analysis Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; margin: 0; padding: 40px 24px; }
  .container { max-width: 720px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #222; }
  .logo { background: #dc2626; border-radius: 6px; padding: 6px 10px; color: white; font-weight: 800; font-size: 13px; text-decoration: none; }
  .title { font-size: 22px; font-weight: 700; color: white; }
  .meta { font-size: 12px; color: #666; margin-top: 2px; }
  .badge { background: rgba(220,38,38,0.15); color: #f87171; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 99px; border: 1px solid rgba(220,38,38,0.3); }
  .section { background: #141414; border: 1px solid #222; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; }
  .label { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .value { font-size: 14px; color: #ccc; line-height: 1.6; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; font-size: 11px; color: #444; text-align: center; }
  .footer a { color: #666; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">YT</div>
    <div>
      <div class="title">${typeInfo?.icon} ${typeInfo?.label} Analysis Report</div>
      <div class="meta">Generated ${now} &nbsp;·&nbsp; <span class="badge">AI Analysis</span> &nbsp;·&nbsp; ${sampleSize.toLocaleString()} comments analysed</div>
    </div>
  </div>
  ${bodyContent}
  <div class="footer">Generated by <a href="https://youtubecommentdownloader.com">youtubecommentdownloader.com</a></div>
</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yt-${resultType}-analysis-report.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function runAnalysis() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: comments.slice(0, sampleSize).map(c => ({ author: c.author, text: c.text, likes: c.likes, date: c.date })),
          analysisType: activeType,
          tier,
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setResult(data.result)
      setResultType(activeType)
    } catch {
      setError('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="mt-4 sm:mt-6 bg-[#171717] border border-white/[0.07] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-5 h-5 text-red-400" />
          <h2 className="text-white font-bold text-base">AI Comment Analysis</h2>
          <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-600/30">Pro+</span>
        </div>
        <p className="text-[#888888] text-sm mb-5">Get AI-powered insights on audience sentiment, topics, feedback, and trends. Sign in to unlock.</p>
        <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
          <Lock className="w-4 h-4" /> Sign in to unlock AI Analysis
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-4 sm:mt-6 bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base">AI Comment Analysis</span>
              <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-red-600/30">{tierLabel}</span>
            </div>
            <p className="text-[#888888] text-xs mt-0.5">Analyzing up to {limit.toLocaleString()} comments with GPT-4o mini</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[#888888] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#888888] shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-white/[0.07] p-4 sm:p-5 space-y-4">
          {/* Analysis type selector */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ANALYSIS_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => { setActiveType(t.id); setResult(null); setError('') }}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition-colors border ${
                  activeType === t.id
                    ? 'bg-red-600 border-transparent text-white'
                    : 'bg-[#0a0a0a] border-white/[0.07] text-[#888888] hover:border-white/[0.15] hover:text-white'
                }`}
              >
                <span className="text-lg leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Selected type description */}
          <p className="text-[#888888] text-xs">{ANALYSIS_TYPES.find(t => t.id === activeType)?.description}</p>

          {/* Comment count chip + run button */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[#888888] text-xs bg-[#0a0a0a] border border-white/[0.07] px-3 py-1.5 rounded-full">
              {sampleSize.toLocaleString()} of {comments.length.toLocaleString()} comments selected
            </span>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors min-h-[40px]"
            >
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing…</>
                : <><Sparkles className="w-4 h-4" /> Run Analysis</>
              }
            </button>
          </div>

          {/* Hint — shown when no result yet */}
          {!result && !loading && (
            <p className="text-[#555555] text-xs">After running an analysis, you can download a full branded HTML report.</p>
          )}

          {/* Error */}
          {error && <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-3 text-red-400 text-sm">{error}</div>}

          {/* Results */}
          {result && resultType && (
            <>
              <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{ANALYSIS_TYPES.find(t => t.id === resultType)?.icon}</span>
                  <span className="text-white font-semibold text-sm">{ANALYSIS_TYPES.find(t => t.id === resultType)?.label} Report</span>
                  <span className="text-[#555555] text-xs ml-auto">{sampleSize.toLocaleString()} comments</span>
                </div>
                {resultType === 'sentiment' && <SentimentResult data={result as Parameters<typeof SentimentResult>[0]['data']} />}
                {resultType === 'audience' && <AudienceResult data={result as Parameters<typeof AudienceResult>[0]['data']} />}
                {resultType === 'topics' && <TopicsResult data={result as Parameters<typeof TopicsResult>[0]['data']} />}
                {resultType === 'feedback' && <FeedbackResult data={result as Parameters<typeof FeedbackResult>[0]['data']} />}
                {resultType === 'trends' && <TrendsResult data={result as Parameters<typeof TrendsResult>[0]['data']} />}
              </div>

              {/* Prominent export button */}
              <button
                onClick={exportReport}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                ⬇ Download Analysis Report
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
