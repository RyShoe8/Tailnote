import { parseDmarcTag } from '@/lib/email-health/dmarc';
import type { DnsRecordSuggestion } from '@/lib/email-health/types';

function joinDmarcTags(record: string, addition: string): string {
  const base = record.replace(/;\s*$/, '').trim();
  return `${base}; ${addition}`;
}

/** Add rua= reporting to an existing DMARC record when missing. */
export function suggestDmarcAddRua(currentRecord: string, domain: string): DnsRecordSuggestion | null {
  if (parseDmarcTag(currentRecord, 'rua')) return null;
  return {
    type: 'TXT',
    host: '_dmarc',
    value: joinDmarcTags(currentRecord, `rua=mailto:dmarc@${domain}`),
    note: 'Add a reporting address so you receive visibility into spoofing and misconfiguration.',
  };
}

/** Set pct=100 on an existing DMARC record when partially enforced. */
export function suggestDmarcPct100(currentRecord: string): DnsRecordSuggestion | null {
  const pct = parseDmarcTag(currentRecord, 'pct');
  if (!pct || pct === '100') return null;
  const value = /pct\s*=/i.test(currentRecord)
    ? currentRecord.replace(/pct\s*=\s*[^;]+/i, 'pct=100')
    : joinDmarcTags(currentRecord, 'pct=100');
  return {
    type: 'TXT',
    host: '_dmarc',
    value: value.trim(),
    note: 'Set pct=100 so the policy applies to every failing message.',
  };
}
