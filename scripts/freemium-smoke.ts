/**
 * Verifies FREE attribution and tracking gating behavior.
 */
process.env.BETTER_AUTH_SECRET = 'smoke-test-secret-key-minimum-length-32';

import assert from 'node:assert/strict';
import { renderSignature, type RenderSignatureInput, type SignatureTemplate } from 'emailsignature-engine';
import { appendSignatureClickTrackingIfEnabled } from '../lib/signatureTrackingHtml';
import { appendSignatureAttributionIfNeeded } from '../lib/signatureAttribution';

const template: SignatureTemplate = {
  id: 'free-smoke',
  name: 'Free smoke',
  layout: 'standard',
  elements: [{ type: 'name' }, { type: 'contentBlocks' }],
};

const input: RenderSignatureInput = {
  profile: {
    firstName: 'T',
    lastName: 'U',
    title: '',
    email: 't@example.com',
  },
  brand: {
    companyName: 'Co',
    website: '',
    logoUrl: '',
    logoLink: '',
    primaryColor: '#000',
    fontFamily: 'Arial',
    socialLinks: {},
    contentBlocks: [
      {
        type: 'list',
        enabled: true,
        listTitle: 'Links',
        listItems: [{ title: 'A', url: 'https://example.com/pricing' }],
      },
    ],
  },
  template,
  publicSiteOrigin: 'https://app.example.com',
};

const raw = renderSignature(input);

const freeAttributed = appendSignatureAttributionIfNeeded({
  html: raw,
  org: { plan: 'free', subscriptionStatus: 'none' },
});
assert.match(freeAttributed, /Powered by/);
assert.match(freeAttributed, /tailnote\.io\/from-signature/);

const paidAttributed = appendSignatureAttributionIfNeeded({
  html: raw,
  org: { plan: 'team', subscriptionStatus: 'active' },
});
assert.equal(paidAttributed, raw);

const freeTracked = appendSignatureClickTrackingIfEnabled({
  html: raw,
  org: { plan: 'free', subscriptionStatus: 'none', signatureClickTrackingEnabled: true } as never,
  organizationId: '507f1f77bcf86cd799439011',
  input,
  baseUrl: 'https://app.example.com',
});
assert.doesNotMatch(freeTracked, /\/api\/track\/signature\?/);

const paidTracked = appendSignatureClickTrackingIfEnabled({
  html: raw,
  org: { plan: 'team', subscriptionStatus: 'active', signatureClickTrackingEnabled: true } as never,
  organizationId: '507f1f77bcf86cd799439011',
  input,
  baseUrl: 'https://app.example.com',
});
assert.match(paidTracked, /\/api\/track\/signature\?/);

process.stdout.write('freemium-smoke: ok\n');
