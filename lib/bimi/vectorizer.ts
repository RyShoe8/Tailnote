import sharp from 'sharp';
import { optimize } from 'svgo';
import { posterize, Potrace } from 'potrace';

function tracePosterize(buffer: Buffer, options: any): Promise<string> {
  return new Promise((resolve, reject) => {
    posterize(buffer, options, (err: Error | null, svg: string) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
}

export async function rasterToVectorSvg(buffer: Buffer): Promise<{ svg: string; warnings: string[] }> {
  const warnings: string[] = [
    'Your logo was automatically traced into a vector. For the absolute best crispness (especially for text), we recommend uploading a true vector SVG from your design team.'
  ];

  // 1. Process image with sharp to extract a clean PNG, forced into a square
  // A moderate input size (400x400) provides enough resolution for crisp text, 
  // while Potrace's efficient Bezier curves keep the file size tiny.
  const TARGET_SIZE = 400;
  const pngBuffer = await sharp(buffer)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png() // potrace requires an image format it can parse (like PNG or JPEG)
    .toBuffer();

  // 2. Trace options for Potrace
  const options = {
    // 4 steps means it will quantize the image into 4 dominant color layers
    steps: 4, 
    // Ignore tiny noise specs (2 is default, 8 is a bit cleaner)
    turdSize: 8, 
    // Optimization tolerance (higher = fewer points = smaller file, but looser curves)
    optTolerance: 0.4
  };

  // 3. Trace the image using Potrace Posterization
  const svgString = await tracePosterize(pngBuffer, options);

  // 4. Optimize the resulting SVG to shrink file size
  let finalSvg = svgString;
  try {
    const optimized = optimize(svgString, {
      multipass: true,
      floatPrecision: 1, // Heavily reduces file size by trimming decimal precision on coordinates
      plugins: [
        'preset-default',
        'removeDimensions', // Let the viewBox dictate the scaling for BIMI
      ]
    });
    finalSvg = optimized.data;
  } catch {
    warnings.push('Could not fully optimize the traced SVG.');
  }

  // Ensure it has the correct square viewBox
  finalSvg = finalSvg.replace(/viewBox="[^"]+"/i, `viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}"`);
  if (!finalSvg.includes('viewBox')) {
    finalSvg = finalSvg.replace('<svg ', `<svg viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}" `);
  }

  // 5. Enforce SVG tiny standard by ensuring no scripts/rasters exist
  const safeSvg = finalSvg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<image[\s\S]*?\/image>/gi, '')
    .replace(/<image[\s\S]*?>/gi, '');

  return { svg: safeSvg, warnings };
}
