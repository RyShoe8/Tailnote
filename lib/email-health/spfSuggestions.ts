import type { DnsRecordSuggestion } from '@/lib/email-health/types';

function normalizeSpf(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Derive a copy-paste SPF TXT fix from the domain's current record. */
export function suggestSpfTxtFix(currentRecord: string): DnsRecordSuggestion | null {
  const trimmed = currentRecord.trim();
  if (!trimmed.toLowerCase().startsWith('v=spf1')) return null;

  const lower = trimmed.toLowerCase();

  if (lower.includes('+all')) {
    return {
      type: 'TXT',
      host: '@',
      value: normalizeSpf(trimmed.replace(/\s*\+all\s*/i, ' -all')),
      note: 'Replace +all (allows anyone) with -all so only listed servers may send.',
    };
  }

  if (lower.includes('?all')) {
    return {
      type: 'TXT',
      host: '@',
      value: normalizeSpf(trimmed.replace(/\s*\?all\s*/i, ' ~all')),
      note: 'Replace ?all (neutral) with ~all so unauthorized senders are flagged.',
    };
  }

  if (lower.includes('~all')) {
    return {
      type: 'TXT',
      host: '@',
      value: normalizeSpf(trimmed.replace(/\s*~all\s*/i, ' -all')),
      note: 'Change ~all (soft-fail) to -all so providers reject senders not in your list.',
    };
  }

  if (!lower.includes('-all') && !lower.includes('~all') && !lower.includes('?all')) {
    return {
      type: 'TXT',
      host: '@',
      value: normalizeSpf(`${trimmed} ~all`),
      note: 'Add ~all at the end so unauthorized senders are flagged.',
    };
  }

  return null;
}
