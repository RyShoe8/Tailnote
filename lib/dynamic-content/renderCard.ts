import 'server-only';
import { createHash } from 'crypto';
import { Resvg } from '@resvg/resvg-js';
import { colorToHex, parseCssColor } from '@/lib/colors/cssColor';
import { resolveCardFont } from '@/lib/dynamic-content/resolveCardFont';

export type DynamicContentCardItem = {
  title: string;
};

export type RenderDynamicContentCardOptions = {
  /** Org brand font stack (CSS font-family). */
  fontFamily?: string | null;
  /** Org brand primary color. */
  primaryColor?: string | null;
  /** Org brand secondary color (optional gradient tint base). */
  secondaryColor?: string | null;
};

const WIDTH = 600;
const PAD = 28;
const FALLBACK_PRIMARY = '#0a0a0a';
const FALLBACK_GRADIENT_END = '#eef2f7';
const GRADIENT_START = '#f8fafc';

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

/** Mix color toward white by `amount` (0 = original, 1 = white). */
function tintTowardWhite(hex: string, amount: number): string | null {
  const rgb = parseCssColor(hex);
  if (!rgb) return null;
  const t = Math.min(1, Math.max(0, amount));
  return colorToHex({
    r: rgb.r + (255 - rgb.r) * t,
    g: rgb.g + (255 - rgb.g) * t,
    b: rgb.b + (255 - rgb.b) * t,
  });
}

function resolveBrandColors(options: RenderDynamicContentCardOptions): {
  accent: string;
  gradientEnd: string;
} {
  const primaryRgb = options.primaryColor ? parseCssColor(options.primaryColor) : null;
  const accent = primaryRgb ? colorToHex(primaryRgb) : FALLBACK_PRIMARY;

  const secondaryRaw = (options.secondaryColor || '').trim();
  const tintBase = secondaryRaw && parseCssColor(secondaryRaw) ? secondaryRaw : accent;
  const gradientEnd = tintTowardWhite(tintBase, 0.88) ?? FALLBACK_GRADIENT_END;

  return { accent, gradientEnd };
}

/** Generate a retina-friendly PNG card for Dynamic Content. */
export async function renderDynamicContentCardPng(
  items: DynamicContentCardItem[],
  postsToDisplay: 1 | 2 | 3 = 1,
  options: RenderDynamicContentCardOptions = {}
): Promise<{ buffer: Buffer; contentHash: string; width: number; height: number }> {
  const font = await resolveCardFont(options.fontFamily);
  const familyAttr = escapeXml(font.familyName);
  const { accent, gradientEnd } = resolveBrandColors(options);

  const display = items.slice(0, postsToDisplay).filter((i) => i.title.trim());
  const single = display.length <= 1;

  let bodyHeight: number;
  let bodySvg: string;

  if (single) {
    const lines = wrapTitle(display[0]?.title || 'Latest update', 36, 3);
    const lineEls = lines
      .map(
        (line, i) =>
          `<text x="${PAD}" y="${88 + i * 36}" font-family="${familyAttr}" font-size="28" font-weight="600" fill="#111827">${escapeXml(line)}</text>`
      )
      .join('');
    bodyHeight = 88 + lines.length * 36 + 48;
    bodySvg = `${lineEls}
      <text x="${PAD}" y="${bodyHeight - 20}" font-family="${familyAttr}" font-size="18" font-weight="600" fill="${accent}">Read More →</text>`;
  } else {
    const bullets = display
      .map((item, i) => {
        const t = truncate(item.title, 48);
        return `<text x="${PAD}" y="${92 + i * 40}" font-family="${familyAttr}" font-size="22" font-weight="600" fill="#1f2937">• ${escapeXml(t)}</text>`;
      })
      .join('');
    bodyHeight = 92 + display.length * 40 + 28;
    bodySvg = bullets;
  }

  const height = Math.max(160, bodyHeight + PAD);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${GRADIENT_START}"/>
      <stop offset="100%" stop-color="${gradientEnd}"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${height}" rx="16" fill="url(#bg)"/>
  <rect x="0" y="0" width="8" height="${height}" fill="${accent}"/>
  <text x="${PAD}" y="42" font-family="${familyAttr}" font-size="14" font-weight="700" letter-spacing="1.2" fill="#64748b">LATEST CONTENT</text>
  ${bodySvg}
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: {
      fontFiles: [font.semiBoldPath, font.boldPath],
      loadSystemFonts: false,
      defaultFontFamily: font.familyName,
    },
  });
  const buffer = Buffer.from(resvg.render().asPng());
  const contentHash = createHash('sha256').update(buffer).digest('hex').slice(0, 24);
  return { buffer, contentHash, width: WIDTH, height };
}
