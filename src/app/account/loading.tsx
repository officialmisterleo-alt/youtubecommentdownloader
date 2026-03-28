import { CardSkeleton } from '@/components/skeletons/CardSkeleton'

export default function AccountLoading() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold font-jakarta text-[#e5e2e1] mb-8">Account</h1>

        {/* Profile card skeleton */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden mb-6">
          <div className="p-6 border-b border-white/[0.07] flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 animate-pulse rounded-full shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-white/5 animate-pulse rounded" />
              <div className="h-3 w-28 bg-white/5 animate-pulse rounded" />
            </div>
          </div>
          <div className="px-6 py-4 border-b border-white/[0.07]">
            <div className="h-3 w-10 bg-white/5 animate-pulse rounded mb-1" />
            <div className="h-4 w-48 bg-white/5 animate-pulse rounded" />
          </div>
          <div className="px-6 py-4">
            <div className="h-3 w-20 bg-white/5 animate-pulse rounded mb-1" />
            <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
          </div>
        </div>

        <CardSkeleton className="mb-6" />
        <CardSkeleton className="mb-6" />

        {/* Sign out card */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
          <div className="h-4 w-20 bg-white/5 animate-pulse rounded mb-2" />
          <div className="h-3 w-52 bg-white/5 animate-pulse rounded mb-4" />
          <div className="h-10 w-28 bg-white/5 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  )
}
