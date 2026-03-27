'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { LogOut, User as UserIcon, CreditCard, ExternalLink, Mail, Lock } from 'lucide-react'

type Subscription = { plan: string; status: string; current_period_end: string | null; lifetime: boolean | null }

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(false)

  // Change email
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  // Change password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login')
      } else {
        setUser(user)
        const { data } = await supabase
          .from('subscriptions')
          .select('plan, status, current_period_end, lifetime')
          .eq('user_id', user.id)
          .single()
        setSubscription(data)
      }
      setLoading(false)
    })
  }, [router])

  async function handleManageBilling() {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/stripe/portal')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setBillingLoading(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailLoading(true)
    setEmailMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) {
      setEmailMsg({ type: 'error', text: error.message })
    } else {
      setEmailMsg({ type: 'success', text: 'Check both inboxes for confirmation links — your email will update once confirmed.' })
      setNewEmail('')
    }
    setEmailLoading(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setPasswordLoading(true)
    setPasswordMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || null
  const initials = displayName ? displayName[0].toUpperCase() : (user.email?.[0]?.toUpperCase() ?? 'U')
  const isGoogleUser = user.app_metadata?.provider === 'google'

  const plan = subscription?.plan ?? 'free'
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const isLifetime = subscription?.lifetime === true
  const isPaidActive = subscription && subscription.plan !== 'free' && subscription.status === 'active'
  const periodEnd = isPaidActive && subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null

  const inputClass = 'w-full bg-[#111111] border border-white/[0.07] rounded-xl px-4 py-2.5 text-white placeholder-[#444] focus:outline-none focus:border-red-600/50 text-sm'
  const btnPrimary = 'bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed'

  return (
    <div className="flex-1 flex flex-col">
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
                <div className="text-white text-sm">{planLabel}</div>
                {isPaidActive && (
                  <div className="text-xs text-[#555555] mt-0.5">
                    Status: {subscription.status}{periodEnd ? ` · Renews ${periodEnd}` : ''}
                  </div>
                )}
              </div>
            </div>
            {plan === 'free' ? (
              <Link
                href="/pricing"
                className="inline-flex items-center text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Upgrade
              </Link>
            ) : !isLifetime ? (
              <button
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-white border border-white/[0.07] hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-3 h-3" />
                {billingLoading ? 'Loading...' : 'Manage Billing'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Security card — email/password users only */}
        {!isGoogleUser && (
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
            <div className="p-6 border-b border-white/[0.07]">
              <h2 className="text-sm font-semibold text-white">Security</h2>
              <p className="text-[#555555] text-xs mt-1">Update your email address or password.</p>
            </div>

            {/* Change email */}
            <form onSubmit={handleChangeEmail} className="p-6 border-b border-white/[0.07]">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-[#555555]" />
                <span className="text-sm font-medium text-white">Change Email</span>
              </div>
              <div className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  required
                  className={inputClass}
                />
                {emailMsg && (
                  <p className={`text-xs ${emailMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {emailMsg.text}
                  </p>
                )}
                <button type="submit" disabled={emailLoading} className={btnPrimary}>
                  {emailLoading ? 'Sending...' : 'Update Email'}
                </button>
              </div>
            </form>

            {/* Change password */}
            <form onSubmit={handleChangePassword} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-[#555555]" />
                <span className="text-sm font-medium text-white">Change Password</span>
              </div>
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                  required
                  className={inputClass}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className={inputClass}
                />
                {passwordMsg && (
                  <p className={`text-xs ${passwordMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordMsg.text}
                  </p>
                )}
                <button type="submit" disabled={passwordLoading} className={btnPrimary}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

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
    </div>
  )
}
