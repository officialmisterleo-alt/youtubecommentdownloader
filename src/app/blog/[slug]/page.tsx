import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostMeta } from '@/lib/blog'

// Dynamic imports for each post's content
import { getPostContent } from '../posts'

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostMeta(slug)
  if (!post) return {}

  return {
    title: `${post.title} — YouTube Comment Downloader Blog`,
    description: post.description,
    alternates: { canonical: `https://youtubecommentdownloader.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [`https://youtubecommentdownloader.com/opengraph-image.jpg`],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostMeta(slug)
  if (!post) notFound()

  const Content = getPostContent(slug)
  if (!Content) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    keywords: post.tags.join(', '),
    author: {
      '@type': 'Organization',
      name: 'YouTube Comment Downloader',
      url: 'https://youtubecommentdownloader.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'YouTube Comment Downloader',
      url: 'https://youtubecommentdownloader.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://youtubecommentdownloader.com/opengraph-image.jpg',
      },
    },
    image: 'https://youtubecommentdownloader.com/opengraph-image.jpg',
    url: `https://youtubecommentdownloader.com/blog/${slug}`,
    mainEntityOfPage: `https://youtubecommentdownloader.com/blog/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Content />
    </>
  )
}
