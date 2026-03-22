'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Users, CheckCircle, XCircle, AlertTriangle, LogIn } from 'lucide-react'

type JoinState = 'loading' | 'auth-required' | 'joining' | 'success' | 'error'

interface JoinResult {
  team?: { id: string; name: string; plan: string }
  errorCode?: 'expired' | 'accepted' | 'revoked' | 'invalid' | 'no-seats' | 'already-member' | 'generic'
  errorMessage?: string
}

const ERROR_ICONS: Record<string, typeof XCircle> = {
  expired: AlertTriangle,
  accepted: CheckCircle,
  revoked: XCircle,
  invalid: XCircle,
  'no-seats': AlertTriangle,
  'already-member': AlertTriangle,
  generic: XCircle,
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
      </div>
    }>
      <JoinPageInner />
    </Suspense>
  )
}

function JoinPageInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<JoinState>('loading')
  const [result, setResult] = useState<JoinResult>({})
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    if (!token) {
      setResult({ errorCode: 'invalid', errorMessage: 'No invitation token provided.' })
      setState('error')
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        setState('auth-required')
        return
      }
      setUser({ email: u.email ?? '' })
      setState('joining')
      attemptJoin(token)
    })
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function attemptJoin(tok: string) {
    try {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tok }),
      })
      const data = await res.json()

      if (!res.ok) {
        const msg: string = data.error ?? 'Failed to join team'
        let code: JoinResult['errorCode'] = 'generic'
        if (msg.includes('expired')) code = 'expired'
        else if (msg.includes('already been accepted')) code = 'accepted'
        else if (msg.includes('revoked')) code = 'revoked'
        else if (msg.includes('Invalid')) code = 'invalid'
        else if (msg.includes('no available seats')) code = 'no-seats'
        else if (msg.includes('already part of a team')) code = 'already-member'
        setResult({ errorCode: code, errorMessage: msg })
        setState('error')
        return
      }

      setResult({ team: data.team })
      setState('success')
    } catch {
      setResult({ errorCode: 'generic', errorMessage: 'Something went wrong. Please try again.' })
      setState('error')
    }
  }

  function signInUrl() {
    const redirect = encodeURIComponent(`/join?token=${token}`)
    return `/auth/login?next=${redirect}`
  }

  // Loading
  if (state === 'loading' || state === 'joining') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-red-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#888888] text-sm">
            {state === 'joining' ? 'Accepting your invitation…' : 'Loading…'}
          </p>
        </div>
      </div>
    )
  }

  // Auth required
  if (state === 'auth-required') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#171717] border border-white/[0.07] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-red-900/20 border border-red-900/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Users className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">You&apos;ve been invited</h1>
          <p className="text-[#888888] text-sm mb-6">
            Sign in to accept your team invitation and unlock Business plan features.
          </p>
          <Link
            href={signInUrl()}
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign in to accept invitation
          </Link>
          <p className="text-[#888888] text-xs mt-4">
            Don&apos;t have an account?{' '}
            <Link href={`/auth/signup?next=${encodeURIComponent(`/join?token=${token}`)}`} className="text-red-400 hover:text-red-300">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // Success
  if (state === 'success' && result.team) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#171717] border border-white/[0.07] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-green-900/20 border border-green-900/40 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-7 h-7 text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">You&apos;re in!</h1>
          <p className="text-[#888888] text-sm mb-1">
            You&apos;ve joined <strong className="text-white">{result.team.name}</strong>
          </p>
          <p className="text-[#888888] text-sm mb-6">
            You now have access to {result.team.plan.charAt(0).toUpperCase() + result.team.plan.slice(1)} plan features.
          </p>
          {user?.email && (
            <p className="text-[#555555] text-xs mb-6">Signed in as {user.email}</p>
          )}
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Error
  const ErrorIcon = ERROR_ICONS[result.errorCode ?? 'generic'] ?? XCircle
  const isAccepted = result.errorCode === 'accepted'
  const iconClass = isAccepted
    ? 'text-green-400'
    : result.errorCode === 'expired' || result.errorCode === 'no-seats' || result.errorCode === 'already-member'
      ? 'text-yellow-400'
      : 'text-red-400'
  const borderClass = isAccepted
    ? 'border-green-900/40 bg-green-900/20'
    : result.errorCode === 'expired' || result.errorCode === 'no-seats' || result.errorCode === 'already-member'
      ? 'border-yellow-900/40 bg-yellow-900/20'
      : 'border-red-900/40 bg-red-900/20'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#171717] border border-white/[0.07] rounded-2xl p-8 text-center">
        <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center mx-auto mb-5 ${borderClass}`}>
          <ErrorIcon className={`w-7 h-7 ${iconClass}`} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          {result.errorCode === 'expired' && 'Invitation Expired'}
          {result.errorCode === 'accepted' && 'Already Accepted'}
          {result.errorCode === 'revoked' && 'Invitation Revoked'}
          {result.errorCode === 'invalid' && 'Invalid Invitation'}
          {result.errorCode === 'no-seats' && 'No Seats Available'}
          {result.errorCode === 'already-member' && 'Already in a Team'}
          {result.errorCode === 'generic' && 'Something Went Wrong'}
        </h1>
        <p className="text-[#888888] text-sm mb-6">{result.errorMessage}</p>
        {result.errorCode === 'already-member' ? (
          <Link
            href="/dashboard/team"
            className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            View Your Team
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full bg-[#0a0a0a] hover:bg-white/[0.04] border border-white/[0.07] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        )}
      </div>
    </div>
  )
}
