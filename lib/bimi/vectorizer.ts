import sharp from 'sharp';
import { optimize } from 'svgo';
// @ts-expect-error No type definitions for imagetracerjs
import ImageTracer from 'imagetracerjs';

export async function rasterToVectorSvg(buffer: Buffer): Promise<{ svg: string; warnings: string[] }> {
  const warnings: string[] = [
    'Your logo was automatically traced into a vector. For the best quality, we recommend uploading a true vector SVG from your design team.'
  ];

  // 1. Process image with sharp to extract raw RGBA pixels
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Prepare data for imagetracerjs
  const imgData = { width: info.width, height: info.height, data: new Uint8Array(data) };

  // 3. Trace options (tuned for logos)
  const options = {
    corshrink: 1.5,
    scale: 1,
    ltres: 0.5,
    qtres: 0.5,
    blurradius: 1,
    colorsampling: 1,
    numberofcolors: 16,
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
