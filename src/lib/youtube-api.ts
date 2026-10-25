export interface AttemptLog {
  keyIndex: number
  error?: string
}

interface KeyEntry {
  key: string
  index: number
}

export function getApiKeys(): KeyEntry[] {
  const keys: KeyEntry[] = []
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`YOUTUBE_API_KEY_${i}`]
    if (key && key.trim() !== '' && !key.startsWith('PLACEHOLDER')) {
      keys.push({ key, index: i })
    }
  }
  return keys
}

// Errors that mean "this key can't be used right now". Anything else on a 403
// (e.g. commentsDisabled, forbidden on a private video) is about the request
// itself, so it's returned to the caller instead of burning through every key.
const KEY_ERROR_REASONS = new Set([
  'quotaExceeded',
  'dailyLimitExceeded',
  'rateLimitExceeded',
  'userRateLimitExceeded',
  'accessNotConfigured',
  'keyInvalid',
  'keyExpired',
  'ipRefererBlocked',
])

/** First error reason from a YouTube API error body, e.g. 'commentsDisabled'. */
export function getYouTubeErrorReason(data: unknown): string | undefined {
  return (data as { error?: { errors?: { reason?: string }[] } })?.error?.errors?.[0]?.reason
}

function shouldRotateKey(status: number, data: unknown): boolean {
  if (status === 429) return true
  if (status !== 403 && status !== 400) return false
  const reason = getYouTubeErrorReason(data)
  // A 403 with no reason is ambiguous — keep the old behaviour and rotate
  if (!reason) return status === 403
  return KEY_ERROR_REASONS.has(reason)
}

export async function fetchWithKeyRotation(
  buildUrl: (apiKey: string) => string,
  options?: RequestInit
): Promise<{ data: unknown; keyIndex: number; attemptsLog: AttemptLog[] }> {
  const keys = getApiKeys()
  if (keys.length === 0) {
    throw new Error('No YouTube API keys configured')
  }

  const attemptsLog: AttemptLog[] = []

  for (const { key, index: keyIndex } of keys) {
    const url = buildUrl(key)

    try {
      const res = await fetch(url, options)
      const data = await res.json()

      if (shouldRotateKey(res.status, data)) {
        // Quota exceeded, rate limited, or a bad key — try next key
        const msg = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
        attemptsLog.push({ keyIndex, error: msg })
        continue
      }

      // All other statuses (200, 400, 404, 500…) — return immediately, let caller decide
      attemptsLog.push({ keyIndex })
      return { data, keyIndex, attemptsLog }
    } catch (err) {
      // Network / parse error — try next key
      attemptsLog.push({ keyIndex, error: err instanceof Error ? err.message : 'Network error' })
      continue
    }
  }

  throw new Error(`All ${keys.length} YouTube API keys exhausted`)
}
