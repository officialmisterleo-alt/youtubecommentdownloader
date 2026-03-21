'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Youtube, Wrench, CreditCard, LayoutDashboard, LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navLinks = [
  { href: '/tool',      label: 'Tool',      icon: Wrench },
  { href: '/pricing',   label: 'Pricing',   icon: CreditCard },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); setLoaded(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!open && !dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpen(false)
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, dropdownOpen])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || null
  const firstName = displayName ? displayName.split(' ')[0] : null
  const initials = displayName ? displayName[0].toUpperCase() : (user?.email?.[0]?.toUpperCase() ?? 'U')

  return (
    <>
      <nav ref={navRef} className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">

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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[#888888] hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right auth — desktop */}
            <div className={`hidden md:flex items-center justify-end gap-1 transition-opacity duration-150 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="w-7 h-7 bg-red-900 rounded-full flex items-center justify-center text-red-200 text-xs font-bold">
                      {initials}
                    </div>
                    <span className="text-sm text-[#888888] max-w-[140px] truncate">{firstName || displayName || user.email}</span>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#111111] border border-white/[0.1] rounded-xl shadow-xl overflow-hidden z-50">
                      <Link
                        href="/account"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#888888] hover:text-white hover:bg-white/[0.05] transition-colors"
                      >
                        <User size={14} />
                        Account
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#888888] hover:text-white hover:bg-white/[0.05] transition-colors"
                      >
                        <LayoutDashboard size={14} />
                        Dashboard
                      </Link>
                      <div className="border-t border-white/[0.07]">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-white/[0.05] transition-colors"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm text-[#888888] hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Animated hamburger — mobile */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-colors"
              aria-label="Toggle menu"
            >
              <span className={`absolute block w-5 h-0.5 bg-[#888] transition-all duration-200 ${open ? 'rotate-45' : '-translate-y-[6px]'}`} />
              <span className={`absolute block w-5 h-0.5 bg-[#888] transition-all duration-200 ${open ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`absolute block w-5 h-0.5 bg-[#888] transition-all duration-200 ${open ? '-rotate-45' : 'translate-y-[6px]'}`} />
            </button>
          </div>
        </div>

        {/* Mobile slide-down panel */}
        <div className={`md:hidden overflow-hidden transition-all duration-200 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="bg-[#0a0a0a] border-t border-white/[0.07]">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-6 border-b border-white/[0.05] text-[#888888] hover:text-white hover:bg-white/[0.04] transition-colors text-sm font-medium"
                style={{ minHeight: 52 }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-6 border-b border-white/[0.05] text-[#888888] hover:text-white hover:bg-white/[0.04] transition-colors text-sm font-medium"
                  style={{ minHeight: 52 }}
                >
                  <div className="w-6 h-6 bg-red-900 rounded-full flex items-center justify-center text-red-200 text-xs font-bold">
                    {initials}
                  </div>
                  Account
                </Link>
                <div className="px-6 py-4">
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-[#1a0a0a] hover:bg-red-950 border border-red-900/50 text-red-400 font-medium px-4 py-3 rounded-lg text-center transition-colors text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center px-6 border-b border-white/[0.05] text-[#888888] hover:text-white hover:bg-white/[0.04] transition-colors text-sm font-medium"
                  style={{ minHeight: 52 }}
                >
                  Sign In
                </Link>
                <div className="px-6 py-4">
                  <Link
                    href="/auth/signup"
                    onClick={() => setOpen(false)}
                    className="block bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-3 rounded-lg text-center transition-colors text-sm"
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
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
