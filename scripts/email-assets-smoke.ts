import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import {
  inlineEmailAssetIcons,
  resolveEmailAssetIconUrl,
} from '../lib/inlineEmailAssetIcons';

async function main() {
  const assetsDir = join(process.cwd(), 'public/email-assets');
  const icons = readdirSync(assetsDir).filter((f) => /^icon-.*\.png$/i.test(f));

  assert.ok(icons.length >= 6, 'expected icon-*.png files');

  for (const name of icons) {
    const path = join(assetsDir, name);
    const buf = readFileSync(path);
    const colorType = buf[25];
    assert.equal(colorType, 6, `${name}: truecolor+alpha (color type 6)`);
    assert.ok(buf.length >= 400, `${name}: size >= 400 bytes`);
    await sharp(buf).png().toBuffer();
  }

  const html =
    '<img src="https://app.example.com/email-assets/icon-linkedin.png?v=10" width="18" height="18">';
  const noop = await inlineEmailAssetIcons(html);
  assert.equal(noop, html, 'inline: no-op without browser fetch');

  assert.equal(
    resolveEmailAssetIconUrl('/email-assets/icon-linkedin.png?v=10', 'https://app.example.com'),
    'https://app.example.com/email-assets/icon-linkedin.png?v=10'
  );
  assert.equal(
    resolveEmailAssetIconUrl(
      'https://cdn.example.com/email-assets/icon-facebook.png',
      'https://app.example.com'
    ),
    'https://cdn.example.com/email-assets/icon-facebook.png'
  );

  console.log('email-assets-smoke: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
