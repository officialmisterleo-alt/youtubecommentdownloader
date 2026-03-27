'use client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 bg-[#1a0a0a] hover:bg-red-950 border border-red-900/50 text-red-400 hover:text-red-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  )
}
