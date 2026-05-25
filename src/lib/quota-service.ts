/**
 * Service-role quota helpers for use in v1 API routes where there is no
 * browser session (auth is via API key, not cookies). These mirror the
 * logic in src/lib/quota.ts but use createServiceClient so they bypass RLS
 * and never touch the cookie store.
 */
import { createServiceClient } from '@/lib/supabase/server'
import { MONTHLY_LIMITS, getCurrentMonth } from '@/lib/quota'

export type MonthlyUsage = {
  used: number
  limit: number
  remaining: number
  month: string
}

export async function getMonthlyUsageService(
  userId: string,
  plan: string,
): Promise<MonthlyUsage> {
  const service = createServiceClient()
  const month = getCurrentMonth()
  const limit = MONTHLY_LIMITS[plan] ?? 100

  const { data } = await service
    .from('monthly_usage')
    .select('comment_count')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle()

  const used = (data as { comment_count?: number } | null)?.comment_count ?? 0
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used)
  return { used, limit, remaining, month }
}

export async function checkAndIncrementUsageService(
  userId: string,
  plan: string,
  count: number,
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  const { used, limit, remaining } = await getMonthlyUsageService(userId, plan)

  if (limit !== -1 && remaining <= 0) {
    return { allowed: false, used, limit, remaining: 0 }
  }

  const service = createServiceClient()
  const month = getCurrentMonth()
  const newUsed = used + count

  await service.from('monthly_usage').upsert(
    {
      user_id: userId,
      month,
      comment_count: newUsed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,month' },
  )

  const newRemaining = limit === -1 ? -1 : Math.max(0, limit - newUsed)
  return { allowed: true, used: newUsed, limit, remaining: newRemaining }
}

/** Returns ISO string for the first day of next month at 00:00:00Z */
export function getQuotaResetDate(): string {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return next.toISOString()
}
