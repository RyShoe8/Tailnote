import type { CheckStatus } from '@/lib/email-health/types';

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 65536;

export type SvgValidationResult = {
  status: CheckStatus | 'unknown';
  url?: string;
  width?: number;
  height?: number;
  byteSize?: number;
  summary: string;
  issues: string[];
};

function parseViewBoxDimensions(svg: string): { width?: number; height?: number } {
  const viewBox = svg.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1];
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const w = svg.match(/\bwidth\s*=\s*["']([\d.]+)/i)?.[1];
  const h = svg.match(/\bheight\s*=\s*["']([\d.]+)/i)?.[1];
  if (w && h) return { width: Number(w), height: Number(h) };
  return {};
}

function hasExternalReferences(svg: string): boolean {
  return (
    /<script[\s>]/i.test(svg) ||
    /xlink:href\s*=\s*["']https?:/i.test(svg) ||
    /href\s*=\s*["']https?:/i.test(svg) ||
    /<foreignObject/i.test(svg) ||
    /href\s*=\s*["']data:image\/(png|jpeg|jpg|webp|gif)/i.test(svg) ||
    /xlink:href\s*=\s*["']data:image\/(png|jpeg|jpg|webp|gif)/i.test(svg)
  );
}

export async function validateBimiSvgUrl(url: string): Promise<SvgValidationResult> {
  const issues: string[] = [];

  if (!/^https:\/\//i.test(url)) {
    return {
      status: 'fail',
      url,
      summary: 'Your logo must be hosted at a secure HTTPS address',
      issues: ['Logo URL must use HTTPS, not HTTP'],
    };
  }

  let buffer: ArrayBuffer;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    // Append a timestamp to bypass CDN edge cache, ensuring we validate the absolute latest upload
    const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    const res = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: { Accept: 'image/svg+xml,text/xml,application/xml,*/*' },
      redirect: 'follow',
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        status: 'fail',
        url,
        summary: 'We could not reach your logo file on the web',
        issues: [`Server returned HTTP ${res.status}`],
      };
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType && !/svg|xml/i.test(contentType)) {
      issues.push('The server did not report this file as SVG content');
    }

    buffer = await res.arrayBuffer();
  } catch {
    return {
      status: 'fail',
      url,
      summary: 'We could not download your logo file — check the URL is public',
      issues: ['Network error or timeout while fetching logo'],
    };
  }

  const byteSize = buffer.byteLength;
  if (byteSize > MAX_BYTES) {
    issues.push(`Logo file is ${Math.round(byteSize / 1024)}KB — BIMI works best under 32KB`);
  }

  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  if (!/<svg[\s>]/i.test(text)) {
    return {
      status: 'fail',
      url,
      byteSize,
      summary: 'Your logo file needs to be converted to a BIMI-compatible SVG',
      issues: ['File content is not a valid SVG document'],
    };
  }

  if (hasExternalReferences(text)) {
    issues.push('Logo SVG contains scripts, external links, or embedded raster images — BIMI requires a pure, self-contained vector file');
  }

  const { width, height } = parseViewBoxDimensions(text);
  if (width && height) {
    const ratio = width / height;
    if (ratio < 0.9 || ratio > 1.1) {
      issues.push('Logo should be square or nearly square for inbox display');
    }
  } else {
    issues.push('Could not confirm logo dimensions — use a square SVG when possible');
  }

  if (issues.length === 0) {
    return {
      status: 'pass',
      url,
      width,
      height,
      byteSize,
      summary: 'Your BIMI logo file looks reachable and compatible',
      issues: [],
    };
  }

  if (issues.some((i) => i.includes('not a valid') || i.includes('HTTPS') || i.includes('raster images'))) {
    return {
      status: 'fail',
      url,
      width,
      height,
      byteSize,
      summary: 'Your logo file needs to be converted to a BIMI-compatible SVG',
      issues,
    };
  }

  return {
    status: 'warn',
    url,
    width,
    height,
    byteSize,
    summary: 'Your logo file works, but a few improvements are recommended',
    issues,
  };
}
