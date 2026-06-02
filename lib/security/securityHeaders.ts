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

function productionHttpsSite(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    !process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') &&
    !process.env.NEXT_PUBLIC_APP_URL?.includes('127.0.0.1')
  );
}

export function getSecurityHeaders(): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
    { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy() },
  ];
  if (productionHttpsSite()) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }
  return headers;
}

/** Public static files embedded cross-origin in email signatures (Gmail, Outlook). */
export function getPublicStaticAssetHeaders(): SecurityHeader[] {
  return [
    {
      key: 'Cache-Control',
      value: 'public, max-age=86400, stale-while-revalidate=604800',
    },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
    /** Override site-wide COEP so email clients can embed icon PNGs cross-origin. */
    { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
  ];
}

function headerValue(headers: SecurityHeader[], key: string): string | undefined {
  return headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;
}

/** Merge Next.js header rules the same way duplicate keys use the last matching rule. */
export function resolveHeadersForPath(
  path: string,
  rules: { source: string; headers: SecurityHeader[] }[]
): SecurityHeader[] {
  const matched = rules.filter((rule) => pathMatchesSource(path, rule.source));
  const merged = new Map<string, string>();
  for (const rule of matched) {
    for (const h of rule.headers) {
      merged.set(h.key.toLowerCase(), h.value);
    }
  }
  return [...merged.entries()].map(([key, value]) => ({
    key: headersKeyCase(key, matched.flatMap((r) => r.headers)),
    value,
  }));
}

function headersKeyCase(lowerKey: string, all: SecurityHeader[]): string {
  return all.find((h) => h.key.toLowerCase() === lowerKey)?.key ?? lowerKey;
}

function pathMatchesSource(path: string, source: string): boolean {
  if (source === '/:path*') return true;
  const prefix = source.replace(/\/:path\*$/, '/').replace(/\/$/, '');
  if (source.endsWith('/:path*')) {
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  return path === source;
}

export function getNextHeaderRules(): { source: string; headers: SecurityHeader[] }[] {
  const securityHeaders = getSecurityHeaders();
  return [
    { source: '/:path*', headers: securityHeaders },
    { source: '/email-assets/:path*', headers: getPublicStaticAssetHeaders() },
  ];
}
