export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-[#171717] border border-white/[0.07] rounded-2xl p-6 ${className ?? ''}`}>
      <div className="h-4 w-24 bg-white/5 animate-pulse rounded mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-white/5 animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded" />
      </div>
    </div>
  )
}
