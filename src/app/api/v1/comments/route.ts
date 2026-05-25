import { NextRequest, NextResponse } from 'next/server'
import { authenticateV1Request, isAuthSuccess } from '@/lib/v1-auth'
import { getMonthlyUsageService, checkAndIncrementUsageService } from '@/lib/quota-service'
import { getApiKeys, fetchWithKeyRotation, AttemptLog } from '@/lib/youtube-api'
import { sendApiAlert } from '@/lib/alerts'

// ── Types ─────────────────────────────────────────────────────────────────────

type Reply = {
  id: string
  author: string
  text: string
  likes: number
  date: string
  dateRaw: string
}

type Comment = {
  id: string
  author: string
  text: string
  likes: number
  date: string
  dateRaw: string
  replies: number
  replyList: Reply[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function decodeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
}

function collectFailedKeys(log: AttemptLog[]): number[] {
  return log.filter(a => a.error !== undefined).map(a => a.keyIndex)
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status })
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Auth
  const auth = await authenticateV1Request(req)
  if (!isAuthSuccess(auth)) return auth

  const { userId, plan } = auth

  // 2. Parse query params
  const { searchParams } = new URL(req.url)
  const url          = searchParams.get('url')
  const maxCommentsRaw = parseInt(searchParams.get('maxComments') ?? '100', 10)
  const includeReplies = searchParams.get('includeReplies') === 'true'
  const sortByRaw    = searchParams.get('sortBy') ?? 'top'

  if (!url) {
    return err('invalid_params', '`url` query parameter is required.', 400)
  }

  const validSortBy = ['top', 'newest', 'oldest'] as const
  type SortBy = typeof validSortBy[number]
  if (!validSortBy.includes(sortByRaw as SortBy)) {
    return err('invalid_params', '`sortBy` must be one of: top, newest, oldest.', 400)
  }
  const sortBy = sortByRaw as SortBy

  if (isNaN(maxCommentsRaw) || maxCommentsRaw < 1) {
    return err('invalid_params', '`maxComments` must be a positive integer.', 400)
  }
  const maxComments = Math.min(maxCommentsRaw, 10000)

  // 3. Extract video ID
  const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
  if (!videoIdMatch) {
    return err('invalid_params', 'Could not extract a video ID from the provided URL.', 400)
  }
  const videoId = videoIdMatch[1]

  // 4. Quota check
  const { remaining, used: usedBefore, limit } = await getMonthlyUsageService(userId, plan)
  if (limit !== -1 && remaining <= 0) {
    return NextResponse.json(
      { error: 'quota_exceeded', message: 'Monthly quota exhausted. Resets on the 1st of next month.', remaining: 0 },
      { status: 429 },
    )
  }

  // Clamp requested count to remaining quota (unless unlimited)
  const effectiveMax = limit === -1
    ? maxComments
    : Math.min(maxComments, remaining)

  // 5. Require real API keys
  const configuredKeys = getApiKeys()
  if (configuredKeys.length === 0) {
    return err('server_error', 'YouTube API is not configured on this server.', 503)
  }

  // 6. Fetch video metadata (title + channel name)
  const allFailedKeys = new Set<number>()
  let lastSuccessKey: number | undefined
  let videoTitle = ''
  let channelName = ''

  try {
    const { data: metaData, keyIndex, attemptsLog } = await fetchWithKeyRotation(
      (key) => `https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({ part: 'snippet', id: videoId, key })}`
    )
    collectFailedKeys(attemptsLog).forEach(k => allFailedKeys.add(k))
    lastSuccessKey = keyIndex
    const snippet = (metaData as { items?: { snippet?: { title?: string; channelTitle?: string } }[] })?.items?.[0]?.snippet
    videoTitle   = snippet?.title ?? ''
    channelName  = snippet?.channelTitle ?? ''
  } catch {
    // Non-fatal — metadata is best-effort
  }

  // 7. Fetch comment threads
  const comments: Comment[] = []
  let pageToken = ''
  const order = sortBy === 'top' ? 'relevance' : 'time'

  while (comments.length < effectiveMax) {
    let threadData: { items?: unknown[]; nextPageToken?: string; error?: { message: string } }
    try {
      const { data, keyIndex, attemptsLog } = await fetchWithKeyRotation(
        (key) => `https://www.googleapis.com/youtube/v3/commentThreads?${new URLSearchParams({
          part: 'snippet',
          videoId,
          maxResults: '100',
          order,
          key,
          ...(pageToken ? { pageToken } : {}),
        })}`
      )
      collectFailedKeys(attemptsLog).forEach(k => allFailedKeys.add(k))
      lastSuccessKey = keyIndex
      threadData = data as typeof threadData
    } catch {
      const failedKeys = Array.from(allFailedKeys)
      await sendApiAlert({
        event: 'api_pool_exhausted',
        message: `All ${configuredKeys.length} YouTube API keys exhausted fetching comment threads`,
        failedKeys,
        endpoint: '/api/v1/comments',
        timestamp: new Date().toISOString(),
      })
      return err('server_error', 'YouTube API quota exhausted. Please try again later.', 503)
    }

    if (threadData.error) {
      return err('not_found', threadData.error.message, 400)
    }

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
                dateRaw: rr.snippet.publishedAt,
              }
            })
          }
        } catch {
          // Non-fatal — replies are best-effort
        }
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
      })
      if (comments.length >= effectiveMax) break
    }

    if (!threadData.nextPageToken) break
    pageToken = threadData.nextPageToken
  }

  // 8. Alert if many keys failed
  if (allFailedKeys.size >= 3) {
    sendApiAlert({
      event: 'quota_warning',
      message: `${allFailedKeys.size} YouTube API keys failed in a single v1 request`,
      failedKeys: Array.from(allFailedKeys),
      successKey: lastSuccessKey,
      endpoint: '/api/v1/comments',
      timestamp: new Date().toISOString(),
    }).catch(() => {})
  }

  // 9. Deduct quota
  const { used: usedAfter, remaining: remainingAfter } = await checkAndIncrementUsageService(
    userId,
    plan,
    comments.length,
  ).catch(() => ({
    used: usedBefore + comments.length,
    limit,
    remaining: limit === -1 ? -1 : Math.max(0, remaining - comments.length),
    allowed: true,
  }))

  return NextResponse.json({
    video: {
      id: videoId,
      title: videoTitle,
      channelName,
    },
    comments,
    totalFetched: comments.length,
    quota: {
      used: usedAfter,
      remaining: remainingAfter,
      limit,
    },
  })
}
