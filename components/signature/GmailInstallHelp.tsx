import { OpenEmailSettingsButton } from '@/components/signature/OpenEmailSettingsButton';
import { GMAIL_SETTINGS_URL } from '@/lib/install/gmailSettingsUrl';

const STEPS = [
  'Copy your signature using the button above.',
  'Open Gmail email settings.',
  'Scroll to the Signature section on the General tab.',
  'Paste into the signature field and save changes at the bottom of the page.',
] as const;

type Props = {
  disabled?: boolean;
  onSettingsOpen?: () => void;
};

export function GmailInstallHelp({ disabled, onSettingsOpen }: Props) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Gmail</p>
      <OpenEmailSettingsButton
        href={GMAIL_SETTINGS_URL}
        label="Open Gmail email settings"
        disabled={disabled}
        onOpen={onSettingsOpen}
      />
      <ol className="list-decimal pl-5 space-y-2">
        {STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="text-xs">
        <strong className="text-foreground">Where do I paste this?</strong> Settings → General → scroll to{' '}
        <strong className="text-foreground">Signature</strong>.
      </p>
    </div>
  );
}
