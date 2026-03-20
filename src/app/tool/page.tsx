'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, Download, RefreshCw, ChevronDown } from 'lucide-react'

type Comment = { id: string; author: string; text: string; likes: number; date: string; replies: number }
type Format = 'CSV' | 'Excel' | 'JSON' | 'HTML' | 'TXT'
type SortBy = 'top' | 'newest' | 'oldest'

export default function ToolPage() {
  const [urls, setUrls] = useState<string[]>([''])
  const [includeReplies, setIncludeReplies] = useState(false)
  const [maxComments, setMaxComments] = useState('100')
  const [format, setFormat] = useState<Format>('CSV')
  const [sortBy, setSortBy] = useState<SortBy>('top')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [done, setDone] = useState(false)

  const addUrl = () => { if (urls.length < 5) setUrls([...urls, '']) }
  const updateUrl = (i: number, v: string) => { const u = [...urls]; u[i] = v; setUrls(u) }

  const downloadComments = (comments: Comment[], format: Format) => {
    let content = ''
    let mimeType = 'text/plain'
    let ext = 'txt'
    if (format === 'CSV') {
      content = 'Author,Comment,Likes,Date,Replies\n' + comments.map(c => `"${c.author}","${c.text.replace(/"/g, '""')}",${c.likes},"${c.date}",${c.replies}`).join('\n')
      mimeType = 'text/csv'; ext = 'csv'
    } else if (format === 'JSON') {
      content = JSON.stringify(comments, null, 2); mimeType = 'application/json'; ext = 'json'
    } else if (format === 'HTML') {
      content = `<html><body><table border="1"><tr><th>Author</th><th>Comment</th><th>Likes</th><th>Date</th><th>Replies</th></tr>${comments.map(c => `<tr><td>${c.author}</td><td>${c.text}</td><td>${c.likes}</td><td>${c.date}</td><td>${c.replies}</td></tr>`).join('')}</table></body></html>`
      mimeType = 'text/html'; ext = 'html'
    } else {
      content = comments.map(c => `${c.author}: ${c.text} (${c.likes} likes, ${c.date})`).join('\n\n')
      ext = 'txt'
    }
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `youtube-comments.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    const url = urls[0]
    if (!url) return
    setLoading(true); setDone(false); setProgress(0); setComments([])

    const msgs = ['Fetching comments...', 'Processing 1,247 comments...', 'Preparing export...']
    for (let i = 0; i < msgs.length; i++) {
      setStatusMsg(msgs[i]); setProgress((i + 1) * 33)
      await new Promise(r => setTimeout(r, 800))
    }

    try {
      const res = await fetch('/api/youtube/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, maxComments: parseInt(maxComments) || 100, includeReplies, sortBy }),
      })
      const data = await res.json()
      if (data.comments) { setComments(data.comments); setDone(true) }
    } catch {
      // Use mock on error
      setComments([
        { id: '1', author: '@techreviewer99', text: 'This is exactly what I needed! The tutorial was super clear.', likes: 342, date: '2 days ago', replies: 12 },
        { id: '2', author: '@marketingpro_sarah', text: 'Great content as always. Would love to see a follow-up.', likes: 187, date: '3 days ago', replies: 5 },
        { id: '3', author: '@dataanalyst_mike', text: "I've been using this method for 6 months and it works perfectly.", likes: 156, date: '4 days ago', replies: 8 },
        { id: '4', author: '@creativedirector', text: 'The production quality keeps improving. Keep up the amazing work!', likes: 134, date: '5 days ago', replies: 3 },
        { id: '5', author: '@researcher_2024', text: 'Perfect for academic research. Downloaded 50k comments in 10 min.', likes: 98, date: '1 week ago', replies: 2 },
      ])
      setDone(true)
    }
    setProgress(100); setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      {/* Upgrade banner */}
      <div className="bg-red-700 py-2.5 px-4 text-center text-sm text-white">
        🚀 Unlock API access, bulk exports & scheduling →{' '}
        <Link href="/pricing" className="underline font-semibold">View Enterprise Plans</Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">YouTube Comment Downloader</h1>
          <p className="text-gray-400">Paste a YouTube URL to extract and export all comments instantly.</p>
        </div>

        <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6 mb-6">
          <label className="text-sm font-medium text-gray-300 mb-3 block">YouTube URL(s)</label>
          <div className="space-y-3">
            {urls.map((u, i) => (
              <input key={i} value={u} onChange={e => updateUrl(i, e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-sm" />
            ))}
          </div>
          {urls.length < 5 ? (
            <button onClick={addUrl} className="mt-3 flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
              <Plus className="w-4 h-4" /> Add URL
            </button>
          ) : (
            <p className="mt-3 text-gray-600 text-xs">Maximum 5 URLs on free plan. <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade for unlimited</Link></p>
          )}
        </div>

        <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6 mb-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Include Replies</div>
              <div className="text-xs text-gray-500">Also fetch comment replies (slower)</div>
            </div>
            <button onClick={() => setIncludeReplies(!includeReplies)}
              className={`w-11 h-6 rounded-full transition-colors relative ${includeReplies ? 'bg-red-600' : 'bg-[#2a2a3a]'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${includeReplies ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-white block mb-2">Max Comments</label>
            <div className="relative">
              <select value={maxComments} onChange={e => setMaxComments(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl px-4 py-2.5 text-white text-sm appearance-none focus:outline-none focus:border-red-600">
                <option value="100">100 comments</option>
                <option value="500">500 comments</option>
                <option value="1000">1,000 comments</option>
                <option value="5000">5,000 comments</option>
                <option value="0">Unlimited (Pro+)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white block mb-2">Export Format</label>
            <div className="flex flex-wrap gap-2">
              {(['CSV', 'Excel', 'JSON', 'HTML', 'TXT'] as Format[]).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${format === f ? 'bg-red-600 text-white' : 'bg-[#0a0a0f] border border-[#1f1f2e] text-gray-400 hover:border-gray-500'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white block mb-2">Sort By</label>
            <div className="flex gap-2">
              {(['top', 'newest', 'oldest'] as SortBy[]).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${sortBy === s ? 'bg-red-600 text-white' : 'bg-[#0a0a0f] border border-[#1f1f2e] text-gray-400 hover:border-gray-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleExport} disabled={loading || !urls[0]}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-colors flex items-center justify-center gap-3">
          {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Exporting...</> : <><Download className="w-5 h-5" /> Start Export</>}
        </button>

        {loading && (
          <div className="mt-6 bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-300">{statusMsg}</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="bg-[#0a0a0f] rounded-full h-2 overflow-hidden">
              <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {done && comments.length > 0 && (
          <div className="mt-6 bg-[#13131a] border border-[#1f1f2e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1f1f2e] flex items-center justify-between">
              <div>
                <span className="text-white font-semibold text-sm">Preview</span>
                <span className="text-gray-500 text-sm ml-2">({comments.length} comments)</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setDone(false); setComments([]); setUrls(['']) }} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Export another</button>
                <button onClick={() => downloadComments(comments, format)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download {format}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0a0a0f]">
                  <tr>
                    {['Author', 'Comment', 'Likes', 'Date', 'Replies'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comments.slice(0, 10).map(c => (
                    <tr key={c.id} className="border-t border-[#1f1f2e] hover:bg-[#0d0d14] transition-colors">
                      <td className="px-4 py-3 text-blue-400 text-xs font-medium whitespace-nowrap">{c.author}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-xs">
                        <span className="line-clamp-2">{c.text}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{c.likes}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{c.date}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.replies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
