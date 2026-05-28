'use client';

import { useCallback, useState } from 'react';
import { copyHtmlToClipboard, type CopyHtmlMethod } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';

type Props = {
  html: string;
  disabled?: boolean;
  label?: string;
  copiedLabel?: string;
  onCopyResult?: (ok: boolean, method: CopyHtmlMethod) => void;
};

export function CopySignatureButton({
  html,
  disabled,
  label = 'Copy signature',
  copiedLabel = 'Copied',
  onCopyResult,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !html.trim()) return;
    const result = await copyHtmlToClipboard(html);
    onCopyResult?.(result.ok, result.method);
    if (result.ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  }, [html, disabled, onCopyResult]);

  return (
    <Button type="button" variant="default" onClick={() => void handleClick()} disabled={disabled || !html.trim()}>
      {copied ? copiedLabel : label}
    </Button>
  );
}
