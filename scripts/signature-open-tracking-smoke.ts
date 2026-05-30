/**
 * Verifies open tracking pixel is appended when enabled.
 */
process.env.BETTER_AUTH_SECRET = 'smoke-test-secret-key-minimum-length-32';

import assert from 'node:assert/strict';
import { renderSignature, type RenderSignatureInput, type SignatureTemplate } from 'emailsignature-engine';
import { appendSignatureOpenTrackingPixelIfEnabled } from '../lib/signatureTrackingHtml';

const template: SignatureTemplate = {
  id: 'open-smoke',
  name: 'Open smoke',
  layout: 'standard',
  elements: [{ type: 'name' }],
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
  },
  template,
  publicSiteOrigin: 'https://app.example.com',
};

let html = renderSignature(input);

const offOrg = { signatureOpenTrackingEnabled: false } as never;
html = appendSignatureOpenTrackingPixelIfEnabled({
  html,
  org: offOrg,
  organizationId: '507f1f77bcf86cd799439011',
  baseUrl: 'https://app.example.com',
});
assert.ok(!html.includes('/api/track/signature/open'), 'open smoke: pixel absent when disabled');

html = renderSignature(input);
const onOrg = { signatureOpenTrackingEnabled: true } as never;
html = appendSignatureOpenTrackingPixelIfEnabled({
  html,
  org: onOrg,
  organizationId: '507f1f77bcf86cd799439011',
  employeeId: '507f1f77bcf86cd799439012',
  baseUrl: 'https://app.example.com',
});
assert.ok(html.includes('/api/track/signature/open?t='), 'open smoke: pixel present when enabled');
assert.ok(html.includes('width="1" height="1"'), 'open smoke: pixel dimensions set');

process.stdout.write('signature-open-tracking-smoke: ok\n');
