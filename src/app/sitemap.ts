import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  return [
    {
      url: 'https://youtubecommentdownloader.com',
      lastModified: new Date('2024-01-01'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://youtubecommentdownloader.com/tool',
      lastModified: new Date('2024-01-01'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://youtubecommentdownloader.com/pricing',
      lastModified: new Date('2024-06-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://youtubecommentdownloader.com/blog',
      lastModified: new Date('2024-06-01'),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: 'https://youtubecommentdownloader.com/privacy',
      lastModified: new Date('2024-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: 'https://youtubecommentdownloader.com/terms',
      lastModified: new Date('2024-01-01'),
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
