import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { safeNextPath } from '@/lib/safe-redirect'

const ALLOWED_TYPES: EmailOtpType[] = ['signup', 'magiclink', 'email']

/** Target of the confirmation links sent by /api/auth/signup. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNextPath(searchParams.get('next'), '/tool')

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const response = NextResponse.redirect(`${origin}${next}`)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return response
  }

  // Used or expired link. Email scanners sometimes open links before the person does,
  // which confirms the account but uses up the link, so point them at sign-in.
  return NextResponse.redirect(`${origin}/auth/login?notice=link_expired&next=${encodeURIComponent(next)}`)
}
