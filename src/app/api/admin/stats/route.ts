import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/teams'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  // Fetch all stats in parallel
  const [
    totalExportsRes,
    exportsThisMonthRes,
    totalCommentsRes,
    activeUsersRes,
    activeSubsRes,
    planBreakdownRes,
    usersRes,
  ] = await Promise.all([
    // Total exports all time
    service.from('exports').select('*', { count: 'exact', head: true }),
    // Exports this month
    service.from('exports').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    // Total comments downloaded (sum of comment_count)
    service.from('exports').select('comment_count'),
    // Active users this month (distinct user_id in exports this month)
    service.from('exports').select('user_id').gte('created_at', startOfMonth),
    // Active subscriptions count
    service.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    // Plan breakdown
    service.from('subscriptions').select('plan').eq('status', 'active'),
    // All users via auth admin
    service.auth.admin.listUsers({ perPage: 1, page: 1 }),
  ])

  // Total comments
  const totalComments = (totalCommentsRes.data ?? []).reduce(
    (sum, row) => sum + (row.comment_count ?? 0),
    0
  )

  // Active users this month (distinct)
  const activeUserIds = new Set((activeUsersRes.data ?? []).map((r: { user_id: string }) => r.user_id))
  const activeUsersThisMonth = activeUserIds.size

  // Plan breakdown
  const planCounts: Record<string, number> = {}
  for (const row of planBreakdownRes.data ?? []) {
    const plan = row.plan ?? 'unknown'
    planCounts[plan] = (planCounts[plan] ?? 0) + 1
  }

  // Total users & new this month — paginate auth.users
  let totalUsers = 0
  let newUsersThisMonth = 0
  try {
    // First page already fetched; use total_count from it
    const firstPage = usersRes.data
    if (firstPage) {
      // @ts-expect-error total field exists on paginated response
      totalUsers = firstPage.total ?? firstPage.users?.length ?? 0

      // Paginate to count new users this month
      const pageSize = 1000
      const totalPages = Math.ceil(totalUsers / pageSize)
      const startMs = new Date(startOfMonth).getTime()

      // Fetch all pages to count new users
      const pagePromises = []
      for (let p = 1; p <= totalPages; p++) {
        pagePromises.push(service.auth.admin.listUsers({ perPage: pageSize, page: p }))
      }
      const pages = await Promise.all(pagePromises)
      for (const page of pages) {
        for (const u of page.data?.users ?? []) {
          if (new Date(u.created_at).getTime() >= startMs) {
            newUsersThisMonth++
          }
        }
      }
    }
  } catch {
    // non-fatal
  }

  return NextResponse.json({
    totalUsers,
    newUsersThisMonth,
    activeUsersThisMonth,
    totalExports: totalExportsRes.count ?? 0,
    exportsThisMonth: exportsThisMonthRes.count ?? 0,
    totalComments,
    activeSubscriptions: activeSubsRes.count ?? 0,
    planBreakdown: planCounts,
    lastUpdated: now.toISOString().slice(0, 10),
  })
}
