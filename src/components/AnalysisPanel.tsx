'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Lock, RefreshCw, ChevronDown, ChevronUp, Download } from 'lucide-react'

type Reply = { id: string; author: string; text: string; likes: number; date: string }
type Comment = { id: string; author: string; text: string; likes: number; date: string; replies: number; replyList?: Reply[]; videoTitle?: string; channelName?: string; videoUrl?: string }

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

// ── HTML report generation ────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getVideoId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : ''
}

function renderSentimentHtml(data: { overall: string; positive: number; neutral: number; negative: number; positiveThemes: string[]; negativeThemes: string[]; summary: string }): string {
  const overallColor = data.overall === 'Positive' ? '#22c55e' : data.overall === 'Negative' ? '#ef4444' : '#eab308'
  const bars = [
    { label: 'Positive', value: data.positive, color: '#22c55e' },
    { label: 'Neutral', value: data.neutral, color: '#888888' },
    { label: 'Negative', value: data.negative, color: '#ef4444' },
  ]
  return `
    <div class="analysis-section">
      <div class="analysis-title">😊 Sentiment Analysis</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <span style="font-size:24px;font-weight:700;color:${overallColor}">${esc(data.overall)}</span>
        <span style="color:#64748b;font-size:14px">overall sentiment</span>
      </div>
      ${bars.map(b => `
        <div class="sentiment-bar-wrap">
          <div class="sentiment-label"><span>${b.label}</span><span>${b.value}%</span></div>
          <div class="sentiment-bar"><div class="sentiment-bar-fill" style="width:${b.value}%;background:${b.color}"></div></div>
        </div>
      `).join('')}
      <div class="two-col" style="margin-top:20px">
        <div class="card">
          <h4>What they love</h4>
          <div>${(data.positiveThemes || []).map(t => `<span class="chip" style="background:#dcfce7;color:#166534">${esc(t)}</span>`).join('')}</div>
        </div>
        <div class="card">
          <h4>Pain points</h4>
          <div>${(data.negativeThemes || []).map(t => `<span class="chip" style="background:#fee2e2;color:#991b1b">${esc(t)}</span>`).join('')}</div>
        </div>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0">${esc(data.summary)}</p>
    </div>`
}

function renderAudienceHtml(data: { profile: string; expertise: string; useCases: string[]; context: string; motivations: string[]; summary: string }): string {
  return `
    <div class="analysis-section">
      <div class="analysis-title">👥 Audience Insights</div>
      <div class="card" style="margin-bottom:16px">
        <h4>Audience Profile</h4>
        <p style="margin:0;font-size:14px;color:#334155">${esc(data.profile)}</p>
      </div>
      <div class="two-col" style="margin-bottom:16px">
        <div class="card">
          <h4>Expertise Level</h4>
          <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a">${esc(data.expertise)}</p>
        </div>
        <div class="card">
          <h4>Context</h4>
          <p style="margin:0;font-size:14px;color:#334155">${esc(data.context)}</p>
        </div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <h4>Why they watch</h4>
        <div>${(data.motivations || []).map(m => `<span class="chip">${esc(m)}</span>`).join('')}</div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <h4>Top use cases</h4>
        <div>${(data.useCases || []).map(u => `<span class="chip" style="background:#fee2e2;color:#991b1b">${esc(u)}</span>`).join('')}</div>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;padding-top:16px;border-top:1px solid #e2e8f0">${esc(data.summary)}</p>
    </div>`
}

function renderTopicsHtml(data: { topics: Array<{ name: string; percentage: number; description: string; example: string }>; summary: string }): string {
  return `
    <div class="analysis-section">
      <div class="analysis-title">💬 Top Topics</div>
      ${(data.topics || []).map(t => `
        <div style="background:#f8fafc;border-radius:8px;padding:14px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:14px;font-weight:600;color:#0f172a">${esc(t.name)}</span>
            <span style="font-size:13px;color:#64748b;font-weight:500">${t.percentage}%</span>
          </div>
          <div class="sentiment-bar" style="margin-bottom:8px"><div class="sentiment-bar-fill" style="width:${t.percentage}%;background:#dc2626"></div></div>
          <p style="font-size:13px;color:#64748b;margin:0 0 4px">${esc(t.description)}</p>
          ${t.example ? `<p style="font-size:12px;color:#94a3b8;font-style:italic;margin:0">&ldquo;${esc(t.example)}&rdquo;</p>` : ''}
        </div>
      `).join('')}
      <p style="color:#64748b;font-size:14px;line-height:1.6;padding-top:16px;border-top:1px solid #e2e8f0">${esc(data.summary)}</p>
    </div>`
}

function renderFeedbackHtml(data: { praise: string[]; requests: string[]; insights: Array<{ action: string; reason: string }>; summary: string }): string {
  return `
    <div class="analysis-section">
      <div class="analysis-title">💡 Feedback Breakdown</div>
      <div class="two-col" style="margin-bottom:20px">
        <div class="card">
          <h4 style="color:#166534">👏 What they love</h4>
          <ul>${(data.praise || []).map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        </div>
        <div class="card">
          <h4 style="color:#92400e">💬 What they want</h4>
          <ul>${(data.requests || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="card">
        <h4>Key Insights</h4>
        <ul>${(data.insights || []).map(ins => `<li><strong>${esc(ins.action)}</strong> — ${esc(ins.reason)}</li>`).join('')}</ul>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0">${esc(data.summary)}</p>
    </div>`
}

function renderTrendsHtml(data: { phrases: string[]; viralComments: Array<{ text: string; reason: string }>; keywords: string[]; summary: string }): string {
  return `
    <div class="analysis-section">
      <div class="analysis-title">🔥 Trending Signals</div>
      <div style="margin-bottom:16px">
        <div style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Trending Phrases</div>
        <div>${(data.phrases || []).map(p => `<span class="chip">&ldquo;${esc(p)}&rdquo;</span>`).join('')}</div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">High-Impact Comments</div>
        ${(data.viralComments || []).map(c => `
          <div class="viral-comment">&ldquo;${esc(c.text)}&rdquo;<br><span style="font-style:normal;font-weight:600">🔥 ${esc(c.reason)}</span></div>
        `).join('')}
      </div>
      <div>
        <div style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Top Keywords</div>
        <div>${(data.keywords || []).map(k => `<span class="chip" style="background:#fee2e2;color:#991b1b">${esc(k)}</span>`).join('')}</div>
      </div>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0">${esc(data.summary)}</p>
    </div>`
}

function renderAnalysisSectionHtml(type: AnalysisType, data: Record<string, unknown>): string {
  if (type === 'sentiment') return renderSentimentHtml(data as Parameters<typeof renderSentimentHtml>[0])
  if (type === 'audience') return renderAudienceHtml(data as Parameters<typeof renderAudienceHtml>[0])
  if (type === 'topics') return renderTopicsHtml(data as Parameters<typeof renderTopicsHtml>[0])
  if (type === 'feedback') return renderFeedbackHtml(data as Parameters<typeof renderFeedbackHtml>[0])
  if (type === 'trends') return renderTrendsHtml(data as Parameters<typeof renderTrendsHtml>[0])
  return ''
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AnalysisPanel({ comments, isSignedIn }: { comments: Comment[]; isSignedIn: boolean }) {
  const [activeType, setActiveType] = useState<AnalysisType>('sentiment')
  const [loading, setLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<Partial<Record<AnalysisType, Record<string, unknown>>>>({})
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(true)

  // For now everyone who is signed in gets Pro limits; tier enforcement comes with subscriptions
  const tier = 'pro'
  const { comments: limit, label: tierLabel } = TIER_LIMITS[tier]
  const sampleSize = Math.min(comments.length, limit)
  const hasResults = Object.keys(analysisResults).length > 0
  const currentResult = analysisResults[activeType] ?? null

  async function runAnalysis() {
    setLoading(true)
    setError('')
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
      setAnalysisResults(prev => ({ ...prev, [activeType]: data.result }))
    } catch {
      setError('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function generateReport() {
    // Group comments by videoUrl to get per-video metadata
    const videoMap = new Map<string, { videoTitle: string; channelName: string; videoUrl: string; count: number }>()
    for (const c of comments) {
      const url = c.videoUrl || 'unknown'
      if (!videoMap.has(url)) {
        videoMap.set(url, {
          videoTitle: c.videoTitle || 'Unknown Video',
          channelName: c.channelName || 'Unknown Channel',
          videoUrl: url,
          count: 0,
        })
      }
      videoMap.get(url)!.count++
    }
    const videos = Array.from(videoMap.values())
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const reportTitle = videos.length === 1 ? videos[0].videoTitle : 'Multiple Videos'

    // Build analysis HTML (same results shown across all videos since analysis is combined)
    const analysisHtml = (Object.entries(analysisResults) as [AnalysisType, Record<string, unknown>][])
      .map(([type, data]) => renderAnalysisSectionHtml(type, data))
      .join('')

    // Build video sections
    const videoSectionsHtml = videos.map((video, i) => {
      const videoId = getVideoId(video.videoUrl)
      const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
      const videoLink = video.videoUrl !== 'unknown' ? video.videoUrl : '#'
      const isFirst = i === 0

      return `
        <div class="video-section" ${!isFirst ? 'style="page-break-before:always"' : ''}>
          <div class="video-header">
            ${thumbnailUrl ? `<img class="video-thumbnail" src="${esc(thumbnailUrl)}" alt="Video thumbnail" onerror="this.style.display='none'" />` : ''}
            <div class="video-info">
              <h2><a href="${esc(videoLink)}" style="color:#0f172a;text-decoration:none" target="_blank">${esc(video.videoTitle)}</a></h2>
              <div class="channel">📺 ${esc(video.channelName)}</div>
              <div class="stats">${video.count.toLocaleString()} comments analyzed</div>
            </div>
          </div>
          ${isFirst || videos.length === 1 ? analysisHtml : ''}
        </div>`
    }).join('')

    // If multiple videos, append analysis after all video cards (for subsequent videos, show analysis in its own section)
    const multiVideoAnalysis = videos.length > 1 ? `
      <div class="video-section" style="page-break-before:always">
        <div style="padding:24px 28px 0;font-size:18px;font-weight:700;color:#0f172a">📊 Analysis Results</div>
        <div style="padding:0 4px 4px;color:#64748b;font-size:13px;padding-left:28px;padding-bottom:12px">Combined analysis across all ${videos.length} videos · ${sampleSize.toLocaleString()} comments</div>
        ${analysisHtml}
      </div>` : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comment Analysis Report - ${esc(reportTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .report-header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 40px 48px; }
    .report-header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; }
    .report-header .meta { opacity: 0.85; font-size: 14px; }
    .video-section { background: white; margin: 32px auto; max-width: 900px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .video-header { display: flex; gap: 20px; padding: 24px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; align-items: center; }
    .video-thumbnail { width: 160px; height: 90px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
    .video-info h2 { margin: 0 0 6px; font-size: 18px; font-weight: 600; color: #0f172a; }
    .video-info .channel { color: #64748b; font-size: 14px; margin-bottom: 6px; }
    .video-info .stats { font-size: 13px; color: #94a3b8; }
    .analysis-section { padding: 28px; border-bottom: 1px solid #f1f5f9; }
    .analysis-section:last-child { border-bottom: none; }
    .analysis-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 20px; }
    .sentiment-bar-wrap { margin-bottom: 10px; }
    .sentiment-label { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 4px; }
    .sentiment-bar { height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden; }
    .sentiment-bar-fill { height: 100%; border-radius: 4px; }
    .chip { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; margin: 3px; background: #f1f5f9; color: #475569; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: #f8fafc; border-radius: 8px; padding: 16px; }
    .card h4 { margin: 0 0 10px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .card ul { margin: 0; padding-left: 16px; }
    .card li { font-size: 14px; color: #334155; margin-bottom: 6px; line-height: 1.5; }
    .viral-comment { background: #fef9c3; border-left: 3px solid #eab308; padding: 10px 14px; margin-bottom: 8px; border-radius: 0 6px 6px 0; font-size: 13px; font-style: italic; color: #713f12; line-height: 1.6; }
    .report-footer { text-align: center; padding: 32px; color: #94a3b8; font-size: 13px; }
    .report-footer a { color: #dc2626; text-decoration: none; }
    @media print {
      .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .video-section { box-shadow: none; border: 1px solid #e2e8f0; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>📊 Comment Analysis Report</h1>
    <div class="meta">Generated by YouTubeCommentDownloader.com · ${date}</div>
  </div>

  ${videoSectionsHtml}
  ${multiVideoAnalysis}

  <div class="report-footer">
    Generated by <a href="https://youtubecommentdownloader.com">YouTubeCommentDownloader.com</a>
  </div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comment-analysis-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
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
                onClick={() => { setActiveType(t.id); setError('') }}
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
            <div className="flex items-center gap-2">
              {hasResults && (
                <button
                  onClick={generateReport}
                  className="flex items-center gap-2 bg-[#0a0a0a] hover:bg-[#111111] border border-white/[0.12] hover:border-red-600/50 text-[#aaaaaa] hover:text-red-400 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors min-h-[40px]"
                >
                  <Download className="w-4 h-4" /> Export Report
                </button>
              )}
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
          </div>

          {/* Error */}
          {error && <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-3 text-red-400 text-sm">{error}</div>}

          {/* Results */}
          {currentResult && (
            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{ANALYSIS_TYPES.find(t => t.id === activeType)?.icon}</span>
                <span className="text-white font-semibold text-sm">{ANALYSIS_TYPES.find(t => t.id === activeType)?.label} Report</span>
                <span className="text-[#555555] text-xs ml-auto">{sampleSize.toLocaleString()} comments</span>
              </div>
              {activeType === 'sentiment' && <SentimentResult data={currentResult as Parameters<typeof SentimentResult>[0]['data']} />}
              {activeType === 'audience' && <AudienceResult data={currentResult as Parameters<typeof AudienceResult>[0]['data']} />}
              {activeType === 'topics' && <TopicsResult data={currentResult as Parameters<typeof TopicsResult>[0]['data']} />}
              {activeType === 'feedback' && <FeedbackResult data={currentResult as Parameters<typeof FeedbackResult>[0]['data']} />}
              {activeType === 'trends' && <TrendsResult data={currentResult as Parameters<typeof TrendsResult>[0]['data']} />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
