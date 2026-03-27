export default function StatCard({
  value,
  label,
  sub,
  accent = 'red',
}: {
  value: string
  label: string
  sub?: string
  accent?: 'red' | 'blue' | 'purple' | 'green'
}) {
  const colors = {
    red: 'text-red-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-emerald-400',
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 flex flex-col gap-1">
      <span className={`text-3xl font-bold tracking-tight ${colors[accent]}`}>
        {value}
      </span>
      <span className="text-sm font-medium text-white">{label}</span>
      {sub && <span className="text-xs text-[#666]">{sub}</span>}
    </div>
  )
}
