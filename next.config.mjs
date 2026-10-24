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
