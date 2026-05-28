'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { GmailInstallHelp } from '@/components/signature/GmailInstallHelp';
import { GmailOpenActions } from '@/components/signature/GmailOpenActions';
import { OpenEmailSettingsButton } from '@/components/signature/OpenEmailSettingsButton';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml, type CopyHtmlMethod } from '@/lib/clipboard';
import {
  OUTLOOK_PERSONAL_SETTINGS_URL,
  OUTLOOK_WORK_SETTINGS_URL,
} from '@/lib/install/outlookSettingsUrl';

type Props = {
  html: string;
  disabled?: boolean;
  downloadFilename?: string;
};

function copySuccessMessage(method: CopyHtmlMethod): string {
  if (method === 'html') {
    return 'Copied with formatting. Paste in Gmail in your browser (Settings → General → Signature) for best results.';
  }
  return 'Copied as plain text only — formatting may be lost. Use Open Gmail in browser after copying, or long-press the live preview to copy manually.';
}

export function SignatureInstallPanel({
  html,
  disabled,
  downloadFilename = 'tailnote-signature.html',
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copyMethod, setCopyMethod] = useState<CopyHtmlMethod | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);

  const handleCopyResult = (ok: boolean, method: CopyHtmlMethod) => {
    setCopyFailed(!ok);
    if (ok) {
      setCopied(true);
      setCopyMethod(method);
    } else {
      setCopyMethod(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <CopySignatureButton html={html} disabled={disabled} onCopyResult={handleCopyResult} />
          <CopyRichTextButton
            html={html}
            disabled={disabled}
            onCopyResult={handleCopyResult}
            className="hidden sm:inline-flex"
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !html.trim()}
            onClick={() => downloadHtml(downloadFilename, html)}
          >
            Download HTML
          </Button>
        </div>
      </div>

      {copied ? (
        <div
          className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <p className="font-medium">Signature copied</p>
          <p className="mt-1 text-muted-foreground">{copySuccessMessage(copyMethod ?? 'html')}</p>
          {settingsOpened ? (
            <p className="mt-2 text-xs text-muted-foreground">Gmail opened — check your app or browser tab.</p>
          ) : null}
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-foreground mb-2">Gmail</p>
              <GmailOpenActions
                size="sm"
                disabled={disabled}
                onOpen={() => setSettingsOpened(true)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <OpenEmailSettingsButton
                href={OUTLOOK_WORK_SETTINGS_URL}
                label="Open Outlook email settings"
                size="sm"
                onOpen={() => setSettingsOpened(true)}
              />
              <OpenEmailSettingsButton
                href={OUTLOOK_PERSONAL_SETTINGS_URL}
                label="Open Outlook.com email settings"
                size="sm"
                onOpen={() => setSettingsOpened(true)}
              />
              <Button type="button" size="sm" variant="ghost" asChild>
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {copyFailed ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t copy automatically. Try Download HTML, or long-press the signature in the live
          preview → Copy, then paste in Gmail browser settings.
        </p>
      ) : null}

      <GmailInstallHelp disabled={disabled} onSettingsOpen={() => setSettingsOpened(true)} />
      <OutlookInstallHelp disabled={disabled} />
    </div>
  );
}
