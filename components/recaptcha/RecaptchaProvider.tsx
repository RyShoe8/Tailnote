'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { isRecaptchaConfigured } from '@/lib/recaptcha/public';

export function RecaptchaProvider({ children }: { children: React.ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();
  if (!isRecaptchaConfigured() || !siteKey) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey} scriptProps={{ async: true, defer: true }}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
