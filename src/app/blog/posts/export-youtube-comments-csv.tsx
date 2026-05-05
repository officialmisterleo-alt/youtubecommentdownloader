import BlogPostLayout from '@/components/blog/BlogPostLayout'
import Callout from '@/components/blog/Callout'
import KeyTakeaway from '@/components/blog/KeyTakeaway'

const toc = [
  { id: 'why-csv', label: 'Why CSV Is the Right Format', level: 2 as const },
  { id: 'how-to-export', label: 'How to Export YouTube Comments to CSV', level: 2 as const },
  { id: 'csv-columns', label: 'What the CSV Columns Look Like', level: 2 as const },
  { id: 'open-in-sheets', label: 'Opening Your CSV in Excel or Google Sheets', level: 2 as const },
  { id: 'what-to-do', label: 'What to Do With the Data', level: 2 as const },
  { id: 'alternatives', label: 'Alternatives Comparison', level: 2 as const },
]

export default function ExportYouTubeCommentsCSV() {
  return (
    <BlogPostLayout
      title="How to Export YouTube Comments to CSV (Free, No Code)"
      description="Export YouTube comments to CSV in a few clicks — no API keys, no coding. Here's how to do it, what the CSV columns look like, and what to do with the data in Excel or Google Sheets."
      date="2026-05-01"
      readTime="7 min read"
      tags={['Data Export', 'YouTube Tools', 'Spreadsheets']}
      toc={toc}
    >
      <p>
        Exporting YouTube comments to CSV is the fastest way to go from a comment section you can only browse to a dataset you can actually analyze. Once you have the data in a spreadsheet, you can search across thousands of comments in seconds, sort by likes, filter by date, or run any analysis you need — without touching the YouTube interface again.
      </p>
      <p>
        This guide shows you how to export YouTube comments to CSV for free, what you get in the file, and what to do with it.
      </p>

      <h2 className="font-jakarta" id="why-csv">Why CSV Is the Right Format for YouTube Comment Data</h2>
      <p>
        CSV (comma-separated values) is the universal format for structured data. Every spreadsheet tool opens it — Excel, Google Sheets, LibreOffice Calc, Numbers on Mac. It also works directly with Python (pandas), R, SQL tools, and basically any data pipeline you might want to run.
      </p>
      <p>
        The alternatives have tradeoffs:
      </p>
      <ul>
        <li><strong>TXT</strong> — readable by humans, hard to filter or sort programmatically</li>
        <li><strong>JSON</strong> — best for developers and machine learning, awkward to open in spreadsheets</li>
        <li><strong>Excel (.xlsx)</strong> — pre-formatted spreadsheet, useful for sharing with clients, but not as portable as CSV</li>
        <li><strong>HTML</strong> — good-looking shareable report, but not editable</li>
      </ul>
      <p>
        For most use cases — content research, sentiment analysis, moderation review, client reporting — CSV is the right choice. It opens in one click and works everywhere.
      </p>

      <h2 className="font-jakarta" id="how-to-export">How to Export YouTube Comments to CSV</h2>
      <p>
        Here&apos;s the process using this tool, which requires no coding and no API setup:
      </p>

      <ol>
        <li>
          <strong>Go to <a href="/tool" className="text-red-400 hover:text-red-300">the tool page</a>.</strong> You&apos;ll need a free account to export CSV (TXT works without one).
        </li>
        <li>
          <strong>Paste the YouTube URL.</strong> Video, playlist, or channel URL — all work. For playlists and channels, the tool fetches comments from every video in the source.
        </li>
        <li>
          <strong>Set your comment limit.</strong> Free accounts: up to 100 comments. Pro: up to 10,000. Business: up to 100,000.
        </li>
        <li>
          <strong>Choose sort order.</strong> &ldquo;Top comments&rdquo; gives you the most-liked comments first (usually most useful for research). &ldquo;Newest&rdquo; is better for real-time monitoring.
        </li>
        <li>
          <strong>Select CSV as the format.</strong> It&apos;s in the format picker. If you see a lock icon, sign in to unlock it.
        </li>
        <li>
          <strong>Click Export.</strong> Comments load in real time — you&apos;ll see the count increase as data streams in.
        </li>
        <li>
          <strong>Download.</strong> Once the export is complete, click the download button. Your browser saves the .csv file immediately.
        </li>
      </ol>

      <Callout variant="insight" title="Multiple videos at once">
        You can paste up to 5 URLs in the tool simultaneously. The CSV export combines all comments into one file, with a column identifying the source video. This is useful for pulling comments from several videos in a single download.
      </Callout>

      <h2 className="font-jakarta" id="csv-columns">What the CSV Columns Look Like</h2>
      <p>
        Each row in the exported CSV is one comment. Here are the columns:
      </p>

      <div className="my-6 overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">Column</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">What it contains</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {[
              ['Author', "The commenter's YouTube display name"],
              ['Comment', 'Full text of the comment (not truncated)'],
              ['Likes', 'Number of likes the comment received'],
              ['Date', 'When the comment was posted (relative or absolute)'],
              ['Replies', 'Number of replies to the top-level comment'],
              ['Video Title', 'Title of the source video (useful for multi-video exports)'],
              ['Video URL', 'Direct link to the source video'],
              ['Channel', 'Channel name the video belongs to'],
            ].map(([col, desc]) => (
              <tr key={col} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{col}</td>
                <td className="px-4 py-3 text-[#888]">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>
        If you export with replies enabled, each reply gets its own row in the CSV, with a parent comment reference so you can reconstruct the thread structure if needed.
      </p>

      <h2 className="font-jakarta" id="open-in-sheets">Opening Your CSV in Excel or Google Sheets</h2>

      <h3 className="font-jakarta">Google Sheets</h3>
      <p>
        Open Google Sheets and go to <strong>File → Import</strong>. Select the CSV file from your computer. Choose &ldquo;Comma&rdquo; as the separator (it should auto-detect). Click Import. Your comments appear as a formatted table.
      </p>
      <p>
        From there, use <strong>Data → Create a filter</strong> to add filter dropdowns to each column. You can then filter to comments with more than 50 likes, or sort by date to find the most recent responses.
      </p>

      <h3 className="font-jakarta">Excel</h3>
      <p>
        Open Excel and go to <strong>Data → From Text/CSV</strong>. Select your file. Excel&apos;s import wizard shows a preview — confirm the delimiter is set to comma and click Load. The data lands in a table with column headers.
      </p>

      <Callout variant="insight" title="Tip: use Table format">
        After importing in Excel, select your data and press Ctrl+T (or Cmd+T on Mac) to convert it to an Excel Table. This gives you built-in filter controls on each column header and makes sorting one click.
      </Callout>

      <h2 className="font-jakarta" id="what-to-do">What to Do With the Data</h2>
      <p>
        Once you have the CSV open in a spreadsheet, a few analyses are immediately useful:
      </p>

      <h3 className="font-jakarta">Sort by likes to find the signal</h3>
      <p>
        Sort the Likes column descending. The top-liked comments are the ones the community collectively endorsed — these are often questions, opinions, or observations that resonated with many viewers. They&apos;re your highest-signal data points.
      </p>

      <h3 className="font-jakarta">Search for keywords</h3>
      <p>
        Use Ctrl+F (or Sheets&apos; built-in search) to find all mentions of a competitor name, a product feature, or a specific question. Even a quick keyword scan across 5,000 comments takes 30 seconds in a spreadsheet.
      </p>

      <h3 className="font-jakarta">Count questions</h3>
      <p>
        Filter the Comment column for rows containing &ldquo;?&rdquo; to pull out every question in the dataset. These are the gaps in the video&apos;s content — and potential topics for follow-up videos or FAQ additions.
      </p>

      <h3 className="font-jakarta">Track sentiment themes</h3>
      <p>
        Add a column for manual or automated sentiment labels. Even a simple positive/negative/neutral tag on the top 100 comments gives you a useful read on audience mood that you can track over time.
      </p>

      <h2 className="font-jakarta" id="alternatives">Alternatives Comparison</h2>
      <p>
        There are a few other ways to export YouTube comments to CSV. Here&apos;s the honest comparison:
      </p>

      <div className="my-6 overflow-x-auto rounded-xl border border-white/[0.07]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02]">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">Method</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">Pros</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">Cons</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {[
              ['This tool', 'No code, instant, bulk support', 'Free tier capped at 100 comments'],
              ['YouTube Data API (DIY)', 'Full control, no limits beyond quota', 'Requires coding + API key setup'],
              ['YouTube Studio export', 'Official, easy', 'Only your own videos, no CSV'],
              ['Browser extensions', 'Convenient for small jobs', 'Often break with YouTube updates, few active'],
              ['Python scripts (yt-dlp)', 'Flexible, open source', 'Requires Python setup, technical'],
            ].map(([method, pros, cons]) => (
              <tr key={method} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{method}</td>
                <td className="px-4 py-3 text-[#888]">{pros}</td>
                <td className="px-4 py-3 text-[#888]">{cons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <KeyTakeaway>
        Exporting YouTube comments to CSV takes about 30 seconds with the right tool. You get a clean, structured file that opens in any spreadsheet, ready for analysis. No API keys, no coding, no waiting — just paste a URL and download.
      </KeyTakeaway>
    </BlogPostLayout>
  )
}
