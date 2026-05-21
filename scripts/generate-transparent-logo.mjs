/**
 * One-off: chroma-key near #F8FAFC from JPEG → transparent PNG for header logo.
 * Also emits a tightly-cropped `tailnote-logo-mark.png` for use inside email
 * signatures, where the canvas padding around the wordmark would otherwise
 * make table cells look oversized.
 * Run: node scripts/generate-transparent-logo.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const inputPath = path.join(root, 'public/images/tailnote-logo.jpg');
const outputPath = path.join(root, 'public/images/tailnote-logo.png');
const tightOutputPath = path.join(root, 'public/images/tailnote-logo-mark.png');

const BG = { r: 248, g: 250, b: 252 };

/** Even padding (px) added around the cropped wordmark so it does not touch borders. */
const TIGHT_PADDING_PX = 12;

async function main() {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  if (channels !== 4) throw new Error(`Expected 4 channels, got ${channels}`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const dr = r - BG.r;
    const dg = g - BG.g;
    const db = b - BG.b;
    const dist = Math.hypot(dr, dg, db);
    // Background + light anti-alias ring; keep logo colors (blues, teals, mint, dark text)
    if (dist < 38 || (r > 238 && g > 240 && b > 244 && (r + g + b) / 3 > 246)) {
      data[i + 3] = 0;
    }
  }

  await sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.info('Wrote', outputPath);

  const bounds = findOpaqueBounds(data, w, h);
  if (!bounds) {
    console.warn('No opaque pixels found; skipping tight crop output.');
    return;
  }

  const padX = Math.min(TIGHT_PADDING_PX, bounds.left, w - bounds.right - 1);
  const padY = Math.min(TIGHT_PADDING_PX, bounds.top, h - bounds.bottom - 1);
  const cropLeft = Math.max(0, bounds.left - padX);
  const cropTop = Math.max(0, bounds.top - padY);
  const cropWidth = Math.min(w - cropLeft, bounds.right - bounds.left + 1 + padX * 2);
  const cropHeight = Math.min(h - cropTop, bounds.bottom - bounds.top + 1 + padY * 2);

  await sharp(Buffer.from(data), { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
    .png({ compressionLevel: 9 })
    .toFile(tightOutputPath);

  console.info(`Wrote ${tightOutputPath} (${cropWidth}x${cropHeight} from ${w}x${h})`);
}

/** Find the bounding box of pixels whose alpha is above the threshold. */
function findOpaqueBounds(data, w, h, alphaThreshold = 8) {
  let top = -1;
  let bottom = -1;
  let left = w;
  let right = -1;
  for (let y = 0; y < h; y++) {
    let rowHasOpaque = false;
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > alphaThreshold) {
        rowHasOpaque = true;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    if (rowHasOpaque) {
      if (top === -1) top = y;
      bottom = y;
    }
  }
  if (top === -1 || right === -1) return null;
  return { top, bottom, left, right };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
