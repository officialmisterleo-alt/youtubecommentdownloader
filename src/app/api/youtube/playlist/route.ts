import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseYouTubeUrl } from '@/lib/youtube/url-parser'
import { getEffectivePlan } from '@/lib/teams'
import { getMonthlyUsage, MONTHLY_LIMITS } from '@/lib/quota'
import { fetchWithKeyRotation, getApiKeys } from '@/lib/youtube-api'

export type PlaylistVideo = {
  videoId: string
  videoUrl: string
  title: string
  channelTitle: string
  position: number
}

const MOCK_PLAYLIST_VIDEOS: PlaylistVideo[] = [
  { videoId: 'dQw4w9WgXcW', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcW', title: 'Sample Playlist Video 1', channelTitle: 'SampleChannel', position: 0 },
  { videoId: 'abc123defgh', videoUrl: 'https://www.youtube.com/watch?v=abc123defgh', title: 'Sample Playlist Video 2', channelTitle: 'SampleChannel', position: 1 },
  { videoId: 'xyz789uvwqr', videoUrl: 'https://www.youtube.com/watch?v=xyz789uvwqr', title: 'Sample Playlist Video 3', channelTitle: 'SampleChannel', position: 2 },
]

export async function POST(req: NextRequest) {
  try {
    const { url, maxVideos = 0 } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Auth check — must be signed in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    // Plan check — must be Business or Enterprise
    const plan = await getEffectivePlan(user.id)
    if (plan !== 'business' && plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'Bulk playlist downloads require a Business or Enterprise plan.' },
        { status: 403 },
      )
    }

    // Monthly quota check — fail fast before pagination
    const { remaining } = await getMonthlyUsage(user.id, plan)
    const monthlyMax = MONTHLY_LIMITS[plan] ?? 100
    if (monthlyMax !== -1 && remaining <= 0) {
      return NextResponse.json(
        { error: 'Monthly quota exceeded. Resets on the 1st of next month.' },
        { status: 429 },
      )
    }

    // Parse URL
    const parsed = parseYouTubeUrl(url)
    if (parsed.type !== 'playlist') {
      return NextResponse.json({ error: 'Not a valid YouTube playlist URL' }, { status: 400 })
    }
    const playlistId = parsed.id

    if (getApiKeys().length === 0) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Playlist exports are temporarily unavailable. Please try again later.' },
          { status: 503 },
        )
      }
      return NextResponse.json({
        videos: MOCK_PLAYLIST_VIDEOS,
        playlistTitle: 'Sample Playlist',
        total: MOCK_PLAYLIST_VIDEOS.length,
        mock: true,
      })
    }

    // Fetch playlist metadata
    let playlistTitle = ''
    try {
      const { data: metaData } = await fetchWithKeyRotation(
        (key) => `https://www.googleapis.com/youtube/v3/playlists?${new URLSearchParams({ part: 'snippet', id: playlistId, key })}`
      )
      playlistTitle = (metaData as { items?: { snippet?: { title?: string } }[] }).items?.[0]?.snippet?.title ?? ''
    } catch { /* non-fatal */ }

    // Paginate through playlist items (in order)
    const videos: PlaylistVideo[] = []
    let pageToken = ''

    while (true) {
      const result = await fetchWithKeyRotation(
        (key) => `https://www.googleapis.com/youtube/v3/playlistItems?${new URLSearchParams({
          part: 'snippet',
          playlistId,
          maxResults: '50',
          key,
          ...(pageToken ? { pageToken } : {}),
        })}`
      )
      const data = result.data as {
        items?: { snippet?: { resourceId?: { videoId?: string }; title?: string; videoOwnerChannelTitle?: string; position?: number } }[]
        nextPageToken?: string
        error?: { message?: string }
      }
      if (data.error) {
        return NextResponse.json({ error: data.error.message ?? 'Failed to fetch playlist' }, { status: 400 })
      }

      for (const item of data.items ?? []) {
        const videoId = item.snippet?.resourceId?.videoId
        if (!videoId) continue
        videos.push({
          videoId,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          title: item.snippet?.title ?? '',
          channelTitle: item.snippet?.videoOwnerChannelTitle ?? '',
          position: item.snippet?.position ?? videos.length,
        })
        if (maxVideos > 0 && videos.length >= maxVideos) break
      }

      if ((maxVideos > 0 && videos.length >= maxVideos) || !data.nextPageToken) break
      pageToken = data.nextPageToken
    }

    return NextResponse.json({
      videos,
      playlistTitle,
      total: videos.length,
      mock: false,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch playlist videos' }, { status: 500 })
  }
}
