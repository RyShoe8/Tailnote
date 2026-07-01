/**
 * Smoke test for BIMI raster-to-SVG conversion.
 */
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  rasterToVectorSvg,
  rasterToVectorSvgWithPass,
  normalizeSvgViewBox,
  RASTER_TRACE_PASSES,
  pickBestTraceResult,
  BIMI_TARGET_BYTES,
} from '../lib/bimi/vectorizer';

async function run() {
  const logoBuffer = await sharp({
    create: {
      width: 240,
      height: 240,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="240" height="240"><circle cx="120" cy="120" r="72" fill="#ffffff"/></svg>',
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  const ladderResults = [];
  for (let i = 0; i < RASTER_TRACE_PASSES.length; i++) {
    const result = await rasterToVectorSvgWithPass(logoBuffer, RASTER_TRACE_PASSES[i], i);
    if (result) ladderResults.push(result);
  }
  const best = pickBestTraceResult(ladderResults);
  assert.ok(best, 'expected at least one ladder pass under 32KB');
  assert.ok(best!.byteSize < BIMI_TARGET_BYTES);

  const { svg, warnings } = await rasterToVectorSvg(logoBuffer);
  assert.match(svg, /<svg[\s>]/i);
  assert.match(svg, /viewBox="0 0 512 512"/i);
  assert.ok(!/<image[\s>]/i.test(svg));
  assert.ok(svg.length < BIMI_TARGET_BYTES, `SVG too large: ${svg.length} bytes`);
  assert.ok(warnings.length >= 1);

  const normalized = normalizeSvgViewBox('<svg width="100" height="50"><rect width="100" height="50"/></svg>');
  assert.match(normalized, /viewBox="0 0 512 512"/i);

  process.stdout.write('vectorizer-smoke: ok\n');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
