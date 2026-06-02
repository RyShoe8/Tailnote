import { NextResponse } from 'next/server';
import { z } from 'zod';
import { subscribeToBrevoNewsletter } from '@/lib/email/brevoNewsletter';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { verifyRecaptchaToken } from '@/lib/recaptcha/verify';
import { isRateLimited } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const NEWSLETTER_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BodySchema = z.object({
  email: z.string().trim().min(1).max(254),
  firstName: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().max(50)).max(10).optional(),
  source: z.string().trim().max(50).optional(),
  signupPage: z.string().trim().max(500).optional(),
  company: z.string().max(200).optional(),
  recaptchaToken: z.string().max(4096).optional(),
});

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

  if (isRateLimited(request, NEWSLETTER_RATE_LIMIT)) {
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
