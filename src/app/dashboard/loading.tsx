import { StatCardSkeleton } from '@/components/skeletons/StatCardSkeleton'
import { TableRowSkeleton } from '@/components/skeletons/TableRowSkeleton'
import { CardSkeleton } from '@/components/skeletons/CardSkeleton'

export default function DashboardLoading() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-56 bg-white/5 animate-pulse rounded" />
              <div className="h-6 w-20 bg-white/5 animate-pulse rounded-full" />
            </div>
            <div className="h-4 w-40 bg-white/5 animate-pulse rounded mt-2" />
          </div>
          <div className="h-9 w-44 bg-white/5 animate-pulse rounded-lg" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Quota bar */}
        <div className="mb-8 h-16 bg-white/5 animate-pulse rounded-xl" />

        {/* Recent Exports */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-8">
          <div className="p-5 border-b border-white/[0.07]">
            <div className="h-5 w-32 bg-white/5 animate-pulse rounded" />
          </div>
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
                {Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Key + Team */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>

      </div>
    </div>
  )
}
