process.env.NEXT_PUBLIC_APP_URL = 'https://tailnote.io';

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSpotlightHallOfFameEmail,
  buildSpotlightNeedsChangesEmail,
  buildSpotlightVotingEmail,
} from './spotlight';

describe('spotlight email templates', () => {
  const submission = {
    founder: 'Jane Doe',
    companyName: 'Acme Corp',
  } as Parameters<typeof buildSpotlightNeedsChangesEmail>[0];

  it('needs changes email includes edit application link on tailnote.io', () => {
    const { html, text } = buildSpotlightNeedsChangesEmail(submission, 'Please update your logo.');
    assert.ok(html.includes('https://tailnote.io/dashboard/spotlight/apply'));
    assert.ok(text.includes('https://tailnote.io/dashboard/spotlight/apply'));
    assert.ok(!html.includes('tailnote.com'));
    assert.ok(html.includes('Please update your logo.'));
  });

  it('hall of fame email includes winners page link on tailnote.io', () => {
    const { subject, html, text } = buildSpotlightHallOfFameEmail(submission);
    assert.ok(subject.includes('Hall of Fame'));
    assert.ok(html.includes('https://tailnote.io/spotlight/winners'));
    assert.ok(text.includes('https://tailnote.io/spotlight/winners'));
    assert.ok(!html.includes('tailnote.com'));
    assert.ok(html.includes('Acme Corp'));
  });

  it('voting email includes vote and dashboard links on tailnote.io', () => {
    const votingStart = new Date('2026-06-08T00:00:00.000Z');
    const { subject, html, text } = buildSpotlightVotingEmail(submission, votingStart);
    assert.ok(subject.includes('voting week'));
    assert.ok(html.includes('https://tailnote.io/spotlight/vote'));
    assert.ok(html.includes('https://tailnote.io/dashboard/spotlight'));
    assert.ok(text.includes('https://tailnote.io/spotlight/vote'));
    assert.ok(text.includes('https://tailnote.io/dashboard/spotlight'));
    assert.ok(!html.includes('tailnote.com'));
    assert.ok(html.includes('Week of Jun 8, 2026'));
    assert.ok(html.includes('Share the vote page'));
  });
});
