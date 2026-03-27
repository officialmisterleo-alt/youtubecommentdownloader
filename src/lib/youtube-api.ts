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

      if (res.status === 403 || res.status === 429) {
        // Quota exceeded or rate limited — try next key
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
