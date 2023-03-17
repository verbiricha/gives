/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  crons: [
    {
      path: '/api/runsubs',
      schedule: '0 5 * * *',
    },
  ],

  images: {
    domains: ['hrf.org', 'btcpayserver.org', 'zeusln.app'],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

module.exports = nextConfig
