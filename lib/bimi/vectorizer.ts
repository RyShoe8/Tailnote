import sharp from 'sharp';
import { optimize } from 'svgo';
// @ts-expect-error No type definitions for imagetracerjs
import ImageTracer from 'imagetracerjs';

const TARGET_SIZE = 512;

export async function rasterToVectorSvg(buffer: Buffer): Promise<{ svg: string; warnings: string[] }> {
  const warnings: string[] = [
    'Your logo was automatically traced into a vector. For the absolute best crispness, we recommend uploading a true vector SVG from your design team.',
  ];

  const trimmed = await sharp(buffer)
    .trim()
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = trimmed;
  const imgData = { width: info.width, height: info.height, data: new Uint8Array(data) };
  const monochrome = isMostlyMonochrome(imgData.data);

  const traceOptions = monochrome
    ? {
        ltres: 0.5,
        qtres: 0.5,
        pathomit: 4,
        colorsampling: 0,
        numberofcolors: 2,
        blurradius: 0,
        blurdelta: 0,
        strokewidth: 0,
        linefilter: true,
        scale: 1,
        roundcoords: 1,
        viewbox: true,
      }
    : {
        corshrink: 1,
        scale: 1,
        ltres: 0.5,
        qtres: 0.5,
        blurradius: 0,
        colorsampling: 2,
        numberofcolors: 16,
        pathomit: 4,
        rightangleenhance: false,
      };

  if (monochrome) {
    warnings.push('Detected a mostly flat logo — used a high-contrast trace for sharper edges.');
  }

  const svgString = ImageTracer.imagedataToSVG(imgData, traceOptions);

  let finalSvg = svgString;
  try {
    const optimized = optimize(svgString, {
      multipass: true,
      floatPrecision: 2,
      plugins: [
        'preset-default',
        'removeDimensions',
      ],
    });
    finalSvg = optimized.data;
  } catch {
    warnings.push('Could not fully optimize the traced SVG.');
  }

  finalSvg = stripTinyPaths(finalSvg);
  finalSvg = finalSvg.replace(/viewBox="[^"]+"/i, `viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}"`);
  if (!finalSvg.includes('viewBox')) {
    finalSvg = finalSvg.replace('<svg ', `<svg viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}" `);
  }

  const safeSvg = finalSvg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<image[\s\S]*?\/image>/gi, '')
    .replace(/<image[\s\S]*?>/gi, '');

  return { svg: safeSvg, warnings };
}

function isMostlyMonochrome(data: Uint8Array): boolean {
  const step = Math.max(4, Math.floor(data.length / 4 / 400));
  const colors = new Set<string>();
  for (let i = 0; i < data.length; i += step * 4) {
    const alpha = data[i + 3] ?? 0;
    if (alpha < 32) continue;
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    colors.add(key);
    if (colors.size > 8) return false;
  }
  return colors.size <= 8;
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

export function normalizeSvgViewBox(svg: string, size = TARGET_SIZE): string {
  let out = svg.replace(/viewBox="[^"]+"/i, `viewBox="0 0 ${size} ${size}"`);
  if (!out.includes('viewBox')) {
    out = out.replace('<svg ', `<svg viewBox="0 0 ${size} ${size}" `);
  }
  return out;
}
