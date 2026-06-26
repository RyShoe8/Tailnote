import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { suggestSpfTxtFix } from './spfSuggestions';

describe('suggestSpfTxtFix', () => {
  it('replaces ~all with -all', () => {
    const fix = suggestSpfTxtFix('v=spf1 include:_spf.google.com ~all');
    assert.ok(fix);
    assert.equal(fix!.value, 'v=spf1 include:_spf.google.com -all');
    assert.equal(fix!.host, '@');
  });

  it('replaces ?all with ~all', () => {
    const fix = suggestSpfTxtFix('v=spf1 include:sendgrid.net ?all');
    assert.ok(fix);
    assert.equal(fix!.value, 'v=spf1 include:sendgrid.net ~all');
  });

  it('replaces +all with -all', () => {
    const fix = suggestSpfTxtFix('v=spf1 +all');
    assert.ok(fix);
    assert.equal(fix!.value, 'v=spf1 -all');
  });

  it('appends ~all when no all mechanism is present', () => {
    const fix = suggestSpfTxtFix('v=spf1 include:_spf.google.com');
    assert.ok(fix);
    assert.equal(fix!.value, 'v=spf1 include:_spf.google.com ~all');
  });

  it('returns null when record already uses -all', () => {
    const fix = suggestSpfTxtFix('v=spf1 include:_spf.google.com -all');
    assert.equal(fix, null);
  });
});
