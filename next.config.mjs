/** @type {import('next').NextConfig} */
const nextConfig = {
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
