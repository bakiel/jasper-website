/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For VPS deployment with PM2
  async rewrites() {
    // VPS API URL - all routes go to jasper-api on port 3003
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://127.0.0.1:3003'  // VPS: jasper-api running locally
      : 'http://127.0.0.1:8000'  // Dev: FastAPI backend

    return [
      // All API routes proxy to jasper-api
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
