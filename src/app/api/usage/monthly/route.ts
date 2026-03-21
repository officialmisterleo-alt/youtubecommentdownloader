import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

const MONTHLY_LIMITS: Record<string, number | null> = {
  free: 1000,
  pro: 100000,
  business: 1000000,
  enterprise: null, // unlimited
}

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()
  const yearMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const [subResult, usageResult] = await Promise.all([
    serviceClient
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single(),
    serviceClient
      .from('monthly_usage')
      .select('comments_fetched')
      .eq('user_id', user.id)
      .eq('year_month', yearMonth)
      .single(),
  ])

  const plan = (subResult.data?.status === 'active' ? subResult.data?.plan : null) ?? 'free'
  const limit = MONTHLY_LIMITS[plan] ?? MONTHLY_LIMITS.free
  const used = usageResult.data?.comments_fetched ?? 0

  return NextResponse.json({ used, limit, plan, yearMonth })
}
