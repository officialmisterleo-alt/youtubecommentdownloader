'use client'

import { useState } from 'react'
import Link from 'next/link'

const subjects = [
  'General Question',
  'Billing & Subscription',
  'Bug Report',
  'Enterprise Inquiry',
  'Other',
]

const inputClass =
  'w-full bg-[#0a0a0a] border border-white/[0.12] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#555555] focus:outline-none focus:border-white/30 transition-colors'

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: 'General Question',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('https://submit-form.com/EnHGMbha3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Submission failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#1c1c1c] to-[#111111] border border-white/[0.07] rounded-2xl p-6 sm:p-8 shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_1px_3px_rgba(0,0,0,0.4)]">
      {status === 'success' ? (
        <div className="text-center py-8">
          <div className="text-green-400 text-4xl mb-4">✓</div>
          <h2 className="text-[#e5e2e1] font-semibold font-jakarta text-lg mb-2">Message sent!</h2>
          <p className="text-[#888888] text-sm">
            Thanks! We&apos;ll get back to you within 1 business day.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#888888] text-xs font-medium mb-1.5 uppercase tracking-wider">
              Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[#888888] text-xs font-medium mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-[#888888] text-xs font-medium mb-1.5 uppercase tracking-wider">
              Subject
            </label>
            <select
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className={inputClass + ' cursor-pointer'}
            >
              {subjects.map(s => (
                <option key={s} value={s} className="bg-[#171717]">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#888888] text-xs font-medium mb-1.5 uppercase tracking-wider">
              Message
            </label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="How can we help?"
              className={inputClass + ' resize-none'}
            />
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm text-center">
              Something went wrong. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {status === 'submitting' ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  )
}
