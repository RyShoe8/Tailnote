/**
 * Generates public/email-assets/icon-reddit.png
 * Bold white Snoo on #FF4500 (matches Facebook/Discord email icons — no outer circle).
 */
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/email-assets/icon-reddit.png');

// 24×24 viewBox — Snoo only (head + antenna + eyes), ~12% inset from edges.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="#FF4500"/>
  <g fill="#FFFFFF">
    <circle cx="12" cy="4.2" r="1.35"/>
    <rect x="11.35" y="4.8" width="1.3" height="2.4" rx="0.35"/>
    <path d="M12 7.2c-3.35 0-5.75 1.85-5.75 4.35 0 1.05.45 2 1.2 2.65-.15.45-.25.95-.25 1.45 0 1.85 2.05 3.35 4.8 3.35s4.8-1.5 4.8-3.35c0-.5-.1-1-.25-1.45.75-.65 1.2-1.6 1.2-2.65 0-2.5-2.4-4.35-5.75-4.35z"/>
    <circle cx="9.35" cy="11.85" r="1.25"/>
    <circle cx="14.65" cy="11.85" r="1.25"/>
  </g>
</svg>`;

const png = await sharp(Buffer.from(svg))
  .ensureAlpha()
  .resize(32, 32, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: sharp.kernel.lanczos3,
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

writeFileSync(outPath, png);
console.log('Wrote', outPath, `(${png.length} bytes)`);
