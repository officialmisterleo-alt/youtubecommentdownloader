/**
 * YouTube URL parser — handles every valid YouTube URL format.
 *
 * Returns a discriminated union so callers can branch cleanly on type.
 *
 * Channel idType determines how the YouTube Data API must resolve the ID:
 *   - 'channel_id' : raw UC… ID → channels.list?id=
 *   - 'handle'     : @handle    → channels.list?forHandle=
 *   - 'user'       : /user/…    → channels.list?forUsername=
 *   - 'custom'     : /c/…       → try forHandle then forUsername
 *   - 'legacy'     : /Name      → try forHandle then forUsername
 */

export type ParsedYouTubeUrl =
  | { type: 'video';   id: string }
  | { type: 'short';   id: string }
  | { type: 'channel'; id: string; idType: 'channel_id' | 'handle' | 'user' | 'custom' | 'legacy' }
  | { type: 'playlist'; id: string; videoId?: string }
  | { type: 'unknown' }

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl {
  if (!input || typeof input !== 'string') return { type: 'unknown' }

  let normalized = input.trim()
  // Accept bare domains / handles without protocol
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }

  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    return { type: 'unknown' }
  }

  // Strip www. / m. prefix and lower-case
  const hostname = url.hostname.replace(/^(www\.|m\.)/, '').toLowerCase()
  if (hostname !== 'youtube.com' && hostname !== 'youtu.be') {
    return { type: 'unknown' }
  }

  // Strip trailing slashes; split into path segments
  const pathname = url.pathname.replace(/\/+$/, '') || '/'
  const segments = pathname.split('/').filter(Boolean)

  const listParam = url.searchParams.get('list')
  const vParam    = url.searchParams.get('v')

  // ── Playlist ───────────────────────────────────────────────────────────────
  // Any URL that carries ?list= is treated as a playlist download, including
  // watch?v=X&list=Y and youtu.be/X?list=Y
  if (listParam) {
    return { type: 'playlist', id: listParam, ...(vParam ? { videoId: vParam } : {}) }
  }

  // ── youtu.be short links ───────────────────────────────────────────────────
  if (hostname === 'youtu.be') {
    const vid = segments[0]
    if (vid && /^[a-zA-Z0-9_-]{11}$/.test(vid)) {
      return { type: 'video', id: vid }
    }
    return { type: 'unknown' }
  }

  // ── youtube.com ────────────────────────────────────────────────────────────
  if (!segments.length) return { type: 'unknown' }

  const first  = segments[0]
  const second = segments[1]

  // /watch?v=VIDEO_ID
  if (first === 'watch' && vParam) {
    return { type: 'video', id: vParam }
  }

  // /shorts/VIDEO_ID
  if (first === 'shorts' && second) {
    return { type: 'short', id: second }
  }

  // /embed/VIDEO_ID
  if (first === 'embed' && second) {
    return { type: 'video', id: second }
  }

  // /v/VIDEO_ID
  if (first === 'v' && second) {
    return { type: 'video', id: second }
  }

  // /channel/CHANNEL_ID  (always starts with "UC")
  if (first === 'channel' && second) {
    return { type: 'channel', id: second, idType: 'channel_id' }
  }

  // /@handle
  if (first.startsWith('@')) {
    const handle = first.slice(1)
    if (handle) return { type: 'channel', id: handle, idType: 'handle' }
  }

  // /c/CustomName  (legacy custom URL)
  if (first === 'c' && second) {
    return { type: 'channel', id: second, idType: 'custom' }
  }

  // /user/Username  (legacy username)
  if (first === 'user' && second) {
    return { type: 'channel', id: second, idType: 'user' }
  }

  // /CustomName  (bare legacy channel — one segment, no prefix)
  // Guard: skip reserved YouTube paths and anything that looks like a video ID (11 chars).
  const RESERVED_PATHS = new Set([
    'watch', 'shorts', 'embed', 'v', 'channel', 'c', 'user', 'playlist',
    'feed', 'results', 'live', 'gaming', 'about', 'premium', 'trending',
  ])
  if (
    segments.length === 1 &&
    first.length > 2 &&
    !RESERVED_PATHS.has(first.toLowerCase()) &&
    /^[a-zA-Z0-9_-]+$/.test(first) &&
    !/^[a-zA-Z0-9_-]{11}$/.test(first) // not a video ID length
  ) {
    return { type: 'channel', id: first, idType: 'legacy' }
  }

  return { type: 'unknown' }
}

/** Convenience helpers */
export function isVideoUrl(parsed: ParsedYouTubeUrl): parsed is { type: 'video' | 'short'; id: string } {
  return parsed.type === 'video' || parsed.type === 'short'
}

export function isBulkUrl(
  parsed: ParsedYouTubeUrl,
): parsed is
  | { type: 'channel'; id: string; idType: 'channel_id' | 'handle' | 'user' | 'custom' | 'legacy' }
  | { type: 'playlist'; id: string; videoId?: string } {
  return parsed.type === 'channel' || parsed.type === 'playlist'
}
