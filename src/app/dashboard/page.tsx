import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Key, Users, ExternalLink, FileText } from 'lucide-react'

type ExportRecord = {
  id: string
  video_url: string
  video_title: string
  channel_name: string
  comment_count: number
  format: string
  created_at: string
}

const FORMAT_COLORS: Record<string, string> = {
  CSV: 'text-green-400 bg-green-900/20 border-green-900/40',
  JSON: 'text-blue-400 bg-blue-900/20 border-blue-900/40',
  Excel: 'text-emerald-400 bg-emerald-900/20 border-emerald-900/40',
  HTML: 'text-orange-400 bg-orange-900/20 border-orange-900/40',
  TXT: 'text-[#888888] bg-white/[0.04] border-white/[0.07]',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name
  const firstName = displayName ? displayName.split(' ')[0] : null

  // Fetch export history — gracefully handle if table doesn't exist yet
  let allExports: ExportRecord[] = []
  try {
    const { data } = await supabase
      .from('exports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    allExports = (data as ExportRecord[]) ?? []
  } catch { /* table may not exist yet */ }

  // Stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonth = allExports.filter(e => e.created_at >= startOfMonth)
  const exportsThisMonth = thisMonth.length
  const commentsThisMonth = thisMonth.reduce((s, e) => s + (e.comment_count ?? 0), 0)
  const recentExports = allExports.slice(0, 10)

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
            <Link href="/tool" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Export
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Exports This Month', value: exportsThisMonth.toLocaleString() },
            { label: 'Comments Downloaded', value: commentsThisMonth.toLocaleString() },
            { label: 'Total Exports', value: allExports.length.toLocaleString() },
          ].map(s => (
            <div key={s.label} className="bg-[#171717] border border-white/[0.07] rounded-xl p-5">
              <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-[#888888] text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Exports */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
          <div className="p-5 border-b border-white/[0.07] flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Exports</h2>
            {allExports.length > 10 && (
              <span className="text-[#888888] text-xs">{allExports.length} total</span>
            )}
          </div>

          {recentExports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 bg-[#0a0a0a] border border-white/[0.07] rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-[#888888]" />
              </div>
              <p className="text-[#888888] text-sm font-medium mb-1">No exports yet</p>
              <p className="text-[#888888] text-xs mb-5">Head to the Tool to export your first comment thread.</p>
              <Link href="/tool" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                Go to Tool
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0a0a0a]">
                  <tr>
                    {['Video', 'Channel', 'Comments', 'Format', 'When'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[#888888] font-medium text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentExports.map(e => (
                    <tr key={e.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs truncate" title={e.video_title || e.video_url}>
                            {e.video_title || e.video_url || '—'}
                          </span>
                          {e.video_url && (
                            <a href={e.video_url} target="_blank" rel="noopener noreferrer" className="text-[#555555] hover:text-[#888888] shrink-0">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#888888] text-xs whitespace-nowrap max-w-[140px] truncate">
                        {e.channel_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-white text-xs whitespace-nowrap font-medium">
                        {(e.comment_count ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${FORMAT_COLORS[e.format] ?? FORMAT_COLORS.TXT}`}>
                          {e.format}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#888888] text-xs whitespace-nowrap">
                        {timeAgo(e.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* API Key + Team */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
