'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { DesktopInstallNotice } from '@/components/signature/DesktopInstallNotice';
import { EmailSignatureButton } from '@/components/signature/EmailSignatureButton';
import { GmailInstallHelp } from '@/components/signature/GmailInstallHelp';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import { useIsMobileInstallContext } from '@/lib/hooks/useMediaQuery';

type Props = {
  html: string;
  disabled?: boolean;
  downloadFilename?: string;
  /** Shown in install email when an admin emails a copy for an employee. */
  emailForwardNote?: string;
};

export function SignatureInstallPanel({
  html,
  disabled,
  downloadFilename = 'tailnote-signature.html',
  emailForwardNote,
}: Props) {
  const isMobileInstall = useIsMobileInstallContext();
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopyResult = (ok: boolean) => {
    setCopyFailed(!ok);
  };

  return (
    <div className="space-y-6">
      {isMobileInstall ? <DesktopInstallNotice /> : null}

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {!isMobileInstall ? (
            <>
              <CopySignatureButton html={html} disabled={disabled} onCopyResult={handleCopyResult} />
              <CopyRichTextButton
                html={html}
                disabled={disabled}
                onCopyResult={handleCopyResult}
                className="hidden sm:inline-flex"
              />
            </>
          ) : null}
          <Button
            type="button"
            variant={isMobileInstall ? 'default' : 'outline'}
            disabled={disabled || !html.trim()}
            onClick={() => downloadHtml(downloadFilename, html)}
          >
            Download HTML
          </Button>
          {isMobileInstall ? (
            <EmailSignatureButton html={html} disabled={disabled} forwardNote={emailForwardNote} />
          ) : null}
        </div>
      </div>

      {!isMobileInstall && copyFailed ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t copy automatically. Try Download HTML, or select the signature in the live preview and copy
          manually.
        </p>
      ) : null}

      <GmailInstallHelp disabled={disabled} />
      <OutlookInstallHelp disabled={disabled} />
    </div>
  );
}
