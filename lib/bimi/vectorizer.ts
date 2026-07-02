import sharp from 'sharp';
import { optimize } from 'svgo';
// @ts-expect-error No type definitions for imagetracerjs
import ImageTracer from 'imagetracerjs';
import {
  countDistinctColors,
  isMostlyMonochrome,
  normalizeTracedSvg,
  type RgbaFrame,
} from '@/lib/bimi/tracePosterized';
import { tracePotraceMono, tracePotracePosterized } from '@/lib/bimi/tracePotrace';

export const DEFAULT_TARGET_SIZE = 512;
export const BIMI_TARGET_BYTES = 32 * 1024;

export type RasterTraceOptions = {
  canvasSize?: number;
  colorCount?: number | 'auto';
  engine?: 'potrace' | 'imagetracer';
  mode?: 'posterize' | 'mono';
  steps?: number;
  floatPrecision?: number;
};

export type RasterTraceResult = {
  svg: string;
  warnings: string[];
  passLabel: string;
  passIndex: number;
  byteSize: number;
};

const BASE_WARNING =
  'Your logo was automatically traced into a vector. For the absolute best crispness, upload a square SVG prepared by your design team.';
type PrepareFrameOptions = {
  colorCount?: number;
  sharpen?: boolean;
};

async function prepareTraceFrame(
  buffer: Buffer,
  canvasSize: number,
  opts: PrepareFrameOptions = {},
): Promise<RgbaFrame> {
  let pipeline = sharp(buffer)
    .trim()
    .resize(canvasSize, canvasSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .flatten({ background: { r: 255, g: 255, b: 255 } });

  if (opts.sharpen !== false) {
    pipeline = pipeline.sharpen({ sigma: 0.5 });
  }

  if (opts.colorCount && opts.colorCount > 1) {
    pipeline = pipeline.png({ palette: true, colors: opts.colorCount, effort: 10 });
  }

  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

function optimizeTracedSvg(svg: string, floatPrecision: number): string {
  try {
    return optimize(svg, {
      multipass: true,
      floatPrecision,
      plugins: ['preset-default', 'removeDimensions', 'removeMetadata', 'removeComments'],
    }).data;
  } catch {
    return svg;
  }
}

function traceWithImageTracer(
  frame: RgbaFrame,
  colorCount: number,
  viewSize: number,
  textSafe: boolean,
): string {
  const imgData = { width: frame.width, height: frame.height, data: frame.data };
  const monochrome = isMostlyMonochrome(frame.data) || colorCount <= 2;
  const pathomit = textSafe ? 0 : 10;
  const traceOptions = monochrome
    ? {
        ltres: 1,
        qtres: 1,
        pathomit,
        colorsampling: 0,
        numberofcolors: 2,
        blurradius: 0,
        blurdelta: 0,
        strokewidth: 0,
        linefilter: !textSafe,
        scale: 1,
        roundcoords: 1,
        viewbox: true,
      }
    : {
        corshrink: 1,
        scale: 1,
        ltres: 1,
        qtres: 1,
        blurradius: 0,
        colorsampling: 0,
        numberofcolors: colorCount,
        pathomit,
        rightangleenhance: false,
      };

  const svgString = ImageTracer.imagedataToSVG(imgData, traceOptions);
  return normalizeTracedSvg(svgString, viewSize);
}

function stripTinyPaths(svg: string): string {
  return svg.replace(/<path\b[^>]*\bd="([^"]+)"[^>]*\/?>/gi, (match, pathData: string) => {
    const nums = pathData.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
    if (nums.length < 4) return '';
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i]!;
      const y = nums[i + 1]!;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const area = (maxX - minX) * (maxY - minY);
    return area < 4 ? '' : match;
  });
}

function resolveColorCount(frame: RgbaFrame, colorCount: number | 'auto'): number {
  if (colorCount !== 'auto') return colorCount;
  return isMostlyMonochrome(frame.data) ? 2 : Math.min(4, countDistinctColors(frame.data));
}

function buildPassLabel(options: RasterTraceOptions, canvasSize: number, colors?: number): string {
  const engine = options.engine ?? 'imagetracer';
  if (engine === 'potrace') {
    const mode = options.mode ?? 'posterize';
    const steps = options.steps ?? (mode === 'mono' ? 1 : 4);
    return `potrace-${canvasSize}-${mode}-${steps}s-p${options.floatPrecision ?? 2}`;
  }
  return `imagetracer-${canvasSize}-${colors}c-p${options.floatPrecision ?? 2}`;
}

export async function rasterToVectorSvgWithPass(
  buffer: Buffer,
  options: RasterTraceOptions = {},
  passIndex = 0,
): Promise<RasterTraceResult | null> {
  const canvasSize = options.canvasSize ?? DEFAULT_TARGET_SIZE;
  const floatPrecision = options.floatPrecision ?? 2;
  const requestedColors = options.colorCount ?? 'auto';
  const engine = options.engine ?? 'imagetracer';

  const warnings: string[] = [BASE_WARNING];
  let svgRaw: string;
  let passLabel: string;

  if (engine === 'potrace') {
    const mode = options.mode ?? 'posterize';
    const frame = await prepareTraceFrame(buffer, canvasSize, { sharpen: true });

    try {
      if (mode === 'mono') {
        svgRaw = await tracePotraceMono(frame, { viewSize: canvasSize });
        warnings.push('Detected a mostly flat logo — used a high-contrast trace for sharper edges.');
      } else {
        const steps = options.steps ?? 4;
        svgRaw = await tracePotracePosterized(frame, { viewSize: canvasSize, steps });
        if (steps <= 3) {
          warnings.push('We simplified your logo to meet the 32KB BIMI size limit.');
        }
      }
    } catch {
      return null;
    }

    passLabel = buildPassLabel(options, canvasSize);
    const svg = optimizeTracedSvg(svgRaw, floatPrecision);

    return {
      svg,
      warnings,
      passLabel,
      passIndex,
      byteSize: Buffer.byteLength(svg, 'utf8'),
    };
  }

  const textSafe = true;
  const previewFrame = await prepareTraceFrame(buffer, canvasSize, { sharpen: true });
  const colors = resolveColorCount(previewFrame, requestedColors);
  const frame =
    colors > 2
      ? await prepareTraceFrame(buffer, canvasSize, { sharpen: true, colorCount: colors })
      : previewFrame;

  try {
    svgRaw = traceWithImageTracer(frame, colors, canvasSize, textSafe);
  } catch {
    return null;
  }

  if (colors <= 2) {
    warnings.push('Detected a mostly flat logo — used a high-contrast trace for sharper edges.');
  }
  if (typeof requestedColors === 'number' && requestedColors <= 3) {
    warnings.push('We simplified your logo to meet the 32KB BIMI size limit.');
  }

  passLabel = buildPassLabel(options, canvasSize, colors);
  const svg = optimizeTracedSvg(textSafe ? svgRaw : stripTinyPaths(svgRaw), floatPrecision);

  return {
    svg,
    warnings,
    passLabel,
    passIndex,
    byteSize: Buffer.byteLength(svg, 'utf8'),
  };
}

/** Backward-compatible single-pass entry (best-quality auto pass). */
export async function rasterToVectorSvg(buffer: Buffer): Promise<{ svg: string; warnings: string[] }> {
  const result = await rasterToVectorSvgWithPass(buffer, RASTER_TRACE_PASSES[0], 0);
  if (!result) {
    throw new Error('Could not trace logo');
  }
  return { svg: result.svg, warnings: result.warnings };
}

export function normalizeSvgViewBox(svg: string, size = DEFAULT_TARGET_SIZE): string {
  return normalizeTracedSvg(svg, size);
}

export const RASTER_TRACE_PASSES: RasterTraceOptions[] = [
  { canvasSize: 1024, engine: 'potrace', mode: 'posterize', steps: 4, floatPrecision: 2 },
  { canvasSize: 1024, engine: 'potrace', mode: 'posterize', steps: 3, floatPrecision: 2 },
  { canvasSize: 512, engine: 'potrace', mode: 'posterize', steps: 3, floatPrecision: 1 },
  { canvasSize: 512, colorCount: 4, engine: 'imagetracer', floatPrecision: 2 },
  { canvasSize: 256, engine: 'potrace', mode: 'mono', floatPrecision: 0 },
];

export function pickBestTraceResult(
  results: RasterTraceResult[],
  targetBytes: number = BIMI_TARGET_BYTES,
): RasterTraceResult | null {
  const valid = results.filter((r) => r.byteSize <= targetBytes);
  if (!valid.length) return null;
  return valid.sort((a, b) => a.passIndex - b.passIndex)[0] ?? null;
}
