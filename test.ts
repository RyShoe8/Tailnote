import fs from 'fs';
import { rasterToVectorSvg } from './lib/bimi/vectorizer';
import sharp from 'sharp';

async function run() {
  const buffer = await sharp({
    create: {
      width: 479,
      height: 247,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  }).png().toBuffer();
  
  const { svg } = await rasterToVectorSvg(buffer);
  console.log(svg.substring(0, 500));
}
run();
