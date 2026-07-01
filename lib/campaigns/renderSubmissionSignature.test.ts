import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  contentBlocksFromSubmission,
  submissionBrandFromSnapshot,
  submissionProfileFromSnapshot,
} from './renderSubmissionSignature';

describe('renderSubmissionSignature helpers', () => {
  it('contentBlocksFromSubmission uses stored blocks when present', () => {
    const blocks = [{ type: 'quote' as const, quoteSource: 'custom' as const, quoteText: 'Hi', enabled: true }];
    const result = contentBlocksFromSubmission({ contentBlocks: blocks, content: { quote: 'ignored' } });
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'quote');
  });

  it('contentBlocksFromSubmission falls back to content.quote', () => {
    const result = contentBlocksFromSubmission({
      content: { quote: 'Build something great' },
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].type, 'quote');
    assert.equal((result[0] as { quoteText?: string }).quoteText, 'Build something great');
  });

  it('submissionProfileFromSnapshot clears hidden fields', () => {
    const profile = submissionProfileFromSnapshot({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      hiddenFields: ['email'],
    });
    assert.equal(profile.firstName, 'Ada');
    assert.equal(profile.email, '');
  });

  it('submissionBrandFromSnapshot clears hidden social links', () => {
    const brand = submissionBrandFromSnapshot({
      companyName: 'Acme',
      website: 'https://acme.test',
      logoUrl: 'https://acme.test/logo.png',
      socialProfiles: { linkedin: 'https://linkedin.com/in/acme' },
      hiddenFields: ['socialLinks'],
    });
    assert.deepEqual(brand.socialLinks, {});
    assert.equal(brand.companyName, 'Acme');
  });
});
