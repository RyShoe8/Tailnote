import assert from 'node:assert/strict';
import {
  prepareSignatureHtmlForClipboard,
  stripHtmlToPlainText,
  wrapClipboardHtml,
} from '../lib/clipboard';
import { renderMarketingSample } from '../lib/marketing/renderMarketingSample';

const withStyle = `<style type="text/css">.x { color: red; }</style><table><tr><td>Hi</td></tr></table>`;
const prepared = prepareSignatureHtmlForClipboard(withStyle);

assert.ok(!prepared.includes('<style'), 'prepare: removes style blocks');
assert.match(prepared, /<table/, 'prepare: keeps table markup');

const cf = wrapClipboardHtml('<table><tr><td>A</td></tr></table>');
assert.match(cf, /^Version:0\.9\r\n/, 'cfhtml: version header');
assert.match(cf, /StartFragment:/, 'cfhtml: fragment markers');
assert.match(cf, /<!--StartFragment--><table>/, 'cfhtml: wraps fragment');

const plain = stripHtmlToPlainText('<p>Hello <b>world</b></p>');
assert.equal(plain, 'Hello world', 'plain: strips tags');

const professionalHtml = renderMarketingSample('professional');
assert.ok(
  !prepareSignatureHtmlForClipboard(professionalHtml).startsWith('<style'),
  'professional sample: clipboard prep does not start with style'
);

console.log('clipboard-smoke: ok');
