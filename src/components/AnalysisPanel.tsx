'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Lock, RefreshCw, ChevronDown, ChevronUp, Download } from 'lucide-react'

type Reply = { id: string; author: string; text: string; likes: number; date: string }
type Comment = { id: string; author: string; text: string; likes: number; date: string; replies: number; replyList?: Reply[]; videoTitle?: string; channelName?: string; videoUrl?: string }

type AnalysisType = 'sentiment' | 'audience' | 'topics' | 'feedback' | 'trends'

const ANALYSIS_TYPES: { id: AnalysisType; label: string; description: string; icon: string }[] = [
  { id: 'sentiment', label: 'Sentiment', description: 'Positive/negative breakdown, emotional drivers & notable quotes', icon: '😊' },
  { id: 'audience', label: 'Audience', description: 'Distinct audience segments, demographics & recommendations', icon: '👥' },
  { id: 'topics', label: 'Topics', description: 'What people are actually talking about, content gaps & surprises', icon: '💬' },
  { id: 'feedback', label: 'Feedback', description: 'Praise, requests, criticisms, questions & priority insights', icon: '💡' },
  { id: 'trends', label: 'Trends', description: 'Viral phrases, community health & engagement recommendations', icon: '🔥' },
]

const TIER_LIMITS: Record<string, { comments: number; label: string }> = {
  free: { comments: 0, label: 'Free' },
  pro: { comments: 10000, label: 'Pro' },
  business: { comments: 50000, label: 'Business' },
  enterprise: { comments: 100000, label: 'Enterprise' },
}

// ── Result renderers ──────────────────────────────────────────────────────────

type SentimentData = {
  positive: number
  neutral: number
  negative: number
  summary: string
  themes?: string[]
  emotionalDrivers?: { positive: string[]; negative: string[] }
  notableQuotes?: string[]
  sentimentOverTime?: string
}

function SentimentResult({ data }: { data: SentimentData }) {
  const bars = [
    { label: 'Positive', value: data.positive, color: 'bg-green-500' },
    { label: 'Neutral', value: data.neutral, color: 'bg-[#444444]' },
    { label: 'Negative', value: data.negative, color: 'bg-red-500' },
  ]
  const dominant = data.positive >= data.negative && data.positive >= data.neutral ? 'Positive'
    : data.negative >= data.positive && data.negative >= data.neutral ? 'Negative' : 'Mixed'
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold ${dominant === 'Positive' ? 'text-green-400' : dominant === 'Negative' ? 'text-red-400' : 'text-yellow-400'}`}>{dominant}</span>
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

      {data.themes && data.themes.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Recurring emotional themes</div>
          <div className="flex flex-wrap gap-1.5">
            {data.themes.map((t, i) => <span key={i} className="bg-[#0a0a0a] border border-white/[0.07] text-[#aaaaaa] text-xs px-2.5 py-1 rounded-full">{t}</span>)}
          </div>
        </div>
      )}

      {data.emotionalDrivers && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-green-400 mb-2 font-medium">What drives positivity</div>
            <ul className="space-y-1.5">
              {data.emotionalDrivers.positive?.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>{d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs text-red-400 mb-2 font-medium">What triggers negativity</div>
            <ul className="space-y-1.5">
              {data.emotionalDrivers.negative?.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                  <span className="text-red-500 mt-0.5 shrink-0">✗</span>{d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data.notableQuotes && data.notableQuotes.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Notable quotes</div>
          <div className="space-y-2">
            {data.notableQuotes.map((q, i) => (
              <blockquote key={i} className="bg-[#0a0a0a] border-l-2 border-red-600/50 pl-3 pr-3 py-2 rounded-r-xl text-xs text-[#aaaaaa] italic">&ldquo;{q}&rdquo;</blockquote>
            ))}
          </div>
        </div>
      )}

      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>

      {data.sentimentOverTime && (
        <p className="text-[#666666] text-xs italic">{data.sentimentOverTime}</p>
      )}
    </div>
  )
}

type AudienceSegment = { emoji: string; name: string; percentage: number; description: string; typicalComment: string; engagementStyle: string }
type AudienceData = {
  segments?: AudienceSegment[]
  audienceSummary?: string
  geographicSignals?: string
  ageSignals?: string
  loyaltySignal?: string
  recommendations?: string[]
  // legacy fields
  profile?: string
  expertise?: string
  useCases?: string[]
  context?: string
  motivations?: string[]
  summary?: string
}

function AudienceResult({ data }: { data: AudienceData }) {
  if (data.segments) {
    return (
      <div className="space-y-4">
        {data.audienceSummary && (
          <p className="text-[#aaaaaa] text-sm leading-relaxed bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">{data.audienceSummary}</p>
        )}
        <div className="space-y-3">
          {data.segments.map((seg, i) => (
            <div key={i} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{seg.emoji}</span>
                  <span className="text-white text-sm font-medium">{seg.name}</span>
                </div>
                <span className="text-[#888888] text-xs font-medium">{seg.percentage}%</span>
              </div>
              <div className="bg-[#171717] rounded-full h-1.5 mb-3 overflow-hidden">
                <div className="bg-red-600 h-full rounded-full transition-all duration-700" style={{ width: `${seg.percentage}%` }} />
              </div>
              <p className="text-[#aaaaaa] text-xs mb-2 leading-relaxed">{seg.description}</p>
              {seg.typicalComment && (
                <p className="text-[#555555] text-xs italic border-t border-white/[0.05] pt-2 mt-2">&ldquo;{seg.typicalComment}&rdquo;</p>
              )}
              {seg.engagementStyle && (
                <div className="mt-2">
                  <span className="bg-[#171717] text-[#888888] text-xs px-2 py-0.5 rounded-full border border-white/[0.07]">{seg.engagementStyle}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {(data.geographicSignals || data.ageSignals || data.loyaltySignal) && (
          <div className="grid grid-cols-1 gap-2">
            {data.geographicSignals && (
              <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="text-xs text-[#888888] mb-1 font-medium">Geographic signals</div>
                <p className="text-white text-xs">{data.geographicSignals}</p>
              </div>
            )}
            {data.ageSignals && (
              <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="text-xs text-[#888888] mb-1 font-medium">Age demographic signals</div>
                <p className="text-white text-xs">{data.ageSignals}</p>
              </div>
            )}
            {data.loyaltySignal && (
              <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="text-xs text-[#888888] mb-1 font-medium">Viewer loyalty</div>
                <p className="text-white text-xs">{data.loyaltySignal}</p>
              </div>
            )}
          </div>
        )}
        {data.recommendations && data.recommendations.length > 0 && (
          <div>
            <div className="text-xs text-[#888888] mb-2 font-medium">Creator recommendations</div>
            <ul className="space-y-1.5">
              {data.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#aaaaaa]">
                  <span className="text-red-500 mt-0.5 shrink-0">→</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  // legacy fallback
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
      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
    </div>
  )
}

type TopicItem = { topic?: string; name?: string; percentage: number; description: string; sentiment?: string; representativeComments?: string[]; example?: string }
type TopicsData = {
  topics?: TopicItem[]
  topicSummary?: string
  summary?: string
  contentGaps?: string[]
  controversialTopics?: string[]
  unusualFindings?: string
}

const sentimentBadgeClass = (s?: string) => {
  if (s === 'positive') return 'bg-green-900/30 text-green-400 border-green-900/50'
  if (s === 'negative') return 'bg-red-900/30 text-red-400 border-red-900/50'
  if (s === 'mixed') return 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50'
  return 'bg-[#171717] text-[#888888] border-white/[0.07]'
}

function TopicsResult({ data }: { data: TopicsData }) {
  return (
    <div className="space-y-3">
      {data.topics?.map((t, i) => (
        <div key={i} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white text-sm font-medium">{t.topic ?? t.name}</span>
              {t.sentiment && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${sentimentBadgeClass(t.sentiment)}`}>{t.sentiment}</span>
              )}
            </div>
            <span className="text-[#888888] text-xs font-medium shrink-0 ml-2">{t.percentage}%</span>
          </div>
          <div className="bg-[#171717] rounded-full h-1.5 mb-3 overflow-hidden">
            <div className="bg-red-600 h-full rounded-full transition-all duration-700" style={{ width: `${t.percentage}%` }} />
          </div>
          <p className="text-[#888888] text-xs mb-2 leading-relaxed">{t.description}</p>
          {t.representativeComments && t.representativeComments.length > 0 && (
            <details className="mt-1">
              <summary className="text-[#555555] text-xs cursor-pointer hover:text-[#888888] transition-colors">Example comments ▸</summary>
              <div className="mt-2 space-y-1.5 pl-2">
                {t.representativeComments.map((c, j) => (
                  <p key={j} className="text-[#555555] text-xs italic">&ldquo;{c}&rdquo;</p>
                ))}
              </div>
            </details>
          )}
          {t.example && !t.representativeComments && (
            <p className="text-[#555555] text-xs italic">&ldquo;{t.example}&rdquo;</p>
          )}
        </div>
      ))}
      <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.topicSummary ?? data.summary}</p>
      {data.contentGaps && data.contentGaps.length > 0 && (
        <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-xl p-4">
          <div className="text-xs text-yellow-400 mb-2 font-medium">Content gaps — what viewers want but didn&apos;t get</div>
          <ul className="space-y-1">
            {data.contentGaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                <span className="text-yellow-500 mt-0.5 shrink-0">→</span>{g}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.unusualFindings && (
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-[#888888] mb-1 font-medium">Unusual findings</div>
          <p className="text-[#aaaaaa] text-xs">{data.unusualFindings}</p>
        </div>
      )}
    </div>
  )
}

type FeedbackInsight = { insight?: string; action?: string; evidence?: string; reason?: string; priority?: string }
type FeedbackData = {
  praise: string[]
  requests: string[]
  criticisms?: string[]
  questions?: string[]
  insights?: FeedbackInsight[]
  overallFeedbackSummary?: string
  contentStrengths?: string[]
  improvementAreas?: string[]
  summary?: string
}

const priorityClass = (p?: string) => {
  if (p === 'high') return 'bg-red-900/30 text-red-400 border-red-900/50'
  if (p === 'medium') return 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50'
  return 'bg-[#0a0a0a] text-[#888888] border-white/[0.07]'
}

function FeedbackResult({ data }: { data: FeedbackData }) {
  return (
    <div className="space-y-4">
      {data.overallFeedbackSummary && (
        <p className="text-[#aaaaaa] text-sm leading-relaxed bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">{data.overallFeedbackSummary}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-green-400 mb-2 font-medium">👏 What they praise</div>
          <ul className="space-y-1.5">
            {data.praise?.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs text-yellow-400 mb-2 font-medium">💬 What they want</div>
          <ul className="space-y-1.5">
            {data.requests?.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                <span className="text-yellow-500 mt-0.5 shrink-0">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
        {data.criticisms && data.criticisms.length > 0 && (
          <div>
            <div className="text-xs text-orange-400 mb-2 font-medium">⚠️ Criticisms</div>
            <ul className="space-y-1.5">
              {data.criticisms.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                  <span className="text-orange-500 mt-0.5 shrink-0">!</span>{c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {data.questions && data.questions.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Common questions from viewers</div>
          <div className="flex flex-wrap gap-1.5">
            {data.questions.map((q, i) => (
              <span key={i} className="bg-[#0a0a0a] border border-white/[0.07] text-[#aaaaaa] text-xs px-2.5 py-1 rounded-full">{q}</span>
            ))}
          </div>
        </div>
      )}
      {data.insights && data.insights.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Priority insights</div>
          <div className="space-y-2">
            {data.insights.map((ins, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-white text-sm font-medium">{ins.insight ?? ins.action}</div>
                  {ins.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${priorityClass(ins.priority)}`}>{ins.priority}</span>
                  )}
                </div>
                <div className="text-[#888888] text-xs">{ins.evidence ?? ins.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {(data.contentStrengths || data.improvementAreas) && (
        <div className="grid grid-cols-2 gap-3">
          {data.contentStrengths && (
            <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-3">
              <div className="text-xs text-green-400 mb-2 font-medium">Content strengths</div>
              <ul className="space-y-1">
                {data.contentStrengths.map((s, i) => (
                  <li key={i} className="text-xs text-[#aaaaaa] flex items-start gap-1.5">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.improvementAreas && (
            <div className="bg-orange-900/10 border border-orange-900/30 rounded-xl p-3">
              <div className="text-xs text-orange-400 mb-2 font-medium">Areas to improve</div>
              <ul className="space-y-1">
                {data.improvementAreas.map((a, i) => (
                  <li key={i} className="text-xs text-[#aaaaaa] flex items-start gap-1.5">
                    <span className="text-orange-500 mt-0.5 shrink-0">→</span>{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {data.summary && !data.overallFeedbackSummary && (
        <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
      )}
    </div>
  )
}

type ViralComment = { comment?: string; text?: string; reason: string }
type TrendsData = {
  trendingPhrases?: string[]
  phrases?: string[]
  viralComments?: ViralComment[]
  keywords?: string[]
  emergingTrends?: string[]
  insideJokes?: string[]
  viralityFactors?: string
  communityHealth?: string
  contentMoments?: string[]
  crossContentSignals?: string
  recommendations?: string[]
  summary?: string
}

function TrendsResult({ data }: { data: TrendsData }) {
  const phrases = data.trendingPhrases ?? data.phrases ?? []
  return (
    <div className="space-y-4">
      {phrases.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Trending phrases</div>
          <div className="flex flex-wrap gap-1.5">
            {phrases.map((p, i) => <span key={i} className="bg-[#0a0a0a] border border-white/[0.07] text-white text-xs px-3 py-1.5 rounded-full">&ldquo;{p}&rdquo;</span>)}
          </div>
        </div>
      )}
      {data.viralComments && data.viralComments.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">High-impact comments</div>
          <div className="space-y-2">
            {data.viralComments.map((c, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3.5">
                <p className="text-white text-sm mb-1.5 leading-relaxed">&ldquo;{c.comment ?? c.text}&rdquo;</p>
                <p className="text-[#888888] text-xs">🔥 {c.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.emergingTrends && data.emergingTrends.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Emerging trends</div>
          <div className="flex flex-wrap gap-1.5">
            {data.emergingTrends.map((t, i) => <span key={i} className="bg-red-900/20 border border-red-900/40 text-red-400 text-xs px-2.5 py-1 rounded-full">{t}</span>)}
          </div>
        </div>
      )}
      {data.keywords && data.keywords.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Top keywords</div>
          <div className="flex flex-wrap gap-1.5">
            {data.keywords.map((k, i) => <span key={i} className="bg-[#0a0a0a] border border-white/[0.07] text-[#888888] text-xs px-2.5 py-1 rounded-full">{k}</span>)}
          </div>
        </div>
      )}
      {data.insideJokes && data.insideJokes.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">In-jokes &amp; community references</div>
          <div className="flex flex-wrap gap-1.5">
            {data.insideJokes.map((j, i) => <span key={i} className="bg-[#0a0a0a] border border-purple-900/40 text-purple-400 text-xs px-2.5 py-1 rounded-full">{j}</span>)}
          </div>
        </div>
      )}
      {data.communityHealth && (
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-[#888888] mb-1 font-medium">Community health</div>
          <p className="text-[#aaaaaa] text-xs leading-relaxed">{data.communityHealth}</p>
        </div>
      )}
      {data.viralityFactors && (
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
          <div className="text-xs text-[#888888] mb-1 font-medium">Virality factors</div>
          <p className="text-[#aaaaaa] text-xs leading-relaxed">{data.viralityFactors}</p>
        </div>
      )}
      {data.contentMoments && data.contentMoments.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">High-activity content moments</div>
          <ul className="space-y-1.5">
            {data.contentMoments.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                <span className="text-red-500 mt-0.5 shrink-0">▶</span>{m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <div className="text-xs text-[#888888] mb-2 font-medium">Recommendations</div>
          <ul className="space-y-1.5">
            {data.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#aaaaaa]">
                <span className="text-red-500 mt-0.5 shrink-0">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.summary && (
        <p className="text-[#aaaaaa] text-sm leading-relaxed border-t border-white/[0.07] pt-4">{data.summary}</p>
      )}
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
  const [userPlan, setUserPlan] = useState<string | null>(null)
  const [planLoaded, setPlanLoaded] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      setPlanLoaded(true)
      return
    }
    fetch('/api/quota')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUserPlan(data?.plan ?? 'free')
        setPlanLoaded(true)
      })
      .catch(() => { setUserPlan('free'); setPlanLoaded(true) })
  }, [isSignedIn])

  const isLocked = !isSignedIn || !planLoaded || userPlan === 'free' || userPlan === null

  const tier = (!isLocked && userPlan) ? userPlan : 'pro'
  const { comments: limit, label: tierLabel } = TIER_LIMITS[tier] ?? TIER_LIMITS.pro
  const sampleSize = Math.min(comments.length, limit)

  function exportReport() {
    if (!result || !resultType) return
    const typeInfo = ANALYSIS_TYPES.find(t => t.id === resultType)
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const renderSection = (label: string, value: string) =>
      `<div class="section"><div class="label">${label}</div><div class="value">${value}</div></div>`

    // Group comments by videoUrl and collect unique video metadata
    const videoMap = new Map<string, { videoTitle: string; channelName: string; videoUrl: string }>()
    for (const c of comments) {
      if (c.videoUrl && !videoMap.has(c.videoUrl)) {
        videoMap.set(c.videoUrl, {
          videoTitle: c.videoTitle ?? '',
          channelName: c.channelName ?? '',
          videoUrl: c.videoUrl,
        })
      }
    }
    const extractVideoId = (url: string) => {
      const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
      return m ? m[1] : ''
    }
    const videoEntries = Array.from(videoMap.values())
    const videoInfoHtml = videoEntries.map((v, i) => {
      const videoId = extractVideoId(v.videoUrl)
      const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
      return `<div class="video-card${i > 0 ? ' page-break' : ''}">
        ${thumbUrl ? `<img src="${thumbUrl}" alt="thumbnail" class="thumb" onerror="this.onerror=null;var mq=this.src.replace('hqdefault','mqdefault');if(this.src!==mq){this.src=mq}else{this.style.display='none'}" />` : ''}
        <div class="video-meta">
          <a href="${v.videoUrl}" class="video-title">${v.videoTitle || 'YouTube Video'}</a>
          ${v.channelName ? `<div class="channel-name">${v.channelName}</div>` : ''}
        </div>
      </div>`
    }).join('')

    let bodyContent = ''
    if (resultType === 'sentiment') {
      const d = result as SentimentData
      const dominant = (d.positive ?? 0) >= (d.negative ?? 0) && (d.positive ?? 0) >= (d.neutral ?? 0) ? 'Positive'
        : (d.negative ?? 0) >= (d.neutral ?? 0) ? 'Negative' : 'Mixed'
      bodyContent = `
        ${renderSection('Overall Sentiment', dominant)}
        ${renderSection('Breakdown', `Positive: ${d.positive}% &nbsp;|&nbsp; Neutral: ${d.neutral}% &nbsp;|&nbsp; Negative: ${d.negative}%`)}
        ${d.themes?.length ? renderSection('Emotional themes', d.themes.join(', ')) : ''}
        ${d.emotionalDrivers?.positive?.length ? renderSection('What drives positivity', d.emotionalDrivers.positive.join('<br>• ')) : ''}
        ${d.emotionalDrivers?.negative?.length ? renderSection('What triggers negativity', d.emotionalDrivers.negative.join('<br>• ')) : ''}
        ${d.notableQuotes?.length ? renderSection('Notable quotes', d.notableQuotes.map(q => `"${q}"`).join('<br>')) : ''}
        ${renderSection('Summary', d.summary)}
        ${d.sentimentOverTime ? renderSection('Sentiment over time', d.sentimentOverTime) : ''}`
    } else if (resultType === 'audience') {
      const d = result as AudienceData
      if (d.segments) {
        bodyContent = `
          ${d.audienceSummary ? renderSection('Audience Overview', d.audienceSummary) : ''}
          ${d.segments.map(s => renderSection(`${s.emoji} ${s.name} (${s.percentage}%)`, `${s.description}${s.typicalComment ? `<br><em>"${s.typicalComment}"</em>` : ''}`)).join('')}
          ${d.geographicSignals ? renderSection('Geographic signals', d.geographicSignals) : ''}
          ${d.ageSignals ? renderSection('Age signals', d.ageSignals) : ''}
          ${d.loyaltySignal ? renderSection('Viewer loyalty', d.loyaltySignal) : ''}
          ${d.recommendations?.length ? renderSection('Recommendations', d.recommendations.join('<br>• ')) : ''}`
      } else {
        bodyContent = `
          ${renderSection('Audience Profile', d.profile ?? '')}
          ${renderSection('Expertise Level', d.expertise ?? '')}
          ${renderSection('Context', d.context ?? '')}
          ${renderSection('Why they watch', d.motivations?.join(', ') ?? '')}
          ${renderSection('Summary', d.summary ?? '')}`
      }
    } else if (resultType === 'topics') {
      const d = result as TopicsData
      bodyContent = (d.topics ?? []).map(t =>
        renderSection(`${t.topic ?? t.name} (${t.percentage}%)${t.sentiment ? ` — ${t.sentiment}` : ''}`, `${t.description}${t.representativeComments?.length ? `<br><em>"${t.representativeComments[0]}"</em>` : t.example ? `<br><em>"${t.example}"</em>` : ''}`)
      ).join('')
        + renderSection('Summary', d.topicSummary ?? d.summary ?? '')
        + (d.contentGaps?.length ? renderSection('Content gaps', d.contentGaps.join('<br>• ')) : '')
        + (d.unusualFindings ? renderSection('Unusual findings', d.unusualFindings) : '')
    } else if (resultType === 'feedback') {
      const d = result as FeedbackData
      bodyContent = `
        ${d.overallFeedbackSummary ? renderSection('Overview', d.overallFeedbackSummary) : ''}
        ${renderSection('What they praise', d.praise?.join('<br>• ') ?? '')}
        ${renderSection('What they want', d.requests?.join('<br>• ') ?? '')}
        ${d.criticisms?.length ? renderSection('Criticisms', d.criticisms.join('<br>• ')) : ''}
        ${d.questions?.length ? renderSection('Common questions', d.questions.join('<br>• ')) : ''}
        ${d.insights?.map(ins => renderSection(`[${(ins.priority ?? 'insight').toUpperCase()}] ${ins.insight ?? ins.action}`, ins.evidence ?? ins.reason ?? '')).join('') ?? ''}
        ${d.contentStrengths?.length ? renderSection('Content strengths', d.contentStrengths.join('<br>• ')) : ''}
        ${d.improvementAreas?.length ? renderSection('Improvement areas', d.improvementAreas.join('<br>• ')) : ''}
        ${d.summary ? renderSection('Summary', d.summary) : ''}`
    } else if (resultType === 'trends') {
      const d = result as TrendsData
      const phrases = d.trendingPhrases ?? d.phrases ?? []
      bodyContent = `
        ${phrases.length ? renderSection('Trending phrases', phrases.map(p => `"${p}"`).join(', ')) : ''}
        ${d.viralComments?.map(c => renderSection(`"${c.comment ?? c.text}"`, `🔥 ${c.reason}`)).join('') ?? ''}
        ${d.emergingTrends?.length ? renderSection('Emerging trends', d.emergingTrends.join('<br>• ')) : ''}
        ${d.keywords?.length ? renderSection('Top keywords', d.keywords.join(', ')) : ''}
        ${d.insideJokes?.length ? renderSection('In-jokes & references', d.insideJokes.join(', ')) : ''}
        ${d.communityHealth ? renderSection('Community health', d.communityHealth) : ''}
        ${d.viralityFactors ? renderSection('Virality factors', d.viralityFactors) : ''}
        ${d.contentMoments?.length ? renderSection('High-activity moments', d.contentMoments.join('<br>• ')) : ''}
        ${d.recommendations?.length ? renderSection('Recommendations', d.recommendations.join('<br>• ')) : ''}
        ${d.summary ? renderSection('Summary', d.summary) : ''}`
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
  .logo { background: #dc2626; border-radius: 6px; padding: 5px 10px; color: white; font-weight: 800; font-size: 12px; text-decoration: none; white-space: nowrap; }
  .site-name { font-size: 11px; color: #555; font-weight: 500; margin-bottom: 2px; }
  .title { font-size: 22px; font-weight: 700; color: white; }
  .meta { font-size: 12px; color: #666; margin-top: 2px; }
  .badge { background: rgba(220,38,38,0.15); color: #f87171; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 99px; border: 1px solid rgba(220,38,38,0.3); }
  .section { background: #141414; border: 1px solid #222; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; }
  .label { font-size: 11px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
  .value { font-size: 14px; color: #ccc; line-height: 1.6; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; font-size: 11px; color: #444; text-align: center; }
  .footer a { color: #666; }
  .video-card { display: flex; align-items: center; gap: 16px; background: #141414; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .thumb { width: 160px; height: 90px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .video-meta { flex: 1; min-width: 0; }
  .video-title { font-size: 15px; font-weight: 600; color: #e0e0e0; text-decoration: none; display: block; margin-bottom: 4px; }
  .video-title:hover { color: #fff; }
  .channel-name { font-size: 12px; color: #666; }
  .page-break { page-break-before: always; margin-top: 40px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <a href="https://youtubecommentdownloader.com" target="_blank" class="logo">YT</a>
    <div>
      <div class="site-name">YouTube Comment Downloader</div>
      <div class="title">${typeInfo?.icon} ${typeInfo?.label} Analysis</div>
      <div class="meta">Generated ${now} &nbsp;·&nbsp; <span class="badge">AI Analysis</span> &nbsp;·&nbsp; ${sampleSize.toLocaleString()} comments analysed</div>
    </div>
  </div>
  ${videoInfoHtml}
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

  // While fetching plan for signed-in user, show a minimal loading state to avoid flash
  if (isSignedIn && !planLoaded) {
    return (
      <div className="mt-4 sm:mt-6 bg-[#171717] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-2 text-[#555555] text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <div className="mt-4 sm:mt-6 relative bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden">
      {/* Panel content — non-interactive when locked */}
      <div className={isLocked ? 'pointer-events-none opacity-50 select-none' : ''}>
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
                  {resultType === 'sentiment' && <SentimentResult data={result as SentimentData} />}
                  {resultType === 'audience' && <AudienceResult data={result as AudienceData} />}
                  {resultType === 'topics' && <TopicsResult data={result as TopicsData} />}
                  {resultType === 'feedback' && <FeedbackResult data={result as FeedbackData} />}
                  {resultType === 'trends' && <TrendsResult data={result as TrendsData} />}
                </div>

                {/* Prominent export button */}
                <button
                  onClick={exportReport}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-5 py-3.5 rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Analysis Report
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lock overlay — shown for unauthenticated or free-plan users */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-gray-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center px-8 py-6 max-w-xs">
            <Lock className="w-10 h-10 text-red-400" />
            <div>
              <div className="text-white font-bold text-lg mb-1">AI Analysis — Pro Feature</div>
              <p className="text-[#aaaaaa] text-sm leading-relaxed">Upgrade to Pro to analyze up to 10,000 comments and generate branded reports.</p>
            </div>
            <Link
              href="/pricing"
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
