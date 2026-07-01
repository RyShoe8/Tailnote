import type { BIMIResult } from '@/lib/email-health/bimiTypes';

export type BimiLogoSummary = {
  previewUrl: string | null;
  previewDisplayUrl: string | null;
  hostedWithTailnote: boolean;
  dnsLogoUrl: string | null;
  dnsMismatch: boolean;
  specs: {
    format: string;
    width: number | null;
    height: number | null;
    byteSize: number | null;
    byteSizeKb: string | null;
  };
  status: string;
  issues: string[];
  improvements: string[];
  specsPass: boolean;
  uploadedAt: Date | null;
};

function normalizeUrl(url: string | undefined | null): string | null {
  const trimmed = url?.trim();
  return trimmed || null;
}

/** Cache-busted URL for dashboard `<img>` previews only — keep canonical URL for DNS/links. */
export function bimiLogoDisplayUrl(
  url: string | null | undefined,
  uploadedAt?: Date | string | null,
): string | null {
  const canonical = normalizeUrl(url);
  if (!canonical) return null;
  if (!uploadedAt) return canonical;
  const at = uploadedAt instanceof Date ? uploadedAt : new Date(uploadedAt);
  if (Number.isNaN(at.getTime())) return canonical;
  const sep = canonical.includes('?') ? '&' : '?';
  return `${canonical}${sep}v=${at.getTime()}`;
}

function urlsDiffer(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  try {
    return new URL(a).href !== new URL(b).href;
  } catch {
    return a !== b;
  }
}

export function buildBimiLogoSummary(input: {
  bimiLogoUrl?: string | null;
  bimiDetail?: BIMIResult | null;
  bimiLogoUploadedAt?: Date | string | null;
}): BimiLogoSummary {
  const hostedUrl = normalizeUrl(input.bimiLogoUrl);
  const dnsLogoUrl = normalizeUrl(input.bimiDetail?.bimiRecordStatus?.tags?.l);
  const svg = input.bimiDetail?.svgStatus;
  const svgUrl = normalizeUrl(svg?.url);

  const previewUrl = hostedUrl ?? dnsLogoUrl ?? svgUrl;
  const hostedWithTailnote = Boolean(hostedUrl && previewUrl && hostedUrl === previewUrl);

  const width = svg?.width ?? null;
  const height = svg?.height ?? null;
  const byteSize = svg?.byteSize ?? null;
  const byteSizeKb =
    byteSize != null ? `${(byteSize / 1024).toFixed(byteSize >= 10240 ? 1 : 2)} KB` : null;

  const issues = [...(svg?.issues ?? [])];
  const improvements: string[] = [];

  for (const issue of issues) {
    if (!improvements.includes(issue)) improvements.push(issue);
  }
  for (const rec of input.bimiDetail?.recommendations ?? []) {
    if (!improvements.includes(rec)) improvements.push(rec);
  }
  if (input.bimiDetail?.certificateStatus?.classification === 'none') {
    const vmcNote =
      'A Verified Mark Certificate (VMC) is optional for self-asserted BIMI on Yahoo and Apple Mail; Gmail typically requires one.';
    if (!improvements.includes(vmcNote)) improvements.push(vmcNote);
  }

  const specsPass =
    svg?.status === 'pass' &&
    Boolean(previewUrl?.startsWith('https://')) &&
    width != null &&
    height != null &&
    width === height &&
    (byteSize == null || byteSize <= 32 * 1024);

  const uploadedAt = input.bimiLogoUploadedAt
    ? new Date(input.bimiLogoUploadedAt)
    : null;
  const previewDisplayUrl = bimiLogoDisplayUrl(previewUrl, uploadedAt);

  return {
    previewUrl,
    previewDisplayUrl,
    hostedWithTailnote,
    dnsLogoUrl,
    dnsMismatch: urlsDiffer(hostedUrl, dnsLogoUrl),
    specs: {
      format: previewUrl?.toLowerCase().includes('.svg') || svgUrl ? 'SVG' : 'Image',
      width,
      height,
      byteSize,
      byteSizeKb,
    },
    status: svg?.summary?.trim() || (previewUrl ? 'Logo on file' : 'No logo uploaded'),
    issues,
    improvements,
    specsPass,
    uploadedAt: uploadedAt && !Number.isNaN(uploadedAt.getTime()) ? uploadedAt : null,
  };
}
