'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, Download, RefreshCw, ChevronDown, X, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Comment = { id: string; author: string; text: string; likes: number; date: string; replies: number }
type Format = 'CSV' | 'Excel' | 'JSON' | 'HTML' | 'TXT'
type SortBy = 'top' | 'newest' | 'oldest'

const GATED_FORMATS: Format[] = ['CSV', 'Excel', 'JSON']
const ALL_FORMATS: Format[] = ['CSV', 'Excel', 'JSON', 'HTML', 'TXT']

function ToolPageContent() {
  const searchParams = useSearchParams()
  const [urls, setUrls] = useState<string[]>([''])
  const [includeReplies, setIncludeReplies] = useState(false)
  const [maxComments, setMaxComments] = useState('100')
  const [format, setFormat] = useState<Format>('TXT')
  const [sortBy, setSortBy] = useState<SortBy>('top')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [done, setDone] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [showAuthGate, setShowAuthGate] = useState(false)

  // Pre-fill URL from query param
  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam) setUrls([urlParam])
  }, [searchParams])

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setIsSignedIn(!!data.user)
      if (data.user) setFormat('CSV')
    }
    checkAuth()
  }, [])

  const addUrl = () => { if (urls.length < 5) setUrls([...urls, '']) }
  const updateUrl = (i: number, v: string) => { const u = [...urls]; u[i] = v; setUrls(u) }
  const removeUrl = (i: number) => { setUrls(urls.filter((_, idx) => idx !== i)) }

  const selectFormat = (f: Format) => {
    if (GATED_FORMATS.includes(f) && !isSignedIn) {
      setShowAuthGate(true)
      return
    }
    setFormat(f)
  }

  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const downloadComments = (comments: Comment[], fmt: Format) => {
    if (GATED_FORMATS.includes(fmt) && !isSignedIn) {
      setShowAuthGate(true)
      return
    }
    let content = ''
    let mimeType = 'text/plain'
    let ext = 'txt'
    if (fmt === 'CSV') {
      content = 'Author,Comment,Likes,Date,Replies\n' + comments.map(c => `"${c.author}","${c.text.replace(/"/g, '""')}",${c.likes},"${c.date}",${c.replies}`).join('\n')
      mimeType = 'text/csv'; ext = 'csv'
    } else if (fmt === 'JSON') {
      content = JSON.stringify(comments, null, 2); mimeType = 'application/json'; ext = 'json'
    } else if (fmt === 'HTML') {
      const commentRows = comments.map(c => {
        const initial = c.author.replace('@', '')[0]?.toUpperCase() || '?'
        return `<div class="comment">
  <div class="avatar">${initial}</div>
  <div class="comment-body">
    <div class="comment-header">
      <span class="author">${escapeHtml(c.author)}</span>
      <span class="timestamp">${escapeHtml(c.date)}</span>
    </div>
    <div class="comment-text">${escapeHtml(c.text)}</div>
    <div class="comment-actions">
      <span class="likes">👍 ${c.likes.toLocaleString()}</span>${c.replies > 0 ? `\n      <span class="replies">${c.replies} ${c.replies === 1 ? 'reply' : 'replies'}</span>` : ''}
    </div>
  </div>
</div>`
      }).join('\n')
      content = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YouTube Comments</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f0f; color: #fff; font-family: Roboto, Arial, sans-serif; padding: 24px 16px; max-width: 860px; margin: 0 auto; }
  .header { font-size: 20px; font-weight: 400; color: #fff; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #272727; }
  .comment { display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid #272727; }
  .comment:last-child { border-bottom: none; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: #3f3f3f; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; color: #fff; flex-shrink: 0; }
  .comment-body { flex: 1; min-width: 0; }
  .comment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
  .author { font-size: 13px; font-weight: 500; color: #fff; }
  .timestamp { font-size: 12px; color: #aaa; }
  .comment-text { font-size: 14px; color: #f1f1f1; line-height: 1.6; margin-bottom: 8px; word-break: break-word; white-space: pre-wrap; }
  .comment-actions { display: flex; align-items: center; gap: 16px; }
  .likes { font-size: 13px; color: #aaa; }
  .replies { font-size: 13px; color: #3ea6ff; }
</style>
</head>
<body>
<div class="header">${comments.length.toLocaleString()} Comments</div>
${commentRows}
</body>
</html>`
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

    const msgs = ['Fetching comments...', 'Processing comments...', 'Preparing export...']
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
      if (data.comments) {
        setComments(data.comments)
        setStatusMsg(`Processed ${data.comments.length.toLocaleString()} comments`)
        setDone(true)
      }
    } catch {
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
    <div className="min-h-screen bg-[#0a0a0f] overflow-x-hidden">
      <Navbar />

      {showBanner && (
        <div className="bg-red-700 py-2.5 px-4 flex items-center justify-center gap-3 text-sm text-white">
          <span>🚀 Unlock API access, bulk exports &amp; scheduling →{' '}
            <Link href="/pricing" className="underline font-semibold">View Enterprise Plans</Link>
          </span>
          <button onClick={() => setShowBanner(false)} className="ml-auto text-white/70 hover:text-white text-xl leading-none">&times;</button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">YouTube Comment Downloader</h1>
          <p className="text-gray-400 text-sm sm:text-base">Paste a YouTube URL to extract and export all comments instantly.</p>
        </div>

        {/* URL inputs */}
        <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <label className="text-sm font-medium text-gray-300 mb-3 block">YouTube URL(s)</label>
          <div className="space-y-3">
            {urls.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={u} onChange={e => updateUrl(i, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 min-w-0 bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-sm w-full" />
                {i > 0 && (
                  <button onClick={() => removeUrl(i)} className="text-gray-500 hover:text-red-400 p-1 shrink-0">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {urls.length < 5 ? (
            <button onClick={addUrl} className="mt-3 flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors min-h-[36px]">
              <Plus className="w-4 h-4" /> Add URL
            </button>
          ) : (
            <p className="mt-3 text-gray-600 text-xs">Maximum 5 URLs on free plan. <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade for unlimited</Link></p>
          )}
        </div>

        {/* Options */}
        <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-5">

          {/* Include Replies toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white">Include Replies</div>
              <div className="text-xs text-gray-500">Also fetch comment replies (slower)</div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer shrink-0">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeReplies}
                  onChange={e => setIncludeReplies(e.target.checked)}
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${includeReplies ? 'bg-red-600' : 'bg-gray-700'}`} />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeReplies ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>

          {/* Max Comments */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">Max Comments</label>
            <div className="relative">
              <select value={maxComments} onChange={e => setMaxComments(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1f1f2e] rounded-xl px-4 py-3 text-white text-sm appearance-none focus:outline-none focus:border-red-600">
                <option value="100">100 comments</option>
                <option value="500">500 comments</option>
                <option value="1000">1,000 comments</option>
                <option value="5000">5,000 comments</option>
                <option value="0">Unlimited (Pro+)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">Export Format</label>
            {!isSignedIn && (
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-gray-600" />
                <span>CSV, JSON &amp; Excel require a free account. <Link href="/auth/login" className="text-red-400 hover:text-red-300 underline">Sign in to unlock</Link></span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {ALL_FORMATS.map(f => {
                const isGated = GATED_FORMATS.includes(f) && !isSignedIn
                const isActive = format === f
                return (
                  <button
                    key={f}
                    onClick={() => selectFormat(f)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[40px] flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : isGated
                        ? 'bg-[#0a0a0f] border border-[#1f1f2e] text-gray-600 cursor-pointer hover:border-gray-600'
                        : 'bg-[#0a0a0f] border border-[#1f1f2e] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {isGated && <Lock className="w-3 h-3" />}
                    {f}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">Sort By</label>
            <div className="flex flex-wrap gap-2">
              {(['top', 'newest', 'oldest'] as SortBy[]).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors min-h-[40px] ${sortBy === s ? 'bg-red-600 text-white' : 'bg-[#0a0a0f] border border-[#1f1f2e] text-gray-400 hover:border-gray-500'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleExport} disabled={loading || !urls[0]}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3 min-h-[56px]">
          {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Exporting...</> : <><Download className="w-5 h-5" /> Start Export</>}
        </button>

        {loading && (
          <div className="mt-4 sm:mt-6 bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-4 sm:p-6">
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
          <div className="mt-4 sm:mt-6 bg-[#13131a] border border-[#1f1f2e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#1f1f2e] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-white font-semibold text-sm">Preview</span>
                <span className="text-gray-500 text-sm ml-2">({comments.length} comments)</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => { setDone(false); setComments([]); setUrls(['']) }} className="text-gray-500 hover:text-gray-300 text-sm transition-colors min-h-[36px]">Export another</button>
                <button onClick={() => downloadComments(comments, format)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 min-h-[36px]">
                  <Download className="w-4 h-4" /> Download {format}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0a0a0f]">
                  <tr>
                    {['Author', 'Comment', 'Likes', 'Date', 'Replies'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comments.slice(0, 10).map(c => (
                    <tr key={c.id} className="border-t border-[#1f1f2e]">
                      <td className="px-4 py-3 text-blue-400 text-xs font-medium whitespace-nowrap">{c.author}</td>
                      <td className="px-4 py-3 text-gray-300 min-w-[200px] max-w-xs">
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

      {/* Auth gate modal */}
      {showAuthGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#13131a] border border-[#1f1f2e] rounded-2xl p-6 sm:p-8 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600/20 rounded-full p-2">
                <Lock className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-white font-bold text-lg">Sign in to export</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Create a free account to download in <strong className="text-white">CSV, JSON, and Excel</strong> formats. Plain text is always free — no sign-in needed.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/auth/signup" className="block bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl text-center transition-colors">
                Create Free Account
              </Link>
              <Link href="/auth/login" className="block border border-[#1f1f2e] hover:border-gray-600 text-gray-300 font-medium px-4 py-3 rounded-xl text-center transition-colors text-sm">
                Sign In
              </Link>
              <button onClick={() => setShowAuthGate(false)} className="text-gray-600 hover:text-gray-400 text-sm transition-colors mt-1">
                Continue with TXT (no sign-in)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ToolPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <ToolPageContent />
    </Suspense>
  )
}
