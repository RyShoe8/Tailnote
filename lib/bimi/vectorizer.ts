import sharp from 'sharp';
import { optimize } from 'svgo';
// @ts-expect-error No type definitions for imagetracerjs
import ImageTracer from 'imagetracerjs';

export async function rasterToVectorSvg(buffer: Buffer): Promise<{ svg: string; warnings: string[] }> {
  const warnings: string[] = [
    'Your logo was automatically traced into a vector. For the absolute best crispness, we recommend uploading a true vector SVG from your design team.'
  ];

  // 1. Process image with sharp to extract raw RGBA pixels, forcing it into a moderate square
  // A moderate input size (300x300) provides enough resolution for text, while SVGO cuts down file size!
  const TARGET_SIZE = 300;
  const { data, info } = await sharp(buffer)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Prepare data for imagetracerjs
  const imgData = { width: info.width, height: info.height, data: new Uint8Array(data) };

  // 3. Trace options 
  const options = {
    corshrink: 1.5,
    scale: 1,
    ltres: 1.0, 
    qtres: 1.0, 
    blurradius: 1, 
    colorsampling: 1,
    numberofcolors: 8, 
    pathomit: 8, 
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

  // Ensure it has the correct square viewBox
  finalSvg = finalSvg.replace(/viewBox="[^"]+"/i, `viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}"`);
  if (!finalSvg.includes('viewBox')) {
    finalSvg = finalSvg.replace('<svg ', `<svg viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}" `);
  }

  // 6. Enforce SVG tiny standard by ensuring no scripts/rasters exist
  const safeSvg = finalSvg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<image[\s\S]*?\/image>/gi, '')
    .replace(/<image[\s\S]*?>/gi, '');

  return { svg: safeSvg, warnings };
}
