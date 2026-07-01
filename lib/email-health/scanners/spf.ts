import { flattenTxt, resolveTxtRecords } from '@/lib/email-health/dns';
import { mergeSpfRecords } from '@/lib/email-health/mergeSpfRecords';
import { buildCategoryResult } from '@/lib/email-health/scoring';
import { suggestSpfTxtFix } from '@/lib/email-health/spfSuggestions';
import type { CategoryResult, DomainIssue } from '@/lib/email-health/types';

export type SpfScanResult = {
  category: CategoryResult;
  issues: DomainIssue[];
};

function spfDnsFix(record: string) {
  const fix = suggestSpfTxtFix(record);
  return fix ? [fix] : undefined;
}

export async function scanSpf(domain: string): Promise<SpfScanResult> {
  const issues: DomainIssue[] = [];
  const txt = flattenTxt(await resolveTxtRecords(domain));
  const spfRecords = txt.filter((r) => r.toLowerCase().startsWith('v=spf1'));

  if (spfRecords.length === 0) {
    issues.push({
      category: 'spf',
      severity: 'fail',
      title: 'Your domain is missing sender authorization (SPF)',
      explanation:
        'Without SPF, receiving mail servers may treat messages from your domain as less trustworthy or reject them.',
      recommendation:
        'Add an SPF TXT record at your domain root that lists the services allowed to send email on your behalf.',
      stepsToPass: [
        'List every service that sends mail for your domain (email host, CRM, marketing tools).',
        'In your DNS provider, add one TXT record at @ (root) — not multiple SPF records.',
        'Add the DNS record on this card or use your provider’s SPF generator, including each sender with include:.',
        'End the record with ~all or -all, save, wait up to 48 hours, then rescan.',
      ],
      technicalDetail: `No TXT record starting with v=spf1 found for ${domain}.`,
      dnsRecords: [
        {
          type: 'TXT',
          host: '@',
          value: 'v=spf1 include:_spf.google.com ~all',
        },
      ],
    });
    return {
      category: buildCategoryResult('spf', 'fail', 'No SPF record found'),
      issues,
    };
  }

  if (spfRecords.length > 1) {
    const merged = mergeSpfRecords(spfRecords);
    issues.push({
      category: 'spf',
      severity: 'fail',
      title: 'Multiple SPF records detected',
      explanation:
        'Having more than one SPF record breaks authentication — many providers will ignore all of them.',
      recommendation: 'Merge allowed senders into a single SPF TXT record and remove duplicates.',
      stepsToPass: [
        'Open DNS and list every TXT record that starts with v=spf1.',
        'Combine all include: and ip4:/ip6: mechanisms into one v=spf1 record.',
        'Delete the extra SPF TXT records so only one remains at @.',
        'Keep a single ~all or -all at the end, then rescan.',
      ],
      technicalDetail: `Found ${spfRecords.length} SPF records: ${spfRecords.join(' | ')}`,
      foundRecords: [...spfRecords],
      dnsRecords: [
        {
          type: 'TXT',
          host: '@',
          value: merged,
          note: 'Replace all SPF TXT records at @ with this single merged record.',
        },
      ],
    });
    return {
      category: buildCategoryResult('spf', 'fail', 'Multiple SPF records detected'),
      issues,
    };
  }

  const spf = spfRecords[0]!;
  const lower = spf.toLowerCase();
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let summary = 'SPF record is configured';

  if (lower.includes('+all')) {
    status = 'fail';
    summary = 'SPF allows any sender (+all)';
    issues.push({
      category: 'spf',
      severity: 'fail',
      title: 'SPF is too permissive',
      explanation: 'An SPF record with +all tells the world anyone may send as your domain — a common spoofing risk.',
      recommendation: 'Use ~all (softfail) or -all (hardfail) after listing only your real sending services.',
      stepsToPass: [
        'Edit your SPF TXT record and remove +all completely.',
        'Add include: entries for each legitimate sender (Google, Microsoft, CRM, etc.).',
        'End the record with ~all while testing, or -all when every sender is listed.',
        'Save DNS and rescan after propagation.',
      ],
      technicalDetail: spf,
      dnsRecords: spfDnsFix(spf),
    });
  } else if (lower.includes('?all')) {
    status = 'warn';
    summary = 'SPF uses neutral policy';
    issues.push({
      category: 'spf',
      severity: 'warn',
      title: 'SPF policy is neutral',
      explanation: 'A neutral (?all) policy does little to protect your domain from impersonation.',
      recommendation: 'Switch to ~all or -all once all legitimate senders are listed in the record.',
      stepsToPass: [
        'Audit every service that sends email as your domain.',
        'Add missing include: or ip4: mechanisms to the SPF record.',
        'Replace ?all with ~all (testing) or -all (strict enforcement).',
        'Rescan after DNS updates.',
      ],
      technicalDetail: spf,
      dnsRecords: spfDnsFix(spf),
    });
  } else if (lower.includes('~all')) {
    status = 'warn';
    summary = 'SPF uses softfail';
    issues.push({
      category: 'spf',
      severity: 'warn',
      title: 'SPF uses softfail (~all)',
      explanation:
        'Softfail is acceptable for many teams, but stricter -all is stronger once you are confident every sender is listed.',
      recommendation: 'Review includes (Google, Microsoft, CRM, etc.) then consider upgrading to -all.',
      stepsToPass: [
        'Confirm every sending service appears in the SPF record (check provider docs for include: values).',
        'Send test mail from each tool and verify it passes SPF in headers.',
        'When confident nothing is missing, change ~all to -all at the end of the record.',
        'Rescan after the change propagates.',
      ],
      technicalDetail: spf,
      dnsRecords: spfDnsFix(spf),
    });
  } else if (!lower.includes('-all') && !lower.includes('~all')) {
    status = 'warn';
    summary = 'SPF missing explicit all mechanism';
    issues.push({
      category: 'spf',
      severity: 'warn',
      title: 'SPF may be incomplete',
      explanation: 'The record does not end with a clear ~all or -all policy, which can confuse receivers.',
      recommendation: 'End your SPF record with ~all or -all after all include: mechanisms.',
      stepsToPass: [
        'Open the SPF TXT record in DNS.',
        'Ensure every authorized sender is listed with include: or ip4:/ip6: before the policy.',
        'Add ~all or -all as the final mechanism (after all includes).',
        'Save and rescan.',
      ],
      technicalDetail: spf,
      dnsRecords: spfDnsFix(spf),
    });
  }

  if ((spf.match(/include:/gi) ?? []).length > 10) {
    status = status === 'pass' ? 'warn' : status;
    issues.push({
      category: 'spf',
      severity: 'warn',
      title: 'SPF has many nested includes',
      explanation: 'Long include chains can exceed DNS lookup limits and cause SPF to fail unpredictably.',
      recommendation: 'Consolidate sending services or use SPF flattening from your DNS provider.',
      stepsToPass: [
        'Count include: mechanisms — more than 10 DNS lookups often breaks SPF.',
        'Remove unused or duplicate includes from the record.',
        'Use your DNS provider’s SPF flattening tool if available, or merge IPs where possible.',
        'Rescan and verify SPF passes in a test message header.',
      ],
      technicalDetail: spf,
    });
  }

  return {
    category: buildCategoryResult('spf', status, summary),
    issues,
  };
}
