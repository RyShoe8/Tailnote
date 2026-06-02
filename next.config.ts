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
};

export default nextConfig;
