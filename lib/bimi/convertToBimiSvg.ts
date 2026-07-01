// import removed
import { put } from '@vercel/blob';
import { optimize } from 'svgo';
import { ALLOWED_IMAGE_MIMES, SecureImageUploadError } from '@/lib/uploads/secureImageUpload';
import { buildBimiSuggestedRecord } from '@/lib/brandTrust/domainFromOrg';
import { rasterToVectorSvg, normalizeSvgViewBox } from '@/lib/bimi/vectorizer';

const MAX_INPUT_BYTES = 4 * 1024 * 1024;
const BIMI_TARGET_BYTES = 32 * 1024;
const BIMI_VIEWBOX_SIZE = 512;

export type BimiSvgConversionResult = {
  url: string;
  byteSize: number;
  suggestedRecord: string;
  warnings: string[];
};

function sanitizeSvg(svg: string): { svg: string; warnings: string[] } {
  const warnings: string[] = [];
  let out = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  if (/<script[\s>]/i.test(svg)) {
    warnings.push('Scripts were removed from the SVG for BIMI safety.');
  }
  try {
    const result = optimize(out, {
      multipass: true,
      plugins: ['preset-default', 'removeDimensions'],
    });
    out = result.data;
  } catch {
    warnings.push('SVG could not be fully optimized — verify the file manually.');
  }
  return { svg: out, warnings };
}

function aggressiveOptimizeSvg(svg: string): string {
  return optimize(svg, {
    multipass: true,
    floatPrecision: 1,
    plugins: [
      'preset-default',
      'removeDimensions',
      'removeMetadata',
      'removeComments',
      'removeEditorsNSData',
    ],
  }).data;
}

// removed rasterToSquareSvg

export async function convertToBimiSvg(args: {
  file: File;
  organizationId: string;
}): Promise<BimiSvgConversionResult> {
  const mime = (args.file.type || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime) && mime !== 'image/svg+xml') {
    throw new SecureImageUploadError('Unsupported file type. Use PNG, JPEG, WebP, or SVG.', 400);
  }

  const buffer = Buffer.from(await args.file.arrayBuffer());
  if (buffer.length > MAX_INPUT_BYTES) {
    throw new SecureImageUploadError('File too large (max 4 MB).', 400);
  }

  let svgRaw: string;
  let warnings: string[] = [];

  if (mime === 'image/svg+xml' || args.file.name.toLowerCase().endsWith('.svg')) {
    svgRaw = normalizeSvgViewBox(buffer.toString('utf-8'), BIMI_VIEWBOX_SIZE);
  } else {
    const converted = await rasterToVectorSvg(buffer);
    svgRaw = converted.svg;
    warnings = converted.warnings;
  }

  const sanitized = sanitizeSvg(svgRaw);
  warnings.push(...sanitized.warnings);

  let finalSvg = sanitized.svg;
  if (finalSvg.length > BIMI_TARGET_BYTES) {
    finalSvg = aggressiveOptimizeSvg(finalSvg);
  }
  if (finalSvg.length > BIMI_TARGET_BYTES) {
    throw new SecureImageUploadError(
      `Logo SVG is ${Math.round(finalSvg.length / 1024)}KB after optimization — BIMI requires under 32KB. Try a simpler logo.`,
      400,
    );
  }
  if (sanitized.svg.length > BIMI_TARGET_BYTES) {
    warnings.push('SVG was compressed to meet the 32KB BIMI size limit.');
  }

  // We must use a new static filename because 'logo.svg' was previously cached for 1 year by Vercel Blob
  const pathname = `tailnote/orgs/${args.organizationId}/bimi/bimi-logo.svg`;
  const blob = await put(pathname, finalSvg, {
    access: 'public',
    contentType: 'image/svg+xml',
    addRandomSuffix: false,
    cacheControlMaxAge: 60, // Ensure the edge cache expires quickly so updates propagate
  });

  return {
    url: blob.url,
    byteSize: Buffer.byteLength(finalSvg, 'utf8'),
    suggestedRecord: buildBimiSuggestedRecord(blob.url),
    warnings,
  };
}
