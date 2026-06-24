'use client';

import { useCallback, useState } from 'react';
import { copyHtmlToClipboard, type CopyHtmlMethod } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  html: string;
  disabled?: boolean;
  label?: string;
  copiedLabel?: string;
  onCopyResult?: (ok: boolean, method: CopyHtmlMethod) => void;
  onActivate?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
};

export function CopySignatureButton({
  html,
  disabled,
  label = 'Copy signature',
  copiedLabel = 'Copied',
  onCopyResult,
  onActivate,
  variant = 'default',
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !html.trim()) return;
    onActivate?.();
    const result = await copyHtmlToClipboard(html);
    onCopyResult?.(result.ok, result.method);
    if (result.ok) {
      if (result.method === 'html' || result.method === 'text') {
        void fetch('/api/track/signature/copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: result.method }),
        }).catch(() => {});
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  }, [html, disabled, onCopyResult, onActivate]);

  return (
    <Button
      type="button"
      variant={variant}
      className={cn(className)}
      onClick={() => void handleClick()}
      disabled={disabled || !html.trim()}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
}
