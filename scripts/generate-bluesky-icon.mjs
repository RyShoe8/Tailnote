import sharp from 'sharp';
import { siBluesky } from 'simple-icons';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/email-assets/icon-bluesky.png');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${siBluesky.path}" fill="#${siBluesky.hex}"/></svg>`;

const buf = await sharp(Buffer.from(svg))
  .ensureAlpha()
  .resize(32, 32, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: sharp.kernel.lanczos3,
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toBuffer();

writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${buf.length} bytes)`);
