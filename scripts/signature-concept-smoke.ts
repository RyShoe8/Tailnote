import assert from 'node:assert/strict';
import { POST } from '../app/api/signature-concept/route';

async function main() {
  const prospect = { company: 'Studio Example', logoHeightPx: 110, website: 'https://studio.example', logo: 'https://studio.example/logo.png',
    first_name: 'Alex', last_name: 'Sample', role: 'Creative director', email: 'studio@studio.example', phone: '+1-312-555-0199',
    primary_color: '#344c87', secondary_color: '#8f65ae', social: 'https://bsky.app/profile/studio.example',
    feed: 'https://studio.example/feed', feedXml: '<rss><channel><item><title>Opening our second studio</title><link>https://studio.example/news/new-studio</link></item></channel></rss>',
    cta_label: 'Visit our studio', cta_url: 'https://studio.example/visit' };
  for (const overrides of [{ email: '' }, { feedXml: '<rss/>' }]) {
    const result = await POST(new Request('https://tailnote.io/api/signature-concept', { method: 'POST',
      body: JSON.stringify({ ...prospect, preset: 'creator', cta_type: 'list', ...overrides }) }));
    assert.ok(result.status >= 400);
  }
  for (const preset of ['modern_professional', 'portfolio', 'creator']) {
    for (const cta_type of ['list', 'book_a_call']) {
      const response = await POST(new Request('https://tailnote.io/api/signature-concept', { method: 'POST', body: JSON.stringify({ ...prospect, preset, cta_type }) }));
      assert.equal(response.status, 200);
      const { html, headline, promoPng } = await response.json();
      assert.ok(!html.includes(prospect.phone), 'Legacy phone input must never render');
      assert.equal(headline, 'Opening our second studio');
      assert.equal(Buffer.from(promoPng, 'base64').readUInt32BE(0), 0x89504e47);
      for (const expected of [prospect.logo, prospect.email, prospect.role, prospect.cta_label, prospect.cta_url, 'latest-blog.png', 'news/new-studio']) assert.ok(html.includes(expected), preset + '/' + cta_type + ' missing ' + expected);
    }
  }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
