'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Youtube } from 'lucide-react'

const navLinks = [
  { href: '/tool', label: 'Tool' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/dashboard', label: 'Dashboard' },
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
      <nav ref={navRef} className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1f1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-red-600 rounded p-1">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-sm sm:text-base">YTCommentDownloader</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="text-gray-300 hover:text-white text-sm transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth/login" className="text-gray-300 hover:text-white text-sm transition-colors px-3 py-1.5">
                Sign In
              </Link>
              <Link href="/auth/signup" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                Get Started
              </Link>
            </div>

            {/* Animated hamburger button */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1f1f2e] transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`absolute block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${open ? 'rotate-45 translate-y-0' : '-translate-y-[6px]'}`} />
              <span className={`absolute block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`absolute block w-5 h-0.5 bg-gray-300 transition-all duration-200 ${open ? '-rotate-45 translate-y-0' : 'translate-y-[6px]'}`} />
            </button>
          </div>
        </div>

        {/* Mobile slide-down panel */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="bg-[#0d0d14] border-t border-[#1f1f2e]">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center px-6 border-b border-[#1f1f2e] text-gray-300 hover:text-white hover:bg-[#13131a] transition-colors text-base font-medium"
                style={{ minHeight: 52 }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="flex items-center px-6 border-b border-[#1f1f2e] text-gray-300 hover:text-white hover:bg-[#13131a] transition-colors text-base font-medium"
              style={{ minHeight: 52 }}
            >
              Sign In
            </Link>
            <div className="px-6 py-4">
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className="block bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3.5 rounded-xl text-center transition-colors text-base"
              >
                Get Started — Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Background overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
