import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/teams'
import { checkAndIncrementUsage, getMonthlyUsage, MONTHLY_LIMITS } from '@/lib/quota'
import { getApiKeys, fetchWithKeyRotation, AttemptLog } from '@/lib/youtube-api'
import { sendApiAlert } from '@/lib/alerts'

// YouTube's textDisplay is HTML-encoded — decode before storing so all export formats get clean text
function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '') // strip any other HTML tags
}

type Reply = { id: string; author: string; text: string; likes: number; date: string }
type Comment = { id: string; author: string; text: string; likes: number; date: string; replies: number; replyList: Reply[]; videoTitle?: string; channelName?: string; videoUrl?: string }

const PLAN_LIMITS: Record<string, { maxComments: number }> = {
  free: { maxComments: 100 },
  pro: { maxComments: 10000 },
  business: { maxComments: 100000 },
  enterprise: { maxComments: 1000000 },
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1', author: '@techreviewer99', text: 'This is exactly what I needed! The tutorial was super clear and easy to follow.', likes: 342, date: '2 days ago', replies: 2,
    replyList: [
      { id: '1-1', author: '@CreatorChannel', text: 'Thank you so much! Really glad it helped 🙏', likes: 48, date: '2 days ago' },
      { id: '1-2', author: '@techreviewer99', text: 'Can you do a follow-up on the advanced settings?', likes: 11, date: '1 day ago' },
    ],
  },
  {
    id: '2', author: '@marketingpro_sarah', text: 'Great content as always. Would love to see a follow-up on advanced techniques.', likes: 187, date: '3 days ago', replies: 1,
    replyList: [
      { id: '2-1', author: '@CreatorChannel', text: 'Advanced series is coming next month — stay tuned!', likes: 34, date: '3 days ago' },
    ],
  },
  {
    id: '3', author: '@dataanalyst_mike', text: "I've been using this method for 6 months and it works perfectly for our agency workflow.", likes: 156, date: '4 days ago', replies: 3,
    replyList: [
      { id: '3-1', author: '@agencyfounder', text: 'Same here, it cut our reporting time in half.', likes: 22, date: '4 days ago' },
      { id: '3-2', author: '@dataanalyst_mike', text: 'Exactly — the bulk export makes it so much faster.', likes: 8, date: '3 days ago' },
      { id: '3-3', author: '@smmexpert', text: 'Which plan are you on? We need this for enterprise.', likes: 5, date: '2 days ago' },
    ],
  },
  { id: '4', author: '@creativedirector', text: 'The production quality keeps improving. Keep up the amazing work!', likes: 134, date: '5 days ago', replies: 0, replyList: [] },
  {
    id: '5', author: '@researcher_2024', text: 'Perfect for academic research. I downloaded 50k comments in under 10 minutes.', likes: 98, date: '1 week ago', replies: 1,
    replyList: [
      { id: '5-1', author: '@CreatorChannel', text: 'Awesome use case! Let us know if you need higher limits.', likes: 14, date: '1 week ago' },
    ],
  },
  { id: '6', author: '@smmexpert', text: 'Game changer for social media monitoring. Our clients love the reports.', likes: 87, date: '1 week ago', replies: 0, replyList: [] },
  { id: '7', author: '@brandstrategist', text: 'Used this for competitive analysis — found insights we never would have caught manually.', likes: 76, date: '1 week ago', replies: 0, replyList: [] },
  { id: '8', author: '@contentcreator_v', text: 'Finally a tool that handles reply threads properly. Other tools miss so much data.', likes: 65, date: '2 weeks ago', replies: 0, replyList: [] },
  { id: '9', author: '@agencyfounder', text: "We've replaced 3 separate tools with this. The API integration is seamless.", likes: 54, date: '2 weeks ago', replies: 0, replyList: [] },
  { id: '10', author: '@digitalmarketer', text: 'The bulk channel download is incredible. Downloaded an entire competitor channel overnight.', likes: 43, date: '2 weeks ago', replies: 0, replyList: [] },
]

async function incrementLegacyUsage(userId: string, commentsCount: number) {
  const serviceClient = createServiceClient()
  const month = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const { data: existing } = await serviceClient
    .from('usage')
    .select('id, exports_count, comments_count')
    .eq('user_id', userId)
    .eq('month', month)
    .single()

  if (existing) {
    await serviceClient
      .from('usage')
      .update({
        exports_count: (existing.exports_count ?? 0) + 1,
        comments_count: (existing.comments_count ?? 0) + commentsCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await serviceClient
      .from('usage')
      .insert({ user_id: userId, month, exports_count: 1, comments_count: commentsCount })
  }
}

function collectFailedKeys(log: AttemptLog[]): number[] {
  return log.filter(a => a.error !== undefined).map(a => a.keyIndex)
}

export async function POST(req: NextRequest) {
  try {
    const { url, maxComments = 100, includeReplies = false, sortBy = 'top' } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Determine user and plan
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let planMaxComments: number
    let effectivePlan = 'free'
    if (!user) {
      planMaxComments = 50 // unauthenticated limit
    } else {
      // Use effective plan — checks personal subscription and team membership
      effectivePlan = await getEffectivePlan(user.id)
      planMaxComments = PLAN_LIMITS[effectivePlan]?.maxComments ?? PLAN_LIMITS.free.maxComments
    }

    // Check monthly quota before any API calls
    if (user) {
      const { remaining } = await getMonthlyUsage(user.id, effectivePlan)
      const planMonthlyMax = MONTHLY_LIMITS[effectivePlan] ?? 100
      if (planMonthlyMax !== -1 && remaining <= 0) {
        return NextResponse.json(
          { error: 'Monthly quota exceeded. Resets on the 1st of next month.' },
          { status: 429 }
        )
      }
      // Clamp per-download limit to remaining monthly quota
      if (planMonthlyMax !== -1 && remaining < planMaxComments) {
        planMaxComments = remaining
      }
    }

    // Enforce plan per-download limit — client-requested value cannot exceed plan max
    const effectiveMax = Math.min(maxComments, planMaxComments)

    // Use mock mode when no real keys are configured
    const configuredKeys = getApiKeys()
    if (configuredKeys.length === 0) {
      await new Promise(r => setTimeout(r, 1500))
      const mockWithMeta = (includeReplies ? MOCK_COMMENTS : MOCK_COMMENTS.map(c => ({ ...c, replyList: [] }))).map(c => ({
        ...c,
        videoTitle: 'Sample YouTube Video — Tutorial & Deep Dive',
        channelName: 'CreatorChannel',
        videoUrl: url,
      }))
      const mockResult = mockWithMeta.slice(0, effectiveMax)
      if (user) {
        await checkAndIncrementUsage(user.id, effectivePlan, mockResult.length).catch(() => {})
        await incrementLegacyUsage(user.id, mockResult.length).catch(() => {})
      }
      return NextResponse.json({ comments: mockResult, total: mockResult.length, mock: true })
    }

    const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    if (!videoIdMatch) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    const videoId = videoIdMatch[1]

    // Track all failed key indices across this entire request for alerting
    const allFailedKeys = new Set<number>()
    let lastSuccessKey: number | undefined

    // Fetch video title and channel name
    let videoTitle = ''
    let channelName = ''
    try {
      const { data: metaData, keyIndex, attemptsLog } = await fetchWithKeyRotation(
        (key) => `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({ part: 'snippet', id: videoId, key })}`
      )
      collectFailedKeys(attemptsLog).forEach(k => allFailedKeys.add(k))
      lastSuccessKey = keyIndex
      const snippet = (metaData as { items?: { snippet?: { title?: string; channelTitle?: string } }[] })?.items?.[0]?.snippet
      videoTitle = snippet?.title ?? ''
      channelName = snippet?.channelTitle ?? ''
    } catch { /* non-fatal — metadata is best-effort */ }

    const comments: Comment[] = []
    let pageToken = ''
    const order = sortBy === 'newest' ? 'time' : 'relevance'

    while (comments.length < effectiveMax) {
      let threadData: { items?: unknown[]; nextPageToken?: string; error?: { message: string } }
      try {
        const { data, keyIndex, attemptsLog } = await fetchWithKeyRotation(
          (key) => `https://www.googleapis.com/youtube/v3/commentThreads?${new URLSearchParams({ part: 'snippet', videoId, maxResults: '100', order, key, ...(pageToken ? { pageToken } : {}) })}`
        )
        collectFailedKeys(attemptsLog).forEach(k => allFailedKeys.add(k))
        lastSuccessKey = keyIndex
        threadData = data as typeof threadData
      } catch {
        // All keys exhausted — alert and return 503
        const failedKeys = Array.from(allFailedKeys)
        await sendApiAlert({
          event: 'api_pool_exhausted',
          message: `All ${configuredKeys.length} YouTube API keys exhausted fetching comment threads`,
          failedKeys,
          endpoint: '/api/youtube/comments',
          timestamp: new Date().toISOString(),
        })
        return NextResponse.json({ error: 'YouTube API quota exhausted. Please try again later.' }, { status: 503 })
      }

      if (threadData.error) return NextResponse.json({ error: threadData.error.message }, { status: 400 })

      for (const item of threadData.items ?? []) {
        const typedItem = item as {
          id: string
          snippet: {
            topLevelComment: { snippet: { authorDisplayName: string; textDisplay: string; likeCount: number; publishedAt: string } }
            totalReplyCount?: number
          }
        }
        const s = typedItem.snippet.topLevelComment.snippet
        const replyCount: number = typedItem.snippet.totalReplyCount ?? 0
        let replyList: Reply[] = []

        if (includeReplies && replyCount > 0) {
          try {
            const { data: rData, keyIndex, attemptsLog } = await fetchWithKeyRotation(
              (key) => `https://www.googleapis.com/youtube/v3/comments?${new URLSearchParams({ part: 'snippet', parentId: typedItem.id, maxResults: '100', key })}`
            )
            collectFailedKeys(attemptsLog).forEach(k => allFailedKeys.add(k))
            lastSuccessKey = keyIndex
            const rTyped = rData as { items?: unknown[]; error?: unknown }
            if (!rTyped.error) {
              replyList = (rTyped.items ?? []).map((r) => {
                const rr = r as { id: string; snippet: { authorDisplayName: string; textDisplay: string; likeCount: number; publishedAt: string } }
                return {
                  id: rr.id,
                  author: rr.snippet.authorDisplayName,
                  text: decodeHtml(rr.snippet.textDisplay),
                  likes: rr.snippet.likeCount,
                  date: new Date(rr.snippet.publishedAt).toLocaleDateString(),
                }
              })
            }
          } catch { /* non-fatal — replies are best-effort */ }
        }

        comments.push({
          id: typedItem.id,
          author: s.authorDisplayName,
          text: decodeHtml(s.textDisplay),
          likes: s.likeCount,
          date: new Date(s.publishedAt).toLocaleDateString(),
          replies: replyCount,
          replyList,
          videoTitle,
          channelName,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        })
        if (comments.length >= effectiveMax) break
      }
      if (!threadData.nextPageToken) break
      pageToken = threadData.nextPageToken
    }

    // Fire-and-forget quota warning when 3+ keys failed (but at least one succeeded)
    if (allFailedKeys.size >= 3) {
      sendApiAlert({
        event: 'quota_warning',
        message: `${allFailedKeys.size} YouTube API keys failed in a single request`,
        failedKeys: Array.from(allFailedKeys),
        successKey: lastSuccessKey,
        endpoint: '/api/youtube/comments',
        timestamp: new Date().toISOString(),
      }).catch(() => {})
    }

    if (user) {
      await checkAndIncrementUsage(user.id, effectivePlan, comments.length).catch(() => {})
      await incrementLegacyUsage(user.id, comments.length).catch(() => {})
    }

    return NextResponse.json({ comments, total: comments.length, mock: false })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
