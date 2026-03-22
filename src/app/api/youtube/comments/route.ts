import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { getEffectivePlan } from '@/lib/teams'

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

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

async function incrementUsage(userId: string, commentsCount: number) {
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

export async function POST(req: NextRequest) {
  try {
    const { url, maxComments = 100, includeReplies = false, sortBy = 'top' } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Determine user and plan
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let planMaxComments: number
    if (!user) {
      planMaxComments = 50 // unauthenticated limit
    } else {
      // Use effective plan — checks personal subscription and team membership
      const plan = await getEffectivePlan(user.id)
      planMaxComments = PLAN_LIMITS[plan]?.maxComments ?? PLAN_LIMITS.free.maxComments
    }

    // Enforce plan limit — client-requested value cannot exceed plan max
    const effectiveMax = Math.min(maxComments, planMaxComments)

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey || apiKey === 'PLACEHOLDER_YOUTUBE_KEY') {
      await new Promise(r => setTimeout(r, 1500))
      const mockWithMeta = (includeReplies ? MOCK_COMMENTS : MOCK_COMMENTS.map(c => ({ ...c, replyList: [] }))).map(c => ({
        ...c,
        videoTitle: 'Sample YouTube Video — Tutorial & Deep Dive',
        channelName: 'CreatorChannel',
        videoUrl: url,
      }))
      const mockResult = mockWithMeta.slice(0, effectiveMax)
      if (user) await incrementUsage(user.id, mockResult.length).catch(() => {})
      return NextResponse.json({ comments: mockResult, total: mockResult.length, mock: true })
    }

    const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    if (!videoIdMatch) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    const videoId = videoIdMatch[1]

    // Fetch video title and channel name
    let videoTitle = ''
    let channelName = ''
    try {
      const metaParams = new URLSearchParams({ part: 'snippet', id: videoId, key: apiKey })
      const metaRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${metaParams}`)
      const metaData = await metaRes.json()
      const snippet = metaData.items?.[0]?.snippet
      videoTitle = snippet?.title ?? ''
      channelName = snippet?.channelTitle ?? ''
    } catch { /* non-fatal */ }

    const comments: Comment[] = []
    let pageToken = ''
    const order = sortBy === 'newest' ? 'time' : 'relevance'

    while (comments.length < effectiveMax) {
      const params = new URLSearchParams({ part: 'snippet', videoId, maxResults: '100', order, key: apiKey, ...(pageToken ? { pageToken } : {}) })
      const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params}`)
      const data = await res.json()
      if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 })

      for (const item of data.items || []) {
        const s = item.snippet.topLevelComment.snippet
        const replyCount: number = item.snippet.totalReplyCount ?? 0
        let replyList: Reply[] = []

        if (includeReplies && replyCount > 0) {
          const rParams = new URLSearchParams({ part: 'snippet', parentId: item.id, maxResults: '100', key: apiKey })
          const rRes = await fetch(`https://www.googleapis.com/youtube/v3/comments?${rParams}`)
          const rData = await rRes.json()
          if (!rData.error) {
            replyList = (rData.items || []).map((r: { id: string; snippet: { authorDisplayName: string; textDisplay: string; likeCount: number; publishedAt: string } }) => ({
              id: r.id,
              author: r.snippet.authorDisplayName,
              text: decodeHtml(r.snippet.textDisplay),
              likes: r.snippet.likeCount,
              date: new Date(r.snippet.publishedAt).toLocaleDateString(),
            }))
          }
        }

        comments.push({
          id: item.id,
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
      if (!data.nextPageToken) break
      pageToken = data.nextPageToken
    }

    if (user) await incrementUsage(user.id, comments.length).catch(() => {})

    return NextResponse.json({ comments, total: comments.length, mock: false })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
