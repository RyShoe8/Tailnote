'use client';

import { RecaptchaProvider } from '@/components/recaptcha/RecaptchaProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return <RecaptchaProvider>{children}</RecaptchaProvider>;
}
