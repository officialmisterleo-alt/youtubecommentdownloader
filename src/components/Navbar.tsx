'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Youtube } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur border-b border-[#1f1f2e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-red-600 rounded p-1">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-sm sm:text-base">YTCommentDownloader</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/tool" className="text-gray-300 hover:text-white text-sm transition-colors">Tool</Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white text-sm transition-colors">Pricing</Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white text-sm transition-colors">Dashboard</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login" className="text-gray-300 hover:text-white text-sm transition-colors px-3 py-1.5">Sign In</Link>
            <Link href="/auth/signup" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">Get Started</Link>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-300">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {open && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/tool" className="block text-gray-300 hover:text-white py-2 text-sm">Tool</Link>
            <Link href="/pricing" className="block text-gray-300 hover:text-white py-2 text-sm">Pricing</Link>
            <Link href="/dashboard" className="block text-gray-300 hover:text-white py-2 text-sm">Dashboard</Link>
            <Link href="/auth/login" className="block text-gray-300 hover:text-white py-2 text-sm">Sign In</Link>
            <Link href="/auth/signup" className="block bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg text-center mt-2">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
