'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row w-full max-w-xl mx-auto gap-2 mb-3">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste a YouTube URL..."
          className="flex-1 min-w-0 h-12 bg-[#171717] border border-white/10 rounded-lg px-4 text-white text-sm placeholder:text-[#555555] focus:outline-none focus:border-white/20 transition-colors"
        />
        <button
          type="submit"
          className="h-12 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 rounded-lg text-sm whitespace-nowrap transition-colors w-full sm:w-auto"
        >
          Download Comments
        </button>
      </div>
      <p className="text-xs text-[#555555] text-center">
        Works with any public YouTube video, playlist, or channel URL
      </p>
    </form>
  )
}
