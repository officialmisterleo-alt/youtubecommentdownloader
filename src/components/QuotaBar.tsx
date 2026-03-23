'use client'
import { useEffect, useState } from 'react'

type QuotaData = {
  used: number
  limit: number
  remaining: number
  month: string
  plan: string
}

function formatMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`
  return n.toLocaleString()
}

export default function QuotaBar() {
  const [quota, setQuota] = useState<QuotaData | null>(null)

  useEffect(() => {
    fetch('/api/quota')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setQuota(data) })
      .catch(() => {})
  }, [])

  if (!quota) return null

  const unlimited = quota.limit === -1
  const pct = unlimited ? 0 : Math.min(100, Math.round((quota.used / quota.limit) * 100))
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-600'

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">Monthly Quota</span>
        <span className="text-[#888888] text-xs">{formatMonth(quota.month)}</span>
      </div>
      {unlimited ? (
        <p className="text-[#888888] text-xs">Unlimited — Enterprise plan</p>
      ) : (
        <>
          <div className="w-full bg-white/[0.07] rounded-full h-1.5 mb-2">
            <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#888888] text-xs">
              {formatNumber(quota.used)} / {formatNumber(quota.limit)} comments used
            </span>
            <span className="text-[#888888] text-xs">{pct}%</span>
          </div>
        </>
      )}
    </div>
  )
}
