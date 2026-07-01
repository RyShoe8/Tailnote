import type { NextConfig } from 'next';
import { getNextHeaderRules } from './lib/security/securityHeaders';

const nextConfig: NextConfig = {
  transpilePackages: ['emailsignature-engine'],
  serverExternalPackages: ['svgo', 'sharp'],
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return getNextHeaderRules();
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.tailnote.io' }],
        destination: 'https://tailnote.io/:path*',
        permanent: true,
      },
      { source: '/feed', destination: '/rss.xml', permanent: true },
      { source: '/dashboard/email-health', destination: '/dashboard/brand-trust', permanent: false },
      { source: '/dashboard/email-health/:slug*', destination: '/dashboard/brand-trust/:slug*', permanent: false },
      { source: '/templates', destination: '/signatures', permanent: true },
      { source: '/templates/:path*', destination: '/signatures/:path*', permanent: true },
      { source: '/admin/templates', destination: '/admin/signatures', permanent: true },
      { source: '/admin/templates/:path*', destination: '/admin/signatures/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
