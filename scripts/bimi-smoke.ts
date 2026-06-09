/**
 * Smoke test for BIMI analysis helpers (no network/DNS in CI-safe paths).
 */
import assert from 'node:assert/strict';
import { getDmarcEligibilityForBimi, parseDmarcRecord } from '../lib/email-health/dmarc';
import { vmcStatusFromResult } from '../lib/email-health/bimiTypes';
import type { BIMIResult } from '../lib/email-health/bimiTypes';

const none = getDmarcEligibilityForBimi(parseDmarcRecord('v=DMARC1; p=none; rua=mailto:a@b.com'));
assert.equal(none.eligibleForBimi, false);

const reject = getDmarcEligibilityForBimi(parseDmarcRecord('v=DMARC1; p=reject; pct=100'));
assert.equal(reject.eligibleForBimi, true);

const mockResult: BIMIResult = {
  domain: 'example.com',
  status: 'warn',
  dmarcStatus: reject,
  bimiRecordStatus: { status: 'fail', tags: {}, summary: 'missing' },
  svgStatus: { status: 'unknown', summary: '', issues: [] },
  certificateStatus: {
    status: 'warn',
    classification: 'none',
    confidence: 'high',
    summary: 'none',
  },
  providerReadiness: { gmail: 'fail', yahoo: 'fail', fastmail: 'fail' },
  issues: [],
  recommendations: [],
  implementationSteps: [],
};

assert.equal(vmcStatusFromResult(mockResult), 'fail');

process.stdout.write('bimi-smoke: ok\n');
