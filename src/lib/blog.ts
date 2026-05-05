import type { ComponentType } from 'react'

export type BlogPost = {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  tags: string[]
  Content: ComponentType
}

// Registry of all posts — sorted by date desc
const posts: Omit<BlogPost, 'Content'>[] = [
  {
    slug: 'viral-content-ideas-competitors-youtube-comments',
    title: "How to Find Viral Content Ideas Hidden in Your Competitors' YouTube Comments",
    description:
      "Your competitors' comment sections are the most honest focus group on the internet. Here's how to read them like a strategist and turn what you find into content people actually want.",
    date: '2026-04-01',
    readTime: '7 min read',
    tags: ['Content Strategy', 'YouTube Research', 'Creator Economy'],
  },
  {
    slug: 'youtube-comment-downloader',
    title: "YouTube Comment Downloader: Export Any Video's Comments in Seconds",
    description:
      'A YouTube comment downloader lets you extract and save comments from any video for research, moderation, or analysis. Here\'s how to use this free tool and why it matters.',
    date: '2026-05-01',
    readTime: '8 min read',
    tags: ['YouTube Tools', 'Data Export', 'Comment Analysis'],
  },
  {
    slug: 'export-youtube-comments-csv',
    title: 'How to Export YouTube Comments to CSV (Free, No Code)',
    description:
      'Export YouTube comments to CSV in a few clicks — no API keys, no coding. Here\'s how to do it, what the CSV columns look like, and what to do with the data in Excel or Google Sheets.',
    date: '2026-05-01',
    readTime: '7 min read',
    tags: ['Data Export', 'YouTube Tools', 'Spreadsheets'],
  },
  {
    slug: 'youtube-comment-scraper-free',
    title: 'YouTube Comment Scraper: The Free Tool That Actually Works in 2025',
    description:
      'Most free YouTube comment scrapers are broken, abandoned, or rate-limited into uselessness. Here\'s why, and what to use instead.',
    date: '2026-05-01',
    readTime: '7 min read',
    tags: ['YouTube Tools', 'Web Scraping', 'Data Collection'],
  },
  {
    slug: 'how-to-download-youtube-comments',
    title: 'How to Download All Comments from a YouTube Video',
    description:
      'A step-by-step guide to downloading YouTube comments — including which formats to use, how to handle videos with tens of thousands of comments, and bulk options for channels and playlists.',
    date: '2026-05-01',
    readTime: '6 min read',
    tags: ['YouTube Tools', 'How-To', 'Data Export'],
  },
  {
    slug: 'youtube-comments-to-spreadsheet',
    title: 'YouTube Comments to Spreadsheet: Analyze Audience Sentiment Fast',
    description:
      'Move YouTube comments into a spreadsheet in seconds — then sort by likes, filter by keyword, and spot sentiment patterns without any special tools.',
    date: '2026-05-01',
    readTime: '6 min read',
    tags: ['Data Analysis', 'YouTube Tools', 'Audience Research'],
  },
  {
    slug: 'youtube-comments-middle-funnel-use-cases',
    title: 'What to Do With Downloaded YouTube Comments',
    description:
      'Most people download YouTube comments and stop there. Here are five research-backed ways to turn that data into better landing pages, sharper positioning, and content your audience actually wants.',
    date: '2025-02-10',
    readTime: '7 min read',
    tags: ['YouTube Strategy', 'Content Marketing', 'Audience Research'],
  },
  {
    slug: 'youtube-comments-seo-value',
    title: 'The Hidden SEO Value of YouTube Comments',
    description:
      'Most creators think comments are just community feedback. New research reveals they may quietly shape how YouTube — and even Google — discovers and ranks your videos.',
    date: '2025-01-15',
    readTime: '8 min read',
    tags: ['YouTube SEO', 'Content Strategy', 'Algorithm Insights'],
  },
]

export function getAllPosts(): Omit<BlogPost, 'Content'>[] {
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getPostMeta(
  slug: string
): Omit<BlogPost, 'Content'> | undefined {
  return posts.find((p) => p.slug === slug)
}
