import assert from 'node:assert/strict';
import {
  getNextHeaderRules,
  getPublicStaticAssetHeaders,
  getSecurityHeaders,
  resolveHeadersForPath,
} from '../lib/security/securityHeaders';

const rules = getNextHeaderRules();

function corp(path: string): string | undefined {
  return resolveHeadersForPath(path, rules).find(
    (h) => h.key === 'Cross-Origin-Resource-Policy'
  )?.value;
}

function coep(path: string): string | undefined {
  return resolveHeadersForPath(path, rules).find(
    (h) => h.key === 'Cross-Origin-Embedder-Policy'
  )?.value;
}

assert.equal(corp('/dashboard'), 'same-origin', 'app routes: CORP same-origin');
assert.equal(coep('/dashboard'), 'credentialless', 'app routes: COEP credentialless');

assert.equal(
  corp('/email-assets/icon-linkedin.png'),
  'cross-origin',
  'email-assets: CORP cross-origin for Gmail embed'
);
assert.equal(
  coep('/email-assets/icon-linkedin.png'),
  'unsafe-none',
  'email-assets: COEP unsafe-none overrides site-wide credentialless'
);

const publicHeaders = getPublicStaticAssetHeaders();
assert.ok(
  !publicHeaders.some((h) => h.key === 'Content-Security-Policy'),
  'public assets: no CSP'
);
assert.ok(
  getSecurityHeaders().some(
    (h) => h.key === 'Cross-Origin-Resource-Policy' && h.value === 'same-origin'
  ),
  'site security headers still include same-origin CORP'
);

const env = process.env as Record<string, string | undefined>;
const prevNodeEnv = env.NODE_ENV;
const prevAppUrl = env.NEXT_PUBLIC_APP_URL;
env.NODE_ENV = 'production';
env.NEXT_PUBLIC_APP_URL = 'https://tailnote.io';
assert.ok(
  getSecurityHeaders().some((h) => h.key === 'Strict-Transport-Security'),
  'production HTTPS site includes HSTS'
);
if (prevNodeEnv === undefined) delete env.NODE_ENV;
else env.NODE_ENV = prevNodeEnv;
if (prevAppUrl === undefined) delete env.NEXT_PUBLIC_APP_URL;
else env.NEXT_PUBLIC_APP_URL = prevAppUrl;

console.log('security-headers-smoke: ok');
