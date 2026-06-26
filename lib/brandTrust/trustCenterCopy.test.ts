import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  TRUST_CENTER_SCAN_EXPLAINER,
  TRUST_CENTER_SCAN_EXPLAINER_COMPACT,
} from './trustCenterCopy';

describe('trustCenterCopy', () => {
  it('every scan explainer pillar has checks with non-empty solutions', () => {
    assert.ok(TRUST_CENTER_SCAN_EXPLAINER.length > 0);
    for (const pillar of TRUST_CENTER_SCAN_EXPLAINER) {
      assert.ok(pillar.checks.length > 0, `${pillar.id} has no checks`);
      for (const check of pillar.checks) {
        assert.ok(check.label.trim().length > 0, `${pillar.id}: empty check label`);
        assert.ok(check.solution.trim().length > 0, `${pillar.id}: empty solution for "${check.label}"`);
      }
    }
  });

  it('compact explainer is non-empty plain text', () => {
    assert.ok(TRUST_CENTER_SCAN_EXPLAINER_COMPACT.trim().length > 0);
  });
});
