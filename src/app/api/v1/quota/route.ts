import { NextRequest, NextResponse } from 'next/server'
import { authenticateV1Request, isAuthSuccess } from '@/lib/v1-auth'
import { getMonthlyUsageService, getQuotaResetDate } from '@/lib/quota-service'

export async function GET(req: NextRequest) {
  // Auth
  const auth = await authenticateV1Request(req)
  if (!isAuthSuccess(auth)) return auth

  const { userId, plan } = auth

  // Fetch current usage
  const { used, limit, remaining } = await getMonthlyUsageService(userId, plan)

  return NextResponse.json({
    plan,
    used,
    remaining,
    limit,
    resetsAt: getQuotaResetDate(),
  })
}
