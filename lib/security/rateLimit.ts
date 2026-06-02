/** In-memory per-instance IP rate limiting for public API routes. */

export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

const buckets = new Map<string, number[]>();

export function ipFromRequestHeaders(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim();
  if (first) return first;
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || 'unknown';
}

export function takeRateSlot(ip: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const existing = buckets.get(ip) ?? [];
  const recent = existing.filter((ts) => ts > windowStart);
  if (recent.length >= options.max) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  return true;
}

export function isRateLimited(request: Request, options: RateLimitOptions): boolean {
  return !takeRateSlot(ipFromRequestHeaders(request), options);
}
