import { PAID_BIMI_HOSTING_CTA } from '@/lib/email-health/bimiCopy';
import {
  exampleBimiHost,
  exampleBimiRecordValue,
  missingBimiTechnicalDetail,
} from '@/lib/email-health/bimiDnsExample';
import {
  dkimProviderCallout,
  getDkimSetupGuide,
  isMissingDkimIssue,
} from '@/lib/email-health/dkimSetupGuide';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';
import type { DomainIssue } from '@/lib/email-health/types';

const MISSING_BIMI_TITLE = 'Brand logo setup is missing';

const MISSING_BIMI_EXPLANATION =
  'Your domain is not yet set up to show a verified brand logo in supporting inboxes. Publishing a BIMI record alone is not enough — you also need a valid BIMI SVG hosted over HTTPS.';

function enrichMissingBimiIssue(issue: DomainIssue, domain: string): DomainIssue {
  if (issue.category !== 'bimi' || issue.title !== MISSING_BIMI_TITLE) {
    return issue;
  }

  const needsEnrichment = !issue.dnsRecords?.length || !issue.callout;

  if (!needsEnrichment) {
    return issue;
  }

  return {
    ...issue,
    explanation: MISSING_BIMI_EXPLANATION,
    technicalDetail: missingBimiTechnicalDetail(domain),
    dnsRecords: issue.dnsRecords?.length
      ? issue.dnsRecords
      : [
          {
            type: 'TXT',
            host: exampleBimiHost(domain),
            value: exampleBimiRecordValue(domain),
            note: 'placeholder.svg is an example only — inbox providers require a valid, square BIMI SVG hosted over HTTPS.',
            exampleOnly: true,
          },
        ],
    callout: issue.callout ?? PAID_BIMI_HOSTING_CTA,
  };
}

function enrichMissingDkimIssue(issue: DomainIssue, mailProvider?: string): DomainIssue {
  if (!isMissingDkimIssue(issue)) {
    return issue;
  }

  const guide = getDkimSetupGuide(mailProvider);
  const callout = dkimProviderCallout(mailProvider);

  return {
    ...issue,
    stepsToPass: guide.steps,
    dnsRecords: undefined,
    callout: callout ?? issue.callout,
  };
}

function enrichIssueForDisplay(
  issue: DomainIssue,
  scan: SerializedEmailHealthScan,
): DomainIssue {
  let enriched = enrichMissingBimiIssue(issue, scan.domain);
  enriched = enrichMissingDkimIssue(enriched, scan.mailProvider);
  return enriched;
}

export function enrichScanForDisplay(scan: SerializedEmailHealthScan): SerializedEmailHealthScan {
  return {
    ...scan,
    issues: scan.issues.map((issue) => enrichIssueForDisplay(issue, scan)),
  };
}
