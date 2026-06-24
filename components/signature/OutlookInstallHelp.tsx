import { OpenEmailSettingsButton } from '@/components/signature/OpenEmailSettingsButton';
import {
  OUTLOOK_PERSONAL_SETTINGS_URL,
  OUTLOOK_WORK_LAYOUT_SETTINGS_URL,
  OUTLOOK_WORK_SETTINGS_URL,
} from '@/lib/install/outlookSettingsUrl';

type Props = {
  disabled?: boolean;
};

export function OutlookInstallHelp({ disabled }: Props) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Outlook</p>

      <p className="text-xs md:hidden">
        Install on a <strong className="text-foreground">desktop or laptop</strong> using Outlook on the web or
        Outlook desktop (Windows). Mobile Outlook apps cannot reliably paste full HTML signatures. After setup on a
        computer, your signature applies to messages sent from mobile Outlook as well.
      </p>

      <div className="hidden md:flex flex-wrap gap-2">
        <OpenEmailSettingsButton
          href={OUTLOOK_WORK_SETTINGS_URL}
          label="Open Outlook email settings"
          disabled={disabled}
        />
        <OpenEmailSettingsButton
          href={OUTLOOK_PERSONAL_SETTINGS_URL}
          label="Open Outlook.com email settings"
          disabled={disabled}
        />
      </div>
      <p className="hidden md:block">
        Microsoft does not offer a supported public API to set your personal HTML signature from a website (Microsoft
        Graph cannot update signature HTML). Use copy-and-paste or install from a file.
      </p>
      <ol className="list-decimal pl-5 space-y-2">
        <li className="hidden md:list-item">
          <strong>Paste your copied signature</strong> under <strong>Email signature</strong> in Outlook on the web
          (work or personal account). If your tenant uses the classic settings UI, try{' '}
          <a
            href={OUTLOOK_WORK_LAYOUT_SETTINGS_URL}
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mail → Layout
          </a>{' '}
          instead.
        </li>
        <li className="md:hidden">
          <strong>On your computer:</strong> paste under <strong>Email signature</strong> in Outlook on the web or
          Outlook desktop (File → Options → Mail → Signatures on Windows).
        </li>
        <li className="hidden md:list-item">
          <strong>Outlook desktop (Windows):</strong> File → Options → Mail → Signatures… → paste under Edit signature.
        </li>
      </ol>
      <p className="text-xs hidden md:block">
        Use <strong>Copy for Outlook</strong> for best results in Outlook, or <strong>Download HTML</strong> if your IT
        policy prefers a file. If your logo does not appear, re-upload it in Tailnote (logos are saved as PNG for
        Outlook compatibility) and paste the signature again.
      </p>
    </div>
  );
}
