import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Download, Key, Users, BarChart2, FileText, Zap } from 'lucide-react'

const mockExports = [
  { id: '1', url: 'youtube.com/watch?v=dQw4w9WgXcQ', format: 'CSV', comments: 1247, status: 'completed', date: '2025-01-15' },
  { id: '2', url: 'youtube.com/watch?v=9bZkp7q19f0', format: 'JSON', comments: 3892, status: 'completed', date: '2025-01-14' },
  { id: '3', url: 'youtube.com/watch?v=fRh_vgS2dFE', format: 'Excel', comments: 567, status: 'completed', date: '2025-01-13' },
  { id: '4', url: 'youtube.com/watch?v=CevxZvSJLk8', format: 'CSV', comments: 0, status: 'failed', date: '2025-01-12' },
  { id: '5', url: 'youtube.com/watch?v=M7lc1UVf-VE', format: 'TXT', comments: 2103, status: 'completed', date: '2025-01-11' },
]

const stats = [
  { label: 'Exports This Month', value: '14', icon: FileText, color: 'text-blue-400' },
  { label: 'Comments Downloaded', value: '47,892', icon: BarChart2, color: 'text-green-400' },
  { label: 'API Calls', value: '1,203', icon: Zap, color: 'text-yellow-400' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Here&apos;s your export activity</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#13131a] border border-[#1f1f2e] text-gray-400 text-xs px-3 py-1 rounded-full">Free Plan</span>
            <Link href="/tool" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Export
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-[#13131a] border border-[#1f1f2e] rounded-xl p-5 flex items-center gap-4">
              <div className="bg-[#1f1f2e] w-10 h-10 rounded-lg flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-gray-500 text-xs">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Exports */}
        <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl overflow-hidden mb-8">
          <div className="p-5 border-b border-[#1f1f2e]">
            <h2 className="font-semibold text-white">Recent Exports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f1f2e] bg-[#0d0d14]">
                  {['URL', 'Format', 'Comments', 'Status', 'Date', 'Download'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockExports.map(e => (
                  <tr key={e.id} className="border-b border-[#1f1f2e] hover:bg-[#0d0d14] transition-colors">
                    <td className="px-5 py-3.5 text-blue-400 text-xs">{e.url}</td>
                    <td className="px-5 py-3.5 text-gray-300">{e.format}</td>
                    <td className="px-5 py-3.5 text-gray-300">{e.comments.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.status === 'completed' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{e.date}</td>
                    <td className="px-5 py-3.5">
                      {e.status === 'completed' && (
                        <button className="text-gray-500 hover:text-white transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* API Key */}
          <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-white">API Key</h2>
            </div>
            <div className="bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl p-3 flex items-center gap-3 mb-3">
              <code className="text-gray-500 text-xs flex-1">••••••••••••••••••••••••••••••</code>
            </div>
            <p className="text-gray-600 text-xs">Available on Business & Enterprise plans. <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade</Link></p>
          </div>

          {/* Team */}
          <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-white">Team Members</h2>
            </div>
            <div className="flex items-center gap-3 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl p-3 mb-3">
              <div className="w-8 h-8 bg-red-900 rounded-full flex items-center justify-center text-red-200 text-xs font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-white text-sm">{user?.email || 'Your Account'}</div>
                <div className="text-gray-500 text-xs">Owner</div>
              </div>
            </div>
            <p className="text-gray-600 text-xs">Team seats available on Business & Enterprise. <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
