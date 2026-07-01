import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import sharp from 'sharp';
import { pickBestTraceResult, RASTER_TRACE_PASSES } from './vectorizer';

// Import internal helpers via module re-exports
import { oversizeErrorMessage, getBimiLogoBlobPath, BIMI_BLOB_PUT_OPTIONS } from './convertToBimiSvg';

describe('convertToBimiSvg helpers', () => {
  it('oversizeErrorMessage mentions 32KB and designer SVG', () => {
    const msg = oversizeErrorMessage(114 * 1024);
    assert.match(msg, /32KB/i);
    assert.match(msg, /SVG/i);
  });

  it('RASTER_TRACE_PASSES includes imagetracer fallback passes', () => {
    assert.equal(RASTER_TRACE_PASSES.length, 4);
    assert.equal(RASTER_TRACE_PASSES[0]?.engine, 'imagetracer');
    assert.equal(RASTER_TRACE_PASSES[3]?.floatPrecision, 0);
  });

  it('pickBestTraceResult returns null when all passes exceed limit', () => {
    const best = pickBestTraceResult([
      {
        svg: '<svg/>',
        warnings: [],
        passLabel: 'big',
        passIndex: 0,
        byteSize: 40 * 1024,
      },
    ]);
    assert.equal(best, null);
  });

  it('getBimiLogoBlobPath uses a stable path per organization', () => {
    const orgId = 'org123';
    assert.equal(getBimiLogoBlobPath(orgId), `tailnote/orgs/${orgId}/bimi/bimi-logo.svg`);
    assert.equal(getBimiLogoBlobPath(orgId), getBimiLogoBlobPath(orgId));
  });

  it('BIMI_BLOB_PUT_OPTIONS allows overwriting the stable logo path', () => {
    assert.equal(BIMI_BLOB_PUT_OPTIONS.allowOverwrite, true);
    assert.equal(BIMI_BLOB_PUT_OPTIONS.cacheControlMaxAge, 60);
    assert.equal(BIMI_BLOB_PUT_OPTIONS.access, 'public');
  });
});

describe('convertToBimiSvg ladder integration', () => {
  it('sharp synthetic logo produces a small traced svg on first pass', async () => {
    const buffer = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="128" height="128"><rect x="16" y="16" width="96" height="96" rx="12" fill="#111827"/></svg>',
          ),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    const { rasterToVectorSvgWithPass } = await import('./vectorizer');
    const first = await rasterToVectorSvgWithPass(buffer, RASTER_TRACE_PASSES[0], 0);
    assert.ok(first);
    assert.ok(first!.byteSize < 32 * 1024);
  });
});
