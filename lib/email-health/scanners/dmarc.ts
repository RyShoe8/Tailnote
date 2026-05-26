import { flattenTxt, resolveTxtRecords } from '@/lib/email-health/dns';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

export type DmarcScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
  policy?: string;
};

function parseDmarcTag(record: string, tag: string): string | undefined {
  const match = record.match(new RegExp(`(?:^|;)\\s*${tag}\\s*=\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim();
}

export async function scanDmarc(domain: string): Promise<DmarcScanResult> {
  const issues: DomainIssue[] = [];
  const host = `_dmarc.${domain}`;
  const txt = flattenTxt(await resolveTxtRecords(host));
  const dmarc = txt.find((r) => r.toLowerCase().startsWith('v=dmarc1'));

  if (!dmarc) {
    issues.push({
      category: 'dmarc',
      severity: 'fail',
      title: 'Domain protection (DMARC) is not enabled',
      explanation:
        'Without DMARC, your domain is easier to impersonate — phishing emails may look like they came from you.',
      recommendation:
        'Publish a DMARC TXT record at _dmarc.yourdomain, start with p=none for monitoring, then move to quarantine or reject.',
      technicalDetail: `No v=DMARC1 record at ${host}.`,
      dnsRecords: [
        {
          type: 'TXT',
          host: '_dmarc',
          value: `v=DMARC1; p=none; rua=mailto:dmarc@${domain}`,
        },
      ],
    });
    return {
      category: buildCategoryResult('dmarc', 'fail', 'No DMARC record'),
      issues,
    };
  }

  const policy = parseDmarcTag(dmarc, 'p')?.toLowerCase() ?? 'none';
  const pct = parseDmarcTag(dmarc, 'pct');
  const rua = parseDmarcTag(dmarc, 'rua');
  const ruf = parseDmarcTag(dmarc, 'ruf');

  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let summary = `DMARC policy: ${policy}`;

  if (policy === 'none') {
    status = 'warn';
    summary = 'DMARC monitoring only (p=none)';
    issues.push({
      category: 'dmarc',
      severity: 'warn',
      title: 'Your emails may appear less trustworthy because domain protection is not fully enabled',
      explanation:
        'DMARC is present but set to p=none — receivers are told to accept failing messages. Impersonation is still possible.',
      recommendation:
        'After reviewing aggregate reports (rua), tighten policy to p=quarantine then p=reject.',
      technicalDetail: dmarc,
      dnsRecords: [
        {
          type: 'TXT',
          host: '_dmarc',
          value: `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@${domain}`,
        },
      ],
    });
  } else if (policy === 'quarantine') {
    issues.push({
      category: 'dmarc',
      severity: 'info',
      title: 'DMARC quarantine policy is active',
      explanation: 'Suspicious messages may be sent to spam — a solid middle step before full reject.',
      recommendation: 'Monitor reports, then consider p=reject when confident all legitimate mail passes SPF/DKIM.',
      technicalDetail: dmarc,
    });
  } else if (policy === 'reject') {
    issues.push({
      category: 'dmarc',
      severity: 'info',
      title: 'DMARC reject policy is active',
      explanation: 'Strongest protection — failing messages should be blocked by compliant receivers.',
      recommendation: 'Keep SPF and DKIM aligned for every sending service to avoid blocking real mail.',
      technicalDetail: dmarc,
    });
  } else {
    status = 'warn';
    summary = 'Unrecognized DMARC policy';
    issues.push({
      category: 'dmarc',
      severity: 'warn',
      title: 'DMARC policy value is unusual',
      explanation: 'Receivers may not interpret unknown policy values consistently.',
      recommendation: 'Use p=none, quarantine, or reject per the DMARC specification.',
      technicalDetail: dmarc,
    });
  }

  if (!rua && !ruf) {
    status = status === 'pass' ? 'warn' : status;
    issues.push({
      category: 'dmarc',
      severity: 'warn',
      title: 'No DMARC reporting addresses configured',
      explanation: 'Without rua/ruf you will not receive visibility into spoofing attempts or misconfiguration.',
      recommendation: `Add rua=mailto:dmarc-reports@${domain} (or a vendor address) to your DMARC record.`,
      technicalDetail: dmarc,
    });
  }

  if (pct && pct !== '100' && policy !== 'none') {
    status = status === 'pass' ? 'warn' : status;
    issues.push({
      category: 'dmarc',
      severity: 'warn',
      title: 'DMARC is only partially enforced',
      explanation: `pct=${pct} means only a fraction of failing messages receive the ${policy} policy.`,
      recommendation: 'Move pct to 100 once testing is complete.',
      technicalDetail: dmarc,
    });
  }

  return {
    category: buildCategoryResult('dmarc', status, summary),
    issues,
    policy,
  };
}
