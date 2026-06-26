import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { enrichScanForDisplay } from './enrichScanForDisplay';
import { MISSING_DKIM_TITLE } from './dkimSetupGuide';
import type { SerializedEmailHealthScan } from './serialize';
import type { DomainIssue } from './types';

function baseScan(overrides: Partial<SerializedEmailHealthScan> = {}): SerializedEmailHealthScan {
  return {
    domain: 'example.com',
    domainSlug: 'example-com',
    score: 70,
    statusLabel: 'Needs Attention',
    categories: [],
    issues: [],
    scannedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function missingDkimIssue(): DomainIssue {
  return {
    category: 'dkim',
    severity: 'fail',
    title: MISSING_DKIM_TITLE,
    explanation: 'No signing keys found.',
    recommendation: 'Enable DKIM.',
    stepsToPass: ['Generic step one.'],
    dnsRecords: [
      {
        type: 'TXT',
        host: 'selector1._domainkey',
        value: '(paste the DKIM TXT value from your mail provider)',
      },
    ],
  };
}

describe('enrichScanForDisplay', () => {
  it('replaces missing DKIM issue with Google-specific steps when mailProvider is Google Workspace', () => {
    const scan = baseScan({
      mailProvider: 'Google Workspace',
      issues: [missingDkimIssue()],
    });
    const enriched = enrichScanForDisplay(scan);
    const dkim = enriched.issues.find((i) => i.category === 'dkim');
    assert.ok(dkim);
    assert.ok(dkim!.stepsToPass!.some((s) => s.includes('admin.google.com')));
    assert.equal(dkim!.dnsRecords, undefined);
    assert.ok(dkim!.callout?.includes('Google Workspace'));
  });

  it('uses generic steps when mailProvider is unknown', () => {
    const scan = baseScan({
      issues: [missingDkimIssue()],
    });
    const enriched = enrichScanForDisplay(scan);
    const dkim = enriched.issues.find((i) => i.category === 'dkim');
    assert.ok(dkim!.stepsToPass!.length >= 4);
    assert.equal(dkim!.dnsRecords, undefined);
    assert.equal(dkim!.callout, undefined);
  });

  it('does not alter non-DKIM issues', () => {
    const dmarc: DomainIssue = {
      category: 'dmarc',
      severity: 'fail',
      title: 'No DMARC',
      explanation: 'Missing',
      recommendation: 'Add DMARC',
    };
    const scan = baseScan({ issues: [dmarc] });
    const enriched = enrichScanForDisplay(scan);
    assert.equal(enriched.issues[0], dmarc);
  });
});
