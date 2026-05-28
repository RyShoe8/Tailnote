/**
 * Recompress public/email-assets/icon-*.png for email signatures (16–32px display).
 * Does not process other assets (e.g. sbd-logo.png).
 */
import sharp from 'sharp';
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../public/email-assets');
const TARGET_PX = 32;

const files = readdirSync(assetsDir).filter((f) => /^icon-.*\.png$/i.test(f));
if (files.length === 0) {
  console.error('No icon-*.png files found in', assetsDir);
  process.exit(1);
}

for (const name of files) {
  const path = join(assetsDir, name);
  const before = statSync(path).size;
  const meta = await sharp(path).metadata();
  const w = meta.width ?? TARGET_PX;
  const h = meta.height ?? TARGET_PX;
  const resizeTo = Math.min(TARGET_PX, Math.max(w, h));

  const out = await sharp(path)
    .resize(resizeTo, resizeTo, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, palette: true, effort: 10 })
    .toBuffer();

  writeFileSync(path, out);
  console.log(`${name}: ${before} → ${out.length} bytes (${resizeTo}px)`);
}

console.log('optimize-email-assets: done — bump ?v= in socialIcons.ts and SocialLinksEditor.tsx');
