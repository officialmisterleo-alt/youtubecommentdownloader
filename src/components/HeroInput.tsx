'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'

export default function HeroInput() {
  const [url, setUrl] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) {
      router.push(`/tool?url=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full mt-8">
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a YouTube video URL..."
          className="flex-1 bg-[#13131a] border border-[#1f1f2e] focus:border-red-600 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none text-sm sm:text-base transition-colors min-w-0"
        />
        <button
          type="submit"
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-6 py-4 rounded-xl transition-colors text-sm sm:text-base whitespace-nowrap flex items-center justify-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          Download Comments
        </button>
      </div>
      <p className="text-gray-600 text-xs mt-2.5">
        Works with any public YouTube video, playlist, or channel URL
      </p>
    </form>
  )
}
