import BlogPostLayout from '@/components/blog/BlogPostLayout'

const toc = [
  { id: 'what-to-study', label: 'What to Study', level: 2 as const },
  { id: 'collection', label: 'Collect Comments', level: 2 as const },
  { id: 'coding', label: 'Code the Dataset', level: 2 as const },
  { id: 'deliverables', label: 'Useful Deliverables', level: 2 as const },
]

export default function YouTubeCommentsMarketResearch() {
  return (
    <BlogPostLayout
      title="Using YouTube Comments for Market Research"
      description="How teams can collect, structure, and analyze YouTube comments to understand audience demand, objections, competitors, and product feedback."
      date="2026-08-21"
      readTime="7 min read"
      tags={['Market Research', 'Audience Research', 'YouTube Tools']}
      toc={toc}
    >
      <p>
        YouTube comments are public, messy, and unusually candid. For market research, that combination is valuable. Viewers compare products, complain about missing features, ask follow-up questions, and describe the words they would use to explain a problem.
      </p>
      <p>
        The goal is not to treat comments as a perfect survey. The goal is to use them as a directional research source that reveals language and patterns worth validating.
      </p>

      <h2 className="font-jakarta" id="what-to-study">What to Study</h2>
      <p>
        Good targets include competitor review videos, tutorials in your category, product launch videos, comparison videos, and channels where your audience already spends time.
      </p>
      <p>
        For each source, decide what you are looking for before exporting: objections, feature requests, buying triggers, alternatives, sentiment, audience segments, or content gaps.
      </p>

      <h2 className="font-jakarta" id="collection">Collect Comments</h2>
      <p>
        Export comments into a structured format so each row keeps its source video, comment text, likes, date, and reply context. CSV works well for research teams because it opens cleanly in Google Sheets, Excel, Airtable, and analysis tools.
      </p>
      <p>
        If the research spans many videos, use a playlist or channel export on a supported plan so the dataset is not assembled by hand.
      </p>

      <h2 className="font-jakarta" id="coding">Code the Dataset</h2>
      <p>
        Start with broad tags: positive, negative, question, complaint, comparison, feature request, confusion, and quote-worthy language. Keep a second column for themes such as price, trust, setup, performance, ease of use, or support.
      </p>
      <p>
        Sort by likes after tagging. A repeated theme that also appears in high-liked comments deserves more attention than a one-off low-engagement remark.
      </p>

      <h2 className="font-jakarta" id="deliverables">Useful Deliverables</h2>
      <p>
        Turn the analysis into a short list of audience phrases, common objections, feature requests, competitor comparisons, and recommended content topics. Those deliverables are directly useful for landing pages, ads, sales calls, product messaging, and editorial calendars.
      </p>
      <p>
        For a starting point, see the <a href="/youtube-comment-research-tool" className="text-red-400 hover:text-red-300">YouTube comment research tool</a> page or review a <a href="/sample-youtube-comment-export" className="text-red-400 hover:text-red-300">sample comment export</a>.
      </p>
    </BlogPostLayout>
  )
}
