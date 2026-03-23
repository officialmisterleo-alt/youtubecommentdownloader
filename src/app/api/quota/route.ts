import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMonthlyUsage } from '@/lib/quota'
import { getEffectivePlan } from '@/lib/teams'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = await getEffectivePlan(user.id)
  const usage = await getMonthlyUsage(user.id, plan)

  return NextResponse.json({ ...usage, plan })
}
