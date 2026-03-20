'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { LogOut, User as UserIcon, CreditCard } from 'lucide-react'

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
      setLoading(false)
    })
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || null
  const initials = displayName ? displayName[0].toUpperCase() : (user.email?.[0]?.toUpperCase() ?? 'U')
  const isGoogleUser = user.app_metadata?.provider === 'google'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Account</h1>

        {/* Profile card */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
          <div className="p-6 border-b border-white/[0.07] flex items-center gap-4">
            <div className="w-14 h-14 bg-red-900 rounded-full flex items-center justify-center text-red-200 text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <div className="text-white font-medium">{displayName || user.email}</div>
              <div className="text-[#555555] text-xs mt-0.5">{isGoogleUser ? 'Signed in with Google' : 'Signed in with email'}</div>
            </div>
          </div>

          {/* Email row */}
          <div className="px-6 py-4 flex items-center gap-3 border-b border-white/[0.07]">
            <UserIcon className="w-4 h-4 text-[#555555] shrink-0" />
            <div>
              <div className="text-xs text-[#555555] mb-0.5">Email</div>
              <div className="text-white text-sm">{user.email}</div>
            </div>
          </div>

          {/* Plan row */}
          <div className="px-6 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-[#555555] shrink-0" />
              <div>
                <div className="text-xs text-[#555555] mb-0.5">Current Plan</div>
                <div className="text-white text-sm">Free</div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-1">Sign Out</h2>
          <p className="text-[#555555] text-xs mb-4">You&apos;ll be redirected to the home page.</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-[#1a0a0a] hover:bg-red-950 border border-red-900/50 text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
      <Footer />
    </div>
  )
}
