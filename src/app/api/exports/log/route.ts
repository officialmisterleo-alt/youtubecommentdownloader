import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { videoUrl, videoTitle, channelName, commentCount, format } = await req.json()

    const { error } = await supabase.from('exports').insert({
      user_id: user.id,
      video_url: videoUrl ?? '',
      video_title: videoTitle ?? '',
      channel_name: channelName ?? '',
      comment_count: commentCount ?? 0,
      format: format ?? 'TXT',
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to log export'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
