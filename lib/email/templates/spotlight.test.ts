import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSpotlightHallOfFameEmail,
  buildSpotlightNeedsChangesEmail,
} from './spotlight';

describe('spotlight email templates', () => {
  const submission = {
    founder: 'Jane Doe',
    companyName: 'Acme Corp',
  } as Parameters<typeof buildSpotlightNeedsChangesEmail>[0];

  it('needs changes email includes edit application link', () => {
    const { html, text } = buildSpotlightNeedsChangesEmail(submission, 'Please update your logo.');
    assert.ok(html.includes('https://tailnote.com/dashboard/spotlight/apply'));
    assert.ok(text.includes('https://tailnote.com/dashboard/spotlight/apply'));
    assert.ok(html.includes('Please update your logo.'));
  });

  it('hall of fame email includes winners page link', () => {
    const { subject, html, text } = buildSpotlightHallOfFameEmail(submission);
    assert.ok(subject.includes('Hall of Fame'));
    assert.ok(html.includes('https://tailnote.com/spotlight/winners'));
    assert.ok(text.includes('https://tailnote.com/spotlight/winners'));
    assert.ok(html.includes('Acme Corp'));
  });
});
