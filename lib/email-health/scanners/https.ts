import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, method: 'GET' | 'HEAD' = 'GET') {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Tailnote-EmailHealth/1.0' },
    });
  } finally {
    clearTimeout(timer);
  }
}

export type HttpsScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
};

export async function scanHttps(domain: string): Promise<HttpsScanResult> {
  const issues: DomainIssue[] = [];
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let summary = 'HTTPS responds successfully';

  try {
    const httpsRes = await fetchWithTimeout(`https://${domain}/`, 'HEAD');
    if (!httpsRes.ok && httpsRes.status >= 400) {
      status = 'warn';
      summary = `HTTPS returned ${httpsRes.status}`;
      issues.push({
        category: 'https',
        severity: 'warn',
        title: 'Your website returned an error over HTTPS',
        explanation: 'A broken HTTPS response can hurt trust signals tied to your domain.',
        recommendation: 'Fix the site certificate or origin configuration so https:// loads cleanly.',
        stepsToPass: [
          'Open https://yourdomain in a browser and note the exact error (certificate, 404, 5xx).',
          'Renew or reinstall the SSL certificate in your host or CDN.',
          'Point DNS to the correct origin and ensure the app responds on port 443.',
          'Confirm a 200 or valid redirect, then rescan.',
        ],
        technicalDetail: `HTTPS status ${httpsRes.status} ${httpsRes.statusText}`,
      });
    }
  } catch (err) {
    status = 'fail';
    summary = 'HTTPS not reachable';
    issues.push({
      category: 'https',
      severity: 'fail',
      title: 'HTTPS does not appear to be working',
      explanation:
        'Modern browsers and some email-related trust checks expect a valid TLS site on your domain.',
      recommendation: 'Install a valid SSL certificate and ensure port 443 is reachable.',
      stepsToPass: [
        'Enable SSL/TLS in your hosting panel or CDN (Let’s Encrypt, Cloudflare, etc.).',
        'Verify port 443 is open and DNS A/AAAA records point to the correct server.',
        'Fix certificate hostname mismatches (www vs apex) if applicable.',
        'Load https://yourdomain in a browser with no warnings, then rescan.',
      ],
      technicalDetail: err instanceof Error ? err.message : String(err),
    });
    return {
      category: buildCategoryResult('https', status, summary),
      issues,
    };
  }

  try {
    const httpRes = await fetchWithTimeout(`http://${domain}/`, 'HEAD');
    const finalUrl = httpRes.url.toLowerCase();
    if (!finalUrl.startsWith('https://')) {
      status = status === 'pass' ? 'warn' : status;
      summary = 'HTTP may not redirect to HTTPS';
      issues.push({
        category: 'https',
        severity: 'warn',
        title: 'HTTP does not consistently redirect to HTTPS',
        explanation: 'Visitors (and some checks) may hit an insecure version of your site first.',
        recommendation: 'Configure a 301 redirect from http:// to https:// at your host or CDN.',
        stepsToPass: [
          'In your host, CDN, or web server config, add a 301 redirect from HTTP to HTTPS.',
          'Ensure both www and apex (if used) redirect to the same canonical HTTPS URL.',
          'Test by visiting http://yourdomain — the address bar should show https://.',
          'Rescan after the redirect is live.',
        ],
        technicalDetail: `Final URL after HTTP request: ${httpRes.url}`,
      });
    }
  } catch {
    // HTTP probe failure is non-critical if HTTPS works
  }

  if (status === 'pass' && issues.length === 0) {
    issues.push({
      category: 'https',
      severity: 'info',
      title: 'HTTPS is configured',
      explanation: 'Your domain responds over TLS, which supports overall domain trust.',
      recommendation: 'Renew certificates before expiry and enforce HTTPS redirects.',
      technicalDetail: `https://${domain}/`,
    });
  }

  return {
    category: buildCategoryResult('https', status, summary),
    issues,
  };
}
