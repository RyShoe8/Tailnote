import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeQuoteText } from './normalizeQuoteText';

describe('normalizeQuoteText', () => {
  it('trims and lowercases', () => {
    assert.equal(normalizeQuoteText('  Hello World  '), 'hello world');
  });

  it('collapses internal whitespace', () => {
    assert.equal(normalizeQuoteText('hello    world'), 'hello world');
  });

  it('normalizes curly quotes and strips wrapping quotes', () => {
    assert.equal(normalizeQuoteText('“Build something people want.”'), 'build something people want.');
    assert.equal(normalizeQuoteText('"Ship fast"'), 'ship fast');
    assert.equal(normalizeQuoteText("'Stay curious'"), 'stay curious');
  });

  it('treats equivalent formatting as the same quote', () => {
    const a = normalizeQuoteText('  "Build   Something   Great"  ');
    const b = normalizeQuoteText('build something great');
    assert.equal(a, b);
  });
});
