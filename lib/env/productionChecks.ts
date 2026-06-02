let ran = false;

/** One-time production env warnings at server boot (mongoose connect / migrations). */
export function runProductionEnvChecks(): void {
  if (ran || process.env.NODE_ENV !== 'production') return;
  ran = true;

  const missing: string[] = [];
  if (!process.env.MONGODB_URI?.trim()) missing.push('MONGODB_URI');
  if (!process.env.BETTER_AUTH_SECRET?.trim()) missing.push('BETTER_AUTH_SECRET');
  if (!process.env.NEXT_PUBLIC_APP_URL?.trim() && !process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    missing.push('NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL');
  }

  if (missing.length > 0) {
    console.warn('[env] Production is missing required variables:', missing.join(', '));
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    console.warn(
      '[env] STRIPE_SECRET_KEY is not set in production; billing uses subscription status only (no dev bypass).'
    );
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    console.warn('[env] STRIPE_WEBHOOK_SECRET is not set; Stripe webhooks will fail.');
  }

  if (!process.env.SIGNATURE_TRACKING_SECRET?.trim()) {
    console.warn(
      '[env] SIGNATURE_TRACKING_SECRET is not set; signature click/open tracking redirects will not record events.'
    );
  }
}
