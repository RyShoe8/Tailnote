'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { GmailInstallHelp } from '@/components/signature/GmailInstallHelp';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import { GMAIL_SETTINGS_URL } from '@/lib/install/gmailSettingsUrl';

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

  const handleCopyResult = (ok: boolean) => {
    setCopyFailed(!ok);
    if (ok) setCopied(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <CopySignatureButton html={html} disabled={disabled} onCopyResult={handleCopyResult} />
          <Button type="button" variant="outline" asChild disabled={disabled}>
            <a
              href={GMAIL_SETTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSettingsOpened(true)}
            >
              Open Gmail settings
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </a>
          </Button>
          <CopyRichTextButton html={html} disabled={disabled} onCopyResult={handleCopyResult} />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !html.trim()}
            onClick={() => downloadHtml(downloadFilename, html)}
          >
            Download HTML
          </Button>
        </div>
        <div className="sticky bottom-0 z-10 -mx-1 border-t border-slate-200/80 bg-background/95 p-3 backdrop-blur-sm md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none lg:hidden">
          <div className="flex gap-2">
            <CopySignatureButton
              html={html}
              disabled={disabled}
              onCopyResult={handleCopyResult}
              label="Copy signature"
            />
            <Button type="button" variant="outline" className="flex-1" asChild disabled={disabled}>
              <a
                href={GMAIL_SETTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSettingsOpened(true)}
              >
                Gmail settings
              </a>
            </Button>
          </div>
        </div>
      </div>

      {copied ? (
        <div
          className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <p className="font-medium">Signature copied</p>
          <p className="mt-1 text-muted-foreground">
            Now paste it into Gmail. Open settings, paste into the signature field, and save changes.
          </p>
          {settingsOpened ? (
            <p className="mt-2 text-xs text-muted-foreground">Gmail settings opened in a new tab.</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={GMAIL_SETTINGS_URL} target="_blank" rel="noopener noreferrer">
                Open Gmail settings
              </a>
            </Button>
            <Button type="button" size="sm" variant="ghost" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      ) : null}

      {copyFailed ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t copy automatically. Try Download HTML, or select the signature in the live preview
          and copy manually.
        </p>
      ) : null}

      <GmailInstallHelp />
      <OutlookInstallHelp />
    </div>
  );
}
