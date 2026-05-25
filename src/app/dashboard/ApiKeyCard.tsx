'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Key, Copy, Check, RefreshCw } from 'lucide-react'

type ExistingKey = {
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

type Props = {
  effectivePlan: string
  existingKey: ExistingKey | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return formatDate(iso)
}

export default function ApiKeyCard({ effectivePlan, existingKey }: Props) {
  const isEnterprise = effectivePlan === 'enterprise'

  const [keyData, setKeyData] = useState<ExistingKey | null>(existingKey)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showConfirmRegen, setShowConfirmRegen] = useState(false)

  async function generateKey() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/keys/generate', { method: 'POST' })
      const data = await res.json() as { key?: string; prefix?: string; createdAt?: string; error?: string }
      if (!res.ok || !data.key) {
        setError(data.error ?? 'Failed to generate key')
        return
      }
      setRevealedKey(data.key)
      setKeyData({
        prefix: data.prefix!,
        createdAt: data.createdAt!,
        lastUsedAt: null,
      })
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
      setShowConfirmRegen(false)
    }
  }

  async function copyKey() {
    if (!revealedKey) return
    try {
      await navigator.clipboard.writeText(revealedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select the text
    }
  }

  function dismissReveal() {
    setRevealedKey(null)
  }

  // ── Not Enterprise ─────────────────────────────────────────────────────────
  if (!isEnterprise) {
    return (
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">API Key</h2>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mb-3">
          <code className="text-[#888888] text-xs flex-1 select-none">
            ••••••••••••••••••••••••••••••
          </code>
        </div>
        <p className="text-[#888888] text-xs">
          Available on Enterprise plans.{' '}
          <Link href="/pricing" className="text-red-400 hover:text-red-300">
            Upgrade
          </Link>
        </p>
      </div>
    )
  }

  // ── Confirm Regenerate Dialog ──────────────────────────────────────────────
  if (showConfirmRegen) {
    return (
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">API Key</h2>
        </div>
        <div className="bg-yellow-950/30 border border-yellow-700/30 rounded-xl p-4 mb-4">
          <p className="text-yellow-300 text-sm font-medium mb-1">Regenerate API key?</p>
          <p className="text-yellow-300/70 text-xs">
            Your existing key will be permanently invalidated. Any integrations using it will stop working immediately.
          </p>
        </div>
        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={generateKey}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            {loading ? 'Regenerating…' : 'Yes, regenerate'}
          </button>
          <button
            onClick={() => { setShowConfirmRegen(false); setError(null) }}
            disabled={loading}
            className="border border-white/[0.07] text-[#888888] hover:text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // ── Revealed Key (shown once after generate/regenerate) ────────────────────
  if (revealedKey) {
    return (
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">API Key</h2>
        </div>
        <div className="bg-yellow-950/30 border border-yellow-700/30 rounded-xl p-3 mb-3">
          <p className="text-yellow-300 text-xs font-medium">
            Copy this key now — it won&apos;t be shown again.
          </p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mb-4">
          <code className="text-green-400 text-xs flex-1 break-all font-mono">
            {revealedKey}
          </code>
          <button
            onClick={copyKey}
            className="shrink-0 text-[#888888] hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <button
          onClick={dismissReveal}
          className="border border-white/[0.07] text-[#888888] hover:text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          I&apos;ve saved it — dismiss
        </button>
      </div>
    )
  }

  // ── No Key Yet ─────────────────────────────────────────────────────────────
  if (!keyData) {
    return (
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-[#888888]" />
          <h2 className="font-semibold font-jakarta text-[#e5e2e1]">API Key</h2>
        </div>
        <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mb-3">
          <code className="text-[#888888] text-xs flex-1 select-none">
            No key generated yet
          </code>
        </div>
        {error && (
          <p className="text-red-400 text-xs mb-3">{error}</p>
        )}
        <button
          onClick={generateKey}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Key className="w-3 h-3" />
          )}
          {loading ? 'Generating…' : 'Generate API Key'}
        </button>
      </div>
    )
  }

  // ── Has Key (prefix display) ───────────────────────────────────────────────
  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-[#888888]" />
        <h2 className="font-semibold font-jakarta text-[#e5e2e1]">API Key</h2>
      </div>
      <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mb-3">
        <code className="text-[#e5e2e1] text-xs flex-1 font-mono">
          {keyData.prefix}
          <span className="text-[#555555]">{'•'.repeat(24)}</span>
        </code>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-0.5">
          <p className="text-[#555555] text-xs">
            Created {formatDate(keyData.createdAt)}
          </p>
          <p className="text-[#555555] text-xs">
            {keyData.lastUsedAt
              ? `Last used ${timeAgo(keyData.lastUsedAt)}`
              : 'Never used'}
          </p>
        </div>
      </div>
      {error && (
        <p className="text-red-400 text-xs mb-3">{error}</p>
      )}
      <button
        onClick={() => { setShowConfirmRegen(true); setError(null) }}
        className="flex items-center gap-1.5 text-[#888888] hover:text-red-400 text-xs font-medium transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        Regenerate key
      </button>
    </div>
  )
}
