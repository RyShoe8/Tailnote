export const RECAPTCHA_ACTIONS = {
  contact: 'contact',
  signup: 'signup',
  login: 'login',
  forgot_password: 'forgot_password',
} as const;

export type RecaptchaAction = (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS];

export function getRecaptchaMinScore(): number {
  const n = Number(process.env.RECAPTCHA_MIN_SCORE);
  return Number.isFinite(n) ? n : 0.5;
}

/** Server-side: captcha enforcement is on when secret key is set. */
export function isRecaptchaEnabled(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY?.trim());
}
