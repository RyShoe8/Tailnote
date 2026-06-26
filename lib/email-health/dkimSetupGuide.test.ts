import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MISSING_DKIM_TITLE,
  getDkimSetupGuide,
  isMissingDkimIssue,
} from './dkimSetupGuide';

const PROVIDERS = [
  'Google Workspace',
  'Microsoft 365',
  'Zoho Mail',
  'Fastmail',
  'Proton Mail',
  'Custom / other',
] as const;

describe('dkimSetupGuide', () => {
  it('returns at least four steps for each known provider', () => {
    for (const provider of PROVIDERS) {
      const guide = getDkimSetupGuide(provider);
      assert.ok(guide.steps.length >= 4, provider);
      for (const step of guide.steps) {
        assert.ok(step.trim().length > 0, `${provider}: empty step`);
      }
    }
  });

  it('returns generic fallback for unknown provider', () => {
    const guide = getDkimSetupGuide('Some Unknown Host');
    assert.equal(guide.providerLabel, 'your email provider');
    assert.ok(guide.steps.length >= 4);
    assert.ok(guide.recordNote?.includes('provider'));
  });

  it('Google guide mentions admin.google.com', () => {
    const guide = getDkimSetupGuide('Google Workspace');
    assert.ok(guide.steps.some((s) => s.includes('admin.google.com')));
  });

  it('Microsoft guide mentions CNAME records', () => {
    const guide = getDkimSetupGuide('Microsoft 365');
    assert.ok(guide.steps.some((s) => s.toLowerCase().includes('cname')));
  });

  it('identifies missing DKIM issue by title', () => {
    assert.equal(
      isMissingDkimIssue({
        category: 'dkim',
        severity: 'fail',
        title: MISSING_DKIM_TITLE,
      }),
      true,
    );
    assert.equal(
      isMissingDkimIssue({
        category: 'dkim',
        severity: 'warn',
        title: MISSING_DKIM_TITLE,
      }),
      false,
    );
  });
});
