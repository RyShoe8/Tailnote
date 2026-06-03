import { hasBrandingRemoval } from '@/lib/billing/subscriptionAccess';

const ATTRIBUTION_LINK = 'https://tailnote.io/from-signature';

export function shouldIncludeTailnoteAttribution(
  org: { plan?: string | null; subscriptionStatus?: string | null } | null | undefined
): boolean {
  return !hasBrandingRemoval(org);
}

export function signatureAttributionHtml(): string {
  return `<div style="margin-top:8px;padding-top:6px;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.4;color:#6b7280;">Powered by <a href="${ATTRIBUTION_LINK}" target="_blank" rel="noopener noreferrer" style="color:#6b7280;text-decoration:none;">Tailnote</a></div>`;
}

export function appendSignatureAttributionIfNeeded(args: {
  html: string;
  org: { plan?: string | null; subscriptionStatus?: string | null } | null | undefined;
}): string {
  if (!args.html.trim()) return args.html;
  if (!shouldIncludeTailnoteAttribution(args.org)) return args.html;
  return `${args.html}${signatureAttributionHtml()}`;
}
