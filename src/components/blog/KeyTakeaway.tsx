import type { ReactNode } from 'react'

export default function KeyTakeaway({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 rounded-xl border border-red-600 bg-red-600/10 px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-400 mb-2">
        Key Takeaway
      </p>
      <div className="text-[#d0d0d0] text-sm leading-relaxed">{children}</div>
    </div>
  )
}
