import sharp from 'sharp';
// @ts-expect-error No type definitions for potrace
import potrace from 'potrace';
import { normalizeTracedSvg, type RgbaFrame } from '@/lib/bimi/tracePosterized';

export type PotraceMonoOptions = {
  viewSize: number;
  turdSize?: number;
  optTolerance?: number;
};

export type PotracePosterizeOptions = {
  viewSize: number;
  steps: number;
};

export async function rgbaFrameToPngBuffer(frame: RgbaFrame): Promise<Buffer> {
  return sharp(Buffer.from(frame.data), {
    raw: { width: frame.width, height: frame.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

function traceAsync(pngBuffer: Buffer, params: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.trace(pngBuffer, params, (err: Error | null, svg: string) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
}

function posterizeAsync(pngBuffer: Buffer, params: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) => {
    potrace.posterize(pngBuffer, params, (err: Error | null, svg: string) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
}

export async function tracePotraceMono(frame: RgbaFrame, opts: PotraceMonoOptions): Promise<string> {
  const pngBuffer = await rgbaFrameToPngBuffer(frame);
  const svg = await traceAsync(pngBuffer, {
    turdSize: opts.turdSize ?? 1,
    optCurve: true,
    optTolerance: opts.optTolerance ?? 0.2,
  });
  return normalizeTracedSvg(svg, opts.viewSize);
}

export async function tracePotracePosterized(
  frame: RgbaFrame,
  opts: PotracePosterizeOptions,
): Promise<string> {
  const pngBuffer = await rgbaFrameToPngBuffer(frame);
  const svg = await posterizeAsync(pngBuffer, {
    steps: opts.steps,
    fillStrategy: potrace.Posterizer.FILL_DOMINANT,
    turdSize: 1,
    optCurve: true,
    optTolerance: 0.2,
  });
  return normalizeTracedSvg(svg, opts.viewSize);
}
