import assert from 'node:assert/strict';
import {
  clipboardHtmlForPaste,
  prepareSignatureHtmlForClipboard,
  stripHtmlToPlainText,
  wrapClipboardHtml,
} from '../lib/clipboard';
import { renderMarketingSample } from '../lib/marketing/renderMarketingSample';
import { TEMPLATE_PRESET_IDS, type TemplatePresetId } from '../lib/email/templatePresets';

const withStyle = `<style type="text/css">.x { color: red; }</style><table><tr><td>Hi</td></tr></table>`;
const prepared = prepareSignatureHtmlForClipboard(withStyle);

assert.ok(!prepared.includes('<style'), 'prepare: removes style blocks');
assert.match(prepared, /<table/, 'prepare: keeps table markup');

const pasteHtml = clipboardHtmlForPaste('<table><tr><td>A</td></tr></table>');
assert.ok(!pasteHtml.includes('Version:0.9'), 'paste html: no CF_HTML version header');
assert.ok(!pasteHtml.includes('StartHTML:'), 'paste html: no StartHTML offset line');
assert.match(pasteHtml, /<!--StartFragment--><table>/, 'paste html: wraps fragment');

const cf = wrapClipboardHtml('<table><tr><td>A</td></tr></table>');
assert.match(cf, /^Version:0\.9\r\n/, 'cfhtml: version header (legacy helper only)');
assert.match(cf, /StartFragment:/, 'cfhtml: fragment markers');

const plain = stripHtmlToPlainText('<p>Hello <b>world</b></p>');
assert.equal(plain, 'Hello world', 'plain: strips tags');

for (const presetId of TEMPLATE_PRESET_IDS) {
  const html = renderMarketingSample(presetId as TemplatePresetId);
  const frag = prepareSignatureHtmlForClipboard(html);
  assert.ok(!frag.startsWith('<style'), `${presetId}: clipboard prep does not start with style`);
  const paste = clipboardHtmlForPaste(frag);
  assert.ok(!paste.includes('Version:0.9'), `${presetId}: paste html has no CF header`);
  assert.ok(!paste.includes('StartHTML:'), `${presetId}: paste html has no StartHTML line`);
}

console.log('clipboard-smoke: ok');
