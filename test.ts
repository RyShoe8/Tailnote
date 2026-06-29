import fs from 'fs';
import { rasterToVectorSvg } from './lib/bimi/vectorizer';
import sharp from 'sharp';

async function run() {
  try {
    const buffer = await sharp({
      create: {
        width: 479,
        height: 247,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 }
      }
    }).png().toBuffer();
    
    const { svg } = await rasterToVectorSvg(buffer);
    console.log("Success:", svg.substring(0, 100));
  } catch (err) {
    console.error("Crash:", err);
  }
}
run();
