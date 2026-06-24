'use client';

import { isMacOsClient } from '@/components/signature/AppleMailInstallButton';

type Props = {
  showPostDownload?: boolean;
};

export function AppleMailInstallHelp({ showPostDownload }: Props) {
  const isMac = isMacOsClient();

  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Apple Mail</p>

      {!isMac ? (
        <p className="text-xs">
          The installer runs on <strong className="text-foreground">macOS only</strong>. You can download{' '}
          <strong className="text-foreground">tailnote-install.command</strong> here and transfer it to a Mac, or open
          Tailnote on a Mac to install directly.
        </p>
      ) : (
        <p className="text-xs">
          One-click installer for macOS Mail. After download, double-click{' '}
          <strong className="text-foreground">tailnote-install.command</strong> to add your signature.
        </p>
      )}

      {showPostDownload ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Install steps</p>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs">
            <li>Download the installer using the button above.</li>
            <li>
              If macOS warns the file is from the internet, right-click the file → <strong>Open</strong> →{' '}
              <strong>Open</strong> again.
            </li>
            <li>Follow the Terminal prompts (optional: lock the signature from Mail edits).</li>
            <li>
              Open Mail → <strong>Settings</strong> → <strong>Signatures</strong>.
            </li>
            <li>
              Select <strong>Tailnote Signature</strong> and assign it to your email account(s).
            </li>
          </ol>
        </div>
      ) : (
        <ol className="list-decimal pl-5 space-y-1.5 text-xs">
          <li>Click Download installer above.</li>
          <li>Run tailnote-install.command on your Mac (right-click → Open if Gatekeeper blocks it).</li>
          <li>Assign the new signature in Mail → Settings → Signatures.</li>
        </ol>
      )}
    </div>
  );
}
