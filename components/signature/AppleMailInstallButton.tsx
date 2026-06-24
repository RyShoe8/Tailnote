'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  disabled?: boolean;
  employeeId?: string;
  templateId?: string;
  onActivate?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
};

export function AppleMailInstallButton({
  disabled,
  employeeId,
  templateId,
  onActivate,
  variant = 'outline',
  className,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (disabled || busy) return;
    onActivate?.();
    if (!employeeId && !templateId) {
      setError('Save your signature details before downloading the installer.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const url = employeeId
        ? `/api/dashboard/employees/${employeeId}/apple-mail-installer`
        : '/api/dashboard/me/apple-mail-installer';
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: employeeId ? undefined : { 'Content-Type': 'application/json' },
        body: employeeId ? undefined : JSON.stringify({ templateId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === 'string' ? data.error : 'Could not generate installer');
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = 'tailnote-install.command';
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError('Could not generate installer');
    } finally {
      setBusy(false);
    }
  }, [disabled, busy, employeeId, templateId, onActivate]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        className={cn(className)}
        disabled={disabled || busy}
        onClick={() => void handleDownload()}
      >
        {busy ? 'Generating…' : 'Install in Apple Mail'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function isMacOsClient(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac/i.test(navigator.platform || navigator.userAgent);
}
