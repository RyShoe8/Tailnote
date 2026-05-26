'use client';

import { useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { isRecaptchaConfigured } from '@/lib/recaptcha/public';
import type { RecaptchaAction } from '@/lib/recaptcha/config';

export function useRecaptcha(action: RecaptchaAction) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const enabled = isRecaptchaConfigured();

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!enabled || !executeRecaptcha) return null;
    try {
      return (await executeRecaptcha(action)) ?? null;
    } catch {
      return null;
    }
  }, [action, enabled, executeRecaptcha]);

  return { getToken, enabled };
}

export function authCaptchaFetchOptions(token: string | null) {
  if (!token) return undefined;
  return {
    headers: {
      'x-captcha-response': token,
    },
  };
}
