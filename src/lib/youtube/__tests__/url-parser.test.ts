import { parseYouTubeUrl, isBulkUrl, isVideoUrl } from '../url-parser'

const VIDEO_ID   = 'dQw4w9WgXcW' // exactly 11 chars
const CHANNEL_ID = 'UCxxxxxxxxxxxxxxxxxxxxxx'
const PLAYLIST_ID = 'PLrEnWoR732-BHrPp_Pm8_VleD68f9s14n'

// ─── Video URLs ──────────────────────────────────────────────────────────────

describe('video URLs', () => {
  const cases: [string, string][] = [
    [`https://www.youtube.com/watch?v=${VIDEO_ID}`, VIDEO_ID],
    [`https://youtube.com/watch?v=${VIDEO_ID}`, VIDEO_ID],
    [`http://youtube.com/watch?v=${VIDEO_ID}`, VIDEO_ID],
    [`https://m.youtube.com/watch?v=${VIDEO_ID}`, VIDEO_ID],
    [`https://youtu.be/${VIDEO_ID}`, VIDEO_ID],
    [`https://youtu.be/${VIDEO_ID}?si=tracker123`, VIDEO_ID],
    [`https://youtube.com/embed/${VIDEO_ID}`, VIDEO_ID],
    [`https://youtube.com/v/${VIDEO_ID}`, VIDEO_ID],
    [`https://youtube.com/watch?v=${VIDEO_ID}&feature=share`, VIDEO_ID],
    // Without protocol
    [`youtube.com/watch?v=${VIDEO_ID}`, VIDEO_ID],
    [`youtu.be/${VIDEO_ID}`, VIDEO_ID],
  ]

  test.each(cases)('parses %s → video %s', (url, expectedId) => {
    const result = parseYouTubeUrl(url)
    expect(result.type).toBe('video')
    if (result.type === 'video') expect(result.id).toBe(expectedId)
  })
})

// ─── Shorts URLs ─────────────────────────────────────────────────────────────

describe('shorts URLs', () => {
  test('standard shorts URL', () => {
    const result = parseYouTubeUrl(`https://youtube.com/shorts/${VIDEO_ID}`)
    expect(result.type).toBe('short')
    if (result.type === 'short') expect(result.id).toBe(VIDEO_ID)
  })

  test('shorts with trailing slash', () => {
    const result = parseYouTubeUrl(`https://www.youtube.com/shorts/${VIDEO_ID}/`)
    expect(result.type).toBe('short')
  })

  test('shorts with query param', () => {
    const result = parseYouTubeUrl(`https://youtube.com/shorts/${VIDEO_ID}?feature=share`)
    expect(result.type).toBe('short')
    if (result.type === 'short') expect(result.id).toBe(VIDEO_ID)
  })
})

// ─── Channel URLs ─────────────────────────────────────────────────────────────

describe('channel URLs — /channel/ID', () => {
  const cases: [string][] = [
    [`https://youtube.com/channel/${CHANNEL_ID}`],
    [`https://www.youtube.com/channel/${CHANNEL_ID}`],
    [`https://m.youtube.com/channel/${CHANNEL_ID}`],
    [`https://youtube.com/channel/${CHANNEL_ID}/`],
    [`https://youtube.com/channel/${CHANNEL_ID}/videos`],
  ]

  test.each(cases)('parses %s → channel_id', (url) => {
    const result = parseYouTubeUrl(url)
    expect(result.type).toBe('channel')
    if (result.type === 'channel') {
      expect(result.id).toBe(CHANNEL_ID)
      expect(result.idType).toBe('channel_id')
    }
  })
})

describe('channel URLs — @handle', () => {
  const cases: [string, string][] = [
    [`https://youtube.com/@MrBeast`, 'MrBeast'],
    [`https://www.youtube.com/@MrBeast`, 'MrBeast'],
    [`https://youtube.com/@MrBeast/`, 'MrBeast'],
    [`https://youtube.com/@some_channel-123`, 'some_channel-123'],
    [`youtube.com/@MrBeast`, 'MrBeast'],
  ]

  test.each(cases)('parses %s → handle %s', (url, expectedId) => {
    const result = parseYouTubeUrl(url)
    expect(result.type).toBe('channel')
    if (result.type === 'channel') {
      expect(result.id).toBe(expectedId)
      expect(result.idType).toBe('handle')
    }
  })
})

describe('channel URLs — /c/ custom', () => {
  const cases: [string, string][] = [
    [`https://youtube.com/c/GoogleDevelopers`, 'GoogleDevelopers'],
    [`https://www.youtube.com/c/GoogleDevelopers`, 'GoogleDevelopers'],
    [`https://youtube.com/c/GoogleDevelopers/`, 'GoogleDevelopers'],
  ]

  test.each(cases)('parses %s → custom %s', (url, expectedId) => {
    const result = parseYouTubeUrl(url)
    expect(result.type).toBe('channel')
    if (result.type === 'channel') {
      expect(result.id).toBe(expectedId)
      expect(result.idType).toBe('custom')
    }
  })
})

describe('channel URLs — /user/', () => {
  const cases: [string, string][] = [
    [`https://youtube.com/user/Google`, 'Google'],
    [`https://www.youtube.com/user/Google`, 'Google'],
    [`https://youtube.com/user/Google/`, 'Google'],
  ]

  test.each(cases)('parses %s → user %s', (url, expectedId) => {
    const result = parseYouTubeUrl(url)
    expect(result.type).toBe('channel')
    if (result.type === 'channel') {
      expect(result.id).toBe(expectedId)
      expect(result.idType).toBe('user')
    }
  })
})

describe('channel URLs — legacy bare /CustomName', () => {
  test('bare channel name longer than 11 chars', () => {
    const result = parseYouTubeUrl('https://youtube.com/GoogleDevelopers')
    expect(result.type).toBe('channel')
    if (result.type === 'channel') {
      expect(result.id).toBe('GoogleDevelopers')
      expect(result.idType).toBe('legacy')
    }
  })

  test('does NOT mis-identify an 11-char video-ID-length path as a channel', () => {
    // An 11-char alphanumeric slug would look like a video ID — return unknown
    const result = parseYouTubeUrl(`https://youtube.com/${VIDEO_ID}`)
    expect(result.type).toBe('unknown')
  })
})

// ─── Playlist URLs ───────────────────────────────────────────────────────────

describe('playlist URLs', () => {
  test('standard playlist URL', () => {
    const result = parseYouTubeUrl(`https://youtube.com/playlist?list=${PLAYLIST_ID}`)
    expect(result.type).toBe('playlist')
    if (result.type === 'playlist') expect(result.id).toBe(PLAYLIST_ID)
  })

  test('watch URL with list= treats as playlist', () => {
    const result = parseYouTubeUrl(`https://youtube.com/watch?v=${VIDEO_ID}&list=${PLAYLIST_ID}`)
    expect(result.type).toBe('playlist')
    if (result.type === 'playlist') {
      expect(result.id).toBe(PLAYLIST_ID)
      expect(result.videoId).toBe(VIDEO_ID)
    }
  })

  test('youtu.be with list= treats as playlist', () => {
    const result = parseYouTubeUrl(`https://youtu.be/${VIDEO_ID}?list=${PLAYLIST_ID}`)
    expect(result.type).toBe('playlist')
    if (result.type === 'playlist') {
      expect(result.id).toBe(PLAYLIST_ID)
    }
  })

  test('playlist without protocol', () => {
    const result = parseYouTubeUrl(`youtube.com/playlist?list=${PLAYLIST_ID}`)
    expect(result.type).toBe('playlist')
  })

  test('www playlist URL', () => {
    const result = parseYouTubeUrl(`https://www.youtube.com/playlist?list=${PLAYLIST_ID}`)
    expect(result.type).toBe('playlist')
    if (result.type === 'playlist') expect(result.id).toBe(PLAYLIST_ID)
  })
})

// ─── Unknown / invalid ───────────────────────────────────────────────────────

describe('unknown / invalid URLs', () => {
  const cases = [
    '',
    'not a url',
    'https://vimeo.com/watch?v=12345',
    'https://example.com',
    'https://youtube.com',          // no path → unknown
    'https://youtube.com/watch',    // no v= param
  ]

  test.each(cases)('returns unknown for: %s', (url) => {
    expect(parseYouTubeUrl(url).type).toBe('unknown')
  })
})

// ─── Helper functions ────────────────────────────────────────────────────────

describe('isVideoUrl', () => {
  test('true for video', () => {
    expect(isVideoUrl(parseYouTubeUrl(`https://youtube.com/watch?v=${VIDEO_ID}`))).toBe(true)
  })
  test('true for short', () => {
    expect(isVideoUrl(parseYouTubeUrl(`https://youtube.com/shorts/${VIDEO_ID}`))).toBe(true)
  })
  test('false for channel', () => {
    expect(isVideoUrl(parseYouTubeUrl(`https://youtube.com/@MrBeast`))).toBe(false)
  })
  test('false for playlist', () => {
    expect(isVideoUrl(parseYouTubeUrl(`https://youtube.com/playlist?list=${PLAYLIST_ID}`))).toBe(false)
  })
})

describe('isBulkUrl', () => {
  test('true for channel', () => {
    expect(isBulkUrl(parseYouTubeUrl(`https://youtube.com/@MrBeast`))).toBe(true)
  })
  test('true for playlist', () => {
    expect(isBulkUrl(parseYouTubeUrl(`https://youtube.com/playlist?list=${PLAYLIST_ID}`))).toBe(true)
  })
  test('false for video', () => {
    expect(isBulkUrl(parseYouTubeUrl(`https://youtube.com/watch?v=${VIDEO_ID}`))).toBe(false)
  })
  test('false for unknown', () => {
    expect(isBulkUrl(parseYouTubeUrl('not a url'))).toBe(false)
  })
})
