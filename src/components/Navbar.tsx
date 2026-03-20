'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Youtube, Wrench, CreditCard, LayoutDashboard } from 'lucide-react'

const navLinks = [
  { href: '/tool',      label: 'Tool',      icon: Wrench },
  { href: '/pricing',   label: 'Pricing',   icon: CreditCard },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <>
      <nav ref={navRef} className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="bg-red-600 rounded p-1">
                <Youtube className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">YTCommentDownloader</span>
            </Link>

            {/* Center nav links — desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right auth — desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/auth/login"
                className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-md hover:bg-white/5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-medium bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Animated hamburger — mobile */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`absolute block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${open ? 'rotate-45' : '-translate-y-[6px]'}`} />
              <span className={`absolute block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`absolute block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${open ? '-rotate-45' : 'translate-y-[6px]'}`} />
            </button>
          </div>
        </div>

        {/* Mobile slide-down panel */}
        <div className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-gray-950 border-t border-white/10">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-6 border-b border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                style={{ minHeight: 52 }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex items-center px-6 border-b border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
              style={{ minHeight: 52 }}
            >
              Sign In
            </Link>
            <div className="px-6 py-4">
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="block bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-3 rounded-md text-center transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
