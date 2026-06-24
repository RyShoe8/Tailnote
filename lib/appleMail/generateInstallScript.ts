import { buildMailsignatureFile } from '@/lib/appleMail/buildMailsignatureFile';

export type AppleMailInstallScriptInput = {
  signatureUniqueId: string;
  signatureName: string;
  html: string;
};

export function generateAppleMailInstallScript(input: AppleMailInstallScriptInput): string {
  const mailsignaturePlist = buildMailsignatureFile({
    signatureUniqueId: input.signatureUniqueId,
    signatureName: input.signatureName,
    html: input.html,
  });
  const mailsignatureB64 = Buffer.from(mailsignaturePlist, 'utf8').toString('base64');
  const uuid = input.signatureUniqueId;
  const name = input.signatureName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  return `#!/bin/bash
set -euo pipefail

SIGNATURE_UUID="${uuid}"
SIGNATURE_NAME="${name}"
MAILSIGNATURE_B64="${mailsignatureB64}"

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

info() { echo -e "\${GREEN}✓\${NC} $1"; }
warn() { echo -e "\${YELLOW}!\${NC} $1"; }
fail() { echo -e "\${RED}✗\${NC} $1"; exit 1; }

echo "Installing Tailnote Signature..."
echo ""

if [[ "$(uname -s)" != "Darwin" ]]; then
  fail "This installer requires macOS and Apple Mail."
fi

MAIL_ROOT="$HOME/Library/Mail"
if [[ ! -d "$MAIL_ROOT" ]]; then
  fail "Apple Mail installation not found (~/Library/Mail missing)."
fi

LATEST_VERSION=""
LATEST_NUM=0
for dir in "$MAIL_ROOT"/V*; do
  [[ -d "$dir" ]] || continue
  base="$(basename "$dir")"
  num="\${base#V}"
  if [[ "$num" =~ ^[0-9]+$ ]] && (( num > LATEST_NUM )); then
    LATEST_NUM=$num
    LATEST_VERSION="$dir"
  fi
done

if [[ -z "$LATEST_VERSION" ]]; then
  fail "Apple Mail data folder not found under ~/Library/Mail."
fi

MAIL_DATA="$LATEST_VERSION/MailData"
SIG_DIR="$MAIL_DATA/Signatures"
ALL_SIG="$MAIL_DATA/AllSignatures.plist"

if [[ ! -d "$SIG_DIR" ]]; then
  fail "Mail signatures folder not found at $SIG_DIR"
fi

info "Mail folder found ($MAIL_DATA)"

SIG_FILE="$SIG_DIR/$SIGNATURE_UUID.mailsignature"
if ! echo "$MAILSIGNATURE_B64" | base64 -D -o "$SIG_FILE" 2>/dev/null; then
  echo "$MAILSIGNATURE_B64" | base64 -d > "$SIG_FILE"
fi

info "Signature file created"

REGISTERED=0
if [[ -f "$ALL_SIG" ]]; then
  ROOT_TYPE=$(/usr/libexec/PlistBuddy -c "Print" "$ALL_SIG" 2>/dev/null | head -1 || true)
  if [[ "$ROOT_TYPE" == "Dict" ]]; then
    COUNT=$(/usr/libexec/PlistBuddy -c "Print :SignatureData" "$ALL_SIG" 2>/dev/null | grep -c "Dict" || echo "0")
    /usr/libexec/PlistBuddy -c "Add :SignatureData:$COUNT dict" "$ALL_SIG" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :SignatureData:$COUNT:SignatureIsRich bool true" "$ALL_SIG" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :SignatureData:$COUNT:SignatureName string \\"$SIGNATURE_NAME\\"" "$ALL_SIG" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :SignatureData:$COUNT:SignatureUniqueId string $SIGNATURE_UUID" "$ALL_SIG" 2>/dev/null && REGISTERED=1
  elif [[ "$ROOT_TYPE" == "Array" ]]; then
    COUNT=$(/usr/libexec/PlistBuddy -c "Print" "$ALL_SIG" 2>/dev/null | grep -c "Dict" || echo "0")
    /usr/libexec/PlistBuddy -c "Add :$COUNT dict" "$ALL_SIG" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :$COUNT:SignatureIsRich bool true" "$ALL_SIG" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :$COUNT:SignatureName string \\"$SIGNATURE_NAME\\"" "$ALL_SIG" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :$COUNT:SignatureUniqueId string $SIGNATURE_UUID" "$ALL_SIG" 2>/dev/null && REGISTERED=1
  fi
fi

if [[ "$REGISTERED" -eq 1 ]]; then
  info "Signature registered with Mail"
else
  warn "Signature file created but registration in AllSignatures.plist failed or skipped."
  warn "Open Mail → Settings → Signatures and select \\"$SIGNATURE_NAME\\" manually."
fi

read -r -p "Protect the signature from Apple Mail edits? (y/n) " LOCK_CHOICE || LOCK_CHOICE="n"
if [[ "$LOCK_CHOICE" =~ ^[Yy]$ ]]; then
  if chflags uchg "$SIG_FILE" 2>/dev/null; then
    info "Signature file locked"
  else
    warn "Could not lock signature file (permissions)."
  fi
fi

if pgrep -x Mail >/dev/null 2>&1; then
  osascript -e 'quit app "Mail"' >/dev/null 2>&1 || true
  sleep 2
fi
open -a Mail >/dev/null 2>&1 || warn "Could not open Mail automatically."

echo ""
echo "Installation complete."
echo ""
echo "Next steps:"
echo "  1. Open Mail → Settings → Signatures"
echo "  2. Select \\"$SIGNATURE_NAME\\""
echo "  3. Assign it to your email account(s)"
echo ""
`;
}
