import Link from 'next/link';
import { GMAIL_SETTINGS_URL } from '@/lib/install/gmailSettingsUrl';

const STEPS = [
  'Copy your signature using the button above.',
  'Open Gmail settings (link below).',
  'Paste into the signature field (Settings → General → Signature).',
  'Save changes at the bottom of the page.',
] as const;

export function GmailInstallHelp() {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Gmail</p>
      <ol className="list-decimal pl-5 space-y-2">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-xs">
        <strong className="text-foreground">Where do I paste this?</strong> In Gmail, go to Settings →
        General and scroll to the Signature section.
      </p>
      <Link
        href={GMAIL_SETTINGS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex text-sm font-medium text-primary underline underline-offset-2"
      >
        Open Gmail settings
      </Link>
    </div>
  );
}
