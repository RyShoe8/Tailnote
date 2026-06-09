import { flattenTxt, resolveTxtRecords } from '@/lib/email-health/dns';
import type { CheckStatus } from '@/lib/email-health/types';

export type DmarcParsed = {
  record?: string;
  policy?: string;
  pct?: string;
  rua?: string;
  ruf?: string;
};

export function parseDmarcTag(record: string, tag: string): string | undefined {
  const match = record.match(new RegExp(`(?:^|;)\\s*${tag}\\s*=\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim();
}

export function parseDmarcRecord(record: string): DmarcParsed {
  return {
    record,
    policy: parseDmarcTag(record, 'p')?.toLowerCase(),
    pct: parseDmarcTag(record, 'pct'),
    rua: parseDmarcTag(record, 'rua'),
    ruf: parseDmarcTag(record, 'ruf'),
  };
}

export async function fetchDmarcRecord(domain: string): Promise<DmarcParsed | null> {
  const host = `_dmarc.${domain}`;
  const txt = flattenTxt(await resolveTxtRecords(host));
  const dmarc = txt.find((r) => r.toLowerCase().startsWith('v=dmarc1'));
  if (!dmarc) return null;
  return parseDmarcRecord(dmarc);
}

export type DmarcBimiEligibility = {
  status: CheckStatus | 'unknown';
  policy?: string;
  pct?: string;
  eligibleForBimi: boolean;
  summary: string;
  record?: string;
};

export function getDmarcEligibilityForBimi(parsed: DmarcParsed | null): DmarcBimiEligibility {
  if (!parsed?.record) {
    return {
      status: 'fail',
      eligibleForBimi: false,
      summary: 'Email protection (DMARC) is not set up yet',
    };
  }

  const policy = parsed.policy ?? 'none';
  const pct = parsed.pct ?? '100';

  if (policy === 'none') {
    return {
      status: 'fail',
      policy,
      pct,
      eligibleForBimi: false,
      record: parsed.record,
      summary: 'BIMI needs stronger email protection before mailbox providers will trust your logo',
    };
  }

  if (policy !== 'quarantine' && policy !== 'reject') {
    return {
      status: 'warn',
      policy,
      pct,
      eligibleForBimi: false,
      record: parsed.record,
      summary: 'Your DMARC policy is unusual — most providers expect quarantine or reject for BIMI',
    };
  }

  if (pct !== '100') {
    return {
      status: 'warn',
      policy,
      pct,
      eligibleForBimi: true,
      record: parsed.record,
      summary: 'DMARC is enforced, but only for part of your mail (pct is below 100)',
    };
  }

  return {
    status: 'pass',
    policy,
    pct,
    eligibleForBimi: true,
    record: parsed.record,
    summary: 'Your domain meets the DMARC requirement for BIMI',
  };
}
