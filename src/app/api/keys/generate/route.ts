import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient, getEffectivePlan } from '@/lib/teams'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const plan = await getEffectivePlan(user.id)
    if (plan !== 'enterprise') {
      return NextResponse.json(
        { error: 'API key generation requires an Enterprise plan' },
        { status: 403 }
      )
    }

    // Generate cryptographically random key: ytcd_ + 32 hex chars
    const rawKey = 'ytcd_' + randomBytes(16).toString('hex')
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 12) // e.g. "ytcd_a1b2c3d"

    const service = createServiceClient()

    // Check if a key already exists (to set regenerated_at)
    const { data: existing } = await service
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const now = new Date().toISOString()

    const upsertPayload: {
      user_id: string
      key_hash: string
      key_prefix: string
      regenerated_at?: string
    } = {
      user_id: user.id,
      key_hash: keyHash,
      key_prefix: keyPrefix,
    }
    if (existing) upsertPayload.regenerated_at = now

    const { error: upsertError } = await service
      .from('api_keys')
      .upsert(upsertPayload, { onConflict: 'user_id' })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to store API key' }, { status: 500 })
    }

    return NextResponse.json({
      key: rawKey,
      prefix: keyPrefix,
      createdAt: now,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
