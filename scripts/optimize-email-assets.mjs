/**
 * Recompress public/email-assets/icon-*.png for email signatures (32px display).
 * Uses truecolor+alpha PNG — never palette/indexed (Gmail image proxy rejects aggressive palette PNGs).
 */
import sharp from 'sharp';
import { execSync } from 'child_process';
import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../public/email-assets');
const TARGET_PX = 32;
const SOURCE_REV = 'cdf7189';

async function exportIcon(inputBuffer, outPath) {
  const out = await sharp(inputBuffer)
    .ensureAlpha()
    .resize(TARGET_PX, TARGET_PX, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  writeFileSync(outPath, out);
  return out.length;
}

const files = readdirSync(assetsDir).filter((f) => /^icon-.*\.png$/i.test(f));
if (files.length === 0) {
  console.error('No icon-*.png files found in', assetsDir);
  process.exit(1);
}

for (const name of files) {
  const outPath = join(assetsDir, name);
  const before = statSync(outPath).size;
  let inputBuffer;
  try {
    inputBuffer = execSync(`git show ${SOURCE_REV}:public/email-assets/${name}`);
  } catch {
    inputBuffer = await sharp(outPath).toBuffer();
    console.warn(`${name}: git source missing at ${SOURCE_REV}, using current file`);
  }
  const after = await exportIcon(inputBuffer, outPath);
  console.log(`${name}: ${before} → ${after} bytes (${TARGET_PX}px truecolor+alpha)`);
}

console.log('optimize-email-assets: done — bump ?v= in socialIcons.ts and SocialLinksEditor.tsx');
