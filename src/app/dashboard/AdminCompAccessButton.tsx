'use client'

import { useEffect, useState } from 'react'
import { Gift, RotateCcw } from 'lucide-react'

export default function AdminCompAccessButton() {
  const [plan, setPlan] = useState<'free' | 'pro' | 'unknown'>('unknown')
  const [label, setLabel] = useState('Check Admin Plan')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/comp-access')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (cancelled) return
        setPlan(data?.plan === 'pro' ? 'pro' : 'free')
      })
      .catch(() => {
        if (!cancelled) setPlan('free')
      })
    return () => { cancelled = true }
  }, [])

  async function handleClick() {
    setLoading(true)
    try {
      const method = plan === 'pro' ? 'DELETE' : 'POST'
      const res = await fetch('/api/admin/comp-access', { method })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Failed to update access')
      const nextPlan = data?.plan === 'pro' ? 'pro' : 'free'
      setPlan(nextPlan)
      setLabel(nextPlan === 'pro' ? 'Admin Pro active' : 'Admin Free active')
      window.setTimeout(() => {
        window.location.reload()
      }, 700)
    } catch {
      setLabel('Update failed')
      setTimeout(() => setLabel(plan === 'pro' ? 'Revoke Admin Pro' : 'Grant Admin Pro'), 2500)
    } finally {
      setLoading(false)
    }
  }

  const isPro = plan === 'pro'
  const Icon = isPro ? RotateCcw : Gift
  const buttonLabel = loading
    ? (isPro ? 'Revoking...' : 'Granting...')
    : (plan === 'unknown' ? label : (isPro ? 'Revoke Admin Pro' : 'Grant Admin Pro'))

  return (
    <button
      onClick={handleClick}
      disabled={loading || plan === 'unknown'}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-60 disabled:cursor-not-allowed bg-red-900/10 border border-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
    >
      <Icon className="w-3 h-3" />
      {buttonLabel}
    </button>
  )
}
