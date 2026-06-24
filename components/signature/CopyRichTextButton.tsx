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

export function CopyRichTextButton({
  html,
  disabled,
  label = 'Copy for Outlook',
  copiedLabel = 'Copied',
  onCopyResult,
  onActivate,
  variant = 'secondary',
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !html.trim()) return;
    onActivate?.();
    const result = await copyHtmlToClipboard(html);
    onCopyResult?.(result.ok, result.method);
    if (result.ok) {
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
