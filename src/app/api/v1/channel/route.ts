import { NextRequest, NextResponse } from 'next/server'
import { authenticateV1Request, isAuthSuccess } from '@/lib/v1-auth'
import { getMonthlyUsageService } from '@/lib/quota-service'
import { parseYouTubeUrl } from '@/lib/youtube/url-parser'
import { fetchWithKeyRotation } from '@/lib/youtube-api'

// ── Types ─────────────────────────────────────────────────────────────────────

type ChannelInfo = {
  id: string
  title: string
  uploadsPlaylistId: string
}

type VideoEntry = {
  videoId: string
  title: string
  publishedAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: code, message }, { status })
}

/**
 * Resolves a parsed channel identifier to { channelId, uploadsPlaylistId, title }.
 * Mirrors the logic in /api/youtube/channel/route.ts but also returns the channelId
 * and uses fetchWithKeyRotation for key rotation support.
 */
async function resolveChannel(
  id: string,
  idType: 'channel_id' | 'handle' | 'user' | 'custom' | 'legacy',
): Promise<ChannelInfo | null> {
  const base = 'https://www.googleapis.com/youtube/v3/channels'

  async function attempt(params: Record<string, string>): Promise<ChannelInfo | null> {
    try {
      const { data } = await fetchWithKeyRotation(
        (key) => `${base}?${new URLSearchParams({ part: 'contentDetails,snippet', key, ...params })}`
      )
      const typed = data as { items?: { id?: string; contentDetails?: { relatedPlaylists?: { uploads?: string } }; snippet?: { title?: string } }[] }
      const item = typed.items?.[0]
      if (!item?.id) return null
      return {
        id: item.id,
        title: item.snippet?.title ?? '',
        uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? '',
      }
    } catch {
      return null
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
 * Paginates through an uploads playlist and returns video entries.
 * maxVideos = 0 means unlimited (capped at 500 for v1).
 */
async function fetchPlaylistVideos(
  playlistId: string,
  maxVideos: number,
): Promise<VideoEntry[]> {
  const videos: VideoEntry[] = []
  let pageToken = ''

  while (true) {
    let data: { items?: unknown[]; nextPageToken?: string; error?: unknown }
    try {
      const result = await fetchWithKeyRotation(
        (key) => `https://www.googleapis.com/youtube/v3/playlistItems?${new URLSearchParams({
          part: 'snippet',
          playlistId,
          maxResults: '50',
          key,
          ...(pageToken ? { pageToken } : {}),
        })}`
      )
      data = result.data as typeof data
    } catch {
      break
    }

    if (data.error) break

    for (const item of data.items ?? []) {
      const typedItem = item as {
        snippet?: {
          resourceId?: { videoId?: string }
          title?: string
          publishedAt?: string
        }
      }
      const videoId = typedItem.snippet?.resourceId?.videoId
      if (!videoId) continue
      videos.push({
        videoId,
        title: typedItem.snippet?.title ?? '',
        publishedAt: typedItem.snippet?.publishedAt ?? '',
      })
      if (maxVideos > 0 && videos.length >= maxVideos) break
    }

    if ((maxVideos > 0 && videos.length >= maxVideos) || !data.nextPageToken) break
    pageToken = data.nextPageToken
  }

  return videos
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // 1. Auth
  const auth = await authenticateV1Request(req)
  if (!isAuthSuccess(auth)) return auth

  const { userId, plan } = auth

  // 2. Parse query params
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const maxVideosRaw = parseInt(searchParams.get('maxVideos') ?? '50', 10)

  if (!url) {
    return err('invalid_params', '`url` query parameter is required.', 400)
  }
  if (isNaN(maxVideosRaw) || maxVideosRaw < 1) {
    return err('invalid_params', '`maxVideos` must be a positive integer.', 400)
  }
  const maxVideos = Math.min(maxVideosRaw, 500)

  // 3. Parse + validate channel URL
  const parsed = parseYouTubeUrl(url)
  if (parsed.type !== 'channel') {
    return err('invalid_params', 'The provided URL is not a valid YouTube channel URL.', 400)
  }

  // 4. Quota check (informational — channel listing doesn't itself consume quota)
  const { remaining, used, limit } = await getMonthlyUsageService(userId, plan)
  if (limit !== -1 && remaining <= 0) {
    return NextResponse.json(
      { error: 'quota_exceeded', message: 'Monthly quota exhausted. Resets on the 1st of next month.', remaining: 0 },
      { status: 429 },
    )
  }

  // 5. Require API keys
  const { getApiKeys } = await import('@/lib/youtube-api')
  if (getApiKeys().length === 0) {
    return err('server_error', 'YouTube API is not configured on this server.', 503)
  }

  // 6. Resolve channel
  const channel = await resolveChannel(parsed.id, parsed.idType)
  if (!channel || !channel.uploadsPlaylistId) {
    return err('not_found', 'Channel not found. Check the URL and try again.', 404)
  }

  // 7. Fetch videos
  const videos = await fetchPlaylistVideos(channel.uploadsPlaylistId, maxVideos)

  return NextResponse.json({
    channel: {
      id: channel.id,
      title: channel.title,
      uploadsPlaylistId: channel.uploadsPlaylistId,
    },
    videos,
    totalVideos: videos.length,
    quota: {
      used,
      remaining,
      limit,
    },
  })
}
