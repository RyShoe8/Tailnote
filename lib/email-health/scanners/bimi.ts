import { parseDmarcRecord } from '@/lib/email-health/dmarc';
import { analyzeBimi, mapBimiResultToScanOutput } from '@/lib/email-health/bimi';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

export type BimiScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
  bimiDetail?: ReturnType<typeof mapBimiResultToScanOutput>['bimiResult'];
};

export type ScanBimiOptions = {
  dmarcRecord?: string;
  expectedLogoUrl?: string;
};

export async function scanBimi(domain: string, options?: ScanBimiOptions): Promise<BimiScanResult> {
  const dmarcParsed = options?.dmarcRecord
    ? parseDmarcRecord(options.dmarcRecord)
    : undefined;

  const result = await analyzeBimi(domain, {
    dmarcParsed,
    expectedLogoUrl: options?.expectedLogoUrl,
  });
  const mapped = mapBimiResultToScanOutput(result);

  return {
    category: mapped.category,
    issues: mapped.issues,
    bimiDetail: mapped.bimiResult,
  };
}
