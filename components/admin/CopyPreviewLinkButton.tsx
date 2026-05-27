'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  url: string;
};

export function CopyPreviewLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [url]);

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}
