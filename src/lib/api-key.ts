import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

type ApiKeyValidation = {
  userId: string
  plan: string
}

/**
 * Validates an API key sent in a request.
 * Hashes the raw key, looks it up in api_keys, updates last_used_at, and
 * returns the owning user's id + effective plan — or null if the key is invalid.
 */
export async function validateApiKey(rawKey: string): Promise<ApiKeyValidation | null> {
  if (!rawKey || !rawKey.startsWith('ytcd_')) return null

  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const service = createServiceClient()

  const { data: apiKey } = await service
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (!apiKey?.user_id) return null

  // Update last_used_at asynchronously (fire-and-forget, non-blocking)
  void Promise.resolve(
    service
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash)
  ).catch(() => {/* non-fatal */})

  // Fetch the user's effective plan
  const { data: sub } = await service
    .from('subscriptions')
    .select('plan, status, lifetime')
    .eq('user_id', apiKey.user_id)
    .maybeSingle()

  let plan = 'free'
  if (sub?.lifetime) {
    plan = 'pro'
  } else if (sub?.status === 'active' && sub.plan) {
    plan = sub.plan
  }

  // Check team membership if still on free/pro
  if (plan === 'free' || plan === 'pro') {
    const { data: membership } = await service
      .from('team_members')
      .select('status, teams(plan)')
      .eq('user_id', apiKey.user_id)
      .eq('status', 'active')
      .maybeSingle()

    if (membership?.status === 'active') {
      const teamPlan = (membership.teams as { plan?: string } | null)?.plan
      if (teamPlan === 'business' || teamPlan === 'enterprise') plan = teamPlan
    }
  }

  return { userId: apiKey.user_id, plan }
}
