import type { NextConfig } from 'next';
import { getSecurityHeaders } from './lib/security/securityHeaders';

const nextConfig: NextConfig = {
  transpilePackages: ['emailsignature-engine'],
  reactStrictMode: true,
  async headers() {
    const securityHeaders = getSecurityHeaders();
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/email-assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;
