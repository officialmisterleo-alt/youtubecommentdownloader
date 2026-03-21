'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Youtube } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSuccess(true)
  }

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="border border-white/[0.07] rounded-2xl p-8 w-full max-w-md text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-[#888888] text-sm">We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="bg-red-600 rounded p-1.5"><Youtube className="w-5 h-5 text-white" /></div>
        <span className="font-bold text-white">YouTubeCommentDownloader</span>
      </Link>
      <div className="border border-white/[0.07] rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-[#888888] text-sm mb-6">Start with 500 free comment exports</p>

        <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors mb-4">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[#888888] text-xs">or</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {error && <div className="bg-red-950/50 border border-red-900 text-red-400 text-sm rounded-lg px-4 py-3 mb-5">{error}</div>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm text-[#888888] mb-1.5 block">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[#171717] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-sm" />
          </div>
          <div>
            <label className="text-sm text-[#888888] mb-1.5 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[#171717] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-sm" />
          </div>
          <div>
            <label className="text-sm text-[#888888] mb-1.5 block">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-[#171717] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-[#888888] text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-red-400 hover:text-red-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
