import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildBimiLogoSummary, bimiLogoDisplayUrl } from './bimiLogoSummary';
import type { BIMIResult } from '@/lib/email-health/bimiTypes';

const baseBimiDetail = (): BIMIResult => ({
  domain: 'example.com',
  status: 'pass',
  dmarcStatus: {
    status: 'pass',
    eligibleForBimi: true,
    summary: 'ok',
  },
  bimiRecordStatus: {
    status: 'pass',
    tags: { l: 'https://cdn.example.com/logo.svg' },
    summary: 'ok',
  },
  svgStatus: {
    status: 'pass',
    url: 'https://cdn.example.com/logo.svg',
    width: 256,
    height: 256,
    byteSize: 12000,
    summary: 'Valid SVG',
    issues: [],
  },
  certificateStatus: {
    status: 'warn',
    classification: 'self_asserted',
    confidence: 'high',
    summary: 'Self-asserted',
  },
  providerReadiness: { gmail: 'fail', yahoo: 'pass', fastmail: 'pass' },
  issues: [],
  recommendations: [],
  implementationSteps: [],
});

describe('buildBimiLogoSummary', () => {
  it('prefers Tailnote-hosted URL over DNS l= tag', () => {
    const summary = buildBimiLogoSummary({
      bimiLogoUrl: 'https://tailnote.example/logo.svg',
      bimiDetail: baseBimiDetail(),
    });
    assert.equal(summary.previewUrl, 'https://tailnote.example/logo.svg');
    assert.equal(summary.hostedWithTailnote, true);
  });

  it('falls back to DNS l= when no hosted URL', () => {
    const summary = buildBimiLogoSummary({
      bimiDetail: baseBimiDetail(),
    });
    assert.equal(summary.previewUrl, 'https://cdn.example.com/logo.svg');
    assert.equal(summary.hostedWithTailnote, false);
  });

  it('detects DNS mismatch between hosted and published l=', () => {
    const summary = buildBimiLogoSummary({
      bimiLogoUrl: 'https://tailnote.example/new.svg',
      bimiDetail: baseBimiDetail(),
    });
    assert.equal(summary.dnsMismatch, true);
    assert.equal(summary.dnsLogoUrl, 'https://cdn.example.com/logo.svg');
  });

  it('reports specs and pass state from svgStatus', () => {
    const summary = buildBimiLogoSummary({
      bimiLogoUrl: 'https://tailnote.example/logo.svg',
      bimiDetail: baseBimiDetail(),
      bimiLogoUploadedAt: '2025-01-15T12:00:00.000Z',
    });
    assert.equal(summary.specs.width, 256);
    assert.equal(summary.specs.height, 256);
    assert.equal(summary.specs.format, 'SVG');
    assert.ok(summary.specs.byteSizeKb?.includes('KB'));
    assert.equal(summary.specsPass, true);
    assert.ok(summary.uploadedAt);
  });

  it('merges svg issues and recommendations into improvements', () => {
    const detail = baseBimiDetail();
    detail.svgStatus.issues = ['Logo should be square'];
    detail.recommendations = ['Publish BIMI DNS record'];
    const summary = buildBimiLogoSummary({
      bimiLogoUrl: 'https://tailnote.example/logo.svg',
      bimiDetail: detail,
    });
    assert.ok(summary.improvements.includes('Logo should be square'));
    assert.ok(summary.improvements.includes('Publish BIMI DNS record'));
  });

  it('bimiLogoDisplayUrl appends cache-bust query from uploadedAt', () => {
    const url = 'https://tailnote.example/logo.svg';
    const at = '2025-01-15T12:00:00.000Z';
    const display = bimiLogoDisplayUrl(url, at);
    assert.equal(display, `${url}?v=${new Date(at).getTime()}`);
  });

  it('buildBimiLogoSummary exposes previewDisplayUrl for img tags', () => {
    const summary = buildBimiLogoSummary({
      bimiLogoUrl: 'https://tailnote.example/logo.svg',
      bimiLogoUploadedAt: '2025-01-15T12:00:00.000Z',
    });
    assert.equal(summary.previewUrl, 'https://tailnote.example/logo.svg');
    assert.match(summary.previewDisplayUrl ?? '', /\?v=\d+$/);
  });
});
