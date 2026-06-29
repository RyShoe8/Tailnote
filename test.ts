import fs from 'fs';
import ImageTracer from 'imagetracerjs';
import sharp from 'sharp';
import { optimize } from 'svgo';

async function run() {
  const buffer = await sharp({
    create: {
      width: 400,
      height: 400,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  }).png().toBuffer();
  
  const withText = await sharp(buffer)
    .composite([{
      input: Buffer.from('<svg><text x="50" y="50" font-size="24" fill="white">Hello</text></svg>'),
      top: 0,
      left: 0,
    }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const imgData = { width: withText.info.width, height: withText.info.height, data: new Uint8Array(withText.data) };
  
  const options = {
    corshrink: 1.5,
    scale: 1,
    ltres: 1.0,
    qtres: 1.0,
    blurradius: 1,
    colorsampling: 1,
    numberofcolors: 4,
    pathomit: 16,
    rightangleenhance: false
  };

  const svgString = ImageTracer.imagedataToSVG(imgData, options);
  
  const optimized = optimize(svgString, {
    multipass: true,
    floatPrecision: 1,
    plugins: ['preset-default']
  });
  
  console.log("Size:", optimized.data.length);
}
run();
