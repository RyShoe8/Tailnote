import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';
import { connectMongoose } from '@/lib/mongoose';
import { RECAPTCHA_ACTIONS } from '@/lib/recaptcha/config';
import { verifyRecaptchaToken } from '@/lib/recaptcha/verify';
import { isRateLimited } from '@/lib/security/rateLimit';
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

const CONTACT_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimField(value: FormDataEntryValue | null, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
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

  if (isRateLimited(request, CONTACT_RATE_LIMIT)) {
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
      logError('api/contact', e);
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
