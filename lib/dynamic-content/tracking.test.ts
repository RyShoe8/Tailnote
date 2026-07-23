import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { appendSignatureClickTracking } from '@/lib/signatureTrackingHtml';
import type { RenderSignatureInput } from 'emailsignature-engine';

describe('dynamic content click tracking', () => {
  it('rewrites img promo anchors that map to content blocks', () => {
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-dynamic-content-tracking-ok';
    const destination = 'https://example.com/newest-post';
    const html = `<a href="${destination}"><img src="https://tailnote.io/api/content-images/abc.png" width="300" /></a>`;
    const input = {
      profile: {
        firstName: 'A',
        lastName: 'B',
        title: '',
        email: 'a@b.com',
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
            type: 'dynamic_content',
            enabled: true,
            contentImageUrl: 'https://tailnote.io/api/content-images/abc.png',
            rssItems: [{ title: 'Newest', url: destination }],
          },
        ],
      },
      template: {
        layout: 'corporate',
        elements: [{ type: 'contentBlocks', enabled: true }],
      },
      publicSiteOrigin: 'https://tailnote.io',
    } as RenderSignatureInput;

    const out = appendSignatureClickTracking({
      html,
      organizationId: 'org1',
      employeeId: 'emp1',
      input,
      baseUrl: 'https://tailnote.io',
    });

    assert.match(out, /\/api\/track\/signature\?t=/);
    assert.ok(!out.includes(`href="${destination}"`));
  });
});
