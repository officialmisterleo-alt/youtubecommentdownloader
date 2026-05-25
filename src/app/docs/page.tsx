import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference — YouTube Comment Downloader',
  description: 'Programmatic access to YouTube comment data for Enterprise plans. Full REST API documentation.',
}

// ── Shared UI components ──────────────────────────────────────────────────────

function Badge({ children, variant = 'gray' }: { children: React.ReactNode; variant?: 'red' | 'gray' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${
        variant === 'red'
          ? 'bg-red-950/60 text-red-400 border border-red-800/50'
          : 'bg-white/[0.06] text-[#888888] border border-white/[0.07]'
      }`}
    >
      {children}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold font-jakarta text-[#e5e2e1] mb-1">{children}</h2>
  )
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <p className="text-[#888888] text-sm leading-relaxed mb-6">{children}</p>
}

interface CodeBlockProps {
  lang: string
  code: string
}

function CodeBlock({ lang, code }: CodeBlockProps) {
  return (
    <div className="relative rounded-xl border border-white/[0.07] bg-[#0a0a0a] overflow-hidden mb-4">
      <div className="absolute top-0 right-0 px-3 py-2 text-xs font-mono text-[#555555] border-b border-l border-white/[0.07] rounded-bl-lg">
        {lang}
      </div>
      <pre className="overflow-x-auto p-4 pt-8 text-sm font-mono text-[#e5e2e1] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

interface ParamRow {
  param: string
  type: string
  required: boolean
  defaultVal: string
  description: string
}

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#171717] border-b border-white/[0.07]">
            <th className="text-left px-4 py-3 text-[#888888] font-medium">Parameter</th>
            <th className="text-left px-4 py-3 text-[#888888] font-medium">Type</th>
            <th className="text-left px-4 py-3 text-[#888888] font-medium">Required</th>
            <th className="text-left px-4 py-3 text-[#888888] font-medium">Default</th>
            <th className="text-left px-4 py-3 text-[#888888] font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.param}
              className={`border-b border-white/[0.07] last:border-0 ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'}`}
            >
              <td className="px-4 py-3 font-mono text-[#e5e2e1] text-xs">{row.param}</td>
              <td className="px-4 py-3 text-[#888888] font-mono text-xs">{row.type}</td>
              <td className="px-4 py-3">
                {row.required ? (
                  <span className="text-red-400 text-xs font-semibold">yes</span>
                ) : (
                  <span className="text-[#555555] text-xs">no</span>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-[#555555] text-xs">{row.defaultVal || '—'}</td>
              <td className="px-4 py-3 text-[#888888] text-xs leading-relaxed">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ErrorRow {
  code: string
  status: number
  description: string
}

function ErrorTable({ rows }: { rows: ErrorRow[] }) {
  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden mb-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#171717] border-b border-white/[0.07]">
            <th className="text-left px-4 py-3 text-[#888888] font-medium">Error code</th>
            <th className="text-left px-4 py-3 text-[#888888] font-medium">HTTP status</th>
            <th className="text-left px-4 py-3 text-[#888888] font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.code}
              className={`border-b border-white/[0.07] last:border-0 ${i % 2 === 0 ? 'bg-[#0a0a0a]' : 'bg-[#0f0f0f]'}`}
            >
              <td className="px-4 py-3 font-mono text-[#e5e2e1] text-xs">{row.code}</td>
              <td className="px-4 py-3 font-mono text-[#888888] text-xs">{row.status}</td>
              <td className="px-4 py-3 text-[#888888] text-xs leading-relaxed">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EndpointBadge({ method, path }: { method: string; path: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="px-2.5 py-1 rounded-md bg-green-950/60 text-green-400 border border-green-800/50 font-mono text-xs font-bold">
        {method}
      </span>
      <code className="text-[#e5e2e1] font-mono text-sm">{path}</code>
    </div>
  )
}

// ── Data ──────────────────────────────────────────────────────────────────────

const commentsParams: ParamRow[] = [
  { param: 'url', type: 'string', required: true, defaultVal: '', description: 'YouTube video URL (any standard format, including youtu.be short links and /shorts/).' },
  { param: 'maxComments', type: 'integer', required: false, defaultVal: '100', description: 'Maximum number of comments to return. Capped at 10,000 per request.' },
  { param: 'includeReplies', type: 'boolean', required: false, defaultVal: 'false', description: 'When true, reply threads are fetched and included in replyList. Each reply counts toward your quota individually.' },
  { param: 'sortBy', type: 'string', required: false, defaultVal: '"top"', description: 'Sort order for comments. One of: "top" (most relevant), "newest", or "oldest".' },
]

const channelParams: ParamRow[] = [
  { param: 'url', type: 'string', required: true, defaultVal: '', description: 'YouTube channel URL. Supports /channel/ID, /@handle, /c/custom, and /user/legacy formats.' },
  { param: 'maxVideos', type: 'integer', required: false, defaultVal: '50', description: 'Maximum number of videos to return. Capped at 500 per request.' },
]

const errorRows: ErrorRow[] = [
  { code: 'missing_api_key', status: 401, description: 'No Authorization header was provided with the request.' },
  { code: 'invalid_api_key', status: 401, description: 'The API key is malformed, expired, or does not belong to an active Enterprise account.' },
  { code: 'plan_required', status: 403, description: 'The authenticated account is not on an Enterprise plan. API access requires Enterprise.' },
  { code: 'quota_exceeded', status: 429, description: 'Your monthly comment quota is exhausted. Quota resets on the 1st of each month.' },
  { code: 'invalid_params', status: 400, description: 'A required parameter is missing or a parameter value is invalid. Check the message field for details.' },
  { code: 'not_found', status: 404, description: 'The requested video or channel could not be found. Verify the URL and try again.' },
]

// ── Code snippets ─────────────────────────────────────────────────────────────

const curlAuthExample = `curl -H "Authorization: Bearer yt_live_••••••••••••" \\
  "https://www.youtubecommentdownloader.com/api/v1/quota"`

const commentsRequestCurl = `curl -G "https://www.youtubecommentdownloader.com/api/v1/comments" \\
  -H "Authorization: Bearer yt_live_••••••••••••" \\
  --data-urlencode "url=https://www.youtube.com/watch?v=dQw4w9WgXcQ" \\
  --data-urlencode "maxComments=50" \\
  --data-urlencode "includeReplies=false" \\
  --data-urlencode "sortBy=top"`

const commentsRequestJs = `const response = await fetch(
  "https://www.youtubecommentdownloader.com/api/v1/comments?" +
    new URLSearchParams({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      maxComments: "50",
      includeReplies: "false",
      sortBy: "top",
    }),
  {
    headers: {
      Authorization: "Bearer yt_live_••••••••••••",
    },
  }
);

const data = await response.json();
console.log(data.comments);`

const commentsResponse = `{
  "video": {
    "id": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    "channelName": "Rick Astley"
  },
  "comments": [
    {
      "id": "UgxZ1a2b3c4d5e6f7g8",
      "author": "SomeUser",
      "text": "This video never gets old.",
      "likes": 4821,
      "date": "1/15/2024",
      "dateRaw": "2024-01-15T12:34:56.000Z",
      "replies": 12,
      "replyList": []
    }
  ],
  "totalFetched": 50,
  "quota": {
    "used": 150,
    "remaining": 999850,
    "limit": 1000000
  }
}`

const channelRequestCurl = `curl -G "https://www.youtubecommentdownloader.com/api/v1/channel" \\
  -H "Authorization: Bearer yt_live_••••••••••••" \\
  --data-urlencode "url=https://www.youtube.com/@MrBeast" \\
  --data-urlencode "maxVideos=25"`

const channelRequestJs = `const response = await fetch(
  "https://www.youtubecommentdownloader.com/api/v1/channel?" +
    new URLSearchParams({
      url: "https://www.youtube.com/@MrBeast",
      maxVideos: "25",
    }),
  {
    headers: {
      Authorization: "Bearer yt_live_••••••••••••",
    },
  }
);

const data = await response.json();
console.log(data.videos);`

const channelResponse = `{
  "channel": {
    "id": "UCX6OQ3DkcsbYNE6H8uQQuVA",
    "title": "MrBeast",
    "uploadsPlaylistId": "UUX6OQ3DkcsbYNE6H8uQQuVA"
  },
  "videos": [
    {
      "videoId": "abc123defgh",
      "title": "$1 vs $1,000,000 Hotel Room!",
      "publishedAt": "2024-03-10T18:00:00.000Z"
    }
  ],
  "totalVideos": 25,
  "quota": {
    "used": 150,
    "remaining": 999850,
    "limit": 1000000
  }
}`

const quotaRequestCurl = `curl -H "Authorization: Bearer yt_live_••••••••••••" \\
  "https://www.youtubecommentdownloader.com/api/v1/quota"`

const quotaRequestJs = `const response = await fetch(
  "https://www.youtubecommentdownloader.com/api/v1/quota",
  {
    headers: {
      Authorization: "Bearer yt_live_••••••••••••",
    },
  }
);

const data = await response.json();
console.log(\`Used \${data.used} of \${data.limit} comments this month.\`);`

const quotaResponse = `{
  "plan": "enterprise",
  "used": 42817,
  "remaining": 957183,
  "limit": 1000000,
  "resetsAt": "2026-06-01T00:00:00.000Z"
}`

const pythonExample = `import requests

API_KEY = "yt_live_••••••••••••"
BASE_URL = "https://www.youtubecommentdownloader.com/api/v1"
HEADERS  = {"Authorization": f"Bearer {API_KEY}"}

# Step 1 — Get videos from a channel
channel_res = requests.get(
    f"{BASE_URL}/channel",
    headers=HEADERS,
    params={
        "url": "https://www.youtube.com/@MrBeast",
        "maxVideos": 10,
    },
)
channel_data = channel_res.json()
videos = channel_data["videos"]

# Step 2 — Fetch comments for each video
all_comments = []
for video in videos:
    video_url = f"https://www.youtube.com/watch?v={video['videoId']}"
    comments_res = requests.get(
        f"{BASE_URL}/comments",
        headers=HEADERS,
        params={
            "url": video_url,
            "maxComments": 500,
            "sortBy": "top",
        },
    )
    comments_data = comments_res.json()
    all_comments.extend(comments_data.get("comments", []))
    print(f"{video['title']}: {comments_data['totalFetched']} comments fetched")

print(f"\\nTotal comments collected: {len(all_comments)}")`

const jsExample = `const API_KEY = "yt_live_••••••••••••";
const BASE_URL = "https://www.youtubecommentdownloader.com/api/v1";
const headers = { Authorization: \`Bearer \${API_KEY}\` };

async function fetchChannelComments(channelUrl, videosToFetch = 10, commentsPerVideo = 500) {
  // Step 1 — Get videos from the channel
  const channelRes = await fetch(
    \`\${BASE_URL}/channel?\${new URLSearchParams({ url: channelUrl, maxVideos: String(videosToFetch) })}\`,
    { headers }
  );
  const channelData = await channelRes.json();
  const videos = channelData.videos ?? [];

  // Step 2 — Fetch comments for each video
  const allComments = [];
  for (const video of videos) {
    const videoUrl = \`https://www.youtube.com/watch?v=\${video.videoId}\`;
    const commentsRes = await fetch(
      \`\${BASE_URL}/comments?\${new URLSearchParams({
        url: videoUrl,
        maxComments: String(commentsPerVideo),
        sortBy: "top",
      })}\`,
      { headers }
    );
    const commentsData = await commentsRes.json();
    allComments.push(...(commentsData.comments ?? []));
    console.log(\`\${video.title}: \${commentsData.totalFetched} comments\`);
  }

  return allComments;
}

fetchChannelComments("https://www.youtube.com/@MrBeast")
  .then((comments) => console.log(\`Total collected: \${comments.length}\`))`

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-16">

        {/* ── Header ── */}
        <div className="mb-14">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Badge variant="red">Enterprise Only</Badge>
            <Badge variant="gray">REST API</Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-jakarta text-[#e5e2e1] mb-4">
            API Reference
          </h1>
          <p className="text-[#888888] text-lg leading-relaxed">
            Programmatic access to YouTube comment data for Enterprise plans.
          </p>
        </div>

        {/* ── Authentication ── */}
        <section className="mb-14">
          <SectionTitle>Authentication</SectionTitle>
          <div className="w-12 h-px bg-white/[0.07] mb-5" />
          <SectionDesc>
            All API requests must include your API key in the{' '}
            <code className="font-mono text-[#e5e2e1] bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">Authorization</code>{' '}
            header. Generate your key from the API Keys section of your dashboard. Keys are shown only once — if you lose it, regenerate
            a new one from the dashboard.
          </SectionDesc>

          <div className="bg-[#171717] border border-white/[0.07] rounded-xl p-5 mb-6">
            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Header format</div>
            <code className="font-mono text-sm text-[#e5e2e1]">
              Authorization: Bearer &lt;your-api-key&gt;
            </code>
          </div>

          <CodeBlock lang="curl" code={curlAuthExample} />

          <p className="text-[#555555] text-xs leading-relaxed">
            Keep your API key secret. Do not expose it in client-side code or public repositories.
          </p>
        </section>

        {/* ── Endpoint: /api/v1/comments ── */}
        <section className="mb-14">
          <SectionTitle>Endpoints</SectionTitle>
          <div className="w-12 h-px bg-white/[0.07] mb-8" />

          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 mb-8">
            <EndpointBadge method="GET" path="/api/v1/comments" />
            <p className="text-[#888888] text-sm leading-relaxed mb-6">
              Fetch comments from a YouTube video. Returns up to 10,000 comments per request, sorted by your chosen order. Each
              comment (and each reply, if enabled) counts as 1 toward your monthly quota.
            </p>

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Query parameters</div>
            <ParamTable rows={commentsParams} />

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Example request</div>
            <CodeBlock lang="curl" code={commentsRequestCurl} />
            <CodeBlock lang="javascript" code={commentsRequestJs} />

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Example response</div>
            <CodeBlock lang="json" code={commentsResponse} />
          </div>

          {/* ── Endpoint: /api/v1/channel ── */}
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6 mb-8">
            <EndpointBadge method="GET" path="/api/v1/channel" />
            <p className="text-[#888888] text-sm leading-relaxed mb-6">
              List videos from a YouTube channel. Use the returned{' '}
              <code className="font-mono text-[#e5e2e1] bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">videoId</code> values with{' '}
              <code className="font-mono text-[#e5e2e1] bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">/api/v1/comments</code> to pull comments from
              each video. Listing a channel&apos;s videos does not consume quota — only comment fetches do.
            </p>

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Query parameters</div>
            <ParamTable rows={channelParams} />

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Example request</div>
            <CodeBlock lang="curl" code={channelRequestCurl} />
            <CodeBlock lang="javascript" code={channelRequestJs} />

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Example response</div>
            <CodeBlock lang="json" code={channelResponse} />
          </div>

          {/* ── Endpoint: /api/v1/quota ── */}
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-6">
            <EndpointBadge method="GET" path="/api/v1/quota" />
            <p className="text-[#888888] text-sm leading-relaxed mb-6">
              Check your current quota usage. Returns your plan, the number of comments used this month, how many remain, your total
              limit, and the timestamp when quota resets.
            </p>

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">No parameters</div>
            <p className="text-[#555555] text-xs mb-6">This endpoint takes no query parameters.</p>

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Example request</div>
            <CodeBlock lang="curl" code={quotaRequestCurl} />
            <CodeBlock lang="javascript" code={quotaRequestJs} />

            <div className="text-xs text-[#555555] font-semibold uppercase tracking-widest mb-3">Example response</div>
            <CodeBlock lang="json" code={quotaResponse} />
          </div>
        </section>

        {/* ── Error codes ── */}
        <section className="mb-14">
          <SectionTitle>Error codes</SectionTitle>
          <div className="w-12 h-px bg-white/[0.07] mb-5" />
          <SectionDesc>
            All error responses follow the same shape:{' '}
            <code className="font-mono text-[#e5e2e1] bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">{'{ "error": "<code>", "message": "<description>" }'}</code>.
            Use the{' '}
            <code className="font-mono text-[#e5e2e1] bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">error</code> field for programmatic
            handling and <code className="font-mono text-[#e5e2e1] bg-white/[0.06] px-1.5 py-0.5 rounded text-xs">message</code> for
            human-readable context.
          </SectionDesc>
          <ErrorTable rows={errorRows} />
        </section>

        {/* ── Quota & limits ── */}
        <section className="mb-14">
          <SectionTitle>Quota &amp; limits</SectionTitle>
          <div className="w-12 h-px bg-white/[0.07] mb-5" />
          <div className="space-y-3">
            {[
              ['Monthly limit', 'Enterprise accounts receive 1,000,000 comments per month.'],
              ['Reset schedule', 'Quota resets on the 1st of each calendar month at midnight UTC.'],
              ['What counts', 'Each top-level comment counts as 1. When includeReplies=true, each reply also counts as 1.'],
              ['Per-request cap', 'maxComments is capped at 10,000 per request. Make multiple requests to collect more.'],
              ['Monitor usage', 'Call GET /api/v1/quota at any time to check your used, remaining, and resetsAt values.'],
            ].map(([label, text]) => (
              <div key={label} className="bg-[#171717] border border-white/[0.07] rounded-xl p-4 flex gap-4">
                <div className="w-1 rounded-full bg-red-600 flex-shrink-0 self-stretch" />
                <div>
                  <div className="text-[#e5e2e1] text-sm font-semibold mb-0.5">{label}</div>
                  <p className="text-[#888888] text-sm leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Code examples ── */}
        <section className="mb-14">
          <SectionTitle>Code examples</SectionTitle>
          <div className="w-12 h-px bg-white/[0.07] mb-5" />
          <SectionDesc>
            A complete workflow: fetch the video list from a channel, then pull comments from each video. Copy-paste ready.
          </SectionDesc>
          <CodeBlock lang="python" code={pythonExample} />
          <CodeBlock lang="javascript" code={jsExample} />
        </section>

        {/* ── Enterprise CTA ── */}
        <section>
          <div className="bg-[#171717] border border-white/[0.07] rounded-2xl p-8 text-center">
            <div className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-3">Enterprise</div>
            <h2 className="text-2xl font-bold font-jakarta text-[#e5e2e1] mb-3">Ready to get started?</h2>
            <p className="text-[#888888] text-sm leading-relaxed mb-6 max-w-md mx-auto">
              Contact us to set up your Enterprise account and get your API key. We&apos;ll get you up and running quickly.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-[#e5e2e1] font-semibold text-sm rounded-xl transition-colors"
            >
              Contact us →
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
