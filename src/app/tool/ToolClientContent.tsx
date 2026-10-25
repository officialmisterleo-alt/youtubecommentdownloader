'use client'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import AnalysisPanel from '@/components/AnalysisPanel'
import Link from 'next/link'
import { ArrowRight, BadgePercent, Plus, Download, RefreshCw, ChevronDown, X, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseYouTubeUrl, isBulkUrl, isVideoUrl } from '@/lib/youtube/url-parser'
import { trackEvent } from '@/lib/analytics'
import { toolFaqs } from '@/lib/tool-faqs'
import * as XLSX from 'xlsx'

type Reply = { id: string; author: string; text: string; likes: number; date: string; dateRaw?: string }
type Comment = { id: string; author: string; text: string; likes: number; date: string; dateRaw?: string; replies: number; replyList?: Reply[]; videoTitle?: string; channelName?: string; videoUrl?: string }
type VideoListItem = { videoId: string; videoUrl: string; title: string; channelTitle: string }
type SourceMeta = { kind: 'video' | 'channel' | 'playlist'; title: string; channelName?: string; sourceUrl: string; videoCount?: number; thumbnailUrl?: string }
type VideoMeta = { videoId: string; title: string; url: string; thumbnailUrl: string }
type Format = 'CSV' | 'Excel' | 'JSON' | 'HTML' | 'TXT'
type SortBy = 'top' | 'newest'

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

type VideoFetchResult = {
  comments: Comment[]
  // Set when YouTube won't return comments for this video (turned off, private, deleted)
  skippedReason?: string
  // Set when the monthly quota / signed-out daily limit ran out partway through
  quotaMessage?: string
  // Comments + replies YouTube reports for the video
  videoCommentCount?: number | null
}

/**
 * Fetches one video's comments. The API returns them in batches, so keep
 * calling with the returned cursor until it reports done.
 */
async function fetchVideoComments(
  url: string,
  opts: { maxComments: number; includeReplies: boolean; sortBy: SortBy },
  onProgress?: (fetched: number) => void,
): Promise<VideoFetchResult> {
  const comments: Comment[] = []
  let cursor: unknown = null
  let videoCommentCount: number | null = null
  do {
    const res = await fetch('/api/youtube/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, ...opts, cursor, fetchedSoFar: comments.length }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      if (data.code === 'comments_disabled' || data.code === 'video_unavailable') {
        return { comments, skippedReason: data.error }
      }
      if (data.code === 'quota_exceeded' || data.code === 'anon_limit') {
        return { comments, quotaMessage: data.error }
      }
      throw new Error(data.error ?? 'Unable to fetch comments.')
    }
    const batch: Comment[] = data.comments ?? []
    comments.push(...batch)
    videoCommentCount = data.videoCommentCount ?? videoCommentCount
    onProgress?.(comments.length)
    // Guard against a cursor that makes no progress
    cursor = batch.length > 0 ? data.nextCursor : null
  } while (cursor)
  return { comments, videoCommentCount }
}

// YouTube's "Top" (relevance) order stops after a limited set of threads. Flag a video
// when it returned well short of what was asked for while YouTube reports many more.
function endedEarlyInTopOrder(result: VideoFetchResult, requested: number, sortBy: SortBy): boolean {
  if (sortBy !== 'top' || result.skippedReason || result.quotaMessage) return false
  const got = result.comments.length
  const target = requested > 0 ? requested : Infinity
  return got >= 200 && got < target && (result.videoCommentCount ?? 0) > got * 2
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
  // Shown after an export finishes when something needs explaining (skips, limits, short Top order)
  const [completionNote, setCompletionNote] = useState('')
  const [exportError, setExportError] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [done, setDone] = useState(false)

  const [isSignedIn, setIsSignedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<string>('free')
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [showBulkUpgradeModal, setShowBulkUpgradeModal] = useState(false)
  const [quotaData, setQuotaData] = useState<{ used: number; limit: number; remaining: number; month: string; plan: string } | null>(null)
  const [sourceMeta, setSourceMeta] = useState<SourceMeta | null>(null)
  const [videosMeta, setVideosMeta] = useState<VideoMeta[]>([])

  // Pro+ filter state
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterMinLikes, setFilterMinLikes] = useState('')

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
        if (!data.error) {
          setQuotaData(data)
          if (data.plan) setUserPlan(data.plan)
        }
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

  // Pro+ = signed-in and not on free plan
  const isProPlus = isSignedIn && userPlan !== 'free'
  const hasActiveFilters = isProPlus && (!!filterKeyword || !!filterDateFrom || !!filterDateTo || !!filterMinLikes)

  const filteredComments = useMemo(() => {
    if (!isProPlus) return comments
    return comments.filter(c => {
      if (filterKeyword) {
        const kw = filterKeyword.toLowerCase()
        if (!c.text.toLowerCase().includes(kw) && !c.author.toLowerCase().includes(kw)) return false
      }
      if (filterDateFrom && c.dateRaw) {
        if (c.dateRaw.slice(0, 10) < filterDateFrom) return false
      }
      if (filterDateTo && c.dateRaw) {
        if (c.dateRaw.slice(0, 10) > filterDateTo) return false
      }
      if (filterMinLikes !== '' && filterMinLikes !== '0') {
        if (c.likes < parseInt(filterMinLikes, 10)) return false
      }
      return true
    })
  }, [comments, filterKeyword, filterDateFrom, filterDateTo, filterMinLikes, isProPlus])

  const addUrl = () => { if (urls.length < 5) setUrls([...urls, '']) }
  const updateUrl = (i: number, v: string) => { const u = [...urls]; u[i] = v; setUrls(u) }
  const removeUrl = (i: number) => { setUrls(urls.filter((_, idx) => idx !== i)) }

  const selectFormat = (f: Format) => {
    if (GATED_FORMATS.includes(f) && !isSignedIn) {
      trackEvent('export_format_gated', { format: f })
      setShowAuthGate(true)
      return
    }
    trackEvent('export_format_select', { format: f })
    setFormat(f)
  }

  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const downloadComments = (comments: Comment[], fmt: Format) => {
    if (GATED_FORMATS.includes(fmt) && !isSignedIn) {
      trackEvent('download_gated', { format: fmt, comment_count: comments.length })
      setShowAuthGate(true)
      return
    }

    trackEvent('download_click', {
      format: fmt,
      comment_count: comments.length,
      plan: userPlan,
      signed_in: isSignedIn,
    })

    // Detect multi-video: are there multiple distinct video URLs?
    const uniqueVideoUrls = Array.from(new Set(comments.map(c => c.videoUrl ?? c.videoTitle ?? '').filter(Boolean)))
    const isMultiVideo = uniqueVideoUrls.length > 1

    // Group comments by video (preserving order)
    const videoGroups: { url: string; title: string; channelName: string; comments: Comment[] }[] = []
    for (const c of comments) {
      const key = c.videoUrl ?? c.videoTitle ?? ''
      const existing = videoGroups.find(g => g.url === key)
      if (existing) {
        existing.comments.push(c)
      } else {
        videoGroups.push({ url: c.videoUrl ?? '', title: c.videoTitle ?? '', channelName: c.channelName ?? '', comments: [c] })
      }
    }

    // Excel: handle separately (binary output)
    if (fmt === 'Excel') {
      const wb = XLSX.utils.book_new()
      const colHeaders = ['Type', 'VideoTitle', 'VideoURL', 'Channel', 'Author', 'Comment', 'Likes', 'Date']
      if (isMultiVideo) {
        // Separate sheet per video
        for (const vg of videoGroups) {
          const rows: (string | number)[][] = [colHeaders]
          for (const c of vg.comments) {
            rows.push(['comment', vg.title, vg.url, vg.channelName, c.author, c.text, c.likes, c.date])
            for (const r of c.replyList ?? []) {
              rows.push(['reply', vg.title, vg.url, vg.channelName, r.author, r.text, r.likes, r.date])
            }
          }
          const ws = XLSX.utils.aoa_to_sheet(rows)
          const sheetName = (vg.title || vg.url).slice(0, 31).replace(/[\\/*?[\]:]/g, '_')
          XLSX.utils.book_append_sheet(wb, ws, sheetName || `Video${videoGroups.indexOf(vg) + 1}`)
        }
      } else {
        const rows: (string | number)[][] = [colHeaders]
        for (const c of comments) {
          const vt = c.videoTitle ?? ''; const vu = c.videoUrl ?? ''; const ch = c.channelName ?? ''
          rows.push(['comment', vt, vu, ch, c.author, c.text, c.likes, c.date])
          for (const r of c.replyList ?? []) {
            rows.push(['reply', vt, vu, ch, r.author, r.text, r.likes, r.date])
          }
        }
        const ws = XLSX.utils.aoa_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, 'Comments')
      }
      const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
      const blob = new Blob([xlsxBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const dlUrl = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = dlUrl; a.download = 'youtube-comments.xlsx'; a.click()
      URL.revokeObjectURL(dlUrl)
      return
    }

    let content = ''
    let mimeType = 'text/plain'
    let ext = 'txt'
    if (fmt === 'CSV') {
      if (isMultiVideo) {
        const colHeaders = 'Type,VideoTitle,VideoURL,Channel,Author,Comment,Likes,Date'
        const sections: string[] = []
        for (const vg of videoGroups) {
          const q = (s: string) => `"${s.replace(/"/g, '""')}"`
          const rows: string[] = [
            `VIDEO: ${q(vg.title)} (${q(vg.url)})`,
            colHeaders,
          ]
          for (const c of vg.comments) {
            rows.push(`comment,${q(vg.title)},${q(vg.url)},${q(vg.channelName)},${q(c.author)},${q(c.text)},${c.likes},${q(c.date)}`)
            for (const r of c.replyList ?? []) {
              rows.push(`reply,${q(vg.title)},${q(vg.url)},${q(vg.channelName)},${q(r.author)},${q(r.text)},${r.likes},${q(r.date)}`)
            }
          }
          sections.push(rows.join('\n'))
        }
        content = sections.join('\n\n')
      } else {
        // Same columns as the multi-video CSV and Excel export; every text field is quote-escaped
        const q = (s: string) => `"${s.replace(/"/g, '""')}"`
        const rows = ['Type,VideoTitle,VideoURL,Channel,Author,Comment,Likes,Date']
        for (const c of comments) {
          const vt = c.videoTitle ?? ''; const vu = c.videoUrl ?? ''; const ch = c.channelName ?? ''
          rows.push(`comment,${q(vt)},${q(vu)},${q(ch)},${q(c.author)},${q(c.text)},${c.likes},${q(c.date)}`)
          for (const r of c.replyList ?? []) {
            rows.push(`reply,${q(vt)},${q(vu)},${q(ch)},${q(r.author)},${q(r.text)},${r.likes},${q(r.date)}`)
          }
        }
        content = rows.join('\n')
      }
      mimeType = 'text/csv'; ext = 'csv'
    } else if (fmt === 'JSON') {
      if (isMultiVideo) {
        const structured = videoGroups.map(vg => {
          const videoId = vg.url.match(/(?:v=)([a-zA-Z0-9_-]{11})/)?.[1] ?? ''
          return {
            video: { title: vg.title, url: vg.url, videoId, channelName: vg.channelName },
            comments: vg.comments,
          }
        })
        content = JSON.stringify(structured, null, 2)
      } else {
        content = JSON.stringify(comments, null, 2)
      }
      mimeType = 'application/json'; ext = 'json'
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
      const renderCommentThread = (c: Comment) => {
        const replyItems = (c.replyList ?? []).map(r => renderComment(r, 'small')).join('\n')
        const repliesSection = (c.replyList ?? []).length > 0
          ? `<details class="replies-section">
  <summary class="replies-toggle">${sortSvg}&nbsp;${c.replyList!.length} ${c.replyList!.length === 1 ? 'reply' : 'replies'}</summary>
  <div class="replies-list">
${replyItems}
  </div>
</details>`
          : ''
        return `<div class="comment-thread">
${renderComment(c, 'large')}
${repliesSection}
</div>`
      }

      let commentRows: string
      if (isMultiVideo) {
        commentRows = videoGroups.map(vg => {
          const videoId = vg.url.match(/(?:v=)([a-zA-Z0-9_-]{11})/)?.[1] ?? ''
          const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ''
          const threads = vg.comments.map(renderCommentThread).join('\n')
          return `<div class="video-section">
<div class="video-section-header">
  ${thumbUrl ? `<img src="${thumbUrl}" alt="thumbnail" class="video-section-thumb" />` : ''}
  <div class="video-section-meta">
    <h2 class="video-section-title"><a href="${escapeHtml(vg.url)}" target="_blank">${escapeHtml(vg.title)}</a></h2>
    ${vg.channelName ? `<div class="video-section-channel">${escapeHtml(vg.channelName)}</div>` : ''}
    <a href="${escapeHtml(vg.url)}" target="_blank" class="video-section-url">${escapeHtml(vg.url)}</a>
  </div>
</div>
${threads}
</div>`
        }).join('\n<hr class="video-divider" />\n')
      } else {
        commentRows = comments.map(renderCommentThread).join('\n')
      }
      const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      let exportHeaderHtml = ''
      if (sourceMeta) {
        // Only show the top video card for single-video or bulk (channel/playlist) exports.
        // Multi-video exports already show per-video headers in each section block.
        let videoCardHtml = ''
        if (!isMultiVideo && (sourceMeta.title || sourceMeta.thumbnailUrl)) {
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
  .video-section { margin-bottom: 40px; }
  .video-section-header { display: flex; gap: 16px; align-items: flex-start; background: #161616; border: 1px solid #272727; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
  .video-section-thumb { width: 160px; height: 90px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
  .video-section-meta { flex: 1; min-width: 0; }
  .video-section-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; line-height: 1.4; }
  .video-section-title a { color: #f1f1f1; text-decoration: none; }
  .video-section-title a:hover { color: #3ea6ff; }
  .video-section-channel { font-size: 13px; color: #aaaaaa; margin-bottom: 4px; }
  .video-section-url { font-size: 12px; color: #555555; text-decoration: none; word-break: break-all; }
  .video-section-url:hover { color: #3ea6ff; }
  .video-divider { border: none; border-top: 2px solid #272727; margin: 40px 0; }
  .watermark { text-align: center; margin-top: 48px; padding-top: 20px; border-top: 1px solid #272727; font-size: 12px; color: #555555; }
  .watermark a { color: #3ea6ff; text-decoration: none; }
  @media (max-width: 520px) {
    .export-video-card { flex-direction: column; }
    .export-video-thumb { width: 100%; height: auto; aspect-ratio: 16/9; }
    .video-section-header { flex-direction: column; }
    .video-section-thumb { width: 100%; height: auto; aspect-ratio: 16/9; }
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
      const sep = '═'.repeat(40)
      const buildCommentBlock = (c: Comment) => {
        let block = `${c.author} · ${c.date} · ${c.likes} likes\n${c.text}`
        for (const r of c.replyList ?? []) {
          block += `\n\n  ↳ ${r.author} · ${r.date} · ${r.likes} likes\n    ${r.text}`
        }
        return block
      }
      if (isMultiVideo) {
        const sections: string[] = []
        for (const vg of videoGroups) {
          const header = `${sep}\nVIDEO: ${vg.title}\nURL: ${vg.url}\n${sep}`
          const commentBlocks = vg.comments.map(buildCommentBlock).join('\n\n' + '─'.repeat(40) + '\n\n')
          sections.push(`${header}\n\n${commentBlocks}`)
        }
        content = sections.join('\n\n')
      } else {
        const blocks = comments.map(buildCommentBlock)
        content = blocks.join('\n\n' + '─'.repeat(40) + '\n\n')
      }
      ext = 'txt'
    }
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `youtube-comments.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  const isBusiness = userPlan === 'business' || userPlan === 'enterprise'
  const hasBulkUrlDetected = urls.some(u => { if (!u.trim()) return false; const p = parseYouTubeUrl(u); return isBulkUrl(p) })

  const handleExport = async () => {
    const activeUrls = urls.filter(u => u.trim())
    if (!activeUrls.length) return

    // Parse all URLs upfront
    const parsedUrls = activeUrls.map(u => ({ url: u, parsed: parseYouTubeUrl(u) }))
    const hasBulkUrl = parsedUrls.some(({ parsed }) => isBulkUrl(parsed))
    // 0 = "Unlimited" (the server applies the plan's per-download max)
    const parsedMax = parseInt(maxComments)
    const maxCommentsParsed = Number.isNaN(parsedMax) ? 100 : parsedMax
    const fetchOpts = { maxComments: maxCommentsParsed, includeReplies, sortBy }

    // Gate bulk (channel/playlist) to Business+ users
    if (hasBulkUrl && !isBusiness) {
      trackEvent('bulk_export_gated', { plan: userPlan, url_count: activeUrls.length })
      setShowBulkUpgradeModal(true)
      return
    }

    trackEvent('export_start', {
      format,
      plan: userPlan,
      signed_in: isSignedIn,
      url_count: activeUrls.length,
      requested_comments: maxCommentsParsed,
      include_replies: includeReplies,
      sort_by: sortBy,
      has_bulk_url: hasBulkUrl,
    })

    setLoading(true); setDone(false); setProgress(0); setComments([]); setVideosMeta([]); setExportError(''); setCompletionNote('')
    const allComments: Comment[] = []
    const collectedVideosMeta: VideoMeta[] = []
    let pendingMeta: SourceMeta | null = null

    // The server enforces the monthly quota; it tells us when it runs out
    let quotaMessage = ''
    let videosProcessed = 0
    let videosSkipped = 0
    let topEndedEarly = false

    try {
      for (let i = 0; i < parsedUrls.length; i++) {
        if (quotaMessage) break
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

          if (!listRes.ok || listData.error) throw new Error(listData.error ?? 'Unable to fetch the video list.')

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
            const video = videos[j]
            setStatusMsg(`Video ${j + 1} of ${total} — fetching comments…`)
            setProgress(Math.round(5 + ((j / total) * 85)))

            const result = await fetchVideoComments(video.videoUrl, fetchOpts, n =>
              setStatusMsg(`Video ${j + 1} of ${total} — ${n.toLocaleString()} comments…`))
            // Comments turned off / private video: skip it and keep going
            if (result.skippedReason) videosSkipped++
            if (endedEarlyInTopOrder(result, maxCommentsParsed, sortBy)) topEndedEarly = true
            if (result.quotaMessage) quotaMessage = result.quotaMessage
            if (result.comments.length > 0) {
              const videoComments = result.comments
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
            if (quotaMessage) break
          }

        } else if (isVideoUrl(parsed)) {
          // ── Individual video ───────────────────────────────────────────────
          setStatusMsg(`Fetching comments from video ${i + 1} of ${parsedUrls.length}…`)
          setProgress(Math.round((i / parsedUrls.length) * 90))

          // Use canonical URL so the server-side parser always succeeds
          const canonicalUrl = `https://www.youtube.com/watch?v=${parsed.id}`
          const result = await fetchVideoComments(canonicalUrl, fetchOpts, n =>
            setStatusMsg(`Video ${i + 1} of ${parsedUrls.length} — ${n.toLocaleString()} comments…`))
          if (result.skippedReason) {
            if (parsedUrls.length === 1) throw new Error(result.skippedReason)
            videosSkipped++
          }
          if (endedEarlyInTopOrder(result, maxCommentsParsed, sortBy)) topEndedEarly = true
          if (result.quotaMessage) quotaMessage = result.quotaMessage
          if (result.comments.length > 0) {
            const videoComments: Comment[] = result.comments.map((c: Comment, idx: number) => ({ ...c, id: `${i}-${idx}` }))
            allComments.push(...videoComments)
            videosProcessed++
            if (videoComments[0]) {
              const fc = videoComments[0]
              const videoId = fc.videoUrl?.match(/(?:v=)([a-zA-Z0-9_-]{11})/)?.[1] ?? parsed.id ?? ''
              collectedVideosMeta.push({
                videoId,
                title: fc.videoTitle ?? '',
                url: fc.videoUrl ?? url,
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              })
              if (!pendingMeta) {
                pendingMeta = {
                  kind: 'video',
                  title: fc.videoTitle ?? '',
                  channelName: fc.channelName ?? undefined,
                  sourceUrl: fc.videoUrl ?? url,
                  thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined,
                }
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
          const result = await fetchVideoComments(url, fetchOpts)
          if (result.skippedReason) throw new Error(result.skippedReason)
          if (result.quotaMessage) quotaMessage = result.quotaMessage
          if (result.comments.length > 0) {
            allComments.push(...result.comments.map((c: Comment, idx: number) => ({ ...c, id: `${i}-${idx}` })))
            videosProcessed++
          }
        }
      }

      if (quotaMessage && allComments.length === 0) throw new Error(quotaMessage)

      const skippedNote = videosSkipped > 0
        ? ` (${videosSkipped} video${videosSkipped !== 1 ? 's' : ''} skipped — comments off or unavailable)`
        : ''
      if (quotaMessage) {
        setStatusMsg(`Limit reached — ${videosProcessed} video${videosProcessed !== 1 ? 's' : ''} processed, ${allComments.length.toLocaleString()} comments fetched${skippedNote}`)
      } else {
        setStatusMsg(`Processed ${allComments.length.toLocaleString()} comments${skippedNote}`)
      }
      // statusMsg only shows while loading, so anything worth explaining goes in a note that stays
      const notes: string[] = []
      if (quotaMessage) notes.push(`Limit reached after ${allComments.length.toLocaleString()} comments: ${quotaMessage}`)
      if (videosSkipped > 0) notes.push(`${videosSkipped} video${videosSkipped !== 1 ? 's were' : ' was'} skipped because comments are turned off or the video is unavailable.`)
      if (topEndedEarly) notes.push(`YouTube's "Top" order returns a limited set of comments. Switch Sort By to "Newest" to export more.`)
      setCompletionNote(notes.join(' '))
      setComments(allComments)
      if (allComments.length > 0) {
        setDone(true)
        if (isSignedIn) fetchQuota()
      }
      trackEvent('export_complete', {
        format,
        plan: userPlan,
        signed_in: isSignedIn,
        comment_count: allComments.length,
        videos_processed: videosProcessed,
        quota_exceeded: Boolean(quotaMessage),
        videos_skipped: videosSkipped,
        has_bulk_url: hasBulkUrl,
      })
      setSourceMeta(pendingMeta)
      setVideosMeta(collectedVideosMeta)
      if (allComments.length > 0) setDone(true)
    } catch (error) {
      trackEvent('export_error', { format, plan: userPlan, has_bulk_url: hasBulkUrl })
      const message = error instanceof Error ? error.message : 'Unable to complete the export.'
      setExportError(allComments.length > 0
        ? `Export stopped after ${allComments.length.toLocaleString()} comments. You can download the partial results below. ${message}`
        : `Export failed. ${message}`)
      if (allComments.length > 0) {
        setComments(allComments)
        setSourceMeta(pendingMeta)
        setVideosMeta(collectedVideosMeta)
        setDone(true)
        if (isSignedIn) fetchQuota()
      }
    }
    setProgress(100); setLoading(false)
  }

  return (
    <div className="flex-1 overflow-x-hidden">

      <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-[#e5e2e1] mb-2">YouTube Comment Downloader</h1>
          <p className="text-[#888888] text-sm sm:text-base">Paste a public YouTube URL to export available comments within your plan limit.</p>
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
                        <Link href="/pricing" onClick={() => trackEvent('upgrade_cta_click', { location: 'bulk_url_badge', plan: userPlan })} className="text-xs text-red-400 hover:text-red-300 underline">Upgrade</Link>
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
              <div className="text-sm font-medium text-white flex items-center gap-2">
                Include Replies
                {userPlan === 'free' && (
                  <span className="text-xs text-[#555555] bg-[#1a1a1a] border border-white/[0.07] px-1.5 py-0.5 rounded font-normal">Pro only</span>
                )}
              </div>
              <div className="text-xs text-[#888888]">Also fetch comment replies (slower)</div>
            </div>
            <label
              className={`flex items-center gap-3 shrink-0 ${userPlan === 'free' ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
              title={userPlan === 'free' ? 'Pro only' : undefined}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={includeReplies}
                  onChange={e => setIncludeReplies(e.target.checked)}
                  disabled={userPlan === 'free'}
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
                <><Link href="/auth/login" onClick={() => trackEvent('login_cta_click', { location: 'tool_comment_limit' })} className="text-[#888888] hover:text-white underline">Sign in</Link> to unlock more comments</>
              ) : userPlan === 'enterprise' ? (
                'Enterprise plan'
              ) : userPlan === 'business' ? (
                'Business plan'
              ) : userPlan === 'pro' ? (
                'Pro plan'
              ) : (
                <>Free plan · 100 comment max · <Link href="/pricing" onClick={() => trackEvent('upgrade_cta_click', { location: 'tool_quota_hint', plan: userPlan })} className="text-[#888888] hover:text-white underline">Upgrade for more</Link></>
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
                  </p>
                  {quotaData.remaining === 0 && (
                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                      <div className="flex items-start gap-2">
                        <BadgePercent className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                        <div>
                          {/* Point each plan at the next tier up, not always at Pro */}
                          <p className="text-sm font-semibold text-white">
                            {userPlan === 'free' ? 'Free quota used for this month' : 'Monthly quota used'}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#aaaaaa]">
                            {userPlan === 'free'
                              ? 'Upgrade to Pro for a 100,000-comment monthly quota and larger downloads.'
                              : userPlan === 'pro'
                                ? 'Your quota resets on the 1st. Upgrade to Business for a 1,000,000-comment monthly quota and channel exports.'
                                : 'Your quota resets on the 1st. Enterprise has an unlimited monthly quota.'}
                          </p>
                          <Link href={userPlan === 'business' ? '/contact' : '/pricing'} onClick={() => trackEvent('upgrade_cta_click', { location: 'tool_monthly_quota_empty', plan: userPlan })} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500">
                            {userPlan === 'free' ? 'Upgrade to Pro' : userPlan === 'pro' ? 'Upgrade to Business' : 'Contact Sales'}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
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
                <span>CSV, JSON &amp; Excel require a free account. <Link href="/auth/login" onClick={() => trackEvent('login_cta_click', { location: 'tool_format_gate' })} className="text-red-400 hover:text-red-300 underline">Sign in to unlock</Link></span>
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
              {(['top', 'newest'] as SortBy[]).map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors duration-200 min-h-[40px] border ${sortBy === s ? 'bg-red-600 border-transparent text-white' : 'bg-[#0a0a0a] border-white/[0.07] text-[#888888] hover:border-white/[0.2]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleExport} disabled={loading || !urls[0] || (hasBulkUrlDetected && !isBusiness)}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base sm:text-lg transition-colors flex items-center justify-center gap-3 min-h-[56px]">
          {loading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Exporting...</> : <><Download className="w-5 h-5" /> Start Export</>}
        </button>

        {exportError && (
          <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {exportError}
          </p>
        )}

        {hasBulkUrlDetected && !isBusiness && (
          <p className="text-xs text-[#888888] text-center mt-2">
            <Lock className="w-3 h-3 inline mr-1 align-middle" />
            Channel and playlist downloads require a Business plan.{' '}
            <Link href="/pricing" onClick={() => trackEvent('upgrade_cta_click', { location: 'tool_bulk_gate_message', plan: userPlan })} className="text-red-400 hover:text-red-300 underline">Upgrade</Link>
          </p>
        )}

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

        {!loading && completionNote && (
          <p role="status" className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            {completionNote}
          </p>
        )}

        {done && comments.length > 0 && (
          <div className="mt-4 sm:mt-6 bg-[#171717] border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Video tile grid — shown for individual video exports (single or multi) */}
            {videosMeta.length > 0 && (
              <div className="p-4 sm:p-5 border-b border-white/[0.07] bg-[#111111]">
                <div className={`grid gap-3 ${videosMeta.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {videosMeta.map((vm) => (
                    <div key={vm.videoId} className="bg-[#171717] border border-white/[0.07] rounded-xl overflow-hidden relative group">
                      <div className="relative aspect-video">
                        <Image
                          src={vm.thumbnailUrl}
                          alt={vm.title}
                          fill
                          sizes={videosMeta.length === 1 ? '(max-width: 768px) 100vw, 896px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                          className="object-cover"
                          unoptimized
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                        <button
                          onClick={() => {
                            const idx = urls.findIndex(u => {
                              const p = parseYouTubeUrl(u)
                              return ('id' in p && p.id === vm.videoId) || u.includes(vm.videoId)
                            })
                            if (idx >= 0) removeUrl(idx)
                          }}
                          className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove from batch"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <div className="text-white text-xs font-medium line-clamp-2 leading-snug">{vm.title || 'YouTube Video'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Channel / playlist header card — shown only for bulk exports */}
            {sourceMeta && sourceMeta.kind !== 'video' && videosMeta.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-5 border-b border-white/[0.07] bg-[#111111]">
                {sourceMeta.thumbnailUrl && (
                  <Image
                    src={sourceMeta.thumbnailUrl}
                    alt="thumbnail"
                    width={140}
                    height={79}
                    sizes="(max-width: 640px) 100vw, 140px"
                    className="w-full sm:w-[140px] sm:h-[79px] rounded-lg object-cover flex-shrink-0 self-start"
                    unoptimized
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
                    {sourceMeta.title || (sourceMeta.kind === 'channel' ? 'Channel' : 'Playlist')}
                  </div>
                  {sourceMeta.channelName && (
                    <div className="text-[#888888] text-xs mt-1">{sourceMeta.channelName}</div>
                  )}
                  {sourceMeta.videoCount != null && (
                    <div className="text-[#666666] text-xs mt-0.5">{sourceMeta.videoCount} video{sourceMeta.videoCount !== 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
            )}
            <div className="p-4 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-white font-semibold text-sm">Preview</span>
                <span className="text-[#888888] text-sm ml-2">
                  {hasActiveFilters
                    ? `(${filteredComments.length.toLocaleString()} of ${comments.length.toLocaleString()} comments)`
                    : `(${comments.length.toLocaleString()} comments)`}
                </span>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => { setDone(false); setComments([]); setUrls(['']); setSourceMeta(null); setVideosMeta([]); setFilterKeyword(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterMinLikes('') }} className="text-[#888888] hover:text-white text-sm transition-colors min-h-[36px]">Export another</button>
                <button onClick={() => downloadComments(filteredComments, format)}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 min-h-[36px]">
                  <Download className="w-4 h-4" /> Download {format}
                </button>
              </div>
            </div>

            {/* Pro+ filter bar — shown when results are ready */}
            <div className="p-4 border-b border-white/[0.07] bg-[#0f0f0f]">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-sm font-medium text-white">Filter Results</span>
                {!isProPlus && (
                  <span className="text-xs text-[#555555] bg-[#1a1a1a] border border-white/[0.07] px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Pro+ only
                  </span>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setFilterKeyword(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterMinLikes('') }}
                    className="text-xs text-[#888888] hover:text-white px-2 py-0.5 rounded border border-white/[0.07] hover:border-white/[0.15] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={filterKeyword}
                  onChange={e => setFilterKeyword(e.target.value)}
                  placeholder="Keyword search…"
                  disabled={!isProPlus}
                  className={`bg-[#0a0a0a] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-red-600 w-40 ${!isProPlus ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  disabled={!isProPlus}
                  title="From date"
                  style={{ colorScheme: 'dark' }}
                  className={`bg-[#0a0a0a] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600 ${!isProPlus ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
                <span className="text-[#555555] text-sm self-center">–</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  disabled={!isProPlus}
                  title="To date"
                  style={{ colorScheme: 'dark' }}
                  className={`bg-[#0a0a0a] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-600 ${!isProPlus ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
                <input
                  type="number"
                  value={filterMinLikes}
                  onChange={e => setFilterMinLikes(e.target.value)}
                  placeholder="Min likes"
                  min="0"
                  disabled={!isProPlus}
                  className={`bg-[#0a0a0a] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555555] focus:outline-none focus:border-red-600 w-28 ${!isProPlus ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
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
                  {filteredComments.slice(0, 10).map(c => (
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
          <AnalysisPanel comments={filteredComments} isSignedIn={isSignedIn} />
        </div>
      )}

      <section className="border-t border-white/[0.07] px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h2 className="font-jakarta text-2xl font-bold text-[#e5e2e1]">YouTube comment downloader FAQ</h2>
            <p className="mt-2 text-sm leading-6 text-[#777777]">
              Quick answers about export formats, bulk downloads, and AI comment analysis.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {toolFaqs.map((faq) => (
              <div key={faq.question} className="border border-white/[0.07] bg-white/[0.02] p-5">
                <h3 className="font-jakarta text-sm font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-[#777777]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bulk upgrade modal — shown when non-Business users try to use channel/playlist URLs */}
      {showBulkUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 sm:p-8 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600/20 rounded-full p-2">
                <Lock className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-[#e5e2e1] font-bold font-jakarta text-lg">Business plan required</h3>
            </div>
            <p className="text-[#888888] text-sm leading-relaxed mb-6">
              Bulk channel and playlist downloads are available on the{' '}
              <strong className="text-white">Business plan</strong>. Upgrade to download comments from entire channels and playlists in one go.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/pricing" onClick={() => trackEvent('upgrade_cta_click', { location: 'bulk_upgrade_modal', plan: userPlan })} className="block bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl text-center transition-colors">
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
              <h3 className="text-[#e5e2e1] font-bold font-jakarta text-lg">Sign in to export</h3>
            </div>
            <p className="text-[#888888] text-sm leading-relaxed mb-6">
              Create a free account to download in <strong className="text-white">CSV, JSON, and Excel</strong> formats. Plain text is always free — no sign-in needed.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/auth/signup" onClick={() => trackEvent('signup_cta_click', { location: 'auth_gate_modal' })} className="block bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl text-center transition-colors">
                Create Free Account
              </Link>
              <Link href="/pricing" onClick={() => trackEvent('upgrade_cta_click', { location: 'auth_gate_modal_pro_offer', plan: userPlan })} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-100 transition-colors hover:border-red-400/50 hover:bg-red-500/15">
                <BadgePercent className="h-4 w-4" />
                Get Pro with SAVE10
              </Link>
              <Link href="/auth/login" onClick={() => trackEvent('login_cta_click', { location: 'auth_gate_modal' })} className="block border border-white/[0.07] hover:border-white/[0.15] text-white font-medium px-4 py-3 rounded-xl text-center transition-colors text-sm">
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

export default ToolPageContent
