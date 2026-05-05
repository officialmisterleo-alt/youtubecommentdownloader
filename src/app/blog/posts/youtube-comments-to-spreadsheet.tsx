import BlogPostLayout from '@/components/blog/BlogPostLayout'
import Callout from '@/components/blog/Callout'
import KeyTakeaway from '@/components/blog/KeyTakeaway'
import SectionGrid from '@/components/blog/SectionGrid'
import StatCard from '@/components/blog/StatCard'

const toc = [
  { id: 'who-uses-this', label: 'Who Gets the Most Value From This', level: 2 as const },
  { id: 'export-to-spreadsheet', label: 'How to Export YouTube Comments to a Spreadsheet', level: 2 as const },
  { id: 'open-in-google-sheets', label: 'Opening in Google Sheets', level: 2 as const },
  { id: 'open-in-excel', label: 'Opening in Excel', level: 2 as const },
  { id: 'analysis-tips', label: 'Basic Analysis: What to Do Once You Have the Data', level: 2 as const },
]

export default function YouTubeCommentsToSpreadsheet() {
  return (
    <BlogPostLayout
      title="YouTube Comments to Spreadsheet: Analyze Audience Sentiment Fast"
      description="Move YouTube comments into a spreadsheet in seconds — then sort by likes, filter by keyword, and spot sentiment patterns without any special tools. Here's how."
      date="2026-05-01"
      readTime="6 min read"
      tags={['Data Analysis', 'YouTube Tools', 'Audience Research']}
      toc={toc}
    >
      <p>
        Turning YouTube comments into a spreadsheet takes about two minutes. Once you have the data in Google Sheets or Excel, you can sort by likes to find the most-endorsed opinions, filter for keywords, tag sentiment, and spot patterns across thousands of comments — things that are impossible to do by scrolling through YouTube&apos;s interface.
      </p>
      <p>
        This guide covers who benefits most from moving YouTube comments to a spreadsheet, how to do it, and the analysis techniques that actually produce useful insights.
      </p>

      <h2 className="font-jakarta" id="who-uses-this">Who Gets the Most Value From This</h2>
      <p>
        YouTube comments in a spreadsheet are most useful for three groups:
      </p>

      <SectionGrid cols={3}>
        <StatCard value="Creators" label="Content planning" sub="Find questions and topics your audience wants covered" />
        <StatCard value="Marketers" label="Sentiment tracking" sub="Monitor brand or product perception in video comments" />
        <StatCard value="Researchers" label="Audience analysis" sub="Build labeled datasets or analyze discourse patterns" />
      </SectionGrid>

      <h3 className="font-jakarta">Content creators</h3>
      <p>
        Your comment section is a continuous stream of content ideas. Viewers ask questions your video didn&apos;t answer, request follow-ups, suggest angles, and complain about things they expected but didn&apos;t get. Moving those comments to a spreadsheet lets you sort by likes (finding the questions that resonated most with the audience) and build a content calendar from real audience demand rather than guesswork.
      </p>

      <h3 className="font-jakarta">Marketers and brand teams</h3>
      <p>
        If your product, brand, or campaign is mentioned in YouTube videos, the comments are where you&apos;ll find unfiltered audience opinion. Downloading those comments and putting them in a spreadsheet lets you track sentiment over time, count positive vs. negative mentions, and flag specific issues for product or messaging teams.
      </p>

      <h3 className="font-jakarta">Researchers and analysts</h3>
      <p>
        Academic researchers studying online discourse, political communication, health misinformation, or consumer behavior frequently use YouTube comments as primary source data. A spreadsheet is the first step toward any quantitative analysis — tagging, coding, and counting categories across a large dataset.
      </p>

      <h2 className="font-jakarta" id="export-to-spreadsheet">How to Export YouTube Comments to a Spreadsheet</h2>
      <p>
        The tool on this site exports YouTube comments to a spreadsheet-ready format in seconds. Here&apos;s the process:
      </p>

      <ol>
        <li>
          <strong>Open <a href="/tool" className="text-red-400 hover:text-red-300">the tool</a></strong> and sign in (free — required for CSV/Excel export).
        </li>
        <li>
          <strong>Paste the YouTube URL.</strong> Video, playlist, or channel URL all work. For channel-level exports (Business plan), you get comments from every video in one file.
        </li>
        <li>
          <strong>Set your options:</strong> how many comments, sort order, and whether to include replies.
        </li>
        <li>
          <strong>Choose your format:</strong>
          <ul>
            <li><strong>CSV</strong> — best for Google Sheets or any data pipeline</li>
            <li><strong>Excel (.xlsx)</strong> — opens directly in Excel with formatting, useful for sharing</li>
          </ul>
        </li>
        <li>
          <strong>Click Export.</strong> Watch comments load in real time, then download when done.
        </li>
      </ol>

      <Callout variant="insight" title="How many comments should you export?">
        For most analysis, the top 500–2,000 comments by likes give you the highest-signal data. Going beyond that often adds noise — low-liked comments tend to be spam or low-effort. For large-scale NLP work, export as many as you need; for qualitative research, 500 is usually plenty.
      </Callout>

      <h2 className="font-jakarta" id="open-in-google-sheets">Opening YouTube Comments in Google Sheets</h2>
      <p>
        If you downloaded a CSV:
      </p>
      <ol>
        <li>Go to Google Sheets and create a new spreadsheet (or open an existing one).</li>
        <li>Click <strong>File → Import</strong>.</li>
        <li>Select the CSV file from your computer.</li>
        <li>In the import settings, choose <strong>Comma</strong> as the separator type.</li>
        <li>Select <strong>Replace current sheet</strong> or <strong>Insert new sheet</strong>.</li>
        <li>Click <strong>Import data</strong>.</li>
      </ol>
      <p>
        Your YouTube comments now appear as a table with columns for author, comment text, likes, date, replies, and source video.
      </p>
      <p>
        Next, select the header row and go to <strong>Data → Create a filter</strong>. This adds dropdown arrows to each column header, enabling one-click sorting and filtering.
      </p>

      <h2 className="font-jakarta" id="open-in-excel">Opening YouTube Comments in Excel</h2>
      <p>
        If you downloaded the Excel format (.xlsx), just double-click the file — it opens directly in Excel with formatting applied.
      </p>
      <p>
        For CSV files in Excel:
      </p>
      <ol>
        <li>Open Excel and go to <strong>Data → Get Data → From File → From Text/CSV</strong>.</li>
        <li>Select your CSV file.</li>
        <li>In the preview pane, confirm the delimiter is set to <strong>Comma</strong>.</li>
        <li>Click <strong>Load</strong>.</li>
      </ol>
      <p>
        Select any cell in the data, then go to <strong>Insert → Table</strong> (or press Ctrl+T) to convert the range to a table. This enables sorting and filtering on all columns instantly.
      </p>

      <Callout variant="insight" title="Tip: freeze the header row">
        In Google Sheets, go to View → Freeze → 1 row. In Excel, go to View → Freeze Panes → Freeze Top Row. This keeps the column headers visible as you scroll through thousands of comments.
      </Callout>

      <h2 className="font-jakarta" id="analysis-tips">Basic Analysis: What to Do Once You Have the Data</h2>
      <p>
        Once your YouTube comments are in a spreadsheet, here are the analyses that consistently produce useful insights:
      </p>

      <h3 className="font-jakarta">Sort by likes — descending</h3>
      <p>
        This is the single most useful thing you can do first. The most-liked comments are the ones the audience collectively endorsed. They&apos;re your highest-signal data points: the opinions, questions, and observations that resonated with the most viewers. Read through the top 50–100 before doing anything else.
      </p>

      <h3 className="font-jakarta">Filter for questions</h3>
      <p>
        Add a filter to the Comment column and search for &ldquo;?&rdquo;. This pulls every comment that ends with or contains a question mark. The result is a list of things your viewers wanted to know that the video didn&apos;t answer — potential future topics, FAQ entries, or clarifications to add to the video description.
      </p>

      <h3 className="font-jakarta">Search for competitor or product mentions</h3>
      <p>
        Use Ctrl+F (or Sheets&apos; built-in search) to search for competitor brand names, product names, or specific feature terms. Even a quick scan tells you whether viewers are making comparisons, what alternatives they mention, and whether sentiment around those alternatives is positive or negative.
      </p>

      <h3 className="font-jakarta">Add a sentiment column</h3>
      <p>
        Create a new column labeled &ldquo;Sentiment.&rdquo; For the top 100–200 comments (sorted by likes), tag each as Positive, Negative, or Neutral. Once you have 100+ tagged rows, you can count each category and get a rough audience sentiment read. This is manual but surprisingly fast — 100 comments takes about 10–15 minutes, and the pattern becomes obvious quickly.
      </p>

      <h3 className="font-jakarta">Track comment volume over time</h3>
      <p>
        Sort by date instead of likes. If comment activity spikes on a particular day, something happened — a mention on another platform, a response from the creator, or a news event. Cross-referencing high comment-volume days with external events can reveal how your audience reacts to real-world context.
      </p>

      <KeyTakeaway>
        Moving YouTube comments into a spreadsheet unlocks analysis that&apos;s impossible in the YouTube interface. Export as CSV, import to Google Sheets or Excel, sort by likes, filter for questions, and search for keywords. Thirty minutes of spreadsheet work on a comment dataset gives you more audience insight than hours of scrolling through YouTube comments one by one.
      </KeyTakeaway>
    </BlogPostLayout>
  )
}
