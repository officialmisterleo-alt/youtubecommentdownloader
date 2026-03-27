export default function StatCard({
  value,
  label,
  sub,
}: {
  value: string
  label: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#171717] p-5 flex flex-col gap-1">
      <span className="text-3xl font-bold tracking-tight text-red-500">
        {value}
      </span>
      <span className="text-sm font-medium text-white">{label}</span>
      {sub && <span className="text-xs text-[#666]">{sub}</span>}
    </div>
  )
}
