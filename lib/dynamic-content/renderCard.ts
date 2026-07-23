import 'server-only';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

export type DynamicContentCardItem = {
  title: string;
};

const WIDTH = 600;
const PAD = 28;

const fontsDir = join(process.cwd(), 'lib/dynamic-content/fonts');
const interSemiBoldBase64 = readFileSync(join(fontsDir, 'Inter-SemiBold.ttf')).toString('base64');
const interBoldBase64 = readFileSync(join(fontsDir, 'Inter-Bold.ttf')).toString('base64');

const FONT_FACE_CSS = `
@font-face {
  font-family: 'Inter';
  font-weight: 600;
  font-style: normal;
  src: url('data:font/ttf;base64,${interSemiBoldBase64}') format('truetype');
}
@font-face {
  font-family: 'Inter';
  font-weight: 700;
  font-style: normal;
  src: url('data:font/ttf;base64,${interBoldBase64}') format('truetype');
}
`.trim();

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function wrapTitle(title: string, maxChars: number, maxLines: number): string[] {
  const words = truncate(title, maxChars * maxLines).split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  return lines;
}

/** Generate a retina-friendly PNG card for Dynamic Content. */
export async function renderDynamicContentCardPng(
  items: DynamicContentCardItem[],
  postsToDisplay: 1 | 2 | 3 = 1
): Promise<{ buffer: Buffer; contentHash: string; width: number; height: number }> {
  const display = items.slice(0, postsToDisplay).filter((i) => i.title.trim());
  const single = display.length <= 1;

  let bodyHeight: number;
  let bodySvg: string;

  if (single) {
    const lines = wrapTitle(display[0]?.title || 'Latest update', 36, 3);
    const lineEls = lines
      .map(
        (line, i) =>
          `<text x="${PAD}" y="${88 + i * 36}" font-family="Inter" font-size="28" font-weight="600" fill="#111827">${escapeXml(line)}</text>`
      )
      .join('');
    bodyHeight = 88 + lines.length * 36 + 48;
    bodySvg = `${lineEls}
      <text x="${PAD}" y="${bodyHeight - 20}" font-family="Inter" font-size="18" font-weight="600" fill="#2563eb">Read More →</text>`;
  } else {
    const bullets = display
      .map((item, i) => {
        const t = truncate(item.title, 48);
        return `<text x="${PAD}" y="${92 + i * 40}" font-family="Inter" font-size="22" font-weight="600" fill="#1f2937">• ${escapeXml(t)}</text>`;
      })
      .join('');
    bodyHeight = 92 + display.length * 40 + 28;
    bodySvg = bullets;
  }

  const height = Math.max(160, bodyHeight + PAD);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css"><![CDATA[
${FONT_FACE_CSS}
    ]]></style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#eef2ff"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${height}" rx="16" fill="url(#bg)"/>
  <rect x="0" y="0" width="8" height="${height}" fill="#2563eb"/>
  <text x="${PAD}" y="42" font-family="Inter" font-size="14" font-weight="700" letter-spacing="1.2" fill="#64748b">LATEST CONTENT</text>
  ${bodySvg}
</svg>`;

  const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const contentHash = createHash('sha256').update(buffer).digest('hex').slice(0, 24);
  return { buffer, contentHash, width: WIDTH, height };
}
