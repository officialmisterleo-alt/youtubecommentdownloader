import { NextRequest, NextResponse } from 'next/server'

export type AnalysisType = 'sentiment' | 'audience' | 'topics' | 'feedback' | 'trends'

const TIER_LIMITS: Record<string, number> = {
  pro: 500,
  business: 2000,
  enterprise: 10000,
  free: 0,
}

const PROMPTS: Record<AnalysisType, (comments: string) => string> = {
  sentiment: (comments) => `You are analyzing YouTube comments for a content creator. Analyze the sentiment of these comments.

COMMENTS:
${comments}

Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{
  "overall": "Positive" | "Negative" | "Mixed",
  "positive": <number 0-100>,
  "neutral": <number 0-100>,
  "negative": <number 0-100>,
  "positiveThemes": ["theme1", "theme2", "theme3"],
  "negativeThemes": ["theme1", "theme2", "theme3"],
  "summary": "<2 sentence summary of the overall audience mood>"
}`,

  audience: (comments) => `You are analyzing YouTube comments to profile the audience. Based on these comments, describe who is watching.

COMMENTS:
${comments}

Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{
  "profile": "<1 sentence audience description>",
  "expertise": "Beginner" | "Intermediate" | "Advanced" | "Mixed",
  "useCases": ["use case 1", "use case 2", "use case 3"],
  "context": "<professional or personal context of viewers>",
  "motivations": ["why they watch 1", "why they watch 2", "why they watch 3"],
  "summary": "<2 sentence summary of the audience profile>"
}`,

  topics: (comments) => `You are analyzing YouTube comments to identify the main discussion topics.

COMMENTS:
${comments}

Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{
  "topics": [
    { "name": "Topic Name", "percentage": <number>, "description": "<what people say about this>", "example": "<short example quote>" },
    { "name": "Topic Name", "percentage": <number>, "description": "<what people say about this>", "example": "<short example quote>" },
    { "name": "Topic Name", "percentage": <number>, "description": "<what people say about this>", "example": "<short example quote>" },
    { "name": "Topic Name", "percentage": <number>, "description": "<what people say about this>", "example": "<short example quote>" },
    { "name": "Topic Name", "percentage": <number>, "description": "<what people say about this>", "example": "<short example quote>" }
  ],
  "summary": "<1 sentence summary of what dominates the conversation>"
}`,

  feedback: (comments) => `You are analyzing YouTube comments to extract creator feedback. Identify what the audience praises and what they want improved.

COMMENTS:
${comments}

Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{
  "praise": ["specific praise point 1", "specific praise point 2", "specific praise point 3"],
  "requests": ["specific request 1", "specific request 2", "specific request 3"],
  "insights": [
    { "action": "<actionable recommendation>", "reason": "<why based on comments>" },
    { "action": "<actionable recommendation>", "reason": "<why based on comments>" },
    { "action": "<actionable recommendation>", "reason": "<why based on comments>" }
  ],
  "summary": "<2 sentence summary of creator feedback>"
}`,

  trends: (comments) => `You are analyzing YouTube comments to identify trending phrases, high-impact statements, and viral potential.

COMMENTS:
${comments}

Return ONLY valid JSON (no markdown, no explanation) in this exact shape:
{
  "phrases": ["memorable phrase 1", "memorable phrase 2", "memorable phrase 3", "memorable phrase 4", "memorable phrase 5"],
  "viralComments": [
    { "text": "<actual comment text>", "reason": "<why it resonates>" },
    { "text": "<actual comment text>", "reason": "<why it resonates>" },
    { "text": "<actual comment text>", "reason": "<why it resonates>" }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "summary": "<1 sentence on the overall viral quality of this comment section>"
}`,
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

    const prompt = PROMPTS[analysisType](formatted)

    const OpenAI = (await import('openai')).default
    const client = new OpenAI({ apiKey })

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
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
