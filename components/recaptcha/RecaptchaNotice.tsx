import { isRecaptchaConfigured } from '@/lib/recaptcha/public';

export function RecaptchaNotice() {
  if (!isRecaptchaConfigured()) return null;

  return (
    <p className="text-xs text-muted-foreground">
      This site is protected by reCAPTCHA and the Google{' '}
      <a
        href="https://policies.google.com/privacy"
        className="underline underline-offset-2"
        target="_blank"
        rel="noreferrer"
      >
        Privacy Policy
      </a>{' '}
      and{' '}
      <a
        href="https://policies.google.com/terms"
        className="underline underline-offset-2"
        target="_blank"
        rel="noreferrer"
      >
        Terms of Service
      </a>{' '}
      apply.
    </p>
  );
}
