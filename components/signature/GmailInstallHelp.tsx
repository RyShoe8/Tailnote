import { GmailOpenActions } from '@/components/signature/GmailOpenActions';

const STEPS_DESKTOP = [
  'Copy your signature using the button above.',
  'Open Gmail email settings.',
  'Scroll to the Signature section on the General tab.',
  'Paste into the signature field and save changes at the bottom of the page.',
] as const;

const STEPS_MOBILE_APP = [
  'Copy your signature (Copy signature button above).',
  'Tap Open Gmail app.',
  'Menu → Settings → your email → Signature settings (turn off Mobile signature if it overrides your web signature).',
  'Paste and save. The app field may be plain text only.',
] as const;

const STEPS_MOBILE_BROWSER = [
  'Copy your signature (Copy signature button above).',
  'Tap Open Gmail in browser.',
  'You should land on Settings → General — scroll to Signature.',
  'Paste and tap Save changes at the bottom of the page.',
] as const;

type Props = {
  disabled?: boolean;
  onSettingsOpen?: () => void;
};

export function GmailInstallHelp({ disabled, onSettingsOpen }: Props) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Gmail</p>
      <GmailOpenActions disabled={disabled} onOpen={onSettingsOpen} />

      <div className="space-y-3 md:hidden">
        <div>
          <p className="text-xs font-medium text-foreground">Using the Gmail app</p>
          <ol className="mt-1.5 list-decimal pl-5 space-y-1.5">
            {STEPS_MOBILE_APP.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">Using Gmail in your browser (recommended for HTML)</p>
          <ol className="mt-1.5 list-decimal pl-5 space-y-1.5">
            {STEPS_MOBILE_BROWSER.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <p className="text-xs rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          Can&apos;t paste formatted HTML in the app? Use <strong className="text-foreground">Open Gmail in browser</strong>.
        </p>
      </div>

      <ol className="hidden list-decimal pl-5 space-y-2 md:block">
        {STEPS_DESKTOP.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p className="hidden text-xs md:block">
        <strong className="text-foreground">Where do I paste this?</strong> Settings → General → scroll
        to <strong className="text-foreground">Signature</strong>.
      </p>
    </div>
  );
}
