export function HtmlInstallHelp() {
  return (
    <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground space-y-3">
      <p className="font-medium text-foreground">HTML file</p>
      <ol className="list-decimal pl-5 space-y-2 text-xs">
        <li>Your signature was saved as an HTML file.</li>
        <li>Open the file in a browser to preview it, or import it using your email client&apos;s instructions.</li>
        <li>
          For clients without HTML import, open the file, select all, copy, and paste into your signature settings.
        </li>
        <li>Send yourself a test email to confirm images and links render correctly.</li>
      </ol>
    </div>
  );
}
