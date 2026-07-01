const POLICY_RANK: Record<string, number> = {
  '+all': 0,
  '?all': 1,
  '~all': 2,
  '-all': 3,
};

function normalizeSpfRecord(record: string): string {
  return record.replace(/\s+/g, ' ').trim();
}

function pickStrictestPolicy(current: string, candidate: string): string {
  const curRank = POLICY_RANK[current.toLowerCase()] ?? 1;
  const nextRank = POLICY_RANK[candidate.toLowerCase()] ?? 1;
  return nextRank > curRank ? candidate.toLowerCase() : current;
}

/** Merge multiple v=spf1 TXT values into one valid record. */
export function mergeSpfRecords(records: readonly string[]): string {
  const mechanisms: string[] = [];
  const seen = new Set<string>();
  let policy = '~all';

  for (const raw of records) {
    const record = normalizeSpfRecord(raw);
    if (!record.toLowerCase().startsWith('v=spf1')) continue;
    const parts = record.split(/\s+/).slice(1);
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (['+all', '-all', '~all', '?all'].includes(lower)) {
        policy = pickStrictestPolicy(policy, lower);
        continue;
      }
      const key = lower;
      if (!seen.has(key)) {
        seen.add(key);
        mechanisms.push(part);
      }
    }
  }

  return normalizeSpfRecord(`v=spf1 ${mechanisms.join(' ')} ${policy}`);
}
