import assert from 'node:assert/strict';
import {
  contentBlockDisplayLabel,
  resolveSignatureClickKindLabel,
} from '../lib/signatureContentBlockAnalytics';

assert.equal(
  contentBlockDisplayLabel(
    { type: 'list', enabled: true, listTitle: 'Spring sale', listItems: [] },
    0
  ),
  'Spring sale'
);

assert.equal(
  contentBlockDisplayLabel(
    {
      type: 'list',
      enabled: true,
      listItems: [{ title: 'Book a demo', url: 'https://example.com' }],
    },
    1
  ),
  'Book a demo'
);

assert.equal(
  contentBlockDisplayLabel({ type: 'book_a_call', enabled: true, callTitle: 'Schedule a call' }, 0),
  'Schedule a call'
);

assert.equal(
  resolveSignatureClickKindLabel('content_block_1', { content_block_1: 'Spring sale' }),
  'Spring sale'
);

assert.equal(resolveSignatureClickKindLabel('content_block_2', {}), 'Promo 2');

process.stdout.write('promo-label-smoke: ok\n');
