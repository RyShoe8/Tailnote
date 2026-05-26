'use client';

import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { RecaptchaProvider } from '@/components/recaptcha/RecaptchaProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <RecaptchaProvider>{children}</RecaptchaProvider>
    </PostHogProvider>
  );
}
