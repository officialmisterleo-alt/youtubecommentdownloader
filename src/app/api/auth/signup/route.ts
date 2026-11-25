import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSignupConfirmationEmail } from '@/lib/email'
import { safeNextPath } from '@/lib/safe-redirect'

// Supabase's built-in mailer wasn't reaching Gmail inboxes (no Gmail email signup
// confirmed for months), so we create the confirmation link ourselves and send it
// through Resend from our own domain. Supabase's mailer stays as the fallback.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESEND_COOLDOWN_MS = 60_000
const IP_WINDOW_MS = 10 * 60_000
const IP_MAX_SENDS = 5

// Best-effort throttles per serverless instance; the per-user check below covers the rest
const lastSendByEmail = new Map<string, number>()
const sendsByIp = new Map<string, number[]>()

function throttled(email: string, ip: string) {
  const now = Date.now()
  const last = lastSendByEmail.get(email)
  if (last && now - last < RESEND_COOLDOWN_MS) return true
  return (sendsByIp.get(ip) ?? []).filter(t => now - t < IP_WINDOW_MS).length >= IP_MAX_SENDS
}

function recordSend(email: string, ip: string) {
  const now = Date.now()
  if (lastSendByEmail.size > 5000) lastSendByEmail.clear()
  if (sendsByIp.size > 5000) sendsByIp.clear()
  lastSendByEmail.set(email, now)
  sendsByIp.set(ip, [...(sendsByIp.get(ip) ?? []).filter(t => now - t < IP_WINDOW_MS), now])
}

// Signup bots fill the name with one random mixed-case word like "xKpQwRtYz".
// Real names rarely switch case more than three times in one word (McDonald, MacKenzie).
function looksLikeBotName(name: string) {
  if (!/^[A-Za-z]{6,}$/.test(name)) return false
  let flips = 0
  for (let i = 1; i < name.length; i++) {
    if ((name[i] === name[i].toLowerCase()) !== (name[i - 1] === name[i - 1].toLowerCase())) flips++
  }
  return flips >= 4
}

function botReason(body: Record<string, unknown>, name: string) {
  if (typeof body.website === 'string' && body.website.trim()) return 'honeypot'
  if (typeof body.elapsedMs === 'number' && body.elapsedMs < 1500) return 'too_fast'
  if (looksLikeBotName(name)) return 'name'
  return null
}

type AuthUser = {
  id: string
  email?: string
  email_confirmed_at?: string | null
  confirmation_sent_at?: string | null
  recovery_sent_at?: string | null
}

/** supabase-js doesn't expose the admin API's email filter, so call it directly. */
async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&per_page=50`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: 'no-store',
    }
  )
  if (!res.ok) throw new Error(`Admin user lookup failed: ${res.status}`)
  const { users } = (await res.json()) as { users: AuthUser[] }
  // The filter is a substring match, so require the exact address
  return users.find(u => u.email?.toLowerCase() === email) ?? null
}

function sentRecently(...timestamps: (string | null | undefined)[]) {
  return timestamps.some(t => t && Date.now() - new Date(t).getTime() < RESEND_COOLDOWN_MS)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const name = String(body.name ?? '').trim().slice(0, 100)
    // resend: true comes from the "send a new link" buttons and never creates an account
    const resendOnly = body.resend === true
    const next = safeNextPath(typeof body.next === 'string' ? body.next : null, '/tool')

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (!resendOnly && password.length < 6) {
      return NextResponse.json({ error: 'Password should be at least 6 characters.' }, { status: 400 })
    }

    if (!resendOnly) {
      const reason = botReason(body, name)
      if (reason) {
        // Look successful so bots don't adapt, but create nothing and email no one
        console.warn('/api/auth/signup dropped likely bot:', reason)
        return NextResponse.json({ success: true })
      }
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (throttled(email, ip)) {
      return NextResponse.json({ error: 'Please wait a minute before requesting another email.' }, { status: 429 })
    }

    const service = createServiceClient()
    const user = await findUserByEmail(email)

    let tokenHash: string
    let verificationType: string

    if (user) {
      if (user.email_confirmed_at) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Sign in instead.', code: 'already_confirmed' },
          { status: 409 }
        )
      }
      if (sentRecently(user.confirmation_sent_at, user.recovery_sent_at)) {
        return NextResponse.json({ error: 'Please wait a minute before requesting another email.' }, { status: 429 })
      }
      // Signed up before but never confirmed: a magic link confirms the email and signs them in
      const { data, error } = await service.auth.admin.generateLink({ type: 'magiclink', email })
      if (error || !data?.properties) throw error ?? new Error('generateLink returned no properties')
      tokenHash = data.properties.hashed_token
      verificationType = data.properties.verification_type
    } else if (resendOnly) {
      // Don't reveal whether an address has an account
      return NextResponse.json({ success: true })
    } else {
      const { data, error } = await service.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) {
        if (error.code === 'email_exists' || /already been registered/i.test(error.message)) {
          return NextResponse.json(
            { error: 'An account with this email already exists. Sign in instead.', code: 'already_confirmed' },
            { status: 409 }
          )
        }
        throw error
      }
      if (!data?.properties) throw new Error('generateLink returned no properties')
      tokenHash = data.properties.hashed_token
      verificationType = data.properties.verification_type
    }

    recordSend(email, ip)
    const origin = new URL(req.url).origin
    const confirmUrl = `${origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(verificationType)}&next=${encodeURIComponent(next)}`

    let sent = false
    try {
      sent = await sendSignupConfirmationEmail({ toEmail: email, confirmUrl })
    } catch (e) {
      console.error('/api/auth/signup Resend error:', e)
    }

    if (!sent) {
      // Fall back to Supabase's own confirmation email
      const anon = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { error } = await anon.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${origin}/auth/login?notice=confirmed&next=${encodeURIComponent(next)}` },
      })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error('/api/auth/signup error:', e)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
