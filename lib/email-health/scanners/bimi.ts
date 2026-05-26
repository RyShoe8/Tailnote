import { flattenTxt, resolveTxtRecords } from '@/lib/email-health/dns';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

export type BimiScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
};

export async function scanBimi(domain: string): Promise<BimiScanResult> {
  const issues: DomainIssue[] = [];
  const host = `default._bimi.${domain}`;
  const txt = flattenTxt(await resolveTxtRecords(host));
  const bimi = txt.find((r) => r.toLowerCase().startsWith('v=bimi1'));

  if (!bimi) {
    issues.push({
      category: 'bimi',
      severity: 'info',
      title: 'Brand logo in inbox (BIMI) is not configured',
      explanation:
        'BIMI can display your logo beside emails in some clients (e.g. Gmail with a verified mark). This is optional but improves brand recognition.',
      recommendation:
        'If you want inbox branding, publish a BIMI record with an HTTPS SVG logo and obtain a Verified Mark Certificate (VMC) where required.',
      technicalDetail: `No v=BIMI1 record at ${host}.`,
    });
    return {
      category: buildCategoryResult('bimi', 'warn', 'BIMI not configured (optional)'),
      issues,
    };
  }

  const hasLogo = /l\s*=\s*https?:\/\//i.test(bimi);
  const hasVmc = /a\s*=\s*https?:\/\//i.test(bimi);

  let status: 'pass' | 'warn' = hasLogo ? 'pass' : 'warn';
  let summary = hasLogo ? 'BIMI record with logo URL' : 'BIMI record incomplete';

  if (!hasLogo) {
    issues.push({
      category: 'bimi',
      severity: 'warn',
      title: 'BIMI record is missing a logo URL',
      explanation: 'Without an HTTPS SVG logo link, clients cannot show your brand mark.',
      recommendation: 'Add l=https://yourdomain.com/logo.svg to your BIMI TXT record.',
      technicalDetail: bimi,
    });
  }

  if (!hasVmc) {
    status = 'warn';
    summary = 'BIMI without verified mark certificate';
    issues.push({
      category: 'bimi',
      severity: 'info',
      title: 'Verified Mark Certificate (VMC) not detected',
      explanation:
        'Gmail and some providers require a VMC before showing BIMI logos for most senders.',
      recommendation: 'Work with a BIMI-certified provider to obtain a VMC if you need Gmail logo display.',
      technicalDetail: bimi,
    });
  } else {
    issues.push({
      category: 'bimi',
      severity: 'info',
      title: 'BIMI is configured',
      explanation: 'Your domain is set up for inbox logo branding where supported.',
      recommendation: 'Keep the SVG logo hosted over HTTPS and renew VMC before expiry.',
      technicalDetail: bimi,
    });
  }

  return {
    category: buildCategoryResult('bimi', status, summary),
    issues,
  };
}
