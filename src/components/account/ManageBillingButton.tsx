'use client'
import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal')
      const data = await res.json() as { url?: string }
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-[#888888] hover:text-white border border-white/[0.07] hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ExternalLink className="w-3 h-3" />
      {loading ? 'Loading...' : 'Manage Billing'}
    </button>
  )
}
