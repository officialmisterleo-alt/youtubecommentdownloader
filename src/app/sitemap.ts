import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  const now = new Date()

  return [
    {
      url: 'https://youtubecommentdownloader.com',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://youtubecommentdownloader.com/tool',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://youtubecommentdownloader.com/pricing',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://youtubecommentdownloader.com/blog',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://youtubecommentdownloader.com/privacy',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://youtubecommentdownloader.com/terms',
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...posts.map((post) => ({
      url: `https://youtubecommentdownloader.com/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
