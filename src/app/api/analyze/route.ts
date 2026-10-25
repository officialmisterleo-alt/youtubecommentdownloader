import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/teams'

export const maxDuration = 60

export type AnalysisType = 'sentiment' | 'audience' | 'topics' | 'feedback' | 'trends'

type AnalysisComment = { author: string; text: string; likes: number; date: string }
type PartialAnalysis = { commentCount: number; result: unknown }

const TIER_LIMITS: Record<string, number> = {
  free: 0,
  pro: 10000,
  business: 50000,
  enterprise: 100000,
}

const AI_USAGE_LIMITS: Record<string, { analysesPerMonth: number; commentsPerMonth: number; requestsPerMinute: number }> = {
  free: { analysesPerMonth: 0, commentsPerMonth: 0, requestsPerMinute: 0 },
  pro: { analysesPerMonth: 50, commentsPerMonth: 100_000, requestsPerMinute: 3 },
  business: { analysesPerMonth: 250, commentsPerMonth: 1_000_000, requestsPerMinute: 6 },
  enterprise: { analysesPerMonth: 1_000, commentsPerMonth: 5_000_000, requestsPerMinute: 10 },
}

const MODEL = 'gpt-4o-mini'
const CHUNK_CHAR_LIMIT = 120_000
const MERGE_CHAR_LIMIT = 90_000
const CHUNK_CONCURRENCY = 2

const PROMPTS: Record<AnalysisType, (comments: string, sampleSize: number) => string> = {
  sentiment: (comments, sampleSize) => `Analyze the sentiment of these ${sampleSize} YouTube comments in depth. Return a JSON object with this exact structure:
{
  "positive": <number 0-100>,
  "neutral": <number 0-100>,
  "negative": <number 0-100>,
  "summary": "<3-4 sentence narrative summary of the overall emotional tone, what drives the positivity/negativity, and any notable patterns>",
  "themes": ["<specific recurring emotional theme>", "<theme>", "<theme>", "<theme>", "<theme>"],
  "emotionalDrivers": {
    "positive": ["<what specifically makes people react positively>", "<driver>", "<driver>", "<driver>"],
    "negative": ["<what specifically triggers negative reactions>", "<driver>", "<driver>", "<driver>"]
  },
  "notableQuotes": ["<verbatim or near-verbatim comment that exemplifies the dominant sentiment>", "<quote>", "<quote>"],
  "sentimentOverTime": "<observation about whether early vs later comments differ in tone, if detectable>"
}

Return ONLY valid JSON (no markdown, no explanation).

COMMENTS:
${comments}`,

  audience: (comments, sampleSize) => `Analyze these ${sampleSize} YouTube comments to identify distinct audience segments. Return a JSON object:
{
  "segments": [
    {
      "emoji": "<relevant emoji>",
      "name": "<segment name>",
      "percentage": <estimated % of comments>,
      "description": "<2-3 sentences describing this segment's behavior, what they say, what they care about>",
      "typicalComment": "<example of what this segment typically says>",
      "engagementStyle": "<how they engage: e.g. asks questions, shares personal stories, debates others>"
    }
  ],
  "audienceSummary": "<3-4 sentence overview of the overall audience composition and what that means for the creator>",
  "geographicSignals": "<any language/cultural signals suggesting where the audience is from>",
  "ageSignals": "<estimated age demographic based on language, references, tone>",
  "loyaltySignal": "<are these mostly new viewers or a loyal returning fanbase? Evidence?>",
  "recommendations": ["<actionable recommendation for the creator based on audience insights>", "<recommendation>", "<recommendation>"]
}
Provide 4-6 distinct segments. Return ONLY valid JSON (no markdown, no explanation).

COMMENTS:
${comments}`,

  topics: (comments, sampleSize) => `Identify the main topics discussed in these ${sampleSize} YouTube comments. Return a JSON object:
{
  "topics": [
    {
      "topic": "<topic name>",
      "percentage": <% of comments mentioning this>,
      "description": "<2-3 sentences on what people say about this topic, what angle they take>",
      "sentiment": "positive",
      "representativeComments": ["<example comment>", "<example comment>"]
    }
  ],
  "topicSummary": "<3-4 sentence overview of the conversation landscape — what dominates, what's surprising, what's absent>",
  "contentGaps": ["<topic the audience clearly wants but the video didn't cover>", "<gap>", "<gap>"],
  "controversialTopics": ["<any topic generating debate or disagreement>"],
  "unusualFindings": "<anything unexpected or surprising found in the topic analysis>"
}
Return 6-10 topics ordered by frequency. The sentiment field must be one of: positive, negative, mixed, neutral. Return ONLY valid JSON (no markdown, no explanation).

COMMENTS:
${comments}`,

  feedback: (comments, sampleSize) => `Extract detailed actionable feedback from these ${sampleSize} YouTube comments. Return a JSON object:
{
  "praise": ["<specific thing viewers loved, with context>", "<praise>", "<praise>", "<praise>", "<praise>"],
  "requests": ["<specific thing viewers want more of or asked for>", "<request>", "<request>", "<request>", "<request>"],
  "criticisms": ["<constructive criticism or complaint, with context>", "<criticism>", "<criticism>", "<criticism>"],
  "questions": ["<common question viewers are asking>", "<question>", "<question>", "<question>"],
  "insights": [
    {
      "insight": "<actionable insight for the creator>",
      "evidence": "<what in the comments supports this>",
      "priority": "high"
    },
    {
      "insight": "<actionable insight>",
      "evidence": "<evidence>",
      "priority": "medium"
    },
    {
      "insight": "<actionable insight>",
      "evidence": "<evidence>",
      "priority": "low"
    }
  ],
  "overallFeedbackSummary": "<3-4 sentence narrative of what the audience is telling the creator, and the most important thing to act on>",
  "contentStrengths": ["<what this creator clearly does well based on feedback>", "<strength>", "<strength>"],
  "improvementAreas": ["<specific area to improve with concrete suggestion>", "<area>", "<area>"]
}
The priority field must be one of: high, medium, low. Return ONLY valid JSON (no markdown, no explanation).

COMMENTS:
${comments}`,

  trends: (comments, sampleSize) => `Analyze these ${sampleSize} YouTube comments for trends, viral moments, and emerging patterns. Return a JSON object:
{
  "trendingPhrases": ["<phrase or term appearing repeatedly>", "<phrase>", "<phrase>", "<phrase>", "<phrase>", "<phrase>"],
  "viralComments": [
    {
      "comment": "<the comment text>",
      "reason": "<why this comment resonated — humor, relatability, insight, controversy>"
    },
    {
      "comment": "<comment text>",
      "reason": "<reason>"
    },
    {
      "comment": "<comment text>",
      "reason": "<reason>"
    }
  ],
  "keywords": ["<high-frequency meaningful keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>", "<keyword>"],
  "emergingTrends": ["<trend or pattern emerging in this comment section>", "<trend>", "<trend>", "<trend>"],
  "insideJokes": ["<recurring reference, meme, or in-joke specific to this community>"],
  "viralityFactors": "<3-4 sentences on what makes this content shareable/viral based on comment analysis>",
  "communityHealth": "<assessment of the comment section's overall health — toxic, positive, engaged, passive? with evidence>",
  "contentMoments": ["<specific moment or segment of the video that generated the most comment activity>", "<moment>", "<moment>"],
  "crossContentSignals": "<are commenters referencing other videos, creators, or trends? What?>",
  "recommendations": ["<recommendation for maximizing virality or community engagement>", "<recommendation>", "<recommendation>"]
}
Identify 3-5 viral comments. Return ONLY valid JSON (no markdown, no explanation).

COMMENTS:
${comments}`,
}

const stringArraySchema = {
  type: 'array',
  items: { type: 'string' },
} as const

const ANALYSIS_RESPONSE_FORMATS = {
  sentiment: {
    type: 'json_schema',
    json_schema: {
      name: 'sentiment_analysis',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          positive: { type: 'number' },
          neutral: { type: 'number' },
          negative: { type: 'number' },
          summary: { type: 'string' },
          themes: stringArraySchema,
          emotionalDrivers: {
            type: 'object',
            additionalProperties: false,
            properties: {
              positive: stringArraySchema,
              negative: stringArraySchema,
            },
            required: ['positive', 'negative'],
          },
          notableQuotes: stringArraySchema,
          sentimentOverTime: { type: 'string' },
        },
        required: ['positive', 'neutral', 'negative', 'summary', 'themes', 'emotionalDrivers', 'notableQuotes', 'sentimentOverTime'],
      },
    },
  },
  audience: {
    type: 'json_schema',
    json_schema: {
      name: 'audience_analysis',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          segments: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                emoji: { type: 'string' },
                name: { type: 'string' },
                percentage: { type: 'number' },
                description: { type: 'string' },
                typicalComment: { type: 'string' },
                engagementStyle: { type: 'string' },
              },
              required: ['emoji', 'name', 'percentage', 'description', 'typicalComment', 'engagementStyle'],
            },
          },
          audienceSummary: { type: 'string' },
          geographicSignals: { type: 'string' },
          ageSignals: { type: 'string' },
          loyaltySignal: { type: 'string' },
          recommendations: stringArraySchema,
        },
        required: ['segments', 'audienceSummary', 'geographicSignals', 'ageSignals', 'loyaltySignal', 'recommendations'],
      },
    },
  },
  topics: {
    type: 'json_schema',
    json_schema: {
      name: 'topics_analysis',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          topics: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                topic: { type: 'string' },
                percentage: { type: 'number' },
                description: { type: 'string' },
                sentiment: { type: 'string', enum: ['positive', 'negative', 'mixed', 'neutral'] },
                representativeComments: stringArraySchema,
              },
              required: ['topic', 'percentage', 'description', 'sentiment', 'representativeComments'],
            },
          },
          topicSummary: { type: 'string' },
          contentGaps: stringArraySchema,
          controversialTopics: stringArraySchema,
          unusualFindings: { type: 'string' },
        },
        required: ['topics', 'topicSummary', 'contentGaps', 'controversialTopics', 'unusualFindings'],
      },
    },
  },
  feedback: {
    type: 'json_schema',
    json_schema: {
      name: 'feedback_analysis',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          praise: stringArraySchema,
          requests: stringArraySchema,
          criticisms: stringArraySchema,
          questions: stringArraySchema,
          insights: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                insight: { type: 'string' },
                evidence: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['insight', 'evidence', 'priority'],
            },
          },
          overallFeedbackSummary: { type: 'string' },
          contentStrengths: stringArraySchema,
          improvementAreas: stringArraySchema,
        },
        required: ['praise', 'requests', 'criticisms', 'questions', 'insights', 'overallFeedbackSummary', 'contentStrengths', 'improvementAreas'],
      },
    },
  },
  trends: {
    type: 'json_schema',
    json_schema: {
      name: 'trends_analysis',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          trendingPhrases: stringArraySchema,
          viralComments: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                comment: { type: 'string' },
                reason: { type: 'string' },
              },
              required: ['comment', 'reason'],
            },
          },
          keywords: stringArraySchema,
          emergingTrends: stringArraySchema,
          insideJokes: stringArraySchema,
          viralityFactors: { type: 'string' },
          communityHealth: { type: 'string' },
          contentMoments: stringArraySchema,
          crossContentSignals: { type: 'string' },
          recommendations: stringArraySchema,
        },
        required: ['trendingPhrases', 'viralComments', 'keywords', 'emergingTrends', 'insideJokes', 'viralityFactors', 'communityHealth', 'contentMoments', 'crossContentSignals', 'recommendations'],
      },
    },
  },
} as const

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getCurrentMinute(): string {
  return new Date().toISOString().slice(0, 16)
}

function formatComment(c: AnalysisComment, index: number) {
  return `[${index + 1}] ${c.author} (${c.likes} likes): ${c.text}`
}

function createCommentChunks(comments: AnalysisComment[]) {
  const chunks: Array<{ comments: string; count: number }> = []
  let current = ''
  let currentCount = 0

  comments.forEach((comment, index) => {
    const line = formatComment(comment, index)
    const next = current ? `${current}\n${line}` : line

    if (current && next.length > CHUNK_CHAR_LIMIT) {
      chunks.push({ comments: current, count: currentCount })
      current = line
      currentCount = 1
      return
    }

    current = next
    currentCount += 1
  })

  if (current) chunks.push({ comments: current, count: currentCount })
  return chunks
}

function mergePrompt(analysisType: AnalysisType, partials: PartialAnalysis[], sampleSize: number) {
  return `Combine these partial ${analysisType} analyses into one final analysis covering all ${sampleSize} YouTube comments.

Rules:
- Deduplicate repeated themes, topics, phrases, quotes, and recommendations.
- Weight percentages by each partial result's commentCount.
- Preserve specific evidence and representative comments when useful.
- Return one cohesive final JSON object matching the schema.

PARTIAL ANALYSES:
${JSON.stringify(partials)}`
}

function createMergeBatches(partials: PartialAnalysis[]) {
  const batches: PartialAnalysis[][] = []
  let current: PartialAnalysis[] = []
  let currentLength = 2

  for (const partial of partials) {
    const partialLength = JSON.stringify(partial).length + 1
    if (current.length > 0 && currentLength + partialLength > MERGE_CHAR_LIMIT) {
      batches.push(current)
      current = []
      currentLength = 2
    }

    current.push(partial)
    currentLength += partialLength
  }

  if (current.length > 0) batches.push(current)
  return batches
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  )

  return results
}

async function checkAndReserveAiUsage(userId: string, plan: string, commentCount: number) {
  const limits = AI_USAGE_LIMITS[plan] ?? AI_USAGE_LIMITS.pro
  if (limits.analysesPerMonth <= 0 || limits.commentsPerMonth <= 0 || limits.requestsPerMinute <= 0) {
    return {
      allowed: false,
      status: 403,
      error: 'AI Analysis requires a Pro plan or higher',
    }
  }

  const service = createServiceClient()
  const month = getCurrentMonth()
  const minute = getCurrentMinute()
  const now = new Date().toISOString()

  const [{ data: monthly }, { data: minuteUsage }] = await Promise.all([
    service
      .from('ai_analysis_usage')
      .select('analysis_count, comment_count')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle(),
    service
      .from('ai_analysis_rate_limits')
      .select('request_count')
      .eq('user_id', userId)
      .eq('minute', minute)
      .maybeSingle(),
  ])

  const monthlyAnalyses = monthly?.analysis_count ?? 0
  const monthlyComments = monthly?.comment_count ?? 0
  const minuteRequests = minuteUsage?.request_count ?? 0

  if (minuteRequests >= limits.requestsPerMinute) {
    return {
      allowed: false,
      status: 429,
      error: 'Too many AI analysis requests. Please wait a minute and try again.',
    }
  }

  if (monthlyAnalyses + 1 > limits.analysesPerMonth || monthlyComments + commentCount > limits.commentsPerMonth) {
    return {
      allowed: false,
      status: 429,
      error: 'Monthly AI analysis limit reached. Upgrade your plan or wait until next month.',
    }
  }

  const [{ error: monthlyError }, { error: minuteError }] = await Promise.all([
    service.from('ai_analysis_usage').upsert(
      {
        user_id: userId,
        month,
        analysis_count: monthlyAnalyses + 1,
        comment_count: monthlyComments + commentCount,
        updated_at: now,
      },
      { onConflict: 'user_id,month' }
    ),
    service.from('ai_analysis_rate_limits').upsert(
      {
        user_id: userId,
        minute,
        request_count: minuteRequests + 1,
        updated_at: now,
      },
      { onConflict: 'user_id,minute' }
    ),
  ])

  if (monthlyError || minuteError) {
    console.error('[ai-analysis] usage reservation failed:', monthlyError?.message ?? minuteError?.message)
    return {
      allowed: false,
      status: 503,
      error: 'AI analysis temporarily unavailable',
    }
  }

  return { allowed: true, status: 200, error: null }
}

async function createAnalysisCompletion(
  client: OpenAI,
  analysisType: AnalysisType,
  prompt: string,
  maxTokens = 4000
) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: 'system',
        content: 'Return data that exactly matches the provided JSON schema. Use empty arrays or empty strings for unavailable signals instead of omitting fields.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: ANALYSIS_RESPONSE_FORMATS[analysisType],
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return JSON.parse(cleaned)
}

async function reduceAnalysisPartials(
  client: OpenAI,
  analysisType: AnalysisType,
  partials: PartialAnalysis[]
): Promise<PartialAnalysis> {
  if (partials.length === 1) return partials[0]

  const batches = createMergeBatches(partials)
  const reduced = await mapWithConcurrency(batches, CHUNK_CONCURRENCY, async (batch) => {
    const commentCount = batch.reduce((sum, partial) => sum + partial.commentCount, 0)
    const result = await createAnalysisCompletion(
      client,
      analysisType,
      mergePrompt(analysisType, batch, commentCount),
      4000
    )

    return { commentCount, result }
  })

  return reduceAnalysisPartials(client, analysisType, reduced)
}

// ── Staged analysis ─────────────────────────────────────────────────────────
// Large analyses don't fit one 60s request (each chunk is one OpenAI call), so the
// client runs them in steps: 'start' reserves usage and returns a signed token,
// then each 'chunk' and 'merge' call does one OpenAI call against that token.

const STAGE_TOKEN_TTL_MS = 30 * 60_000
// Caps chunk/merge calls per user per minute; total spend is also bounded by the monthly comment limit
const STAGE_CALLS_PER_MINUTE = 30
const MAX_COMMENT_CHARS = 2_000

type StageToken = { u: string; t: AnalysisType; exp: number }

function stageSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
}

function signStageToken(payload: StageToken): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', stageSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verifyStageToken(token: unknown, userId: string, analysisType: AnalysisType): boolean {
  if (typeof token !== 'string' || !token.includes('.')) return false
  const [body, sig] = token.split('.')
  const expected = createHmac('sha256', stageSecret()).update(body).digest('base64url')
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as StageToken
    return payload.u === userId && payload.t === analysisType && payload.exp > Date.now()
  } catch {
    return false
  }
}

async function allowStageCall(userId: string): Promise<boolean> {
  const service = createServiceClient()
  const minute = `${getCurrentMinute()}:stage`
  const { data } = await service
    .from('ai_analysis_rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('minute', minute)
    .maybeSingle()
  const count = data?.request_count ?? 0
  if (count >= STAGE_CALLS_PER_MINUTE) return false
  await service.from('ai_analysis_rate_limits').upsert(
    { user_id: userId, minute, request_count: count + 1, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,minute' }
  )
  return true
}

function sanitizeComments(raw: unknown): AnalysisComment[] {
  if (!Array.isArray(raw)) return []
  return raw.map((c) => {
    const x = c as Partial<AnalysisComment>
    return {
      author: String(x.author ?? '').slice(0, 100),
      text: String(x.text ?? '').slice(0, MAX_COMMENT_CHARS),
      likes: Number(x.likes) || 0,
      date: String(x.date ?? '').slice(0, 40),
    }
  })
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI analysis not configured' }, { status: 503 })
    }

    // Auth check — must be signed in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Plan check — also considers team membership for inherited access
    const plan = await getEffectivePlan(user.id)
    if (!plan || plan === 'free' || (TIER_LIMITS[plan] ?? 0) === 0) {
      return NextResponse.json({ error: 'AI Analysis requires a Pro plan or higher' }, { status: 403 })
    }

    const body = await req.json() as {
      stage?: 'start' | 'chunk' | 'merge'
      token?: string
      commentCount?: number
      comments?: unknown
      partials?: PartialAnalysis[]
      analysisType: AnalysisType
    }
    const { analysisType } = body
    if (!PROMPTS[analysisType]) return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })
    const limit = TIER_LIMITS[plan] ?? TIER_LIMITS.pro

    if (body.stage === 'start') {
      const commentCount = Math.min(Math.max(0, Number(body.commentCount) || 0), limit)
      if (commentCount === 0) return NextResponse.json({ error: 'No comments provided' }, { status: 400 })
      const usage = await checkAndReserveAiUsage(user.id, plan, commentCount)
      if (!usage.allowed) return NextResponse.json({ error: usage.error }, { status: usage.status })
      const token = signStageToken({ u: user.id, t: analysisType, exp: Date.now() + STAGE_TOKEN_TTL_MS })
      return NextResponse.json({ token, commentCount, chunkCharLimit: CHUNK_CHAR_LIMIT, mergeCharLimit: MERGE_CHAR_LIMIT })
    }

    if (body.stage === 'chunk' || body.stage === 'merge') {
      if (!verifyStageToken(body.token, user.id, analysisType)) {
        return NextResponse.json({ error: 'Analysis session expired. Please run it again.' }, { status: 401 })
      }
      if (!(await allowStageCall(user.id))) {
        return NextResponse.json({ error: 'Too many AI analysis requests. Please wait a minute and try again.' }, { status: 429 })
      }
      const client = new OpenAI({ apiKey })

      if (body.stage === 'chunk') {
        const chunkComments = sanitizeComments(body.comments)
        const chunks = createCommentChunks(chunkComments)
        if (chunks.length !== 1) return NextResponse.json({ error: 'Chunk too large' }, { status: 413 })
        const result = await createAnalysisCompletion(client, analysisType, PROMPTS[analysisType](chunks[0].comments, chunks[0].count), 3000)
        return NextResponse.json({ partial: { commentCount: chunks[0].count, result } })
      }

      const partials = Array.isArray(body.partials) ? body.partials : []
      if (partials.length < 2 || JSON.stringify(partials).length > MERGE_CHAR_LIMIT) {
        return NextResponse.json({ error: 'Invalid merge batch' }, { status: 413 })
      }
      const commentCount = partials.reduce((sum, p) => sum + (Number(p.commentCount) || 0), 0)
      const result = await createAnalysisCompletion(client, analysisType, mergePrompt(analysisType, partials, commentCount), 4000)
      return NextResponse.json({ partial: { commentCount, result } })
    }

    // Single-request analysis, kept for small analyses from older clients
    const comments = sanitizeComments(body.comments)
    if (!comments.length) return NextResponse.json({ error: 'No comments provided' }, { status: 400 })
    const sample = comments.slice(0, limit)
    if (createCommentChunks(sample).length > 2) {
      return NextResponse.json({ error: 'This analysis is too large for one request. Please refresh the page and try again.' }, { status: 413 })
    }

    const usage = await checkAndReserveAiUsage(user.id, plan, sample.length)
    if (!usage.allowed) {
      return NextResponse.json({ error: usage.error }, { status: usage.status })
    }

    const client = new OpenAI({ apiKey })
    const chunks = createCommentChunks(sample)
    const partials = await mapWithConcurrency(chunks, CHUNK_CONCURRENCY, async (chunk) => {
      const result = await createAnalysisCompletion(client, analysisType, PROMPTS[analysisType](chunk.comments, chunk.count), 3000)
      return { commentCount: chunk.count, result }
    })

    const result = (await reduceAnalysisPartials(client, analysisType, partials)).result

    return NextResponse.json({ result, analysisType, commentCount: sample.length, chunks: chunks.length })
  } catch (e: unknown) {
    // Log the real error; don't send internal details to the browser
    console.error('/api/analyze error:', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
