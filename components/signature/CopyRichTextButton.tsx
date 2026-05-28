'use client';

import { useCallback, useState } from 'react';
import { copyHtmlToClipboard } from '@/lib/clipboard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  html: string;
  disabled?: boolean;
  onCopyResult?: (ok: boolean) => void;
  className?: string;
};

export function CopyRichTextButton({ html, disabled, onCopyResult, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    if (disabled || !html.trim()) return;
    const result = await copyHtmlToClipboard(html);
    onCopyResult?.(result.ok);
    if (result.ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  }, [html, disabled, onCopyResult]);

  return (
    <Button
      type="button"
      variant="secondary"
      className={cn(className)}
      onClick={() => void handleClick()}
      disabled={disabled || !html.trim()}
    >
      {copied ? 'Copied' : 'Copy rich text'}
    </Button>
  );
}
