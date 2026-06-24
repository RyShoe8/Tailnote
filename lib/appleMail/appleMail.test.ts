import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeForAppleMail } from '@/lib/appleMail/sanitizeForAppleMail';
import { buildMailsignatureFile } from '@/lib/appleMail/buildMailsignatureFile';
import { generateAppleMailInstallScript } from '@/lib/appleMail/generateInstallScript';

describe('sanitizeForAppleMail', () => {
  it('removes style, link, and script tags', () => {
    const input =
      '<style>.x{color:red}</style><link rel="stylesheet" href="https://fonts.googleapis.com/css"/><script>alert(1)</script><table><tr><td>Hi</td></tr></table>';
    const out = sanitizeForAppleMail(input);
    assert.ok(!out.includes('<style'));
    assert.ok(!out.includes('<link'));
    assert.ok(!out.includes('<script'));
    assert.ok(out.includes('<table>'));
  });

  it('strips open tracking pixels and http images', () => {
    const input =
      '<img src="https://app.example.com/api/track/signature/open?t=abc" width="1" height="1" /><img src="http://bad.example/logo.png" /><img src="https://good.example/logo.png" />';
    const out = sanitizeForAppleMail(input);
    assert.ok(!out.includes('/api/track/signature/open'));
    assert.ok(!out.includes('http://bad.example'));
    assert.ok(out.includes('https://good.example/logo.png'));
  });

  it('adds width and height to images missing dimensions', () => {
    const out = sanitizeForAppleMail('<img src="https://cdn.example/a.png" alt="" />');
    assert.match(out, /width="/);
    assert.match(out, /height="/);
  });
});

describe('buildMailsignatureFile', () => {
  it('produces plist keys for Apple Mail', () => {
    const plist = buildMailsignatureFile({
      signatureUniqueId: 'abc-123',
      signatureName: 'Tailnote Signature',
      html: '<table><tr><td>Test</td></tr></table>',
    });
    assert.ok(plist.includes('<key>SignatureIsRich</key>'));
    assert.ok(plist.includes('<key>SignatureMessageBody</key>'));
    assert.ok(plist.includes('abc-123'));
    assert.ok(plist.includes('&lt;table&gt;'));
  });
});

describe('generateAppleMailInstallScript', () => {
  it('embeds base64 and PlistBuddy commands without raw HTML', () => {
    const script = generateAppleMailInstallScript({
      signatureUniqueId: '11111111-2222-3333-4444-555555555555',
      signatureName: 'Tailnote — Test User',
      html: '<table><tr><td>Hello</td></tr></table>',
    });
    assert.ok(script.startsWith('#!/bin/bash'));
    assert.ok(script.includes('MAILSIGNATURE_B64='));
    assert.ok(script.includes('/usr/libexec/PlistBuddy'));
    assert.ok(script.includes('base64'));
    assert.ok(!script.includes('<table><tr><td>Hello</td></tr></table>'));
  });
});
