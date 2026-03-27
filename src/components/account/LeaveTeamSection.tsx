'use client'
import { useState } from 'react'

export function LeaveTeamSection({ memberId }: { memberId: string }) {
  const [leaveConfirm, setLeaveConfirm] = useState(false)
  const [leaveLoading, setLeaveLoading] = useState(false)

  async function handleLeaveTeam() {
    setLeaveLoading(true)
    try {
      const res = await fetch(`/api/teams/members/${memberId}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to leave team')
      }
    } finally {
      setLeaveLoading(false)
      setLeaveConfirm(false)
    }
  }

  if (leaveConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#888888]">Are you sure?</span>
        <button
          onClick={handleLeaveTeam}
          disabled={leaveLoading}
          className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {leaveLoading ? 'Leaving...' : 'Yes, leave'}
        </button>
        <button
          onClick={() => setLeaveConfirm(false)}
          className="text-xs text-[#888888] hover:text-white border border-white/[0.07] px-3 py-1.5 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setLeaveConfirm(true)}
      className="text-xs text-[#888888] hover:text-red-400 border border-white/[0.07] hover:border-red-900/50 px-3 py-1.5 rounded-lg transition-colors"
    >
      Leave Team
    </button>
  )
}
