import assert from 'node:assert/strict';
import { describe, it, mock, afterEach } from 'node:test';
import { isQuoteAlreadyUsed } from './isQuoteAlreadyUsed';
import { QuoteModel } from '@/models/Quote';
import { CampaignSubmissionModel } from '@/models/CampaignSubmission';

describe('isQuoteAlreadyUsed', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('detects a match in the quote library', async () => {
    mock.method(QuoteModel, 'find', () => ({
      select: () => ({
        lean: async () => [{ quoteText: 'Build something people want.' }],
      }),
    }));
    mock.method(CampaignSubmissionModel, 'find', () => ({
      select: () => ({
        lean: async () => [],
      }),
    }));

    const result = await isQuoteAlreadyUsed('  "Build Something People Want." ');
    assert.equal(result.used, true);
    assert.equal(result.source, 'library');
  });

  it('detects a match in non-rejected submissions', async () => {
    mock.method(QuoteModel, 'find', () => ({
      select: () => ({
        lean: async () => [],
      }),
    }));
    mock.method(CampaignSubmissionModel, 'find', () => ({
      select: () => ({
        lean: async () => [
          {
            content: { quote: 'Stay curious and keep shipping.' },
          },
        ],
      }),
    }));

    const result = await isQuoteAlreadyUsed('stay   curious and keep shipping.');
    assert.equal(result.used, true);
    assert.equal(result.source, 'submission');
  });

  it('returns unused for original quotes', async () => {
    mock.method(QuoteModel, 'find', () => ({
      select: () => ({
        lean: async () => [{ quoteText: 'Existing library quote' }],
      }),
    }));
    mock.method(CampaignSubmissionModel, 'find', () => ({
      select: () => ({
        lean: async () => [
          {
            content: { quote: 'Another submission quote' },
          },
        ],
      }),
    }));

    const result = await isQuoteAlreadyUsed('A brand new original quote');
    assert.equal(result.used, false);
  });
});
