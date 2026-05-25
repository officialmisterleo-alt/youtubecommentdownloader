import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

/** Claim any pending enterprise provision for this user. Non-blocking — never throws. */
async function claimEnterpriseProvision(userId: string, email: string): Promise<void> {
  try {
    const service = createSupabaseServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check for an unclaimed provision slot matching this email
    const { data: provision, error: fetchError } = await service
      .from('enterprise_provisions')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('claimed', false)
      .maybeSingle()

    if (fetchError || !provision) return

    const periodEnd = new Date()
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)

    // Upsert subscription
    const { error: subError } = await service
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan: 'enterprise',
          status: 'active',
          current_period_end: periodEnd.toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (subError) {
      console.error('[enterprise-claim] subscription upsert failed:', subError.message)
      return
    }

    // Create team
    const { data: team, error: teamError } = await service
      .from('teams')
      .insert({
        name: provision.team_name,
        owner_id: userId,
        plan: 'enterprise',
        max_seats: provision.max_seats,
      })
      .select()
      .single()

    if (teamError || !team) {
      console.error('[enterprise-claim] team creation failed:', teamError?.message)
      return
    }

    // Add as admin member
    const { error: memberError } = await service
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'admin',
        status: 'active',
        invited_email: email.toLowerCase(),
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('[enterprise-claim] team member insert failed:', memberError.message)
      // Don't bail — team and sub are created, just log it
    }

    // Mark provision as claimed
    const { error: claimError } = await service
      .from('enterprise_provisions')
      .update({
        claimed: true,
        claimed_by: userId,
        claimed_at: new Date().toISOString(),
      })
      .eq('id', provision.id)

    if (claimError) {
      console.error('[enterprise-claim] failed to mark provision claimed:', claimError.message)
    }
  } catch (err) {
    console.error('[enterprise-claim] unexpected error:', err)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Read next destination: cookie (set before OAuth) takes priority over query param
  const cookieNext = request.cookies.get('auth_next')?.value
  const next = cookieNext
    ? decodeURIComponent(cookieNext)
    : (searchParams.get('next') ?? '/dashboard')

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)

    // Clear the auth_next cookie
    response.cookies.delete('auth_next')

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

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After successful login, claim any pending enterprise provision
      const sessionUser = sessionData?.user
      if (sessionUser?.id && sessionUser?.email) {
        // Fire-and-forget: don't block the redirect on enterprise provisioning
        void claimEnterpriseProvision(sessionUser.id, sessionUser.email)
      }
      return response
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=callback_error`)
}
