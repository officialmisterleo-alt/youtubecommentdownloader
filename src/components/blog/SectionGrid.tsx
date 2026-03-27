import type { ReactNode } from 'react'

export default function SectionGrid({
  cols = 2,
  children,
}: {
  cols?: 2 | 3
  children: ReactNode
}) {
  return (
    <div
      className={`my-6 grid gap-4 ${
        cols === 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2'
      }`}
    >
      {children}
    </div>
  )
}
