import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { allSeoPages } from '@/lib/seo-pages'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  return [
    {
      url: 'https://www.youtubecommentdownloader.com',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/tool',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/pricing',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/blog',
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/docs',
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/sample-youtube-comment-export',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/contact',
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/free-youtube-tools',
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-video-id-extractor',
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-url-parser',
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/youtube-comment-csv-template',
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/free-youtube-tools/comment-keyword-extractor',
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    ...allSeoPages.map((page) => ({
      url: `https://www.youtubecommentdownloader.com/${page.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    })),
    {
      url: 'https://www.youtubecommentdownloader.com/privacy',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://www.youtubecommentdownloader.com/terms',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...posts.map((post) => ({
      url: `https://www.youtubecommentdownloader.com/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
