import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Key, Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name
  const firstName = displayName ? displayName.split(' ')[0] : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Welcome back{firstName ? `, ${firstName}` : (user?.email ? `, ${user.email.split('@')[0]}` : '')}
            </h1>
            <p className="text-[#888888] text-sm mt-1">Here&apos;s your export activity</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#171717] border border-white/[0.07] text-[#888888] text-xs px-3 py-1 rounded-full">Free Plan</span>
            <Link
              href="/tool"
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Export
            </Link>
          </div>
        </div>

        {/* Stats — empty state */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Exports This Month', value: '0' },
            { label: 'Comments Downloaded', value: '0' },
            { label: 'API Calls', value: '0' },
          ].map(s => (
            <div key={s.label} className="bg-[#171717] border border-white/[0.07] rounded-xl p-5">
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-[#888888] text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Exports — empty state */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
          <div className="p-5 border-b border-white/[0.07]">
            <h2 className="font-semibold text-white">Recent Exports</h2>
          </div>
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 bg-[#171717] rounded-xl flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-[#888888]" />
            </div>
            <p className="text-[#888888] text-sm font-medium mb-1">No downloads yet</p>
            <p className="text-[#888888] text-xs mb-5">Head to the Tool to export your first comment thread.</p>
            <Link
              href="/tool"
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Go to Tool
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API Key */}
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-[#888888]" />
              <h2 className="font-semibold text-white">API Key</h2>
            </div>
            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mb-3">
              <code className="text-[#888888] text-xs flex-1">••••••••••••••••••••••••••••••</code>
            </div>
            <p className="text-[#888888] text-xs">
              Available on Business &amp; Enterprise plans.{' '}
              <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade</Link>
            </p>
          </div>

          {/* Team */}
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#888888]" />
              <h2 className="font-semibold text-white">Team Members</h2>
            </div>
            <div className="flex items-center gap-3 bg-[#0a0a0a] border border-white/[0.07] rounded-xl p-3 mb-3">
              <div className="w-8 h-8 bg-red-900 rounded-full flex items-center justify-center text-red-200 text-xs font-bold">
                {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-white text-sm">{displayName || user?.email || 'Your Account'}</div>
                <div className="text-[#888888] text-xs">Owner</div>
              </div>
            </div>
            <p className="text-[#888888] text-xs">
              Team seats available on Business &amp; Enterprise.{' '}
              <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
