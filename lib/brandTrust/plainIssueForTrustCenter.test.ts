import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { plainIssueForTrustCenter } from './plainIssueForTrustCenter';
import type { DomainIssue } from '@/lib/email-health/types';

function issue(overrides: Partial<DomainIssue> & Pick<DomainIssue, 'category'>): DomainIssue {
  return {
    severity: 'fail',
    title: '',
    explanation: '',
    recommendation: '',
    ...overrides,
  };
}

describe('plainIssueForTrustCenter', () => {
  it('paraphrases missing SPF without acronyms on card surfaces', () => {
    const plain = plainIssueForTrustCenter(
      issue({
        category: 'spf',
        title: 'SPF missing',
        explanation: 'No SPF record found for this domain.',
        recommendation: 'Add an SPF TXT record.',
      }),
    );
    assert.match(plain.summary, /sender policy|allowed to send/i);
    assert.doesNotMatch(plain.summary, /\bSPF\b/);
    assert.doesNotMatch(plain.nextStep, /\bSPF\b/);
  });

  it('paraphrases missing DKIM', () => {
    const plain = plainIssueForTrustCenter(
      issue({
        category: 'dkim',
        title: 'DKIM not found',
        explanation: 'No DKIM records were found.',
        recommendation: 'Enable DKIM in your provider.',
      }),
    );
    assert.match(plain.summary, /signing/i);
    assert.doesNotMatch(plain.summary, /\bDKIM\b/);
  });

  it('paraphrases missing DMARC', () => {
    const plain = plainIssueForTrustCenter(
      issue({
        category: 'dmarc',
        title: 'DMARC missing',
        explanation: 'No DMARC record at _dmarc.',
        recommendation: 'Publish a DMARC policy.',
      }),
    );
    assert.match(plain.summary, /impersonation policy/i);
    assert.doesNotMatch(plain.summary, /\bDMARC\b/);
  });
});
