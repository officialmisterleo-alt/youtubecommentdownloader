'use client'
import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputClass = 'w-full bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-2.5 text-white placeholder-[#555555] focus:outline-none focus:border-red-600/50 text-sm'
const btnPrimary = 'bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:cursor-not-allowed'

export function SecuritySection() {
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setEmailLoading(true)
    setEmailMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) {
      setEmailMsg({ type: 'error', text: error.message })
    } else {
      setEmailMsg({ type: 'success', text: 'Check both inboxes for confirmation links — your email will update once confirmed.' })
      setNewEmail('')
    }
    setEmailLoading(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setPasswordLoading(true)
    setPasswordMsg(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setPasswordLoading(false)
  }

  return (
    <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
      <div className="p-6 border-b border-white/[0.07]">
        <h2 className="text-sm font-semibold font-jakarta text-[#e5e2e1]">Security</h2>
        <p className="text-[#555555] text-xs mt-1">Update your email address or password.</p>
      </div>

      {/* Change email */}
      <form onSubmit={handleChangeEmail} className="p-6 border-b border-white/[0.07]">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-[#555555]" />
          <span className="text-sm font-medium text-white">Change Email</span>
        </div>
        <div className="space-y-3">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="New email address"
            required
            className={inputClass}
          />
          {emailMsg && (
            <p className={`text-xs ${emailMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {emailMsg.text}
            </p>
          )}
          <button type="submit" disabled={emailLoading} className={btnPrimary}>
            {emailLoading ? 'Sending...' : 'Update Email'}
          </button>
        </div>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[#555555]" />
          <span className="text-sm font-medium text-white">Change Password</span>
        </div>
        <div className="space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            className={inputClass}
          />
          {passwordMsg && (
            <p className={`text-xs ${passwordMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {passwordMsg.text}
            </p>
          )}
          <button type="submit" disabled={passwordLoading} className={btnPrimary}>
            {passwordLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
