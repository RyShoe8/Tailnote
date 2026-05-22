'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BannerInner() {
  const searchParams = useSearchParams();
  if (searchParams.get('checkout') !== 'success') return null;

  return (
    <div
      className="mb-6 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
      role="status"
    >
      Your subscription is active. Welcome to Tailnote — set up your signature and invite your team
      when you are ready.
    </div>
  );
}

export function CheckoutSuccessBanner() {
  return (
    <Suspense fallback={null}>
      <BannerInner />
    </Suspense>
  );
}
