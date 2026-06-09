import { fetchDmarcRecord, parseDmarcRecord, parseDmarcTag } from '@/lib/email-health/dmarc';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

export type DmarcScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
  policy?: string;
  record?: string;
};

export async function scanDmarc(domain: string): Promise<DmarcScanResult> {
  const issues: DomainIssue[] = [];
  const host = `_dmarc.${domain}`;
  const parsed = await fetchDmarcRecord(domain);
  const dmarc = parsed?.record;

  if (!dmarc) {
    issues.push({
      category: 'dmarc',
      severity: 'fail',
      title: 'Domain protection (DMARC) is not enabled',
      explanation:
        'Without DMARC, your domain is easier to impersonate — phishing emails may look like they came from you.',
      recommendation:
        'Publish a DMARC TXT record at _dmarc.yourdomain, start with p=none for monitoring, then move to quarantine or reject.',
      stepsToPass: [
        'In DNS, create a TXT record at host _dmarc (full name: _dmarc.yourdomain).',
        'Add the DNS record on this card starting with v=DMARC1; p=none and a rua= reporting address.',
        'Wait 2–4 weeks while reviewing aggregate reports for spoofing and misconfigurations.',
        'Change p=none to p=quarantine, then p=reject when legitimate mail passes SPF/DKIM.',
        'Rescan after each policy change.',
      ],
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

  const policy = parsed?.policy ?? 'none';
  const pct = parsed?.pct;
  const rua = parsed?.rua;
  const ruf = parsed?.ruf;

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
      stepsToPass: [
        'Confirm rua= is set so you receive DMARC aggregate reports (add the DNS record on this card if missing).',
        'Review reports for 2–4 weeks and fix any SPF/DKIM failures from legitimate senders.',
        'Update the record to p=quarantine; pct=100; keep rua= for monitoring.',
        'After a stable period with no false positives, change p=reject for full protection.',
        'Rescan after each DNS update.',
      ],
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
      stepsToPass: [
        'Edit the _dmarc TXT record and set p= to none, quarantine, or reject only.',
        'Include v=DMARC1; at the start and valid rua= for reporting.',
        'Remove unknown or experimental tags until you understand their effect.',
        'Rescan after saving DNS.',
      ],
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
      stepsToPass: [
        'Edit your existing _dmarc TXT record (do not create a second DMARC record).',
        'Add rua=mailto:you@yourdomain.com or a DMARC report inbox from your provider.',
        'Optionally add ruf= for forensic reports if your team can handle the volume.',
        'Save DNS and confirm reports arrive within a few days, then rescan.',
      ],
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
      stepsToPass: [
        'Confirm legitimate mail passes SPF and DKIM in DMARC reports.',
        'Edit the _dmarc record and set pct=100 (or remove pct to default to 100).',
        'Keep p=quarantine or p=reject as intended.',
        'Rescan after DNS propagation.',
      ],
      technicalDetail: dmarc,
    });
  }

  return {
    category: buildCategoryResult('dmarc', status, summary),
    issues,
    policy,
    record: dmarc,
  };
}

export { parseDmarcRecord, parseDmarcTag, fetchDmarcRecord };
