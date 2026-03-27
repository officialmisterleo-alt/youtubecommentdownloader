'use client'
import { useEffect, useState } from 'react'

type TocItem = { id: string; label: string; level: 2 | 3 }

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>('')

  useEffect(() => {
    const observers = items.map(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id)
        },
        { rootMargin: '-20% 0px -60% 0px' }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [items])

  return (
    <nav className="hidden xl:block sticky top-24 w-56 shrink-0 self-start">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#555] mb-3">
        On this page
      </p>
      <ul className="space-y-1">
        {items.map(({ id, label, level }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block text-sm py-0.5 transition-colors ${
                level === 3 ? 'pl-3' : ''
              } ${
                active === id
                  ? 'text-red-400'
                  : 'text-[#555] hover:text-[#999]'
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
