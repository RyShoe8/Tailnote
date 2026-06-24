function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export type MailsignatureFileInput = {
  signatureUniqueId: string;
  signatureName: string;
  html: string;
};

/** XML plist body for a `.mailsignature` file (modern macOS Mail). */
export function buildMailsignatureFile(input: MailsignatureFileInput): string {
  const id = input.signatureUniqueId.trim();
  const name = escapeXml(input.signatureName.trim() || 'Tailnote Signature');
  const body = escapeXml(input.html.trim());

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>SignatureIsRich</key>
\t<true/>
\t<key>SignatureName</key>
\t<string>${name}</string>
\t<key>SignatureUniqueId</key>
\t<string>${id}</string>
\t<key>SignatureMessageBody</key>
\t<string>${body}</string>
</dict>
</plist>
`;
}
