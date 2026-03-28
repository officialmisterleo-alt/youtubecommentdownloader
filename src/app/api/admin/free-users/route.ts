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

  // Get all user_ids with a free plan subscription
  const { data: freeSubs } = await service
    .from('subscriptions')
    .select('user_id')
    .eq('plan', 'free')

  const freeSubUserIds = new Set((freeSubs ?? []).map((r: { user_id: string }) => r.user_id))

  // Get all user_ids that have any subscription row
  const { data: allSubs } = await service
    .from('subscriptions')
    .select('user_id')

  const allSubUserIds = new Set((allSubs ?? []).map((r: { user_id: string }) => r.user_id))

  // Paginate through all auth users
  const pageSize = 1000
  let page = 1
  let allUsers: { id: string; email?: string }[] = []

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await service.auth.admin.listUsers({ perPage: pageSize, page })
    const users = data?.users ?? []
    allUsers = allUsers.concat(users)
    // @ts-expect-error next_page exists on paginated response
    if (!data?.next_page) break
    page++
  }

  // Free users = those with plan='free' subscription OR no subscription row at all
  const freeUsers = allUsers.filter(u => {
    if (freeSubUserIds.has(u.id)) return true
    if (!allSubUserIds.has(u.id)) return true
    return false
  })

  const emails = freeUsers
    .map(u => u.email ?? '')
    .filter(Boolean)
    .sort()

  return NextResponse.json({ count: freeUsers.length, emails })
}
