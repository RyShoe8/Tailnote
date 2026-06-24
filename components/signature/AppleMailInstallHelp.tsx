'use client';

import { isMacOsClient } from '@/components/signature/AppleMailInstallButton';

export function AppleMailInstallHelp() {
  const isMac = isMacOsClient();

  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Apple Mail</p>

      {!isMac ? (
        <p className="text-xs">
          The installer runs on <strong className="text-foreground">macOS only</strong>. Transfer{' '}
          <strong className="text-foreground">tailnote-install.command</strong> to a Mac if you downloaded it on
          another device.
        </p>
      ) : null}

      <ol className="list-decimal pl-5 space-y-1.5 text-xs">
        <li>
          Open <strong className="text-foreground">tailnote-install.command</strong>. If macOS blocks it, right-click →{' '}
          <strong>Open</strong> → <strong>Open</strong> again.
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
  );
}
