import { createClient, createServiceClient } from '@/lib/supabase/server'

export const MONTHLY_LIMITS: Record<string, number> = {
  free:       100,
  pro:        100_000,
  business:   1_000_000,
  enterprise: -1,  // -1 = unlimited
}

// Comments a signed-out visitor can export per day (per hashed IP)
export const ANON_DAILY_LIMIT = 500

// UTC, matching the webhook's month key
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export async function getMonthlyUsage(userId: string, plan: string) {
  const supabase = await createClient()
  const month = getCurrentMonth()
  const limit = MONTHLY_LIMITS[plan] ?? 100

  const { data } = await supabase
    .from('monthly_usage')
    .select('comment_count')
    .eq('user_id', userId)
    .eq('month', month)
    .single()

  const used = data?.comment_count ?? 0
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used)
  return { used, limit, remaining, month }
}

/**
 * Atomically reserves up to `requested` comments of this month's quota and
 * returns how many were granted (0 when used up). Pass a negative number to
 * refund an unused reservation. Locked in Postgres, so parallel requests
 * can't overshoot the limit.
 */
export async function reserveMonthlyUsage(userId: string, plan: string, requested: number): Promise<number> {
  const { data, error } = await createServiceClient().rpc('reserve_monthly_usage', {
    p_user_id: userId,
    p_month: getCurrentMonth(),
    p_requested: requested,
    p_limit: MONTHLY_LIMITS[plan] ?? 100,
  })
  if (error) throw new Error(`reserve_monthly_usage failed: ${error.message}`)
  return data as number
}

/** Same as reserveMonthlyUsage, for signed-out visitors keyed by hashed IP per UTC day. */
export async function reserveAnonUsage(ipHash: string, requested: number): Promise<number> {
  const { data, error } = await createServiceClient().rpc('reserve_anon_usage', {
    p_ip_hash: ipHash,
    p_day: new Date().toISOString().slice(0, 10),
    p_requested: requested,
    p_limit: ANON_DAILY_LIMIT,
  })
  if (error) throw new Error(`reserve_anon_usage failed: ${error.message}`)
  return data as number
}
