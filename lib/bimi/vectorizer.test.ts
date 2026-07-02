import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import sharp from 'sharp';
import {
  BIMI_TARGET_BYTES,
  pickBestTraceResult,
  RASTER_TRACE_PASSES,
  rasterToVectorSvg,
  rasterToVectorSvgWithPass,
  type RasterTraceResult,
} from './vectorizer';

async function flatMonoLogo(): Promise<Buffer> {
  return sharp({
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
}

async function triColorLogo(): Promise<Buffer> {
  return sharp({
    create: {
      width: 200,
      height: 200,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="200" height="200"><rect x="20" y="20" width="80" height="80" fill="#2563eb"/><rect x="100" y="20" width="80" height="80" fill="#dc2626"/><rect x="60" y="100" width="80" height="80" fill="#16a34a"/></svg>',
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
}

async function iconTextLogo(): Promise<Buffer> {
  return sharp({
    create: {
      width: 420,
      height: 180,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="420" height="180">' +
            '<circle cx="70" cy="90" r="48" fill="#ffffff"/>' +
            '<text x="140" y="105" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="#ffffff">Tailnote</text>' +
            '</svg>',
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();
}

describe('vectorizer', () => {
  it('traces flat mono logo under 32KB', async () => {
    const buffer = await flatMonoLogo();
    const result = await rasterToVectorSvgWithPass(buffer, {
      canvasSize: 512,
      colorCount: 'auto',
      engine: 'imagetracer',
    });
    assert.ok(result);
    assert.match(result!.svg, /<svg[\s>]/i);
    assert.match(result!.svg, /viewBox="0 0 512 512"/i);
    assert.ok(!/<image[\s>]/i.test(result!.svg));
    assert.ok(result!.byteSize < BIMI_TARGET_BYTES);
  });

  it('traces multi-color logo under 32KB with palette reduction', async () => {
    const buffer = await triColorLogo();
    const result = await rasterToVectorSvgWithPass(buffer, {
      canvasSize: 512,
      colorCount: 4,
      engine: 'imagetracer',
    });
    assert.ok(result);
    assert.ok(result!.byteSize < BIMI_TARGET_BYTES);
    assert.match(result!.svg, /<path/i);
  });

  it('traces icon+text logo with potrace posterize under 32KB', async () => {
    const buffer = await iconTextLogo();
    const result = await rasterToVectorSvgWithPass(buffer, RASTER_TRACE_PASSES[0], 0);
    assert.ok(result);
    assert.ok(result!.byteSize < BIMI_TARGET_BYTES);
    assert.match(result!.svg, /viewBox="0 0 1024 1024"/i);
    const pathCount = (result!.svg.match(/<path\b/gi) ?? []).length;
    assert.ok(pathCount >= 3, `expected multiple paths for icon+text, got ${pathCount}`);
  });

  it('ladder picks a passing trace for icon+text logo', async () => {
    const buffer = await iconTextLogo();
    const results: RasterTraceResult[] = [];
    for (let i = 0; i < RASTER_TRACE_PASSES.length; i++) {
      const result = await rasterToVectorSvgWithPass(buffer, RASTER_TRACE_PASSES[i], i);
      if (result) results.push(result);
    }
    const best = pickBestTraceResult(results);
    assert.ok(best);
    assert.ok(best!.byteSize < BIMI_TARGET_BYTES);
    assert.match(best!.svg, /<path/i);
  });

  it('rasterToVectorSvg returns warnings and valid svg', async () => {
    const { svg, warnings } = await rasterToVectorSvg(await flatMonoLogo());
    assert.match(svg, /<svg[\s>]/i);
    assert.ok(warnings.length >= 1);
    assert.ok(Buffer.byteLength(svg, 'utf8') < BIMI_TARGET_BYTES);
  });

  it('pickBestTraceResult prefers earliest passing pass', () => {
    const results: RasterTraceResult[] = [
      { svg: '<svg/>', warnings: [], passLabel: 'p0', passIndex: 0, byteSize: 10000 },
      { svg: '<svg/>', warnings: [], passLabel: 'p2', passIndex: 2, byteSize: 3000 },
    ];
    const best = pickBestTraceResult(results);
    assert.equal(best?.passIndex, 0);
  });
});
