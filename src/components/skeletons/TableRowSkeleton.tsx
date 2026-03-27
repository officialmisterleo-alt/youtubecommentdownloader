export function TableRowSkeleton() {
  return (
    <tr className="border-t border-white/[0.05]">
      <td className="px-4 py-3"><div className="h-3 w-40 bg-white/5 animate-pulse rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-24 bg-white/5 animate-pulse rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-12 bg-white/5 animate-pulse rounded" /></td>
      <td className="px-4 py-3"><div className="h-5 w-14 bg-white/5 animate-pulse rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-white/5 animate-pulse rounded" /></td>
    </tr>
  )
}
