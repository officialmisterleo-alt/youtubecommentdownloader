import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-key'

export type V1AuthSuccess = {
  userId: string
  plan: string
}

/**
 * Authenticates an incoming v1 API request via Bearer token.
 *
 * - Extracts `Authorization: Bearer ytcd_...` header
 * - Validates the key via validateApiKey (hashes it, looks up in DB)
 * - Enforces enterprise plan requirement
 *
 * Returns V1AuthSuccess on success, or a NextResponse error on failure.
 * Callers should check `result instanceof NextResponse` to distinguish.
 */
export async function authenticateV1Request(
  req: Request,
): Promise<V1AuthSuccess | NextResponse> {
  const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      {
        error: 'missing_api_key',
        message: 'Authorization header with Bearer token is required. Format: Authorization: Bearer ytcd_...',
      },
      { status: 401 },
    )
  }

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey) {
    return NextResponse.json(
      {
        error: 'missing_api_key',
        message: 'Bearer token is empty.',
      },
      { status: 401 },
    )
  }

  const result = await validateApiKey(rawKey)

  if (!result) {
    return NextResponse.json(
      {
        error: 'invalid_api_key',
        message: 'The provided API key is invalid or has been revoked.',
      },
      { status: 401 },
    )
  }

  if (result.plan !== 'enterprise') {
    return NextResponse.json(
      {
        error: 'plan_required',
        message: `The v1 API requires an Enterprise plan. Your current plan is "${result.plan}". Upgrade at https://ytcommentdownloader.com/pricing.`,
      },
      { status: 403 },
    )
  }

  return { userId: result.userId, plan: result.plan }
}

/** Type-guard: returns true when auth succeeded (not an error response) */
export function isAuthSuccess(
  result: V1AuthSuccess | NextResponse,
): result is V1AuthSuccess {
  return !(result instanceof NextResponse)
}
