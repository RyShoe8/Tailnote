import { NextResponse } from 'next/server';
import { z } from 'zod';
import { subscribeToBrevoNewsletter } from '@/lib/email/brevoNewsletter';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { verifyRecaptchaToken } from '@/lib/recaptcha/verify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rateBuckets = new Map<string, number[]>();

const BodySchema = z.object({
  email: z.string().trim().min(1).max(254),
  firstName: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().max(50)).max(10).optional(),
  source: z.string().trim().max(50).optional(),
  signupPage: z.string().trim().max(500).optional(),
  company: z.string().max(200).optional(),
  recaptchaToken: z.string().max(4096).optional(),
});

function ipFromHeaders(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim();
  if (first) return first;
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function takeRateSlot(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const existing = rateBuckets.get(ip) ?? [];
  const recent = existing.filter((ts) => ts > windowStart);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateBuckets.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const body = parsed.data;

  if (body.company?.trim()) {
    return new NextResponse(null, { status: 204 });
  }

  const ip = ipFromHeaders(request);
  if (!takeRateSlot(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const captcha = await verifyRecaptchaToken(
    body.recaptchaToken ?? '',
    RECAPTCHA_ACTIONS.newsletter
  );
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const result = await subscribeToBrevoNewsletter({
    email,
    firstName: body.firstName,
    tags: body.tags,
    source: body.source ?? 'blog',
    signupPage: body.signupPage,
  });

  if (!result.ok) {
    const status = result.code === 'not_configured' ? 503 : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({ ok: true, alreadySubscribed: result.alreadySubscribed ?? false });
}
