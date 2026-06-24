export function EmailInstallHelp() {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">Email signature</p>
      <ol className="list-decimal pl-5 space-y-2 text-xs">
        <li>Check your inbox on a desktop or laptop.</li>
        <li>Open the email from Tailnote and copy the signature block.</li>
        <li>Paste into Gmail or Outlook signature settings on your computer.</li>
        <li>
          On mobile Gmail, turn off <strong className="text-foreground">Mobile signature</strong> so new messages use
          your web signature with images and formatting.
        </li>
      </ol>
    </div>
  );
}
