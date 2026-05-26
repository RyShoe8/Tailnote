import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { verifyRecaptchaToken } from '@/lib/recaptcha/verify';
import { SecureImageUploadError, uploadSecureImage } from '@/lib/uploads/secureImageUpload';
import { FeedbackSubmissionModel } from '@/models/FeedbackSubmission';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 200;
const MAX_DETAILS = 5000;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rateBuckets = new Map<string, number[]>();

function trimField(value: FormDataEntryValue | null, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function ipFromHeaders(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const first = forwarded.split(',')[0]?.trim();
  if (first) return first;
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || 'unknown';
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
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const honeypot = trimField(formData.get('company'), 200);
  if (honeypot) {
    return new NextResponse(null, { status: 204 });
  }

  const ip = ipFromHeaders(request);
  if (!takeRateSlot(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const recaptchaToken = trimField(formData.get('recaptchaToken'), 4096);
  const captcha = await verifyRecaptchaToken(recaptchaToken, RECAPTCHA_ACTIONS.contact);
  if (!captcha.ok) {
    return NextResponse.json({ error: captcha.error }, { status: 400 });
  }

  const name = trimField(formData.get('name'), MAX_NAME);
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const email = trimField(formData.get('email'), MAX_EMAIL);
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const subject = trimField(formData.get('subject'), MAX_SUBJECT);
  if (!subject) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
  }

  const details = trimField(formData.get('details'), MAX_DETAILS);
  if (!details) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  let imageUrl = '';
  const file = formData.get('file');
  if (file && file instanceof Blob && file.size > 0) {
    try {
      const uploaded = await uploadSecureImage(file, {
        pathnamePrefix: 'tailnote/contact',
        maxBytes: MAX_IMAGE_BYTES,
        maxWidth: MAX_IMAGE_WIDTH,
      });
      imageUrl = uploaded.url;
    } catch (e) {
      if (e instanceof SecureImageUploadError) {
        return NextResponse.json({ error: e.message }, { status: e.status });
      }
      console.error('Contact image upload failed:', e);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  }

  await connectMongoose();
  await FeedbackSubmissionModel.create({
    type: 'contact',
    subject,
    details,
    imageUrl,
    userId: '',
    userEmail: email,
    userName: name,
    organizationId: '',
    organizationName: '',
    status: 'new',
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
