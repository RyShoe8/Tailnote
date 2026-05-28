'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsLgUp } from '@/lib/hooks/useMediaQuery';
import {
  openGmailApp,
  openGmailSettingsInBrowser,
  resolveGmailSettingsHref,
} from '@/lib/install/resolveGmailSettingsHref';
import { OpenEmailSettingsButton } from '@/components/signature/OpenEmailSettingsButton';

type Props = {
  disabled?: boolean;
  size?: 'default' | 'sm';
  onOpen?: () => void;
};

export function GmailOpenActions({ disabled, size = 'default', onOpen }: Props) {
  const isLgUp = useIsLgUp();
  const [appOpenHint, setAppOpenHint] = useState(false);
  const settingsHref = resolveGmailSettingsHref();

  if (isLgUp) {
    return (
      <OpenEmailSettingsButton
        href={settingsHref}
        label="Open Gmail email settings"
        disabled={disabled}
        size={size}
        onOpen={onOpen}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size={size}
          disabled={disabled}
          onClick={() => {
            onOpen?.();
            setAppOpenHint(true);
            openGmailApp();
          }}
        >
          Open Gmail app
        </Button>
        <Button type="button" variant="outline" size={size} disabled={disabled} asChild>
          <a
            href={settingsHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              onOpen?.();
              openGmailSettingsInBrowser();
            }}
          >
            Open Gmail in browser
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </a>
        </Button>
      </div>
      {appOpenHint ? (
        <p className="text-xs text-muted-foreground">
          If Gmail didn&apos;t open, use <strong className="text-foreground">Open Gmail in browser</strong>{' '}
          below. In the app: Menu → Settings → your account → Signature settings.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">Formatted HTML:</strong> use{' '}
        <strong className="text-foreground">Open Gmail in browser</strong>, then Settings → General →
        scroll to Signature. The app may only support plain text in Mobile signature.
      </p>
    </div>
  );
}
