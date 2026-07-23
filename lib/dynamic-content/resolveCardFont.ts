import 'server-only';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { findFontByStack, type FontOption } from '@/lib/email/fontOptions';

export type ResolvedCardFont = {
  /** Family name used in SVG font-family / @font-face */
  familyName: string;
  /** Absolute filesystem path to SemiBold (600) TTF */
  semiBoldPath: string;
  /** Absolute filesystem path to Bold (700) TTF */
  boldPath: string;
};

type CachedFaces = {
  familyName: string;
  semiBold: Buffer;
  bold: Buffer;
};

const fontsDir = join(process.cwd(), 'lib/dynamic-content/fonts');
const materializeDir = join(tmpdir(), 'tailnote-card-fonts');
const faceCache = new Map<string, CachedFaces>();

/** Web-safe proprietary fonts → free metric-compatible Google Fonts. */
const WEB_SAFE_GOOGLE_EQUIV: Record<string, string> = {
  arial: 'Arimo',
  helvetica: 'Arimo',
  verdana: 'Arimo',
  tahoma: 'Arimo',
  trebuchet: 'Arimo',
  calibri: 'Arimo',
  'segoe-ui': 'Arimo',
  georgia: 'Tinos',
  'times-new-roman': 'Tinos',
  garamond: 'Tinos',
  palatino: 'Tinos',
  'book-antiqua': 'Tinos',
};

function loadInterFallback(): CachedFaces {
  const cached = faceCache.get('inter-local');
  if (cached) return cached;
  const faces: CachedFaces = {
    familyName: 'Inter',
    semiBold: readFileSync(join(fontsDir, 'Inter-SemiBold.ttf')),
    bold: readFileSync(join(fontsDir, 'Inter-Bold.ttf')),
  };
  faceCache.set('inter-local', faces);
  return faces;
}

function googleFamilyQueryName(option: FontOption): string {
  if (option.category.startsWith('google')) {
    return option.name;
  }
  return WEB_SAFE_GOOGLE_EQUIV[option.id] ?? 'Inter';
}

function parseTtfUrlForWeight(css: string, weight: number): string | null {
  const blocks = css.split('@font-face');
  for (const block of blocks) {
    if (!block.includes(`font-weight: ${weight}`) && !block.includes(`font-weight:${weight}`)) {
      continue;
    }
    const urlMatch = block.match(/url\((['"]?)(https:\/\/fonts\.gstatic\.com[^)'"]+)\1\)/);
    if (urlMatch?.[2]) return urlMatch[2];
  }
  const any = css.match(
    new RegExp(
      `font-weight:\\s*${weight}[\\s\\S]*?url\\((['"]?)(https://fonts\\.gstatic\\.com[^)'"]+)\\1\\)`
    )
  );
  return any?.[2] ?? null;
}

async function fetchTtf(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font download failed (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Fetch 600 + 700 TTFs from Google Fonts CSS API.
 * Default Node fetch UA returns truetype (not woff2), which Sharp can embed.
 */
async function fetchGoogleFaces(googleFamily: string): Promise<CachedFaces> {
  const cacheKey = `gfont:${googleFamily}`;
  const hit = faceCache.get(cacheKey);
  if (hit) return hit;

  const familyParam = encodeURIComponent(googleFamily).replace(/%20/g, '+');
  const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@600;700&display=swap`;
  const cssRes = await fetch(cssUrl);
  if (!cssRes.ok) throw new Error(`Google Fonts CSS failed (${cssRes.status}) for ${googleFamily}`);
  const css = await cssRes.text();

  let semiUrl = parseTtfUrlForWeight(css, 600);
  let boldUrl = parseTtfUrlForWeight(css, 700);
  if (!semiUrl) semiUrl = boldUrl ?? parseTtfUrlForWeight(css, 400);
  if (!boldUrl) boldUrl = semiUrl ?? parseTtfUrlForWeight(css, 400);
  if (!semiUrl || !boldUrl) {
    throw new Error(`No TTF URLs in Google Fonts CSS for ${googleFamily}`);
  }

  const [semiBold, bold] = await Promise.all([fetchTtf(semiUrl), fetchTtf(boldUrl)]);
  const faces: CachedFaces = { familyName: googleFamily, semiBold, bold };
  faceCache.set(cacheKey, faces);
  return faces;
}

/** Materialize font bytes to a stable temp path (resvg loads by filesystem path). */
function materializeFaceFile(cacheKey: string, weight: '600' | '700', buf: Buffer): string {
  mkdirSync(materializeDir, { recursive: true });
  const safe = cacheKey.replace(/[^a-zA-Z0-9_-]+/g, '_');
  const file = join(materializeDir, `${safe}-${weight}.ttf`);
  if (!existsSync(file) || readFileSync(file).length !== buf.length) {
    writeFileSync(file, buf);
  }
  return file;
}

function toResolved(faces: CachedFaces, cacheKey: string): ResolvedCardFont {
  return {
    familyName: faces.familyName,
    semiBoldPath: materializeFaceFile(cacheKey, '600', faces.semiBold),
    boldPath: materializeFaceFile(cacheKey, '700', faces.bold),
  };
}

/**
 * Resolve an org brand font stack to embeddable TTF faces for Sharp SVG cards.
 * Google options are fetched; web-safe map to Arimo/Tinos; failure → bundled Inter.
 */
export async function resolveCardFont(fontFamily?: string | null): Promise<ResolvedCardFont> {
  const option = fontFamily?.trim() ? findFontByStack(fontFamily) : undefined;

  if (!option || option.id === 'inter') {
    return toResolved(loadInterFallback(), 'inter-local');
  }

  const googleFamily = googleFamilyQueryName(option);
  if (googleFamily === 'Inter') {
    return toResolved(loadInterFallback(), 'inter-local');
  }

  try {
    const faces = await fetchGoogleFaces(googleFamily);
    return toResolved(faces, `gfont-${googleFamily}`);
  } catch {
    return toResolved(loadInterFallback(), 'inter-local');
  }
}
