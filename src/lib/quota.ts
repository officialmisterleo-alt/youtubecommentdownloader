import { createClient, createServiceClient } from '@/lib/supabase/server'

export const MONTHLY_LIMITS: Record<string, number> = {
  free:       100,
  pro:        100_000,
  business:   1_000_000,
  enterprise: -1,  // -1 = unlimited
}

export function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
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

export async function checkAndIncrementUsage(
  userId: string,
  plan: string,
  count: number
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const { used, limit } = await getMonthlyUsage(userId, plan)

  if (limit !== -1 && used + count > limit) {
    return { allowed: false, used, limit }
  }

  // Use the service role client so writes bypass RLS — this is server-side only code
  const serviceClient = createServiceClient()
  const month = getCurrentMonth()

  await serviceClient.from('monthly_usage').upsert(
    { user_id: userId, month, comment_count: (used + count), updated_at: new Date().toISOString() },
    { onConflict: 'user_id,month' }
  )

  return { allowed: true, used: used + count, limit }
}
