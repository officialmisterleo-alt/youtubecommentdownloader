'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AnalysisPanel from '@/components/AnalysisPanel'
import Link from 'next/link'
import { Plus, Download, RefreshCw, ChevronDown, X, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseYouTubeUrl, isBulkUrl, isVideoUrl } from '@/lib/youtube/url-parser'

type Reply = { id: string; author: string; text: string; likes: number; date: string }
type Comment = { id: string; author: string; text: string; likes: number; date: string; replies: number; replyList?: Reply[]; videoTitle?: string; channelName?: string; videoUrl?: string }
type VideoListItem = { videoId: string; videoUrl: string; title: string; channelTitle: string }
type SourceMeta = { kind: 'video' | 'channel' | 'playlist'; title: string; channelName?: string; sourceUrl: string; videoCount?: number; thumbnailUrl?: string }
type Format = 'CSV' | 'Excel' | 'JSON' | 'HTML' | 'TXT'
type SortBy = 'top' | 'newest' | 'oldest'

const GATED_FORMATS: Format[] = ['CSV', 'Excel', 'JSON']
const ALL_FORMATS: Format[] = ['CSV', 'Excel', 'JSON', 'HTML', 'TXT']

const ALL_COMMENT_OPTIONS = [
  { value: 50, label: '50 comments' },
  { value: 100, label: '100 comments' },
  { value: 500, label: '500 comments' },
  { value: 1000, label: '1,000 comments' },
  { value: 2000, label: '2,000 comments' },
  { value: 5000, label: '5,000 comments' },
  { value: 10000, label: '10,000 comments' },
  { value: 25000, label: '25,000 comments' },
  { value: 50000, label: '50,000 comments' },
  { value: 100000, label: '100,000 comments' },
  { value: 0, label: 'Unlimited' },
]

const PLAN_LIMIT: Record<string, number> = {
  free: 100,
  pro: 10000,
  business: 100000,
  enterprise: 0,
}

// Monthly comment quota per plan (0 = unlimited). Enforced during bulk exports.
const MONTHLY_LIMITS: Record<string, number> = {
  free: 100,
  pro: 100000,
  business: 1000000,
  enterprise: 0,
}

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
  const [userId, setUserId] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [showBulkUpgradeModal, setShowBulkUpgradeModal] = useState(false)
  const [quotaData, setQuotaData] = useState<{ used: number; limit: number; remaining: number; month: string } | null>(null)
  const [sourceMeta, setSourceMeta] = useState<SourceMeta | null>(null)

  // Pre-fill URL from query param
  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam) setUrls([urlParam])
  }, [searchParams])

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/quota')
      if (res.ok) {
        const data = await res.json()
        if (!data.error) setQuotaData(data)
      }
    } catch { /* non-fatal */ }
  }

  // Check auth status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setIsSignedIn(!!data.user)
      if (data.user) {
        setUserId(data.user.id)
        setFormat('CSV')
        fetchQuota()
      }
    }
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch subscription plan
  useEffect(() => {
    if (!isSignedIn || !userId) return
    const supabase = createClient()
    supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single()
      .then(({ data }) => {
        if (data?.status === 'active') setUserPlan(data.plan)
      })
  }, [isSignedIn, userId])

  // Reset maxComments if it exceeds plan limit
  useEffect(() => {
    const limit = isSignedIn ? (PLAN_LIMIT[userPlan] ?? 100) : 50
    const current = parseInt(maxComments) || 0
    if (limit !== 0 && (current === 0 || current > limit)) {
      setMaxComments(String(limit))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPlan, isSignedIn])

  const effectiveLimit = isSignedIn ? (PLAN_LIMIT[userPlan] ?? 100) : 50

  const availableOptions = effectiveLimit === 0
    ? ALL_COMMENT_OPTIONS
    : ALL_COMMENT_OPTIONS.filter(opt => opt.value <= effectiveLimit && opt.value !== 0)

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
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const downloadComments = (comments: Comment[], fmt: Format) => {
    if (GATED_FORMATS.includes(fmt) && !isSignedIn) {
      setShowAuthGate(true)
      return
    }
    let content = ''
    let mimeType = 'text/plain'
    let ext = 'txt'
    if (fmt === 'CSV') {
      const rows = ['Type,VideoTitle,Channel,Author,Comment,Likes,Date']
      let lastVideoTitle = ''
      for (const c of comments) {
        const vt = c.videoTitle ?? ''; const ch = c.channelName ?? ''
        if (vt && vt !== lastVideoTitle) {
          rows.push(`video,"${vt.replace(/"/g, '""')}","${ch.replace(/"/g, '""')}","","","",""`); lastVideoTitle = vt
        }
        rows.push(`comment,"${vt.replace(/"/g, '""')}","${ch.replace(/"/g, '""')}","${c.author}","${c.text.replace(/"/g, '""')}",${c.likes},"${c.date}"`)
        for (const r of c.replyList ?? []) {
          rows.push(`reply,"${vt.replace(/"/g, '""')}","${ch.replace(/"/g, '""')}","${r.author}","${r.text.replace(/"/g, '""')}",${r.likes},"${r.date}"`)
        }
      }
      content = rows.join('\n')
      mimeType = 'text/csv'; ext = 'csv'
    } else if (fmt === 'JSON') {
      content = JSON.stringify(comments, null, 2); mimeType = 'application/json'; ext = 'json'
    } else if (fmt === 'HTML') {
      const avatarColors = ['#1565C0','#2E7D32','#6A1B9A','#AD1457','#E65100','#00695C','#4527A0','#283593','#00838F','#558B2F']
      const getAvatarColor = (name: string) => {
        let hash = 0
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
        return avatarColors[Math.abs(hash) % avatarColors.length]
      }
      const thumbUpSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`
      const thumbDownSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>`
      const sortSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h6v-2H3v2zm0-5h12v-2H3v2zm0-7v2h18V6H3z"/></svg>`
      const renderComment = (c: { author: string; text: string; likes: number; date: string }, size: 'large' | 'small') => {
        const handle = c.author.startsWith('@') ? c.author : `@${c.author}`
        const initial = c.author.replace('@', '')[0]?.toUpperCase() || '?'
        const color = getAvatarColor(c.author)
        const avatarSize = size === 'large' ? '40px' : '24px'
        const avatarFont = size === 'large' ? '15px' : '11px'
        return `<div class="comment" style="margin-bottom:${size === 'small' ? '16px' : '0'}">
  <div class="avatar" style="background:${color};width:${avatarSize};height:${avatarSize};font-size:${avatarFont};flex-shrink:0">${initial}</div>
  <div class="comment-body">
    <div class="comment-meta">
      <span class="author-name">${escapeHtml(handle)}</span>
      <span class="comment-time">${escapeHtml(c.date)}</span>
    </div>
    <div class="comment-text">${escapeHtml(c.text)}</div>
    <div class="comment-actions">
      <button class="action-btn">${thumbUpSvg}<span class="like-count">${c.likes > 0 ? c.likes.toLocaleString() : ''}</span></button>
      <button class="action-btn">${thumbDownSvg}</button>
      ${size === 'large' ? '<button class="action-btn reply-btn">Reply</button>' : ''}
    </div>
  </div>
</div>`
      }
      let lastVideoTitle = ''
      const commentRows = comments.map(c => {
        let videoHeader = ''
        if (c.videoTitle && c.videoTitle !== lastVideoTitle) {
          lastVideoTitle = c.videoTitle
          videoHeader = `<div class="video-header">
  <div class="video-title"><a href="${c.videoUrl ?? '#'}" target="_blank">${escapeHtml(c.videoTitle)}</a></div>
  <div class="video-channel">${escapeHtml(c.channelName ?? '')}</div>
</div>`
        }
        const replyItems = (c.replyList ?? []).map(r => renderComment(r, 'small')).join('\n')
        const repliesSection = (c.replyList ?? []).length > 0
          ? `<details class="replies-section">
  <summary class="replies-toggle">${sortSvg}&nbsp;${c.replyList!.length} ${c.replyList!.length === 1 ? 'reply' : 'replies'}</summary>
  <div class="replies-list">
${replyItems}
  </div>
</details>`
          : ''
        return `${videoHeader}<div class="comment-thread">
${renderComment(c, 'large')}
${repliesSection}
</div>`
      }).join('\n')
      const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      let exportHeaderHtml = ''
      if (sourceMeta) {
        let videoCardHtml = ''
        if (sourceMeta.title || sourceMeta.thumbnailUrl) {
          videoCardHtml = `<div class="export-video-card">
  ${sourceMeta.thumbnailUrl ? `<img src="${sourceMeta.thumbnailUrl}" alt="thumbnail" class="export-video-thumb" onerror="this.onerror=null;this.src=this.src.includes('hqdefault')?this.src.replace('hqdefault','mqdefault'):'';if(!this.src)this.style.display='none'" />` : ''}
  <div class="export-video-meta">
    <a href="${escapeHtml(sourceMeta.sourceUrl)}" target="_blank" class="export-video-title">${escapeHtml(sourceMeta.title || 'YouTube Video')}</a>
    ${sourceMeta.channelName ? `<div class="export-video-channel">${escapeHtml(sourceMeta.channelName)}</div>` : ''}
    ${sourceMeta.kind !== 'video' && sourceMeta.videoCount ? `<div class="export-video-count">${sourceMeta.videoCount} video${sourceMeta.videoCount !== 1 ? 's' : ''}</div>` : ''}
  </div>
</div>`
        }
        exportHeaderHtml = `<div class="export-doc-header">
  <div class="export-branding">
    <a href="https://youtubecommentdownloader.com" target="_blank" class="brand-name">YouTube Comment Downloader</a>
    <span class="export-date">Exported ${exportDate}</span>
  </div>
  ${videoCardHtml}
  <div class="export-stats">${comments.length.toLocaleString()} comment${comments.length !== 1 ? 's' : ''}</div>
</div>`
      }
      content = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YouTube Comments Export</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f0f; color: #f1f1f1; font-family: Roboto, Arial, sans-serif; padding: 24px 16px 64px; max-width: 860px; margin: 0 auto; }
  .export-doc-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #272727; }
  .export-branding { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
  .brand-name { color: #f1f1f1; font-weight: 700; font-size: 14px; text-decoration: none; letter-spacing: -0.01em; }
  .brand-name:hover { color: #3ea6ff; }
  .export-date { font-size: 12px; color: #555555; }
  .export-video-card { display: flex; gap: 16px; align-items: flex-start; background: #161616; border: 1px solid #272727; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
  .export-video-thumb { width: 160px; height: 90px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .export-video-meta { flex: 1; min-width: 0; }
  .export-video-title { font-size: 16px; font-weight: 600; color: #f1f1f1; text-decoration: none; display: block; margin-bottom: 4px; line-height: 1.4; }
  .export-video-title:hover { color: #3ea6ff; }
  .export-video-channel { font-size: 13px; color: #aaaaaa; margin-top: 2px; }
  .export-video-count { font-size: 12px; color: #666666; margin-top: 4px; }
  .export-stats { font-size: 13px; color: #888888; }
  .comments-header { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
  .comments-count { font-size: 16px; font-weight: 400; color: #f1f1f1; }
  .sort-chip { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #f1f1f1; background: none; border: none; padding: 8px 12px; border-radius: 18px; cursor: default; }
  .comment-thread { margin-bottom: 24px; }
  .comment { display: flex; gap: 16px; }
  .avatar { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 500; color: #fff; user-select: none; }
  .comment-body { flex: 1; min-width: 0; }
  .comment-meta { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
  .author-name { font-size: 13px; font-weight: 500; color: #f1f1f1; }
  .comment-time { font-size: 12px; color: #aaaaaa; }
  .comment-text { font-size: 14px; color: #f1f1f1; line-height: 20px; margin-bottom: 8px; word-break: break-word; white-space: pre-wrap; }
  .comment-actions { display: flex; align-items: center; gap: 0; flex-wrap: wrap; margin-bottom: 4px; }
  .action-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #aaaaaa; font-size: 13px; cursor: pointer; padding: 6px 8px; border-radius: 18px; font-family: Roboto, Arial, sans-serif; }
  .action-btn:hover { background: rgba(255,255,255,0.1); }
  .like-count { font-size: 13px; color: #aaaaaa; min-width: 4px; }
  .reply-btn { font-weight: 600; font-size: 13px; margin-left: 4px; }
  .replies-section { margin-left: 56px; margin-top: 8px; }
  .replies-toggle { display: inline-flex; align-items: center; gap: 6px; color: #3ea6ff; font-size: 13px; font-weight: 600; cursor: pointer; padding: 6px 10px; border-radius: 18px; list-style: none; }
  .replies-toggle:hover { background: rgba(62,166,255,0.1); }
  .replies-toggle::-webkit-details-marker { display: none; }
  .replies-list { margin-top: 12px; }
  .video-header { margin: 32px 0 20px; padding: 16px; background: #161616; border: 1px solid #272727; border-radius: 12px; }
  .video-title { font-size: 15px; font-weight: 600; color: #f1f1f1; margin-bottom: 4px; }
  .video-title a { color: #f1f1f1; text-decoration: none; }
  .video-title a:hover { color: #3ea6ff; }
  .video-channel { font-size: 12px; color: #aaaaaa; }
  .watermark { text-align: center; margin-top: 48px; padding-top: 20px; border-top: 1px solid #272727; font-size: 12px; color: #555555; }
  .watermark a { color: #3ea6ff; text-decoration: none; }
  @media (max-width: 520px) {
    .export-video-card { flex-direction: column; }
    .export-video-thumb { width: 100%; height: auto; aspect-ratio: 16/9; }
  }
</style>
</head>
<body>
${exportHeaderHtml}
<div class="comments-header">
  <span class="comments-count">${comments.length.toLocaleString()} Comments</span>
  <button class="sort-chip">${sortSvg}&nbsp;Sort by top</button>
</div>
${commentRows}
<div class="watermark">Exported with <a href="https://youtubecommentdownloader.com" target="_blank">youtubecommentdownloader.com</a></div>
</body>
</html>`
      mimeType = 'text/html'; ext = 'html'
    } else {
      const blocks: string[] = []
      let lastVideoTitle = ''
      for (const c of comments) {
        if (c.videoTitle && c.videoTitle !== lastVideoTitle) {
          const sep = '═'.repeat(60)
          blocks.push(`${sep}\n📹  ${c.videoTitle}\n    ${c.channelName ?? ''}\n    ${c.videoUrl ?? ''}\n${sep}`)
          lastVideoTitle = c.videoTitle
        }
        let block = `${c.author} · ${c.date} · ${c.likes} likes\n${c.text}`
        for (const r of c.replyList ?? []) {
          block += `\n\n  ↳ ${r.author} · ${r.date} · ${r.likes} likes\n    ${r.text}`
        }
        blocks.push(block)
      }
      content = blocks.join('\n\n' + '─'.repeat(60) + '\n\n')
      ext = 'txt'
    }
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `youtube-comments.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  const isBusiness = userPlan === 'business' || userPlan === 'enterprise'

  const handleExport = async () => {
    const activeUrls = urls.filter(u => u.trim())
    if (!activeUrls.length) return

    // Parse all URLs upfront
    const parsedUrls = activeUrls.map(u => ({ url: u, parsed: parseYouTubeUrl(u) }))
    const hasBulkUrl = parsedUrls.some(({ parsed }) => isBulkUrl(parsed))

    // Gate bulk (channel/playlist) to Business+ users
    if (hasBulkUrl && !isBusiness) {
      setShowBulkUpgradeModal(true)
      return
    }

    setLoading(true); setDone(false); setProgress(0); setComments([])
    const allComments: Comment[] = []
    const maxCommentsParsed = parseInt(maxComments) || 100
    let pendingMeta: SourceMeta | null = null

    // For bulk exports: fetch current month's usage so we can enforce quota
    let monthlyUsed = 0
    if (isSignedIn && hasBulkUrl && userId) {
      try {
        const supabase = createClient()
        const month = new Date().toISOString().slice(0, 7)
        const { data: usage } = await supabase
          .from('usage')
          .select('comments_count')
          .eq('user_id', userId)
          .eq('month', month)
          .single()
        monthlyUsed = usage?.comments_count ?? 0
      } catch { /* non-fatal */ }
    }
    const monthlyLimit = MONTHLY_LIMITS[userPlan] ?? 0 // 0 = unlimited

    let quotaExceeded = false
    let videosProcessed = 0

    try {
      for (let i = 0; i < parsedUrls.length; i++) {
        if (quotaExceeded) break
        const { url, parsed } = parsedUrls[i]

        if (parsed.type === 'channel' || parsed.type === 'playlist') {
          // ── Bulk: fetch video list then process each video ─────────────────
          setStatusMsg(`Fetching ${parsed.type} video list…`)
          setProgress(5)

          const endpoint = parsed.type === 'channel' ? '/api/youtube/channel' : '/api/youtube/playlist'
          const listRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          })
          const listData = await listRes.json()

          if (listData.error) {
            setStatusMsg(`Error: ${listData.error}`)
            break
          }

          const videos: VideoListItem[] = listData.videos ?? []
          const total = videos.length
          if (!pendingMeta) {
            const firstVideoId = videos[0]?.videoId
            pendingMeta = {
              kind: parsed.type as 'channel' | 'playlist',
              title: parsed.type === 'channel' ? (listData.channelTitle ?? '') : (listData.playlistTitle ?? ''),
              channelName: parsed.type === 'playlist' ? (videos[0]?.channelTitle ?? undefined) : undefined,
              sourceUrl: url,
              videoCount: videos.length,
              thumbnailUrl: parsed.type === 'playlist' && firstVideoId
                ? `https://img.youtube.com/vi/${firstVideoId}/hqdefault.jpg`
                : undefined,
            }
          }

          for (let j = 0; j < videos.length; j++) {
            // Check monthly quota before fetching each video
            if (monthlyLimit > 0) {
              const remaining = monthlyLimit - monthlyUsed - allComments.length
              if (remaining <= 0) {
                quotaExceeded = true
                break
              }
            }

            const video = videos[j]
            setStatusMsg(`Video ${j + 1} of ${total} — fetching comments…`)
            setProgress(Math.round(5 + ((j / total) * 85)))

            const res = await fetch('/api/youtube/comments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: video.videoUrl, maxComments: maxCommentsParsed, includeReplies, sortBy }),
            })
            const data = await res.json()
            if (data.comments) {
              const videoComments: Comment[] = data.comments
              allComments.push(...videoComments)
              videosProcessed++
              if (isSignedIn && videoComments.length > 0) {
                fetch('/api/exports/log', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    videoUrl: video.videoUrl,
                    videoTitle: videoComments[0].videoTitle ?? video.title,
                    channelName: videoComments[0].channelName ?? video.channelTitle,
                    commentCount: videoComments.length,
                    format,
                  }),
                }).catch(() => {})
              }
            }
          }

        } else if (isVideoUrl(parsed)) {
          // ── Individual video ───────────────────────────────────────────────
          setStatusMsg(`Fetching comments from video ${i + 1} of ${parsedUrls.length}…`)
          setProgress(Math.round((i / parsedUrls.length) * 90))

          // Use canonical URL so the server-side parser always succeeds
          const canonicalUrl = `https://www.youtube.com/watch?v=${parsed.id}`
          const res = await fetch('/api/youtube/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: canonicalUrl, maxComments: maxCommentsParsed, includeReplies, sortBy }),
          })
          const data = await res.json()
          if (data.comments) {
            const videoComments: Comment[] = data.comments.map((c: Comment, idx: number) => ({ ...c, id: `${i}-${idx}` }))
            allComments.push(...videoComments)
            videosProcessed++
            if (!pendingMeta && videoComments[0]) {
              const fc = videoComments[0]
              const videoId = fc.videoUrl?.match(/(?:v=)([a-zA-Z0-9_-]{11})/)?.[1]
              pendingMeta = {
                kind: 'video',
                title: fc.videoTitle ?? '',
                channelName: fc.channelName ?? undefined,
                sourceUrl: fc.videoUrl ?? url,
                thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined,
              }
            }
            if (isSignedIn && videoComments.length > 0) {
              const first = videoComments[0]
              fetch('/api/exports/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  videoUrl: url,
                  videoTitle: first.videoTitle ?? '',
                  channelName: first.channelName ?? '',
                  commentCount: videoComments.length,
                  format,
                }),
              }).catch(() => {})
            }
          }

        } else {
          // Unknown URL — fall back to passing the raw URL; the API will return an error
          setStatusMsg(`Fetching comments from video ${i + 1} of ${parsedUrls.length}…`)
          setProgress(Math.round((i / parsedUrls.length) * 90))
          const res = await fetch('/api/youtube/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, maxComments: maxCommentsParsed, includeReplies, sortBy }),
          })
          const data = await res.json()
          if (data.comments) {
            allComments.push(...data.comments.map((c: Comment, idx: number) => ({ ...c, id: `${i}-${idx}` })))
            videosProcessed++
          }
        }
      }

      if (quotaExceeded) {
        setStatusMsg(`Monthly quota reached — ${videosProcessed} video${videosProcessed !== 1 ? 's' : ''} processed, ${allComments.length.toLocaleString()} comments fetched`)
      } else {
        setStatusMsg(`Processed ${allComments.length.toLocaleString()} comments`)
      }
      setComments(allComments)
      if (allComments.length > 0) {
        setDone(true)
        if (isSignedIn) fetchQuota()
      }
      setSourceMeta(pendingMeta)
      if (allComments.length > 0) setDone(true)
    } catch {
      const mockMeta = { videoTitle: 'Sample YouTube Video — Tutorial & Deep Dive', channelName: 'CreatorChannel', videoUrl: urls[0] }
      setComments([
        { id: '1', author: '@techreviewer99', text: 'This is exactly what I needed! The tutorial was super clear.', likes: 342, date: '2 days ago', replies: 2, replyList: [{ id: '1-1', author: '@CreatorChannel', text: 'Thank you! Really glad it helped.', likes: 48, date: '2 days ago' }], ...mockMeta },
        { id: '2', author: '@marketingpro_sarah', text: 'Great content as always. Would love to see a follow-up.', likes: 187, date: '3 days ago', replies: 1, replyList: [{ id: '2-1', author: '@CreatorChannel', text: 'Advanced series coming next month!', likes: 34, date: '3 days ago' }], ...mockMeta },
        { id: '3', author: '@dataanalyst_mike', text: "I've been using this method for 6 months and it works perfectly.", likes: 156, date: '4 days ago', replies: 0, replyList: [], ...mockMeta },
        { id: '4', author: '@creativedirector', text: 'The production quality keeps improving. Keep up the amazing work!', likes: 134, date: '5 days ago', replies: 0, replyList: [], ...mockMeta },
        { id: '5', author: '@researcher_2024', text: 'Perfect for academic research. Downloaded 50k comments in 10 min.', likes: 98, date: '1 week ago', replies: 0, replyList: [], ...mockMeta },
      ])
      setDone(true)
    }
    setProgress(100); setLoading(false)
  }

  return (
    <div className="flex-1 overflow-x-hidden">

      {showBanner && (
        <div className="bg-red-700 py-1.5 px-4 flex items-center justify-center gap-3 text-sm text-white">
          <span>🚀 Unlock API access, bulk exports &amp; scheduling →{' '}
            <Link href="/pricing" className="underline font-semibold">View Enterprise Plans</Link>
          </span>
          <button onClick={() => setShowBanner(false)} className="ml-auto text-white/70 hover:text-white text-xl leading-none">&times;</button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">YouTube Comment Downloader</h1>
          <p className="text-[#888888] text-sm sm:text-base">Paste a YouTube URL to extract and export all comments instantly.</p>
        </div>

        {/* URL inputs */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
          <label className="text-sm font-medium text-white mb-3 block">YouTube URL(s)</label>
          <div className="space-y-3">
            {urls.map((u, i) => {
              const detected = u.trim() ? parseYouTubeUrl(u) : null
              const isBulk = detected ? isBulkUrl(detected) : false
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input value={u} onChange={e => updateUrl(i, e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or /channel/ or /@handle or /playlist?list=..."
                      className="flex-1 min-w-0 bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-base w-full" />
                    {i > 0 && (
                      <button onClick={() => removeUrl(i)} className="text-[#888888] hover:text-red-400 p-1 shrink-0">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {isBulk && (
                    <div className="flex items-center gap-1.5 pl-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isBusiness ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                        {detected!.type === 'channel' ? 'Channel' : 'Playlist'} — {isBusiness ? 'bulk download enabled' : 'Business plan required'}
                      </span>
                      {!isBusiness && (
                        <Link href="/pricing" className="text-xs text-red-400 hover:text-red-300 underline">Upgrade</Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {urls.length < 5 ? (
            <button onClick={addUrl} className="mt-3 flex items-center gap-2 text-[#888888] hover:text-white text-sm transition-colors min-h-[36px]">
              <Plus className="w-4 h-4" /> Add URL
            </button>
          ) : (
            <p className="mt-3 text-[#888888] text-xs">Maximum 5 URLs. <Link href="/pricing" className="text-red-400 hover:text-red-300">View plans</Link></p>
          )}
        </div>

        {/* Options */}
        <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-5">

          {/* Include Replies toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white">Include Replies</div>
              <div className="text-xs text-[#888888]">Also fetch comment replies (slower)</div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer shrink-0">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeReplies}
                  onChange={e => setIncludeReplies(e.target.checked)}
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${includeReplies ? 'bg-red-600' : 'bg-[#333333]'}`} />
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${includeReplies ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>

          {/* Max Comments */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">Max Comments</label>
            <div className="relative">
              <select value={maxComments} onChange={e => setMaxComments(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/[0.07] rounded-xl px-4 py-3 text-white text-base appearance-none focus:outline-none focus:border-red-600">
                {availableOptions.map(opt => (
                  <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-[#888888] pointer-events-none" />
            </div>
            <p className="mt-1.5 text-xs text-[#666666]">
              {!isSignedIn ? (
                <><Link href="/auth/signin" className="text-[#888888] hover:text-white underline">Sign in</Link> to unlock more comments</>
              ) : userPlan === 'enterprise' ? (
                'Enterprise plan'
              ) : userPlan === 'business' ? (
                'Business plan'
              ) : userPlan === 'pro' ? (
                'Pro plan'
              ) : (
                <>Free plan · 100 comment max · <Link href="/pricing" className="text-[#888888] hover:text-white underline">Upgrade for more</Link></>
              )}
            </p>
          </div>

          {/* Monthly Quota */}
          {isSignedIn && quotaData && (
            <div>
              <label className="text-sm font-medium text-white block mb-2">Monthly Quota</label>
              {quotaData.limit === -1 ? (
                <p className="text-xs text-[#888888]">Unlimited — Enterprise plan</p>
              ) : (
                <div>
                  <div className="w-full bg-white/[0.07] rounded-full h-1.5 mb-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        quotaData.remaining === 0 ? 'bg-red-500' :
                        quotaData.remaining / quotaData.limit < 0.1 ? 'bg-yellow-500' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.round((quotaData.used / quotaData.limit) * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#888888]">
                    {quotaData.used.toLocaleString()} / {quotaData.limit.toLocaleString()} comments used this month
                    {quotaData.remaining === 0 && (
                      <> · <Link href="/pricing" className="text-red-400 hover:text-red-300">Upgrade for more</Link></>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Export Format */}
          <div>
            <label className="text-sm font-medium text-white block mb-2">Export Format</label>
            {!isSignedIn && (
              <p className="text-xs text-[#888888] mb-3 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#888888]" />
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
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 min-h-[40px] flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-red-600 border-transparent text-white'
                        : isGated
                        ? 'bg-[#0a0a0a] border-white/[0.07] text-[#888888] cursor-pointer hover:border-white/[0.15]'
                        : 'bg-[#0a0a0a] border-white/[0.07] text-[#888888] hover:border-white/[0.2]'
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
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors duration-200 min-h-[40px] border ${sortBy === s ? 'bg-red-600 border-transparent text-white' : 'bg-[#0a0a0a] border-white/[0.07] text-[#888888] hover:border-white/[0.2]'}`}>
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
          <div className="mt-4 sm:mt-6 bg-[#171717] border border-white/[0.07] rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white">{statusMsg}</span>
              <span className="text-sm text-[#888888]">{progress}%</span>
            </div>
            <div className="bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
              <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {done && comments.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Video / channel / playlist header card */}
            {sourceMeta && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-5 border-b border-white/[0.07] bg-[#111111]">
                {sourceMeta.thumbnailUrl && (
                  <img
                    src={sourceMeta.thumbnailUrl}
                    alt="thumbnail"
                    className="w-full sm:w-[140px] sm:h-[79px] rounded-lg object-cover flex-shrink-0 self-start"
                    onError={(e) => {
                      const img = e.currentTarget
                      if (img.src.includes('hqdefault')) {
                        img.src = img.src.replace('hqdefault', 'mqdefault')
                      } else {
                        img.style.display = 'none'
                      }
                    }}
                  />
                )}
                {!sourceMeta.thumbnailUrl && sourceMeta.kind === 'channel' && (
                  <div className="w-[48px] h-[48px] rounded-full bg-[#272727] flex items-center justify-center flex-shrink-0 self-start">
                    <span className="text-[#888888] text-xl font-bold">{(sourceMeta.title || 'C')[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm sm:text-base leading-snug line-clamp-2">
                    {sourceMeta.title || (sourceMeta.kind === 'channel' ? 'Channel' : sourceMeta.kind === 'playlist' ? 'Playlist' : 'Video')}
                  </div>
                  {sourceMeta.channelName && (
                    <div className="text-[#888888] text-xs mt-1">{sourceMeta.channelName}</div>
                  )}
                  {sourceMeta.kind !== 'video' && sourceMeta.videoCount != null && (
                    <div className="text-[#666666] text-xs mt-0.5">{sourceMeta.videoCount} video{sourceMeta.videoCount !== 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            )}
            <div className="p-4 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-white font-semibold text-sm">Preview</span>
                <span className="text-[#888888] text-sm ml-2">({comments.length} comments)</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => { setDone(false); setComments([]); setUrls(['']); setSourceMeta(null) }} className="text-[#888888] hover:text-white text-sm transition-colors min-h-[36px]">Export another</button>
                <button onClick={() => downloadComments(comments, format)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 min-h-[36px]">
                  <Download className="w-4 h-4" /> Download {format}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0a0a0a]">
                  <tr>
                    {['Author', 'Comment', 'Likes', 'Date', 'Replies'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[#888888] font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comments.slice(0, 10).map(c => (
                    <tr key={c.id} className="border-t border-white/[0.07]">
                      <td className="px-4 py-3 text-[#888888] text-xs font-medium whitespace-nowrap">{c.author}</td>
                      <td className="px-4 py-3 text-white min-w-[200px] max-w-xs">
                        <span className="line-clamp-2">{c.text}</span>
                      </td>
                      <td className="px-4 py-3 text-[#888888] whitespace-nowrap">{c.likes}</td>
                      <td className="px-4 py-3 text-[#888888] whitespace-nowrap text-xs">{c.date}</td>
                      <td className="px-4 py-3 text-[#888888] whitespace-nowrap">{c.replies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {done && comments.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-10">
          <AnalysisPanel comments={comments} isSignedIn={isSignedIn} />
        </div>
      )}

      {/* Bulk upgrade modal — shown when non-Business users try to use channel/playlist URLs */}
      {showBulkUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 sm:p-8 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600/20 rounded-full p-2">
                <Lock className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-white font-bold text-lg">Business plan required</h3>
            </div>
            <p className="text-[#888888] text-sm leading-relaxed mb-6">
              Bulk channel and playlist downloads are available on the{' '}
              <strong className="text-white">Business plan</strong>. Upgrade to download comments from entire channels and playlists in one go.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/pricing" className="block bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl text-center transition-colors">
                View Business Plan
              </Link>
              <button onClick={() => setShowBulkUpgradeModal(false)} className="text-[#888888] hover:text-white text-sm transition-colors mt-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth gate modal */}
      {showAuthGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 sm:p-8 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600/20 rounded-full p-2">
                <Lock className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-white font-bold text-lg">Sign in to export</h3>
            </div>
            <p className="text-[#888888] text-sm leading-relaxed mb-6">
              Create a free account to download in <strong className="text-white">CSV, JSON, and Excel</strong> formats. Plain text is always free — no sign-in needed.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/auth/signup" className="block bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl text-center transition-colors">
                Create Free Account
              </Link>
              <Link href="/auth/login" className="block border border-white/[0.07] hover:border-white/[0.15] text-white font-medium px-4 py-3 rounded-xl text-center transition-colors text-sm">
                Sign In
              </Link>
              <button onClick={() => setShowAuthGate(false)} className="text-[#888888] hover:text-[#888888] text-sm transition-colors mt-1">
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
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <ToolPageContent />
    </Suspense>
  )
}
