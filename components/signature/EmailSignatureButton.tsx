'use client';

import { useCallback, useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  html: string;
  disabled?: boolean;
  forwardNote?: string;
};

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function EmailSignatureButton({ html, disabled, forwardNote }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (disabled || !html.trim() || status === 'sending') return;

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
  }, [html, disabled, forwardNote, status]);

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
        variant="default"
        disabled={disabled || !html.trim() || status === 'sending'}
        onClick={() => void handleClick()}
      >
        <Mail className="mr-2 h-4 w-4" aria-hidden />
        {label}
      </Button>
      {status === 'error' && errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
      {status === 'sent' ? (
        <p className="text-xs text-muted-foreground">
          Check your inbox on a computer, then copy the signature into Gmail or Outlook settings.
        </p>
      ) : null}
    </div>
  );
}
