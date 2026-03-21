import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MONTHLY_LIMITS: Record<string, number> = {
  free: 1_000,
  pro: 100_000,
  business: 1_000_000,
  enterprise: Infinity,
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    const plan = (sub?.status === 'active' ? sub?.plan : null) ?? 'free'
    const limit = MONTHLY_LIMITS[plan] ?? MONTHLY_LIMITS.free

    const yearMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

    const { data: usage } = await supabase
      .from('usage')
      .select('comments_count')
      .eq('user_id', user.id)
      .eq('month', yearMonth)
      .single()

    const used = usage?.comments_count ?? 0

    return NextResponse.json({ used, limit, plan, yearMonth })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
