'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CopySignatureButton } from '@/components/signature/CopySignatureButton';
import { CopyRichTextButton } from '@/components/signature/CopyRichTextButton';
import { DesktopInstallNotice } from '@/components/signature/DesktopInstallNotice';
import { EmailSignatureButton } from '@/components/signature/EmailSignatureButton';
import { AppleMailInstallButton } from '@/components/signature/AppleMailInstallButton';
import { AppleMailInstallHelp } from '@/components/signature/AppleMailInstallHelp';
import { GmailInstallHelp } from '@/components/signature/GmailInstallHelp';
import { OutlookInstallHelp } from '@/components/signature/OutlookInstallHelp';
import { HtmlInstallHelp } from '@/components/signature/HtmlInstallHelp';
import { EmailInstallHelp } from '@/components/signature/EmailInstallHelp';
import { downloadHtml } from '@/lib/clipboard';
import { useIsMobileInstallContext } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

type InstallMethod = 'gmail' | 'outlook' | 'apple' | 'html' | 'email';

type Props = {
  html: string;
  disabled?: boolean;
  downloadFilename?: string;
  emailForwardNote?: string;
  employeeId?: string;
  installContext?: { templateId: string };
};

const btnClass = 'w-full justify-center';

export function SignatureInstallPanel({
  html,
  disabled,
  downloadFilename = 'tailnote-signature.html',
  emailForwardNote,
  employeeId,
  installContext,
}: Props) {
  const isMobileInstall = useIsMobileInstallContext();
  const [activeMethod, setActiveMethod] = useState<InstallMethod | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopyResult = (ok: boolean) => {
    setCopyFailed(!ok);
  };

  const appleDisabled =
    disabled ||
    (!employeeId && !installContext?.templateId);

  const buttonVariant = (method: InstallMethod) =>
    activeMethod === method ? 'default' : 'outline';

  return (
    <div className="space-y-6">
      {isMobileInstall ? <DesktopInstallNotice /> : null}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {activeMethod ? 'Follow the steps below.' : 'Choose how you want to install your signature.'}
        </p>

        <div className="flex flex-col gap-2">
          {!isMobileInstall ? (
            <>
              <CopySignatureButton
                html={html}
                disabled={disabled}
                label="Copy for Gmail"
                variant={buttonVariant('gmail')}
                className={btnClass}
                onActivate={() => {
                  setActiveMethod('gmail');
                  setCopyFailed(false);
                }}
                onCopyResult={handleCopyResult}
              />
              <CopyRichTextButton
                html={html}
                disabled={disabled}
                label="Copy for Outlook"
                variant={buttonVariant('outlook')}
                className={btnClass}
                onActivate={() => {
                  setActiveMethod('outlook');
                  setCopyFailed(false);
                }}
                onCopyResult={handleCopyResult}
              />
            </>
          ) : null}

          <AppleMailInstallButton
            disabled={appleDisabled}
            employeeId={employeeId}
            templateId={installContext?.templateId}
            variant={buttonVariant('apple')}
            className={btnClass}
            onActivate={() => setActiveMethod('apple')}
          />

          <Button
            type="button"
            variant={buttonVariant('html')}
            className={cn(btnClass)}
            disabled={disabled || !html.trim()}
            onClick={() => {
              setActiveMethod('html');
              downloadHtml(downloadFilename, html);
            }}
          >
            Download HTML
          </Button>

          {isMobileInstall ? (
            <EmailSignatureButton
              html={html}
              disabled={disabled}
              forwardNote={emailForwardNote}
              variant={buttonVariant('email')}
              className={btnClass}
              onActivate={() => setActiveMethod('email')}
            />
          ) : null}
        </div>
      </div>

      {!isMobileInstall && copyFailed && (activeMethod === 'gmail' || activeMethod === 'outlook') ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t copy automatically. Try Download HTML, or select the signature in the live preview and copy
          manually.
        </p>
      ) : null}

      {activeMethod === 'gmail' ? <GmailInstallHelp disabled={disabled} /> : null}
      {activeMethod === 'outlook' ? <OutlookInstallHelp disabled={disabled} /> : null}
      {activeMethod === 'apple' ? <AppleMailInstallHelp /> : null}
      {activeMethod === 'html' ? <HtmlInstallHelp /> : null}
      {activeMethod === 'email' ? <EmailInstallHelp /> : null}
    </div>
  );
}
