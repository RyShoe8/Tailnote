import { put } from '@vercel/blob';
import { optimize } from 'svgo';
import { ALLOWED_IMAGE_MIMES, SecureImageUploadError } from '@/lib/uploads/secureImageUpload';
import { buildBimiSuggestedRecord } from '@/lib/brandTrust/domainFromOrg';
import { RASTER_SVG_HONESTY } from '@/lib/email-health/bimiCopy';
import {
  BIMI_TARGET_BYTES,
  DEFAULT_TARGET_SIZE,
  normalizeSvgViewBox,
  pickBestTraceResult,
  RASTER_TRACE_PASSES,
  rasterToVectorSvgWithPass,
  type RasterTraceResult,
} from '@/lib/bimi/vectorizer';

const MAX_INPUT_BYTES = 4 * 1024 * 1024;
const BIMI_VIEWBOX_SIZE = DEFAULT_TARGET_SIZE;

/** @internal Exported for unit tests */
export function getBimiLogoBlobPath(organizationId: string): string {
  return `tailnote/orgs/${organizationId}/bimi/bimi-logo.svg`;
}

export type BimiSvgConversionResult = {
  url: string;
  byteSize: number;
  suggestedRecord: string;
  warnings: string[];
};

function sanitizeSvg(svg: string, floatPrecision = 2): { svg: string; warnings: string[] } {
  const warnings: string[] = [];
  let out = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  if (/<script[\s>]/i.test(svg)) {
    warnings.push('Scripts were removed from the SVG for BIMI safety.');
  }
  try {
    const result = optimize(out, {
      multipass: true,
      floatPrecision,
      plugins: ['preset-default', 'removeDimensions', 'removeMetadata', 'removeComments'],
    });
    out = result.data;
  } catch {
    warnings.push('SVG could not be fully optimized — verify the file manually.');
  }
  return { svg: out, warnings };
}

function oversizeErrorMessage(byteSize: number): string {
  const kb = Math.round(byteSize / 1024);
  return (
    `Logo SVG is ${kb}KB after optimization — BIMI requires under 32KB. ` +
    `${RASTER_SVG_HONESTY} For complex or full-color marks, upload a designer-prepared square SVG instead.`
  );
}

async function traceRasterWithLadder(buffer: Buffer): Promise<RasterTraceResult> {
  const results: RasterTraceResult[] = [];
  for (let i = 0; i < RASTER_TRACE_PASSES.length; i++) {
    const result = await rasterToVectorSvgWithPass(buffer, RASTER_TRACE_PASSES[i], i);
    if (result) results.push(result);
  }

  const best = pickBestTraceResult(results, BIMI_TARGET_BYTES);
  if (best) return best;

  const smallest = results.sort((a, b) => a.byteSize - b.byteSize)[0];
  if (smallest) {
    throw new SecureImageUploadError(oversizeErrorMessage(smallest.byteSize), 400);
  }

  throw new SecureImageUploadError(
    'Could not convert this logo to a BIMI-compatible SVG. Upload a simpler mark or a square SVG from your design team.',
    400,
  );
}

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
    const sanitized = sanitizeSvg(svgRaw);
    warnings = sanitized.warnings;
    svgRaw = sanitized.svg;
    if (svgRaw.length > BIMI_TARGET_BYTES) {
      const tighter = sanitizeSvg(svgRaw, 0);
      warnings.push(...tighter.warnings);
      svgRaw = tighter.svg;
    }
    if (svgRaw.length > BIMI_TARGET_BYTES) {
      throw new SecureImageUploadError(oversizeErrorMessage(svgRaw.length), 400);
    }
  } else {
    const traced = await traceRasterWithLadder(buffer);
    svgRaw = traced.svg;
    warnings = [...traced.warnings];
    if (traced.passLabel.includes('2c') || traced.passLabel.includes('3c')) {
      if (!warnings.some((w) => w.includes('simplified'))) {
        warnings.push('We simplified your logo to meet the 32KB BIMI size limit.');
      }
    }
  }

  const pathname = getBimiLogoBlobPath(args.organizationId);
  const blob = await put(pathname, svgRaw, {
    access: 'public',
    contentType: 'image/svg+xml',
    cacheControlMaxAge: 60,
  });

  return {
    url: blob.url,
    byteSize: Buffer.byteLength(svgRaw, 'utf8'),
    suggestedRecord: buildBimiSuggestedRecord(blob.url),
    warnings,
  };
}

/** @internal Exported for unit tests */
export { traceRasterWithLadder, oversizeErrorMessage, pickBestTraceResult, RASTER_TRACE_PASSES };
