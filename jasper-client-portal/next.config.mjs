/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For VPS deployment with PM2

  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://www.linkedin.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.jasperfinance.org https://accounts.google.com https://www.linkedin.com https://cloudflareinsights.com",
              "frame-src https://accounts.google.com https://www.linkedin.com",
              "frame-ancestors 'none'",
            ].join('; ')
          },
        ]
      }
    ]
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.jasperfinance.org',
      },
    ],
  },
};

export default nextConfig;
