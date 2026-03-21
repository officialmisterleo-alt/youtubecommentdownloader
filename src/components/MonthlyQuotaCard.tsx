'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type UsageData = {
  used: number
  limit: number
  plan: string
  yearMonth: string
}

function getResetDate(): string {
  const now = new Date()
  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return firstOfNext.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function getBarColor(pct: number, limitReached: boolean): string {
  if (limitReached) return 'bg-red-500'
  if (pct <= 60) return 'bg-green-500'
  if (pct <= 80) return 'bg-amber-400'
  return 'bg-orange-500'
}

export default function MonthlyQuotaCard() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/usage/monthly')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-[#171717] border border-white/[0.07] rounded-xl p-5 animate-pulse">
        <div className="h-3 bg-white/[0.07] rounded w-1/3 mb-3" />
        <div className="h-2 bg-white/[0.05] rounded-full mb-3" />
        <div className="h-3 bg-white/[0.05] rounded w-1/2" />
      </div>
    )
  }

  if (!data) return null

  const isEnterprise = data.plan === 'enterprise'
  const isUnlimited = !isFinite(data.limit) || isEnterprise

  const pct = isUnlimited ? 100 : Math.min(100, Math.round((data.used / data.limit) * 100))
  const limitReached = !isUnlimited && pct >= 100
  const barColor = isUnlimited ? 'bg-green-500' : getBarColor(pct, limitReached)
  const planLabel = data.plan.charAt(0).toUpperCase() + data.plan.slice(1) + ' Plan'
  const resetDate = getResetDate()

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-2xl font-bold text-white">
          {isUnlimited ? '∞' : data.used.toLocaleString()}
        </div>
        {limitReached && (
          <span className="text-xs font-medium text-red-400 bg-red-900/20 border border-red-900/40 px-2 py-0.5 rounded">
            Limit reached
          </span>
        )}
      </div>
      <div className="text-[#888888] text-xs mb-3">
        {isUnlimited
          ? 'Unlimited comments · ' + planLabel
          : `${data.used.toLocaleString()} / ${data.limit.toLocaleString()} comments · ${planLabel}`}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${isUnlimited ? 100 : pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[#555555] text-xs">Resets {resetDate}</span>
        {!isEnterprise && (
          <Link href="/pricing" className="text-red-400 hover:text-red-300 text-xs transition-colors">
            Upgrade Plan
          </Link>
        )}
      </div>
    </div>
  )
}
