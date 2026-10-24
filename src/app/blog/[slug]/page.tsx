import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostMeta } from '@/lib/blog'

// Dynamic imports for each post's content
import { getPostContent } from '../posts'

const siteUrl = 'https://www.youtubecommentdownloader.com'

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
    alternates: { canonical: `${siteUrl}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${siteUrl}/blog/${slug}`,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
      images: [{ url: `${siteUrl}/opengraph-image.jpg`, width: 1200, height: 675 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [`${siteUrl}/opengraph-image.jpg`],
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
    dateModified: post.date,
    keywords: post.tags.join(', '),
    author: {
      '@type': 'Organization',
      name: 'YouTube Comment Downloader',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'YouTube Comment Downloader',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/opengraph-image.jpg`,
      },
    },
    image: `${siteUrl}/opengraph-image.jpg`,
    url: `${siteUrl}/blog/${slug}`,
    mainEntityOfPage: `${siteUrl}/blog/${slug}`,
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
