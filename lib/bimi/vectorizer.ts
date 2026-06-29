import sharp from 'sharp';
import { optimize } from 'svgo';
// @ts-expect-error No type definitions for imagetracerjs
import ImageTracer from 'imagetracerjs';

export async function rasterToVectorSvg(buffer: Buffer): Promise<{ svg: string; warnings: string[] }> {
  const warnings: string[] = [
    'Your logo was automatically traced into a vector. For the best quality, we recommend uploading a true vector SVG from your design team.'
  ];

  // 1. Process image with sharp to extract raw RGBA pixels, forcing it into a small square
  // A smaller input size (250x250) dramatically reduces path complexity/noise, shrinking the SVG file size!
  const TARGET_SIZE = 250;
  const { data, info } = await sharp(buffer)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Prepare data for imagetracerjs
  const imgData = { width: info.width, height: info.height, data: new Uint8Array(data) };

  // 3. Trace options (aggressively tuned for low file size and smooth curves)
  const options = {
    corshrink: 1.5,
    scale: 1,
    ltres: 2.0, // Higher = smoother, simpler curves (smaller file size)
    qtres: 2.0, // Higher = smoother, simpler curves
    blurradius: 2, // Blur away tiny noise to reduce path count
    colorsampling: 1,
    numberofcolors: 8, // Less colors = fewer layered paths
    pathomit: 32, // Ignore small noise chunks
    rightangleenhance: false
  };

  // 4. Trace the image
  const svgString = ImageTracer.imagedataToSVG(imgData, options);

  // 5. Optimize the resulting SVG to shrink file size
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

  // Ensure it has a viewBox (imagetracerjs usually generates one, but let's be safe)
  if (!finalSvg.includes('viewBox')) {
    finalSvg = finalSvg.replace('<svg ', `<svg viewBox="0 0 ${info.width} ${info.height}" `);
  }

  // 6. Enforce SVG tiny standard by ensuring no scripts/rasters exist
  const safeSvg = finalSvg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<image[\s\S]*?\/image>/gi, '')
    .replace(/<image[\s\S]*?>/gi, '');

  return { svg: safeSvg, warnings };
}
