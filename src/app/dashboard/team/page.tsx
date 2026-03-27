'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, UserPlus, Trash2, Shield, ShieldOff, Mail,
  Crown, ChevronRight, X, AlertCircle, Check
} from 'lucide-react'

type TeamMember = {
  id: string
  user_id: string
  role: 'admin' | 'member'
  status: 'active' | 'deactivated'
  invited_email: string | null
  full_name: string | null
  email: string | null
  joined_at: string | null
  created_at: string
}

type PendingInvitation = {
  id: string
  email: string
  status: string
  created_at: string
  expires_at: string
  joinUrl?: string
}

type Team = {
  id: string
  name: string
  plan: string
  max_seats: number
}

type TeamData = {
  team: Team
  members: TeamMember[]
  userRole: 'admin' | 'member'
  usedSeats: number
}

function getInitials(member: TeamMember): string {
  if (member.full_name) {
    return member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return (member.email ?? member.invited_email ?? '?')[0].toUpperCase()
}

function getDisplayName(member: TeamMember): string {
  return member.full_name ?? member.email ?? member.invited_email ?? 'Unknown'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ---- Invite Modal ----
function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: (inv: PendingInvitation) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to send invite'); return }
      onInvited(data.invitation)
      onClose()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Invite Team Member</h2>
          <button onClick={onClose} className="text-[#888888] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-[#888888] text-xs mb-2">Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#555555] outline-none focus:border-white/20 mb-4"
            autoFocus
            required
          />
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs mb-4">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#0a0a0a] border border-white/[0.07] text-[#888888] hover:text-white py-2.5 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Mail className="w-4 h-4" /> Send Invite</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Main Page ----
export default function TeamPage() {
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fetchTeam = useCallback(async () => {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/teams/members'),
        fetch('/api/teams/invitations'),
      ])
      if (!membersRes.ok) {
        const d = await membersRes.json()
        setError(d.error ?? 'Failed to load team')
        return
      }
      const data = await membersRes.json()
      setTeamData(data)

      if (invitesRes.ok) {
        const invData = await invitesRes.json()
        setInvitations(invData.invitations ?? [])
      }
    } catch {
      setError('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  async function updateMember(memberId: string, body: Record<string, string>) {
    setActionLoading(memberId)
    try {
      const res = await fetch(`/api/teams/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Action failed', false); return }
      showToast('Member updated')
      await fetchTeam()
    } finally {
      setActionLoading(null)
    }
  }

  async function removeMember(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return
    setActionLoading(memberId)
    try {
      const res = await fetch(`/api/teams/members/${memberId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to remove member', false); return }
      showToast(`${name} removed from team`)
      await fetchTeam()
    } finally {
      setActionLoading(null)
    }
  }

  async function revokeInvitation(invId: string, email: string) {
    if (!confirm(`Revoke invitation for ${email}?`)) return
    setActionLoading(invId)
    try {
      const res = await fetch(`/api/teams/invitations/${invId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Failed to revoke', false); return }
      setInvitations(prev => prev.filter(i => i.id !== invId))
      showToast('Invitation revoked')
    } finally {
      setActionLoading(null)
    }
  }

  // Not in a team yet
  if (!loading && error === 'You are not part of a team') {
    return (
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-[#0a0a0a] border border-white/[0.07] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Users className="w-7 h-7 text-[#888888]" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">No team yet</h2>
          <p className="text-[#888888] text-sm mb-6 max-w-sm mx-auto">
            Business and Enterprise plan owners can create a team and invite members to share access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={async () => {
                const res = await fetch('/api/teams/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                })
                const d = await res.json()
                if (!res.ok) { showToast(d.error ?? 'Failed to create team', false); return }
                showToast('Team created!')
                setTimeout(() => window.location.reload(), 1500)
                await fetchTeam()
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Create Team
            </button>
            <Link href="/pricing" className="bg-[#0a0a0a] border border-white/[0.07] text-[#888888] hover:text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors text-center">
              View Plans
            </Link>
          </div>
        </div>
        {toast && <Toast toast={toast} />}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-red-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error && error !== 'You are not part of a team') {
    return (
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="bg-red-900/10 border border-red-900/30 rounded-2xl p-6 text-center">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!teamData) return null

  const { team, members, userRole, usedSeats } = teamData
  const isAdmin = userRole === 'admin'
  const atLimit = usedSeats >= team.max_seats

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
      {toast && <Toast toast={toast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#888888] text-xs mb-2">
            <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Team</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{team.name}</h1>
          <p className="text-[#888888] text-sm mt-1">
            <span className="text-white font-medium">{usedSeats}</span> of{' '}
            <span className="text-white font-medium">{team.max_seats}</span> seats used
            {' · '}
            <span className="capitalize text-[#888888]">{team.plan} plan</span>
          </p>
        </div>
        {isAdmin && (
          <div title={atLimit ? 'Seat limit reached — remove a member to invite more' : undefined}>
            <button
              onClick={() => !atLimit && setShowInviteModal(true)}
              disabled={atLimit}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {atLimit ? 'Seat limit reached' : 'Invite Member'}
            </button>
          </div>
        )}
      </div>

      {/* Seat usage bar */}
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-sm font-medium">Seat Usage</span>
          <span className="text-[#888888] text-xs">{usedSeats} / {team.max_seats}</span>
        </div>
        <div className="w-full bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all ${atLimit ? 'bg-red-500' : 'bg-red-600'}`}
            style={{ width: `${Math.min((usedSeats / team.max_seats) * 100, 100)}%` }}
          />
        </div>
        {atLimit && (
          <p className="text-[#888888] text-xs mt-2">
            Seat limit reached.{' '}
            <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade your plan</Link>
            {' '}or remove a member to free a seat.
          </p>
        )}
      </div>

      {/* Members list */}
      <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-white/[0.07]">
          <h2 className="text-white font-semibold">Members</h2>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {members.map(member => {
            const isLoading = actionLoading === member.id
            const isCurrentUser = member.user_id === members.find(m => m.role === 'admin')?.user_id
            return (
              <div key={member.id} className="px-5 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-red-900 text-red-200 flex items-center justify-center text-xs font-bold shrink-0">
                  {getInitials(member)}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium truncate">{getDisplayName(member)}</span>
                    {member.role === 'admin' && (
                      <span className="flex items-center gap-1 text-yellow-400 bg-yellow-900/20 border border-yellow-900/40 text-xs px-1.5 py-0.5 rounded">
                        <Crown className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {member.status === 'deactivated' && (
                      <span className="text-[#888888] bg-white/[0.04] border border-white/[0.07] text-xs px-1.5 py-0.5 rounded">
                        Deactivated
                      </span>
                    )}
                  </div>
                  <div className="text-[#888888] text-xs mt-0.5">
                    {member.email && member.email !== getDisplayName(member) ? member.email : null}
                    {member.joined_at ? ` · Joined ${timeAgo(member.joined_at)}` : ' · Pending'}
                  </div>
                </div>
                {/* Actions (admin only, not self-locked) */}
                {isAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {member.status === 'active' && (
                          <button
                            onClick={() => updateMember(member.id, { status: 'deactivated' })}
                            title="Deactivate"
                            className="text-[#888888] hover:text-yellow-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
                          >
                            <ShieldOff className="w-4 h-4" />
                          </button>
                        )}
                        {member.status === 'deactivated' && (
                          <button
                            onClick={() => updateMember(member.id, { status: 'active' })}
                            title="Reactivate"
                            className="text-[#888888] hover:text-green-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {member.role === 'member' && (
                          <button
                            onClick={() => updateMember(member.id, { role: 'admin' })}
                            title="Make admin"
                            className="text-[#888888] hover:text-yellow-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        )}
                        {member.role === 'admin' && !isCurrentUser && (
                          <button
                            onClick={() => updateMember(member.id, { role: 'member' })}
                            title="Remove admin"
                            className="text-[#888888] hover:text-[#aaaaaa] transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
                          >
                            <Crown className="w-4 h-4 opacity-50" />
                          </button>
                        )}
                        <button
                          onClick={() => removeMember(member.id, getDisplayName(member))}
                          title="Remove member"
                          className="text-[#888888] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending invitations (admin only) */}
      {isAdmin && invitations.length > 0 && (
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <h2 className="text-white font-semibold">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {invitations.map(inv => (
              <div key={inv.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-[#0a0a0a] border border-white/[0.07] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#888888]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{inv.email}</div>
                  <div className="text-[#888888] text-xs mt-0.5">
                    Sent {timeAgo(inv.created_at)} · Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => revokeInvitation(inv.id, inv.email)}
                  disabled={actionLoading === inv.id}
                  title="Revoke invitation"
                  className="text-[#888888] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/[0.04] disabled:opacity-50"
                >
                  {actionLoading === inv.id
                    ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin block" />
                    : <X className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={(inv) => {
            setInvitations(prev => [inv, ...prev])
          }}
        />
      )}
    </div>
  )
}

function Toast({ toast }: { toast: { msg: string; ok: boolean } }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg transition-all
      ${toast.ok
        ? 'bg-[#171717] border-green-900/40 text-green-400'
        : 'bg-[#171717] border-red-900/40 text-red-400'
      }`}
    >
      {toast.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {toast.msg}
    </div>
  )
}
