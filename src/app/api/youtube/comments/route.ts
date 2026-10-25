import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/teams'
import { ANON_DAILY_LIMIT, reserveAnonUsage, reserveMonthlyUsage } from '@/lib/quota'
import { getApiKeys, fetchWithKeyRotation, getYouTubeErrorReason, AttemptLog } from '@/lib/youtube-api'
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

type Reply = { id: string; author: string; text: string; likes: number; date: string; dateRaw?: string }
type Comment = { id: string; author: string; text: string; likes: number; date: string; dateRaw?: string; replies: number; replyList: Reply[]; videoTitle?: string; channelName?: string; videoUrl?: string }

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

// Each call returns one batch; the client keeps calling with nextCursor until done.
// Keeps every response well inside Vercel's time limit and 4.5MB body limit.
export const maxDuration = 60
const BATCH_UNITS = 2000              // comments + replies per call
const BATCH_UNITS_WITH_REPLIES = 500
const TIME_BUDGET_MS = 40_000

// Where the next batch starts: a YouTube page plus how many of its threads were already returned
type Cursor = { pageToken: string; skip: number }

function parseCursor(raw: unknown): Cursor {
  const c = raw as Partial<Cursor> | null
  return {
    pageToken: typeof c?.pageToken === 'string' ? c.pageToken : '',
    skip: Number.isInteger(c?.skip) && (c?.skip ?? 0) > 0 ? (c!.skip as number) : 0,
  }
}

function hashIp(req: NextRequest): string {
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  return createHash('sha256').update(`ycd-anon:${ip}`).digest('hex')
}

function collectFailedKeys(log: AttemptLog[]): number[] {
  return log.filter(a => a.error !== undefined).map(a => a.keyIndex)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url, maxComments = 100, includeReplies: wantsReplies = false, sortBy = 'top', fetchedSoFar = 0 } = body
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Determine user and plan
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use effective plan — checks personal subscription and team membership
    const effectivePlan = user ? await getEffectivePlan(user.id) : 'free'
    const planMaxComments = user
      ? (PLAN_LIMITS[effectivePlan]?.maxComments ?? PLAN_LIMITS.free.maxComments)
      : 50 // unauthenticated limit
    // Reply capture is a paid feature
    const includeReplies = Boolean(wantsReplies) && !!user && effectivePlan !== 'free'

    // Per-download cap across every batch of this download; 0 / missing = plan max
    const requested = Number(maxComments) > 0 ? Number(maxComments) : planMaxComments
    const alreadyFetched = Math.max(0, Number(fetchedSoFar) || 0)
    const downloadRemaining = Math.max(0, Math.min(requested, planMaxComments) - alreadyFetched)
    if (downloadRemaining === 0) {
      return NextResponse.json({ comments: [], total: 0, nextCursor: null, done: true, mock: false })
    }

    // Use mock mode when no real keys are configured
    const configuredKeys = getApiKeys()
    if (configuredKeys.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Comment exports are temporarily unavailable. Please try again later.' },
          { status: 503 }
        )
      }
      await new Promise(r => setTimeout(r, 1500))
      const mockWithMeta = (includeReplies ? MOCK_COMMENTS : MOCK_COMMENTS.map(c => ({ ...c, replyList: [] }))).map(c => ({
        ...c,
        videoTitle: 'Sample YouTube Video — Tutorial & Deep Dive',
        channelName: 'CreatorChannel',
        videoUrl: url,
      }))
      const mockResult = mockWithMeta.slice(0, downloadRemaining)
      return NextResponse.json({ comments: mockResult, total: mockResult.length, nextCursor: null, done: true, mock: true })
    }

    const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    if (!videoIdMatch) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    const videoId = videoIdMatch[1]

    // Reserve this batch's quota atomically up front; whatever isn't used is refunded below
    const batchUnits = includeReplies ? BATCH_UNITS_WITH_REPLIES : Math.min(BATCH_UNITS, downloadRemaining)
    const ipHash = user ? '' : hashIp(req)
    const reserve = (n: number) => user ? reserveMonthlyUsage(user.id, effectivePlan, n) : reserveAnonUsage(ipHash, n)
    const granted = await reserve(batchUnits)
    if (granted <= 0) {
      return user
        ? NextResponse.json({ error: 'Monthly quota exceeded. Resets on the 1st of next month.', code: 'quota_exceeded' }, { status: 429 })
        : NextResponse.json({ error: `You've reached the free limit of ${ANON_DAILY_LIMIT.toLocaleString()} comments per day without an account. Sign up free to keep exporting.`, code: 'anon_limit' }, { status: 429 })
    }
    // Less than a full batch means the quota is nearly used up — keep what fits
    const quotaLimited = granted < batchUnits
    let used = 0

    try {
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
      const order = sortBy === 'newest' ? 'time' : 'relevance'
      // Smaller pages when fetching replies, so one page's reply calls stay quick
      const pageSize = includeReplies ? '20' : '100'
      const started = Date.now()
      let cursor: Cursor | null = parseCursor(body.cursor)

      while (cursor) {
        let threadData: { items?: unknown[]; nextPageToken?: string; error?: { message?: string } }
        try {
          const pageToken = cursor.pageToken
          const { data, keyIndex, attemptsLog } = await fetchWithKeyRotation(
            (key) => `https://www.googleapis.com/youtube/v3/commentThreads?${new URLSearchParams({ part: 'snippet', videoId, maxResults: pageSize, order, key, ...(pageToken ? { pageToken } : {}) })}`
          )
          collectFailedKeys(attemptsLog).forEach(k => allFailedKeys.add(k))
          lastSuccessKey = keyIndex
          threadData = data as typeof threadData
        } catch {
          // All keys exhausted — alert and return 503
          await sendApiAlert({
            event: 'api_pool_exhausted',
            message: `All ${configuredKeys.length} YouTube API keys exhausted fetching comment threads`,
            failedKeys: Array.from(allFailedKeys),
            endpoint: '/api/youtube/comments',
            timestamp: new Date().toISOString(),
          })
          return NextResponse.json({ error: 'YouTube API quota exhausted. Please try again later.', code: 'youtube_quota' }, { status: 503 })
        }

        if (threadData.error) {
          // Per-video problems get their own codes so bulk exports can skip the video and carry on
          const reason = getYouTubeErrorReason(threadData)
          if (reason === 'commentsDisabled') {
            return NextResponse.json({ error: 'Comments are turned off for this video.', code: 'comments_disabled' }, { status: 422 })
          }
          if (reason === 'videoNotFound' || reason === 'forbidden') {
            return NextResponse.json({ error: 'This video is private, deleted, or unavailable.', code: 'video_unavailable' }, { status: 422 })
          }
          return NextResponse.json({ error: threadData.error.message ?? 'YouTube returned an error.', code: 'youtube_error' }, { status: 502 })
        }

        const items = threadData.items ?? []
        let stopAt: number | null = null
        let downloadFull = false

        for (let idx = cursor.skip; idx < items.length; idx++) {
          if (comments.length >= downloadRemaining) { downloadFull = true; break }
          if (used >= granted) { stopAt = idx; break }

          const typedItem = items[idx] as {
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
                    dateRaw: rr.snippet.publishedAt,
                  }
                })
              }
            } catch { /* non-fatal — replies are best-effort */ }
          }

          // Replies count toward quota. If this thread doesn't fit the batch, start the next batch with it,
          // unless the quota itself is nearly out — then keep as many replies as fit.
          if (used + 1 + replyList.length > granted) {
            if (!quotaLimited && used > 0) { stopAt = idx; break }
            replyList = replyList.slice(0, Math.max(0, granted - used - 1))
          }

          comments.push({
            id: typedItem.id,
            author: s.authorDisplayName,
            text: decodeHtml(s.textDisplay),
            likes: s.likeCount,
            date: new Date(s.publishedAt).toLocaleDateString(),
            dateRaw: s.publishedAt,
            replies: replyCount,
            replyList,
            videoTitle,
            channelName,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          })
          used += 1 + replyList.length
        }

        if (downloadFull || comments.length >= downloadRemaining) {
          cursor = null
        } else if (stopAt !== null) {
          // Batch budget used up mid-page — resume from this thread next call
          cursor = { pageToken: cursor.pageToken, skip: stopAt }
          break
        } else if (!threadData.nextPageToken) {
          cursor = null
        } else {
          cursor = { pageToken: threadData.nextPageToken, skip: 0 }
          if (used >= granted || Date.now() - started > TIME_BUDGET_MS) break
        }
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

      return NextResponse.json({ comments, total: comments.length, nextCursor: cursor, done: cursor === null, mock: false })
    } finally {
      const unused = granted - used
      if (unused > 0) await reserve(-unused).catch(() => {})
    }
  } catch (e) {
    console.error('comments route error:', e)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
