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
    assert.match(plain.nextStep, /steps below/i);
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

  it('uses domain-aware next step when a DNS fix record is present', () => {
    const plain = plainIssueForTrustCenter(
      issue({
        category: 'spf',
        title: 'SPF uses softfail (~all)',
        explanation: 'Softfail is acceptable for many teams.',
        recommendation: 'Consider -all.',
        technicalDetail: 'v=spf1 include:_spf.google.com ~all',
        dnsRecords: [
          {
            type: 'TXT',
            host: '@',
            value: 'v=spf1 include:_spf.google.com -all',
          },
        ],
      }),
      { domain: 'acme.com' },
    );
    assert.match(plain.nextStep, /acme\.com/);
    assert.match(plain.nextStep, /replace it with the value below/i);
  });

  it('paraphrases multiple SPF records', () => {
    const plain = plainIssueForTrustCenter(
      issue({
        category: 'spf',
        title: 'Multiple SPF records detected',
        explanation:
          'Having more than one SPF record breaks authentication — many providers will ignore all of them.',
        recommendation: 'Merge allowed senders into a single SPF TXT record and remove duplicates.',
      }),
    );
    assert.match(plain.summary, /more than one sender policy/i);
    assert.match(plain.nextStep, /merge/i);
  });

  it('paraphrases BIMI DNS mismatch', () => {
    const plain = plainIssueForTrustCenter(
      issue({
        category: 'bimi',
        title: 'Inbox-logo DNS points to a different file',
        explanation:
          'Your inbox-logo DNS record points to a different logo URL than your current Tailnote-hosted file.',
        recommendation: 'Update the l= value in your default._bimi TXT record.',
        dnsRecords: [
          {
            type: 'TXT',
            host: 'default._bimi',
            value: 'v=BIMI1; l=https://cdn.example.com/bimi-logo.svg',
          },
        ],
      }),
      { domain: 'acme.com' },
    );
    assert.match(plain.summary, /different file/i);
    assert.match(plain.nextStep, /default\._bimi\.acme\.com/i);
  });
});
