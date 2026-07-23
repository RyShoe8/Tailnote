import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseRssFeed, extractAlternateFeedLinks } from './parseFeed';
import { renderDynamicContentCardPng } from './renderCard';
import { normalizeWebsiteUrl } from './types';

const SAMPLE_RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
<title>Blog</title>
<item>
  <title>First Post</title>
  <link>https://example.com/first</link>
  <guid>https://example.com/first</guid>
  <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
</item>
<item>
  <title><![CDATA[Second Post]]></title>
  <link>https://example.com/second</link>
</item>
</channel></rss>`;

describe('dynamic-content parseFeed', () => {
  it('parses RSS 2.0 items', () => {
    const items = parseRssFeed(SAMPLE_RSS);
    assert.equal(items.length, 2);
    assert.equal(items[0]?.title, 'First Post');
    assert.equal(items[0]?.url, 'https://example.com/first');
    assert.equal(items[1]?.title, 'Second Post');
  });

  it('extracts alternate feed links from HTML', () => {
    const html = `<html><head>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
    </head></html>`;
    const links = extractAlternateFeedLinks(html, 'https://example.com');
    assert.ok(links.some((l) => l.includes('feed.xml')));
  });

  it('normalizes website URLs', () => {
    assert.equal(normalizeWebsiteUrl('example.com'), 'https://example.com');
    assert.equal(normalizeWebsiteUrl('https://example.com/'), 'https://example.com');
  });
});

describe('dynamic-content renderCard', () => {
  it('renders a single-post PNG', async () => {
    const { buffer, contentHash, width } = await renderDynamicContentCardPng(
      [{ title: 'How We Built Tailnote' }],
      1
    );
    assert.ok(buffer.length > 500);
    assert.ok(contentHash.length >= 8);
    assert.equal(width, 600);
  });

  it('renders a multi-post PNG', async () => {
    const { buffer } = await renderDynamicContentCardPng(
      [{ title: 'One' }, { title: 'Two' }, { title: 'Three' }],
      3
    );
    assert.ok(buffer.length > 500);
  });
});
