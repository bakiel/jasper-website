/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Vercel API for OAuth endpoints
    const vercelApiUrl = 'https://jasper-api.vercel.app'

    // Use production API in production, local API in development
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.jasperfinance.org'
      : 'http://127.0.0.1:8000'

    return [
      // OAuth admin auth routes go to Vercel API (higher priority - listed first)
      {
        source: '/api/v1/admin/auth/:path*',
        destination: `${vercelApiUrl}/api/v1/admin/auth/:path*`,
      },
      // All other API routes go to the local/production API
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
