import { GmailOpenActions } from '@/components/signature/GmailOpenActions';

const STEPS_DESKTOP = [
  'Click Copy for Gmail above.',
  'Open Gmail email settings.',
  'Scroll to the Signature section on the General tab.',
  'Paste into the signature field and save changes at the bottom of the page.',
] as const;

const STEPS_MOBILE_AFTER_DESKTOP = [
  'On your computer: copy your signature in Tailnote, open Gmail Settings → General → Signature, paste, and save.',
  'On your phone: Gmail app → Menu → Settings → your account → turn off Mobile signature (or leave it blank) so new messages use your web signature with images and formatting.',
] as const;

type Props = {
  disabled?: boolean;
  onSettingsOpen?: () => void;
};

export function GmailInstallHelp({ disabled, onSettingsOpen }: Props) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Gmail</p>

      <div className="space-y-3 md:hidden">
        <p className="text-xs">
          Install your signature on a <strong className="text-foreground">desktop or laptop</strong> first. The Gmail
          app and mobile browser only accept plain text—you cannot paste a full Tailnote signature on your phone.
        </p>
        <p className="text-xs font-medium text-foreground">After desktop setup</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          {STEPS_MOBILE_AFTER_DESKTOP.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="hidden md:block space-y-3">
        <GmailOpenActions disabled={disabled} onOpen={onSettingsOpen} />
        <ol className="list-decimal pl-5 space-y-2">
          {STEPS_DESKTOP.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="text-xs">
          <strong className="text-foreground">Where do I paste this?</strong> Settings → General → scroll to{' '}
          <strong className="text-foreground">Signature</strong>.
        </p>
      </div>
    </div>
  );
}
