'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'

type ProvisionResultActive = {
  success: true
  isPending: false
  userId: string
  teamId: string
  message: string
}

type ProvisionResultPending = {
  success: true
  isPending: true
  message: string
}

type ProvisionResult = ProvisionResultActive | ProvisionResultPending

const SEAT_OPTIONS = [10, 25, 50, 100] as const

export default function ProvisionForm() {
  const [email, setEmail] = useState('')
  const [teamName, setTeamName] = useState('')
  const [seats, setSeats] = useState<number>(10)
  const [customSeats, setCustomSeats] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProvisionResult | null>(null)
  const [resultEmail, setResultEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const effectiveSeats = isCustom ? parseInt(customSeats, 10) : seats

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    if (isCustom && (!customSeats || isNaN(parseInt(customSeats, 10)) || parseInt(customSeats, 10) < 1)) {
      setError('Please enter a valid seat count.')
      setLoading(false)
      return
    }

    const submittedEmail = email.trim()

    try {
      const res = await fetch('/api/admin/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: submittedEmail,
          teamName: teamName.trim(),
          seats: effectiveSeats,
        }),
      })

      const data: ProvisionResult | { error: string } = await res.json()

      if (!res.ok || !('success' in data)) {
        setError('error' in data ? data.error : 'Provisioning failed.')
      } else {
        setResult(data)
        setResultEmail(submittedEmail)
        // Reset form on success
        setEmail('')
        setTeamName('')
        setSeats(10)
        setCustomSeats('')
        setIsCustom(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.07] flex items-center gap-2">
        <Building2 className="w-5 h-5 text-[#888888]" />
        <h2 className="font-semibold font-jakarta text-[#e5e2e1]">Provision Enterprise Account</h2>
        <span className="text-xs text-[#555555]">admin</span>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          {/* Email */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5" htmlFor="provision-email">
              Customer Email
            </label>
            <input
              id="provision-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@company.com"
              className="w-full bg-[#0a0a0a] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Team Name */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5" htmlFor="provision-team">
              Team / Company Name
            </label>
            <input
              id="provision-team"
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full bg-[#0a0a0a] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Seats */}
          <div>
            <label className="block text-xs text-[#888888] mb-1.5">
              Seats
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {SEAT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setSeats(opt); setIsCustom(false) }}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    !isCustom && seats === opt
                      ? 'bg-yellow-900/30 border-yellow-900/50 text-yellow-400'
                      : 'bg-[#0a0a0a] border-white/[0.07] text-[#888888] hover:text-white hover:border-white/20'
                  }`}
                >
                  {opt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  isCustom
                    ? 'bg-yellow-900/30 border-yellow-900/50 text-yellow-400'
                    : 'bg-[#0a0a0a] border-white/[0.07] text-[#888888] hover:text-white hover:border-white/20'
                }`}
              >
                Custom
              </button>
              {isCustom && (
                <input
                  type="number"
                  min="1"
                  value={customSeats}
                  onChange={(e) => setCustomSeats(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-24 bg-[#0a0a0a] border border-white/[0.07] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#444444] focus:outline-none focus:border-white/20 transition-colors"
                />
              )}
            </div>
            <p className="text-[#555555] text-xs mt-1.5">
              {isCustom ? (customSeats ? `${customSeats} seats` : 'Enter seat count') : `${seats} seats · 1-year term`}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-900/30 disabled:text-yellow-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Provisioning…
              </>
            ) : (
              'Provision Account'
            )}
          </button>
        </form>

        {/* Error state */}
        {error && (
          <div className="mt-4 max-w-lg bg-red-900/20 border border-red-900/40 rounded-xl p-4">
            <p className="text-red-400 text-sm font-medium">Provisioning failed</p>
            <p className="text-red-400/70 text-xs mt-1">{error}</p>
          </div>
        )}

        {/* Success state — active */}
        {result && !result.isPending && (
          <div className="mt-4 max-w-lg bg-green-900/20 border border-green-900/40 rounded-xl p-4 space-y-3">
            <p className="text-green-400 text-sm font-medium">✓ Enterprise activated for {resultEmail}</p>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[#555555] text-xs w-20">Team ID</span>
                <code className="text-green-300/80 text-xs font-mono bg-black/30 px-2 py-0.5 rounded">
                  {result.teamId}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#555555] text-xs w-20">User ID</span>
                <code className="text-green-300/80 text-xs font-mono bg-black/30 px-2 py-0.5 rounded">
                  {result.userId}
                </code>
              </div>
            </div>

            <div className="bg-yellow-900/20 border border-yellow-900/40 rounded-lg p-3">
              <p className="text-yellow-400/70 text-xs">
                The existing user&apos;s subscription has been updated to Enterprise. Notify them if needed.
              </p>
            </div>

            <p className="text-[#555555] text-xs">{result.message}</p>
          </div>
        )}

        {/* Success state — pending */}
        {result && result.isPending && (
          <div className="mt-4 max-w-lg bg-blue-900/20 border border-blue-900/40 rounded-xl p-4 space-y-3">
            <p className="text-blue-400 text-sm font-medium">⏳ Pending slot created for {resultEmail}</p>

            <p className="text-blue-400/70 text-xs">
              They&apos;ll receive Enterprise automatically when they sign up with this email. No action needed.
            </p>

            <p className="text-[#555555] text-xs">{result.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
