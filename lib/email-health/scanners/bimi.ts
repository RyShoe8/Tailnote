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
      severity: 'warn',
      title: 'Brand logo in inbox (BIMI) is not configured',
      explanation:
        'BIMI can display your logo beside emails in some clients (e.g. Gmail with a verified mark). This is optional but improves brand recognition.',
      recommendation:
        'If you want inbox branding, publish a BIMI record with an HTTPS SVG logo and obtain a Verified Mark Certificate (VMC) where required.',
      stepsToPass: [
        'Optional: BIMI is not required for deliverability — you can skip this and still fix SPF/DKIM/DMARC.',
        'Create a square SVG logo and host it at a stable https:// URL on your domain.',
        'Add a TXT record at default._bimi with v=BIMI1; l=https://yourdomain.com/logo.svg.',
        'Purchase a Verified Mark Certificate (VMC) if you need Gmail inbox logo display.',
        'Rescan after DNS and certificate are published.',
      ],
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
      stepsToPass: [
        'Upload a square SVG logo to your site over HTTPS (not HTTP).',
        'Edit the default._bimi TXT record and add l=https://yourdomain.com/path/logo.svg.',
        'Keep v=BIMI1; at the start of the record.',
        'Verify the logo URL loads in a browser, then rescan.',
      ],
      technicalDetail: bimi,
    });
  }

  if (!hasVmc) {
    status = 'warn';
    summary = 'BIMI without verified mark certificate';
    issues.push({
      category: 'bimi',
      severity: 'warn',
      title: 'Verified Mark Certificate (VMC) not detected',
      explanation:
        'Gmail and some providers require a VMC before showing BIMI logos for most senders.',
      recommendation: 'Work with a BIMI-certified provider to obtain a VMC if you need Gmail logo display.',
      stepsToPass: [
        'Ensure your BIMI record includes a valid l= HTTPS SVG logo URL.',
        'Obtain a VMC from an authorized provider (e.g. DigiCert, Entrust) after meeting trademark requirements.',
        'Add a=https://... pointing to your VMC PEM in the BIMI TXT record.',
        'Confirm DMARC is at p=quarantine or p=reject — required for BIMI in most clients.',
        'Rescan after the certificate is live in DNS.',
      ],
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
