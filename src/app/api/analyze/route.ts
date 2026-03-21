import { NextRequest, NextResponse } from 'next/server'

export type AnalysisType = 'sentiment' | 'audience' | 'topics' | 'feedback' | 'trends'

const TIER_LIMITS: Record<string, number> = {
  free: 0,
  pro: 10000,
  business: 50000,
  enterprise: 100000,
}

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

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI analysis not configured' }, { status: 503 })
    }

    const { comments, analysisType, tier = 'pro' } = await req.json() as {
      comments: Array<{ author: string; text: string; likes: number; date: string }>,
      analysisType: AnalysisType,
      tier?: string,
    }

    if (!comments?.length) return NextResponse.json({ error: 'No comments provided' }, { status: 400 })
    if (!PROMPTS[analysisType]) return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 })

    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.pro
    const sample = comments.slice(0, limit)

    // Format comments for the prompt — include likes for weighting
    const formatted = sample
      .map((c, i) => `[${i + 1}] ${c.author} (${c.likes} likes): ${c.text}`)
      .join('\n')

    const prompt = PROMPTS[analysisType](formatted, sample.length)

    const OpenAI = (await import('openai')).default
    const client = new OpenAI({ apiKey })

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? ''

    // Strip markdown code fences if model wraps in ```json```
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const result = JSON.parse(cleaned)

    return NextResponse.json({ result, analysisType, commentCount: sample.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Analysis failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
