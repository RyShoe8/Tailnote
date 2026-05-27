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
      <div className="flex flex-wrap gap-2">
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
      <p>
        Microsoft does not offer a supported public API to set your personal HTML signature from a website (Microsoft
        Graph cannot update signature HTML). Use copy-and-paste or install from a file.
      </p>
      <ol className="list-decimal pl-5 space-y-2">
        <li>
          <strong>Outlook on the web:</strong> use the buttons above (work or personal account), then paste under{' '}
          <strong>Email signature</strong>. If your tenant uses the classic settings UI, try{' '}
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
        <li>
          <strong>Outlook desktop (Windows):</strong> File → Options → Mail → Signatures… → paste under Edit signature.
        </li>
      </ol>
      <p className="text-xs">
        Use <strong>Copy rich text</strong> for best results in Outlook, or <strong>Download HTML</strong> if your IT
        policy prefers a file. If your logo does not appear, re-upload it in Tailnote (logos are saved as PNG for
        Outlook compatibility) and paste the signature again.
      </p>
    </div>
  );
}
