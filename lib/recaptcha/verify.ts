import { getRecaptchaMinScore, isRecaptchaEnabled, type RecaptchaAction } from './config';

type SiteVerifyResponse = {
  success?: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
};

export type RecaptchaVerifyResult =
  | { ok: true; score?: number }
  | { ok: false; error: string };

export async function verifyRecaptchaToken(
  token: string | null | undefined,
  expectedAction: RecaptchaAction
): Promise<RecaptchaVerifyResult> {
  if (!isRecaptchaEnabled()) {
    return { ok: true };
  }

  const trimmed = token?.trim();
  if (!trimmed) {
    return { ok: false, error: 'Security verification is required.' };
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY!.trim();
  const body = new URLSearchParams({
    secret,
    response: trimmed,
  });

  let json: SiteVerifyResponse;
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    json = (await res.json()) as SiteVerifyResponse;
  } catch {
    return { ok: false, error: 'Security verification is temporarily unavailable.' };
  }

  if (!json.success) {
    return { ok: false, error: 'Security verification failed. Please try again.' };
  }

  const minScore = getRecaptchaMinScore();
  if (typeof json.score === 'number' && json.score < minScore) {
    return { ok: false, error: 'Security verification failed. Please try again.' };
  }

  if (json.action && json.action !== expectedAction) {
    return { ok: false, error: 'Security verification failed. Please try again.' };
  }

  return { ok: true, score: json.score };
}
