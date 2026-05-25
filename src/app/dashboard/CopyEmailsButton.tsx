'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'

export default function CopyEmailsButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      const res = await fetch('/api/admin/free-users')
      const data = await res.json()
      const users: { email?: string }[] = Array.isArray(data) ? data : (data.users ?? [])
      const emails = users.map(u => u.email).filter(Boolean).join(', ')
      await navigator.clipboard.writeText(emails)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // non-fatal
    }
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs text-red-400 hover:text-red-300 bg-red-900/10 border border-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
    >
      <Copy className="w-3 h-3" />
      {copied ? 'Copied!' : 'Copy All Free User Emails'}
    </button>
  )
}
