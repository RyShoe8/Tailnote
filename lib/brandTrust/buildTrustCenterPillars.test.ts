import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TRUST_CENTER_PILLAR_ORDER,
  buildTrustCenterPillars,
  buildTrustCenterSummary,
  pillarCardCopyIsPlainEnglish,
  type TrustCenterBimiState,
} from './buildTrustCenterPillars';
import { TRUST_CENTER_LEARN } from './trustCenterCopy';
import type { SerializedEmailHealthScan } from '@/lib/email-health/serialize';

function baseScan(overrides: Partial<SerializedEmailHealthScan> = {}): SerializedEmailHealthScan {
  return {
    domain: 'example.com',
    domainSlug: 'example-com',
    score: 95,
    statusLabel: 'Excellent',
    categories: [
      { category: 'spf', status: 'pass', points: 20, maxPoints: 20, summary: 'ok' },
      { category: 'dkim', status: 'pass', points: 20, maxPoints: 20, summary: 'ok' },
      { category: 'dmarc', status: 'pass', points: 25, maxPoints: 25, summary: 'ok' },
      { category: 'mx', status: 'pass', points: 10, maxPoints: 10, summary: 'ok' },
      { category: 'tls', status: 'pass', points: 10, maxPoints: 10, summary: 'ok' },
      { category: 'https', status: 'pass', points: 5, maxPoints: 5, summary: 'ok' },
      { category: 'bimi', status: 'pass', points: 10, maxPoints: 10, summary: 'ok' },
    ],
    issues: [],
    scannedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

const bimiReady: TrustCenterBimiState = {
  canUseBimiLogoHosting: true,
  bimiLogoUrl: 'https://cdn.example.com/logo.svg',
  bimiSuggestedRecord: 'v=BIMI1; l=https://cdn.example.com/logo.svg',
};

describe('buildTrustCenterPillars', () => {
  it('returns pillars in fixed order', () => {
    const pillars = buildTrustCenterPillars(baseScan(), bimiReady);
    assert.deepEqual(
      pillars.map((p) => p.id),
      [...TRUST_CENTER_PILLAR_ORDER],
    );
  });

  it('marks all pillars confirmed when scan and BIMI are healthy', () => {
    const pillars = buildTrustCenterPillars(baseScan(), bimiReady);
    assert.ok(pillars.every((p) => p.status === 'confirmed'));
    assert.equal(
      buildTrustCenterSummary(pillars),
      "You're in great shape. Deliverability, security, and branding all look good for this domain.",
    );
  });

  it('flags deliverability when SPF fails', () => {
    const scan = baseScan({
      categories: baseScan().categories.map((c) =>
        c.category === 'spf' ? { ...c, status: 'fail', points: 0 } : c,
      ),
      issues: [
        {
          category: 'spf',
          severity: 'fail',
          title: 'SPF missing',
          explanation: 'Your domain does not list which servers may send mail for you.',
          recommendation: 'Add SPF',
        },
      ],
    });
    const pillars = buildTrustCenterPillars(scan, bimiReady);
    const deliverability = pillars.find((p) => p.id === 'deliverability');
    assert.equal(deliverability?.status, 'needs_action');
    assert.equal(
      deliverability?.headline,
      'Will your emails land in the inbox instead of spam?',
    );
  });

  it('computes summary with action count', () => {
    const scan = baseScan({
      categories: baseScan().categories.map((c) =>
        c.category === 'dkim' ? { ...c, status: 'fail', points: 0 } : c,
      ),
      issues: [
        {
          category: 'dkim',
          severity: 'fail',
          title: 'DKIM missing',
          explanation: 'Signing is not configured.',
          recommendation: 'Enable DKIM',
        },
      ],
    });
    const pillars = buildTrustCenterPillars(scan, bimiReady);
    assert.equal(
      buildTrustCenterSummary(pillars),
      "Most of this looks good. We found 1 thing worth fixing — we'll walk you through each one below.",
    );
  });

  it('keeps card copy free of acronyms', () => {
    const scan = baseScan({
      categories: baseScan().categories.map((c) =>
        c.category === 'spf' ? { ...c, status: 'fail', points: 0 } : c,
      ),
      issues: [
        {
          category: 'spf',
          severity: 'fail',
          title: 'SPF',
          explanation: 'Your domain does not list which servers may send mail for you.',
          recommendation: 'Fix',
        },
      ],
    });
    const pillars = buildTrustCenterPillars(scan, {
      canUseBimiLogoHosting: false,
      bimiLogoUrl: '',
      bimiSuggestedRecord: '',
    });
    for (const pillar of pillars) {
      assert.equal(pillarCardCopyIsPlainEnglish(pillar), true, pillar.id);
    }
  });

  it('confirmation pillars never include action buttons', () => {
    const pillars = buildTrustCenterPillars(baseScan(), bimiReady);
    for (const pillar of pillars) {
      if (pillar.status === 'confirmed') {
        assert.equal(pillar.action, undefined);
        assert.ok(pillar.confirmationLine);
      }
    }
  });

  it('provides non-empty structured learn sections per pillar', () => {
    const pillars = buildTrustCenterPillars(baseScan(), bimiReady);
    for (const pillar of pillars) {
      assert.ok(pillar.learnSections.length > 0, pillar.id);
      for (const section of pillar.learnSections) {
        assert.ok(section.title.length > 0);
        assert.ok(section.body.length > 0);
      }
    }
    const deliverability = pillars.find((p) => p.id === 'deliverability');
    const cardText = [deliverability?.headline, deliverability?.body, deliverability?.confirmationLine]
      .filter(Boolean)
      .join(' ');
    assert.doesNotMatch(cardText, /\bSPF\b/);
    assert.ok(
      TRUST_CENTER_LEARN.deliverability.some((s) => s.title.includes('SPF')),
      'SPF should appear only in learn sections',
    );
  });
});
