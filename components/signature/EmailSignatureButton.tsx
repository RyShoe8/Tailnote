'use client';

import { useCallback, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  html: string;
  disabled?: boolean;
  forwardNote?: string;
  onActivate?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function EmailSignatureButton({
  html,
  disabled,
  forwardNote,
  onActivate,
  variant = 'default',
  className,
}: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (disabled || !html.trim() || status === 'sending') return;

    onActivate?.();
    setStatus('sending');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/dashboard/me/signature-install-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html,
          ...(forwardNote ? { forwardNote } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (data.code === 'email_not_configured') {
          setErrorMessage('Email not available — use Download HTML instead.');
        } else {
          setErrorMessage(data.error ?? 'Could not send email. Try Download HTML.');
        }
        setStatus('error');
        return;
      }

      setStatus('sent');
      window.setTimeout(() => setStatus('idle'), 4000);
    } catch {
      setErrorMessage('Could not send email. Try Download HTML.');
      setStatus('error');
    }
  }, [html, disabled, forwardNote, status, onActivate]);

  const label =
    status === 'sending'
      ? 'Sending…'
      : status === 'sent'
        ? 'Email sent'
        : 'Email signature to me';

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={disabled || !html.trim() || status === 'sending'}
        onClick={() => void handleClick()}
      >
        <Mail className="mr-2 h-4 w-4" aria-hidden />
        {label}
      </Button>
      {status === 'error' && errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
