import { OpenEmailSettingsButton } from '@/components/signature/OpenEmailSettingsButton';
import { resolveGmailSettingsHref } from '@/lib/install/resolveGmailSettingsHref';

const STEPS_DESKTOP = [
  'Copy your signature using the button above.',
  'Open Gmail email settings.',
  'Scroll to the Signature section on the General tab.',
  'Paste into the signature field and save changes at the bottom of the page.',
] as const;

const STEPS_MOBILE = [
  'Copy your signature using the button above.',
  'Open Gmail in your browser (recommended for rich HTML) or the Gmail app.',
  'In browser: Settings → General → Signature. In the app: Menu → Settings → your account → Signature.',
  'Paste into the signature field and save. Avoid the plain-text-only “Mobile signature” field if you need logos and formatting.',
] as const;

type Props = {
  disabled?: boolean;
  onSettingsOpen?: () => void;
};

export function GmailInstallHelp({ disabled, onSettingsOpen }: Props) {
  const mobileHref = resolveGmailSettingsHref();

  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Gmail</p>
      <OpenEmailSettingsButton
        href={mobileHref}
        label="Open Gmail"
        disabled={disabled}
        onOpen={onSettingsOpen}
        gmailMobileAware
      />
      <ol className="list-decimal pl-5 space-y-2 md:hidden">
        {STEPS_MOBILE.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <ol className="hidden list-decimal pl-5 space-y-2 md:block">
        {STEPS_DESKTOP.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-xs md:hidden">
        <strong className="text-foreground">Tip:</strong> Rich signatures paste best in Gmail opened in
        your mobile browser (Settings → General → Signature), not as raw HTML in the app&apos;s plain
        mobile signature field.
      </p>
      <p className="hidden text-xs md:block">
        <strong className="text-foreground">Where do I paste this?</strong> Settings → General → scroll
        to <strong className="text-foreground">Signature</strong>.
      </p>
    </div>
  );
}
