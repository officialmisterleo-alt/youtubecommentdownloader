'use client'

import { useState } from 'react'
import { Copy } from 'lucide-react'

export default function CopyEmailsButton() {
  const [label, setLabel] = useState('Copy All Free User Emails')
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/free-users')
      if (!res.ok) throw new Error('Failed to fetch free users')
      const data = await res.json()
      const emailList: string[] = Array.isArray(data?.emails) ? data.emails : []
      const emails = emailList.filter(Boolean).join(', ')
      if (!emails) {
        setLabel('No free user emails')
        setTimeout(() => setLabel('Copy All Free User Emails'), 2000)
        return
      }
      await navigator.clipboard.writeText(emails)
      setLabel(`Copied ${emailList.length} emails`)
      setTimeout(() => setLabel('Copy All Free User Emails'), 2000)
    } catch {
      setLabel('Copy failed')
      setTimeout(() => setLabel('Copy All Free User Emails'), 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-red-400 hover:text-red-300 disabled:opacity-60 disabled:cursor-not-allowed bg-red-900/10 border border-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
    >
      <Copy className="w-3 h-3" />
      {loading ? 'Copying...' : label}
    </button>
  )
}
