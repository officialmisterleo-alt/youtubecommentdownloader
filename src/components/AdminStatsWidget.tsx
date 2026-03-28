'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

type AdminStats = {
  totalUsers: number
  newUsersThisMonth: number
  activeUsersThisMonth: number
  totalExports: number
  exportsThisMonth: number
  totalComments: number
  activeSubscriptions: number
  planBreakdown: Record<string, number>
  lastUpdated: string
}

type FreeUsersData = {
  count: number
  emails: string[]
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4">
      <div className="text-xl font-bold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[#888888] text-xs">{label}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4 animate-pulse">
      <div className="h-6 w-16 bg-white/[0.07] rounded mb-2" />
      <div className="h-3 w-24 bg-white/[0.05] rounded" />
    </div>
  )
}

export default function AdminStatsWidget() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [freeUsers, setFreeUsers] = useState<FreeUsersData | null>(null)
  const [showEmails, setShowEmails] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setStats(data)
      })
      .catch(() => setError('Failed to load stats'))

    fetch('/api/admin/free-users')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setFreeUsers(data)
      })
      .catch(() => {})
  }, [])

  function copyEmails() {
    if (!freeUsers) return
    navigator.clipboard.writeText(freeUsers.emails.join(', ')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const planOrder = ['free', 'pro', 'business', 'enterprise', 'lifetime']
  const planColors: Record<string, string> = {
    free: 'text-[#888888]',
    pro: 'text-blue-400',
    business: 'text-purple-400',
    enterprise: 'text-yellow-400',
    lifetime: 'text-green-400',
  }

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1] text-sm">Platform Stats</h2>
          <span className="text-xs text-[#555555]">admin</span>
        </div>
        <Link href="/api/admin/stats" target="_blank" className="text-red-400 hover:text-red-300 text-xs">
          Raw JSON →
        </Link>
      </div>

      {error && (
        <div className="text-red-400 text-xs">{error}</div>
      )}

      {!error && (
        <>
          {/* Users + Exports grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {stats ? (
              <>
                <StatCard label="Total Users" value={stats.totalUsers} />
                <StatCard label="New Users This Month" value={stats.newUsersThisMonth} />
                <StatCard label="Active Users This Month" value={stats.activeUsersThisMonth} />
                <StatCard label="Total Exports" value={stats.totalExports} />
                <StatCard label="Exports This Month" value={stats.exportsThisMonth} />
                <StatCard label="Total Comments Downloaded" value={stats.totalComments} />
              </>
            ) : (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            )}
          </div>

          {/* Subscriptions row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {stats ? (
              <>
                <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
                <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4 col-span-1 sm:col-span-2">
                  <div className="text-xs text-[#888888] mb-2">Plan Breakdown</div>
                  <div className="flex flex-wrap gap-3">
                    {planOrder
                      .filter(p => (stats.planBreakdown[p] ?? 0) > 0)
                      .map(plan => (
                        <div key={plan} className="flex items-baseline gap-1">
                          <span className={`text-sm font-bold ${planColors[plan] ?? 'text-white'}`}>
                            {stats.planBreakdown[plan]}
                          </span>
                          <span className="text-[#555555] text-xs capitalize">{plan}</span>
                        </div>
                      ))}
                    {Object.keys(stats.planBreakdown).filter(p => !planOrder.includes(p)).map(plan => (
                      <div key={plan} className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-white">{stats.planBreakdown[plan]}</span>
                        <span className="text-[#555555] text-xs capitalize">{plan}</span>
                      </div>
                    ))}
                    {Object.keys(stats.planBreakdown).length === 0 && (
                      <span className="text-[#555555] text-xs">No active subscriptions</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <SkeletonCard />
                <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4 col-span-1 sm:col-span-2 animate-pulse">
                  <div className="h-3 w-24 bg-white/[0.05] rounded mb-2" />
                  <div className="flex gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-4 w-12 bg-white/[0.07] rounded" />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Free users panel */}
          <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[#888888] mb-1">Free Users</div>
                {freeUsers ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-[#888888]">{freeUsers.count.toLocaleString()}</span>
                    <span className="text-[#555555] text-xs">users on free plan</span>
                  </div>
                ) : (
                  <div className="h-6 w-12 bg-white/[0.07] rounded animate-pulse" />
                )}
              </div>
              {freeUsers && freeUsers.count > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyEmails}
                    className="flex items-center gap-1 text-xs text-[#888888] hover:text-white border border-white/[0.07] rounded-lg px-2 py-1 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy all emails'}
                  </button>
                  <button
                    onClick={() => setShowEmails(v => !v)}
                    className="flex items-center gap-1 text-xs text-[#888888] hover:text-white border border-white/[0.07] rounded-lg px-2 py-1 transition-colors"
                  >
                    {showEmails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showEmails ? 'Hide emails' : 'Show emails'}
                  </button>
                </div>
              )}
            </div>
            {showEmails && freeUsers && freeUsers.emails.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto border border-white/[0.05] rounded-lg p-3 space-y-1">
                {freeUsers.emails.map(email => (
                  <div key={email} className="text-xs text-[#aaaaaa] font-mono">{email}</div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {stats && (
            <div className="text-[#444444] text-xs">Last updated: {stats.lastUpdated}</div>
          )}
        </>
      )}
    </div>
  )
}
