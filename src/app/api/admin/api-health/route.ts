import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getApiKeys } from '@/lib/youtube-api'
import { getErrorLog } from '@/lib/alerts'

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

  const keys = []
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`YOUTUBE_API_KEY_${i}`]
    keys.push({
      index: i,
      configured: Boolean(key && key.trim() !== '' && !key.startsWith('PLACEHOLDER')),
    })
  }

  const configuredCount = getApiKeys().length

  return NextResponse.json({
    keys,
    configuredCount,
    recentErrors: getErrorLog(),
  })
}
