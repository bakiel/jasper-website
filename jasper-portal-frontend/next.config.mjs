/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For VPS deployment with PM2
  async rewrites() {
    // Use NEXT_PUBLIC_API_URL from environment or fallback to VPS API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'http://72.61.201.237:9003'  // VPS: jasper-api
        : 'http://127.0.0.1:8000')     // Dev: FastAPI backend

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
