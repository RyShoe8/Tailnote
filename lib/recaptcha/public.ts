/** Client-safe: true when the browser should load reCAPTCHA v3. */
export function isRecaptchaConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim());
}
