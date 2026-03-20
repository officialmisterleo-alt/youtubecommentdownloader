import { NextRequest, NextResponse } from 'next/server'

const MOCK_COMMENTS = [
  { id: '1', author: '@techreviewer99', text: 'This is exactly what I needed! The tutorial was super clear and easy to follow.', likes: 342, date: '2 days ago', replies: 12 },
  { id: '2', author: '@marketingpro_sarah', text: 'Great content as always. Would love to see a follow-up on advanced techniques.', likes: 187, date: '3 days ago', replies: 5 },
  { id: '3', author: '@dataanalyst_mike', text: "I've been using this method for 6 months and it works perfectly for our agency workflow.", likes: 156, date: '4 days ago', replies: 8 },
  { id: '4', author: '@creativedirector', text: 'The production quality keeps improving. Keep up the amazing work!', likes: 134, date: '5 days ago', replies: 3 },
  { id: '5', author: '@researcher_2024', text: 'Perfect for academic research. I downloaded 50k comments in under 10 minutes.', likes: 98, date: '1 week ago', replies: 2 },
  { id: '6', author: '@smmexpert', text: 'Game changer for social media monitoring. Our clients love the reports.', likes: 87, date: '1 week ago', replies: 6 },
  { id: '7', author: '@brandstrategist', text: 'Used this for competitive analysis — found insights we never would have caught manually.', likes: 76, date: '1 week ago', replies: 1 },
  { id: '8', author: '@contentcreator_v', text: 'Finally a tool that handles reply threads properly. Other tools miss so much data.', likes: 65, date: '2 weeks ago', replies: 4 },
  { id: '9', author: '@agencyfounder', text: "We've replaced 3 separate tools with this. The API integration is seamless.", likes: 54, date: '2 weeks ago', replies: 7 },
  { id: '10', author: '@digitalmarketer', text: 'The bulk channel download is incredible. Downloaded an entire competitor channel overnight.', likes: 43, date: '2 weeks ago', replies: 2 },
]

export async function POST(req: NextRequest) {
  try {
    const { url, maxComments = 100, includeReplies = false, sortBy = 'top' } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey || apiKey === 'PLACEHOLDER_YOUTUBE_KEY') {
      await new Promise(r => setTimeout(r, 1500))
      return NextResponse.json({ comments: MOCK_COMMENTS, total: MOCK_COMMENTS.length, mock: true })
    }

    const videoIdMatch = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    if (!videoIdMatch) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    const videoId = videoIdMatch[1]

    const comments: typeof MOCK_COMMENTS = []
    let pageToken = ''
    const order = sortBy === 'newest' ? 'time' : 'relevance'

    while (comments.length < maxComments) {
      const params = new URLSearchParams({ part: 'snippet', videoId, maxResults: '100', order, key: apiKey, ...(pageToken ? { pageToken } : {}) })
      const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params}`)
      const data = await res.json()
      if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 })
      for (const item of data.items || []) {
        const s = item.snippet.topLevelComment.snippet
        comments.push({ id: item.id, author: s.authorDisplayName, text: s.textDisplay, likes: s.likeCount, date: new Date(s.publishedAt).toLocaleDateString(), replies: item.snippet.totalReplyCount })
        if (comments.length >= maxComments) break
      }
      if (!data.nextPageToken) break
      pageToken = data.nextPageToken
    }

    // suppress unused var warning
    void includeReplies

    return NextResponse.json({ comments, total: comments.length, mock: false })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}
