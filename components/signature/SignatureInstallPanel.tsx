'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { DesktopInstallNotice } from '@/components/signature/DesktopInstallNotice';
import { EmailSignatureButton } from '@/components/signature/EmailSignatureButton';
import { AppleMailInstallButton } from '@/components/signature/AppleMailInstallButton';
import { AppleMailInstallHelp } from '@/components/signature/AppleMailInstallHelp';
import { GmailInstallHelp } from '@/components/signature/GmailInstallHelp';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import { useIsMobileInstallContext } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

type Props = {
  html: string;
  disabled?: boolean;
  downloadFilename?: string;
  emailForwardNote?: string;
  employeeId?: string;
  installContext?: { templateId: string };
};

function InstallExportCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm space-y-3', className)}>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function SignatureInstallPanel({
  html,
  disabled,
  downloadFilename = 'tailnote-signature.html',
  emailForwardNote,
  employeeId,
  installContext,
}: Props) {
  const isMobileInstall = useIsMobileInstallContext();
  const [copyFailed, setCopyFailed] = useState(false);
  const [appleDownloaded, setAppleDownloaded] = useState(false);

  const handleCopyResult = (ok: boolean) => {
    setCopyFailed(!ok);
  };

  const appleDisabled =
    disabled ||
    (!employeeId && !installContext?.templateId);

  return (
    <div className="space-y-6">
      {isMobileInstall ? <DesktopInstallNotice /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {!isMobileInstall ? (
          <>
            <InstallExportCard
              title="Gmail"
              description="Copy formatted HTML for Gmail web settings. Works best on desktop."
            >
              <CopySignatureButton
                html={html}
                disabled={disabled}
                label="Copy for Gmail"
                onCopyResult={handleCopyResult}
              />
            </InstallExportCard>

            <InstallExportCard
              title="Outlook"
              description="Copy rich HTML for Outlook on the web or Outlook desktop (Windows)."
            >
              <CopyRichTextButton
                html={html}
                disabled={disabled}
                label="Copy for Outlook"
                onCopyResult={handleCopyResult}
              />
            </InstallExportCard>
          </>
        ) : null}

        <InstallExportCard
          title="Apple Mail"
          description={
            isMobileInstall
              ? 'Download the macOS installer and run it on a Mac.'
              : 'One-click installer for macOS Mail (.command file).'
          }
          className={isMobileInstall ? 'sm:col-span-2' : undefined}
        >
          <AppleMailInstallButton
            disabled={appleDisabled}
            employeeId={employeeId}
            templateId={installContext?.templateId}
            onDownloaded={() => setAppleDownloaded(true)}
          />
        </InstallExportCard>

        <InstallExportCard
          title="HTML file"
          description="Advanced / other clients — download raw HTML for manual import."
          className={isMobileInstall ? 'sm:col-span-2' : undefined}
        >
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
        </InstallExportCard>
      </div>

      {!isMobileInstall && copyFailed ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t copy automatically. Try Download HTML, or select the signature in the live preview and copy
          manually.
        </p>
      ) : null}

      <AppleMailInstallHelp showPostDownload={appleDownloaded} />
      <GmailInstallHelp disabled={disabled} />
      <OutlookInstallHelp disabled={disabled} />
    </div>
  );
}
