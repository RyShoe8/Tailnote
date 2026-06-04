import type { NextConfig } from 'next';
import { getNextHeaderRules } from './lib/security/securityHeaders';

const nextConfig: NextConfig = {
  transpilePackages: ['emailsignature-engine'],
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return getNextHeaderRules();
  },
  async redirects() {
    return [
      { source: '/feed', destination: '/rss.xml', permanent: true },
      { source: '/templates', destination: '/signatures', permanent: true },
      { source: '/templates/:path*', destination: '/signatures/:path*', permanent: true },
      { source: '/admin/templates', destination: '/admin/signatures', permanent: true },
      { source: '/admin/templates/:path*', destination: '/admin/signatures/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
