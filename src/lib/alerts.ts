export interface ErrorLogEntry {
  timestamp: string
  event: string
  failedKeys: number[]
  successKey?: number
  endpoint?: string
}

// In-memory circular buffer — resets on cold start, max 50 entries
const errorLog: ErrorLogEntry[] = []
const MAX_LOG_SIZE = 50

function appendToLog(entry: ErrorLogEntry) {
  errorLog.push(entry)
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.shift()
  }
}

export function getErrorLog(): ErrorLogEntry[] {
  return [...errorLog]
}

export async function sendApiAlert(payload: {
  event: 'api_pool_exhausted' | 'quota_warning' | 'api_error'
  message: string
  failedKeys: number[]
  successKey?: number
  endpoint?: string
  timestamp: string
}): Promise<void> {
  // Always append to in-memory log
  appendToLog({
    timestamp: payload.timestamp,
    event: payload.event,
    failedKeys: payload.failedKeys,
    successKey: payload.successKey,
    endpoint: payload.endpoint,
  })

  const formId = process.env.FORMSPARK_FORM_ID
  if (!formId) return

  try {
    await fetch(`https://submit-api.formspark.io/f/${formId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Fire-and-forget — never throw, never block the response
  }
}
