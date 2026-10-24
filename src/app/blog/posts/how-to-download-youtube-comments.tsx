import BlogPostLayout from '@/components/blog/BlogPostLayout'
import Callout from '@/components/blog/Callout'
import KeyTakeaway from '@/components/blog/KeyTakeaway'

const toc = [
  { id: 'step-by-step', label: 'Step-by-Step: Download YouTube Comments', level: 2 as const },
  { id: 'formats', label: 'Which Format Should You Choose?', level: 2 as const },
  { id: 'large-videos', label: 'Tips for Videos with Lots of Comments', level: 2 as const },
  { id: 'bulk', label: 'Downloading Comments from Playlists and Channels', level: 2 as const },
]

export default function HowToDownloadYouTubeComments() {
  return (
    <BlogPostLayout
      title="How to Download All Comments from a YouTube Video"
      description="A step-by-step guide to downloading YouTube comments — including which formats to use, how to handle videos with tens of thousands of comments, and bulk options for channels and playlists."
      date="2026-05-01"
      readTime="6 min read"
      tags={['YouTube Tools', 'How-To', 'Data Export']}
      toc={toc}
    >
      <p>
        Knowing how to download YouTube comments from a video is useful for a range of tasks: content research, audience analysis, moderation review, or building datasets. This guide walks through the exact steps, explains your format choices, and covers what to do when you&apos;re dealing with a video that has tens of thousands of comments.
      </p>

      <h2 className="font-jakarta" id="step-by-step">Step-by-Step: How to Download YouTube Comments</h2>
      <p>
        The fastest method uses this tool, which works in a browser — no installs, no code, no API setup.
      </p>

      <h3 className="font-jakarta">Step 1: Get the video URL</h3>
      <p>
        Copy the URL from your browser address bar. Standard YouTube video URLs (youtube.com/watch?v=...) and short URLs (youtu.be/...) both work. You can also use channel URLs and playlist URLs if you want comments from multiple videos at once.
      </p>

      <h3 className="font-jakarta">Step 2: Go to the tool</h3>
      <p>
        Open <a href="/tool" className="text-red-400 hover:text-red-300">the tool page</a>. No account is required for a basic export — paste your URL and go. Create a free account if you want CSV, Excel, or JSON output, or need more than 100 comments.
      </p>

      <h3 className="font-jakarta">Step 3: Paste the URL</h3>
      <p>
        Paste your YouTube URL into the input field. The tool immediately detects whether it&apos;s a video, channel, or playlist, and shows you the appropriate options.
      </p>

      <h3 className="font-jakarta">Step 4: Choose your settings</h3>
      <ul>
        <li><strong>Max comments:</strong> How many comments to fetch (free: up to 100, Pro: up to 10,000)</li>
        <li><strong>Sort order:</strong> Top comments (relevance) or Newest first</li>
        <li><strong>Include replies:</strong> Toggle on to also fetch the reply threads under each top-level comment (Pro plan)</li>
      </ul>

      <h3 className="font-jakarta">Step 5: Pick a format</h3>
      <p>
        TXT and HTML work without signing in. CSV, Excel, and JSON require a free account. Pick based on what you&apos;ll do with the data — CSV/Excel for spreadsheets, JSON for code, TXT for quick reading.
      </p>

      <h3 className="font-jakarta">Step 6: Click Export and download</h3>
      <p>
        The export runs immediately. You can watch the comment count increase as data streams in. When it&apos;s done, click the download button. Your file saves to your downloads folder.
      </p>

      <Callout variant="insight" title="What you get in the download">
        Each downloaded comment includes the author name, full comment text, like count, date posted, reply count, and the source video title and URL. Multi-video exports tag each comment with its source so you can filter by video later.
      </Callout>

      <h2 className="font-jakarta" id="formats">Which Format Should You Choose?</h2>
      <p>
        The right format depends entirely on what you plan to do with the downloaded YouTube comments:
      </p>

      <div className="my-6 overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">If you want to&hellip;</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">Use this format</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {[
              ['Open in Google Sheets or Excel', 'CSV'],
              ['Share a polished report with a client', 'Excel or HTML'],
              ['Use in Python, R, or a data pipeline', 'JSON'],
              ['Read through quickly without a spreadsheet', 'TXT'],
              ['Process in a database or import tool', 'CSV or JSON'],
            ].map(([intent, format]) => (
              <tr key={intent} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-[#888]">{intent}</td>
                <td className="px-4 py-3 text-white font-medium">{format}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        When in doubt, use CSV. It works everywhere and preserves all the fields without losing structure.
      </p>

      <h2 className="font-jakarta" id="large-videos">Tips for Videos with Lots of Comments</h2>
      <p>
        Some videos have hundreds of thousands of comments. A few things to know when you want to download YouTube comments at scale:
      </p>

      <h3 className="font-jakarta">Set a realistic comment limit</h3>
      <p>
        Choose a limit that matches your research question. A smaller export is faster to review, while studies of changes over time or uncommon opinions may need a larger, more representative sample. Remember that plan limits and YouTube API availability can affect completeness.
      </p>

      <h3 className="font-jakarta">Start with &ldquo;Top comments&rdquo; sort</h3>
      <p>
        Top comments are useful for seeing prominent reactions, but they are not a representative sample of every viewer. Choose newest comments when timing matters, and describe the sort order when sharing your findings.
      </p>

      <h3 className="font-jakarta">Expect proportional export time</h3>
      <p>
        Export time depends on comment volume, YouTube API response times, and whether replies are included. Larger exports can take longer; keep the tab open until the results are ready.
      </p>

      <h3 className="font-jakarta">Check the comment count first</h3>
      <p>
        YouTube shows the total comment count below each video. If a video has 200,000 comments and you only need the top opinions, set your limit to 5,000 rather than letting the export run for an hour unnecessarily.
      </p>

      <h2 className="font-jakarta" id="bulk">Downloading Comments from Playlists and Channels</h2>
      <p>
        The tool handles more than individual videos. You can also download YouTube comments from:
      </p>

      <ul>
        <li>
          <strong>Playlists:</strong> On Business or Enterprise, paste a playlist URL (youtube.com/playlist?list=...). The tool gathers available comments from playlist videos within plan and API limits. Results include video source context.
        </li>
        <li>
          <strong>Channels:</strong> On Business or Enterprise, paste a channel URL (@handle, youtube.com/channel/, or youtube.com/c/). The tool processes available videos within plan and API limits.
        </li>
        <li>
          <strong>Multiple videos:</strong> Use the &ldquo;Add URL&rdquo; button to paste up to 5 individual video URLs. Useful for comparing engagement across a set of videos side by side.
        </li>
      </ul>

      <Callout variant="insight" title="Channel export use case">
        A common use case: paste a competitor&apos;s channel URL to download comments across their recent videos. You get a combined dataset showing which content types generated the most discussion, what questions keep coming up, and what their audience praises or criticizes most.
      </Callout>

      <KeyTakeaway>
        Paste a public video URL, choose your format and comment limit, then export. Use CSV for spreadsheets, JSON for code, and TXT for quick reading. The time and completeness of an export depend on the source, plan limit, and YouTube API availability.
      </KeyTakeaway>
    </BlogPostLayout>
  )
}
