'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { GmailInstallHelp } from '@/components/signature/GmailInstallHelp';
import { OpenEmailSettingsButton } from '@/components/signature/OpenEmailSettingsButton';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import { resolveGmailSettingsHref } from '@/lib/install/resolveGmailSettingsHref';
import {
  OUTLOOK_PERSONAL_SETTINGS_URL,
  OUTLOOK_WORK_SETTINGS_URL,
} from '@/lib/install/outlookSettingsUrl';

type Props = {
  html: string;
  disabled?: boolean;
  downloadFilename?: string;
};

export function SignatureInstallPanel({
  html,
  disabled,
  downloadFilename = 'tailnote-signature.html',
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const gmailHref = resolveGmailSettingsHref();

  const handleCopyResult = (ok: boolean) => {
    setCopyFailed(!ok);
    if (ok) setCopied(true);
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
          <p className="mt-1 text-muted-foreground">
            Now paste it into your email client. Open settings, paste into the signature field, and save
            changes.
          </p>
          {settingsOpened ? (
            <p className="mt-2 text-xs text-muted-foreground">Email settings opened in a new tab.</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <OpenEmailSettingsButton
              href={gmailHref}
              label="Open Gmail"
              size="sm"
              gmailMobileAware
              onOpen={() => setSettingsOpened(true)}
            />
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
      ) : null}

      {copyFailed ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t copy automatically. Try Download HTML, or select the signature in the live
          preview and copy manually.
        </p>
      ) : null}

      <GmailInstallHelp disabled={disabled} onSettingsOpen={() => setSettingsOpened(true)} />
      <OutlookInstallHelp disabled={disabled} />
    </div>
  );
}
