/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  async redirects() {
    return [
      // Merged pages that targeted the same searches
      { source: '/download-youtube-comments-free', destination: '/youtube-comment-downloader-free', permanent: true },
      { source: '/download-comments-from-youtube-video', destination: '/download-youtube-comments', permanent: true },
      { source: '/youtube-comment-export', destination: '/youtube-comment-exporter', permanent: true },
      { source: '/youtube-comment-scraper-api', destination: '/youtube-comment-api', permanent: true },
      { source: '/youtube-comment-research-tool', destination: '/youtube-comment-downloader-for-researchers', permanent: true },
      { source: '/youtube-comment-sentiment-analysis', destination: '/youtube-comment-analysis-tool', permanent: true },
      { source: '/export-youtube-comments-no-signup', destination: '/youtube-comment-exporter-chrome-extension-alternative', permanent: true },
      { source: '/export-youtube-comments-to-csv', destination: '/blog/export-youtube-comments-csv', permanent: true },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'youtubecommentdownloader.com' }],
        destination: 'https://www.youtubecommentdownloader.com/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
