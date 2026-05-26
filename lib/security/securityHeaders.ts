/** Site-wide security headers for Next.js `headers()` config. */

export type SecurityHeader = { key: string; value: string };

function posthogOrigins(): string[] {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
  try {
    const url = new URL(host.includes('://') ? host : `https://${host}`);
    const origin = url.origin;
    const origins = [origin];
    if (origin.includes('://us.i.posthog.com')) {
      origins.push(origin.replace('://us.i.posthog.com', '://us-assets.i.posthog.com'));
    }
    return origins;
  } catch {
    return ['https://us.i.posthog.com', 'https://us-assets.i.posthog.com'];
  }
}

function buildContentSecurityPolicy(): string {
  const posthog = posthogOrigins();
  const isHttpsSite =
    process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') &&
    !process.env.NEXT_PUBLIC_APP_URL?.includes('127.0.0.1');

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://cdn.cookie-script.com',
    'https://analytics.ahrefs.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://www.google.com',
    'https://www.gstatic.com',
    ...posthog,
  ];

  const connectSrc = [
    "'self'",
    'https://www.google-analytics.com',
    'https://region1.google-analytics.com',
    'https://analytics.ahrefs.com',
    'https://www.google.com',
    'https://www.gstatic.com',
    'https://accounts.google.com',
    'https://api.brevo.com',
    'https://*.public.blob.vercel-storage.com',
    ...posthog,
  ];

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https:`,
    `connect-src ${connectSrc.join(' ')}`,
    `frame-src https://www.google.com https://accounts.google.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://accounts.google.com`,
    `frame-ancestors 'self'`,
  ];

  if (isHttpsSite) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

const PERMISSIONS_POLICY = [
  'accelerometer=()',
  'camera=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()',
].join(', ');

export function getSecurityHeaders(): SecurityHeader[] {
  return [
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  ];
}
