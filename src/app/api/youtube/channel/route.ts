import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseYouTubeUrl } from '@/lib/youtube/url-parser'
import { getEffectivePlan } from '@/lib/teams'
import { getMonthlyUsage, MONTHLY_LIMITS } from '@/lib/quota'

export type ChannelVideo = {
  videoId: string
  videoUrl: string
  title: string
  channelTitle: string
}

const MOCK_CHANNEL_VIDEOS: ChannelVideo[] = [
  { videoId: 'dQw4w9WgXcW', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcW', title: 'Sample Video 1 — Tutorial', channelTitle: 'SampleChannel' },
  { videoId: 'abc123defgh', videoUrl: 'https://www.youtube.com/watch?v=abc123defgh', title: 'Sample Video 2 — Deep Dive', channelTitle: 'SampleChannel' },
  { videoId: 'xyz789uvwqr', videoUrl: 'https://www.youtube.com/watch?v=xyz789uvwqr', title: 'Sample Video 3 — Tips & Tricks', channelTitle: 'SampleChannel' },
]

/**
 * Resolve a parsed channel to { channelId, uploadsPlaylistId, title }.
 * Tries the most specific API param first; for /c/ and legacy bare names
 * it falls back from forHandle → forUsername.
 */
async function resolveChannel(
  id: string,
  idType: 'channel_id' | 'handle' | 'user' | 'custom' | 'legacy',
  apiKey: string,
): Promise<{ uploadsPlaylistId: string; title: string } | null> {
  const base = 'https://www.googleapis.com/youtube/v3/channels'

  async function attempt(params: Record<string, string>) {
    const qs = new URLSearchParams({ part: 'contentDetails,snippet', key: apiKey, ...params })
    const res = await fetch(`${base}?${qs}`)
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return null
    return {
      uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads as string,
      title: item.snippet?.title as string,
    }
  }

  switch (idType) {
    case 'channel_id': return attempt({ id })
    case 'handle':     return attempt({ forHandle: id })
    case 'user':       return attempt({ forUsername: id })
    case 'custom':
    case 'legacy': {
      const byHandle = await attempt({ forHandle: id })
      if (byHandle) return byHandle
      return attempt({ forUsername: id })
    }
  }
}

/**
 * Paginate through a playlist (uploads playlist) to collect video items.
 * maxVideos = 0 means unlimited.
 */
async function fetchPlaylistVideos(
  playlistId: string,
  apiKey: string,
  channelTitle: string,
  maxVideos = 0,
): Promise<ChannelVideo[]> {
  const videos: ChannelVideo[] = []
  let pageToken = ''

  while (true) {
    const qs = new URLSearchParams({
      part: 'snippet',
      playlistId,
      maxResults: '50',
      key: apiKey,
      ...(pageToken ? { pageToken } : {}),
    })
    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${qs}`)
    const data = await res.json()
    if (data.error) break

    for (const item of data.items ?? []) {
      const videoId: string = item.snippet?.resourceId?.videoId
      if (!videoId) continue
      videos.push({
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: item.snippet?.title ?? '',
        channelTitle,
      })
      if (maxVideos > 0 && videos.length >= maxVideos) break
    }

    if ((maxVideos > 0 && videos.length >= maxVideos) || !data.nextPageToken) break
    pageToken = data.nextPageToken
  }

  return videos
}

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
        { error: 'Bulk channel downloads require a Business or Enterprise plan.' },
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
    if (parsed.type !== 'channel') {
      return NextResponse.json({ error: 'Not a valid YouTube channel URL' }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey || apiKey === 'PLACEHOLDER_YOUTUBE_KEY') {
      return NextResponse.json({
        videos: MOCK_CHANNEL_VIDEOS,
        channelTitle: 'SampleChannel',
        total: MOCK_CHANNEL_VIDEOS.length,
        mock: true,
      })
    }

    // Resolve channel → uploads playlist ID
    const resolved = await resolveChannel(parsed.id, parsed.idType, apiKey)
    if (!resolved) {
      return NextResponse.json({ error: 'Channel not found. Check the URL and try again.' }, { status: 404 })
    }

    const videos = await fetchPlaylistVideos(resolved.uploadsPlaylistId, apiKey, resolved.title, maxVideos)

    return NextResponse.json({
      videos,
      channelTitle: resolved.title,
      total: videos.length,
      mock: false,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch channel videos' }, { status: 500 })
  }
}
