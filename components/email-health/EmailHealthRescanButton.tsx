'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { capturePostHogEvent } from '@/components/analytics/PostHogProvider';
import { Button } from '@/components/ui/button';

type Props = {
  domain: string;
};

export function EmailHealthRescanButton({ domain }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function rescan() {
    setLoading(true);
    capturePostHogEvent('email_health_rescan', { domain });

    try {
      const res = await fetch('/api/email-health/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, force: true }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={rescan} disabled={loading} className="gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="h-4 w-4" aria-hidden />
      )}
      Rescan
    </Button>
  );
}
