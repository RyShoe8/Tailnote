import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, SITE_NAME } from '@/lib/seo/site';

async function loadLogoDataUrl(): Promise<string> {
  const buf = await readFile(join(process.cwd(), 'public/images/tailnote-logo.png'));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/** 1200×630 social preview card (Open Graph / Twitter large image). */
export async function createOgImage(): Promise<ImageResponse> {
  const logoSrc = await loadLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0065c9 0%, #0c8fa3 52%, #4fd6b2 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -60,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '56px 64px',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 48,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 520 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- Satori OG renderer requires <img> */}
            <img
              src={logoSrc}
              alt=""
              width={280}
              height={76}
              style={{ objectFit: 'contain', objectPosition: 'left' }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '28px 32px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.22)',
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Email signatures + promo blocks
              </div>
              <div style={{ fontSize: 17, color: 'rgba(255,255,255,0.88)', lineHeight: 1.45 }}>
                On-brand for every send · UTM tracking · Gmail & Outlook
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 440,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(6,40,71,0.35)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 18px',
                background: '#f1f5f9',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              <div style={{ marginLeft: 12, fontSize: 14, color: '#64748b' }}>Inbox — Acme Corp</div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                padding: '24px 22px',
                background: '#ffffff',
              }}
            >
              <div style={{ fontSize: 15, color: '#94a3b8' }}>Thanks for your note —</div>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #0065c9, #4fd6b2)',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Jordan Lee</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>Head of Growth · Acme Corp</div>
                  <div
                    style={{
                      marginTop: 4,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#0065c9',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      alignSelf: 'flex-start',
                    }}
                  >
                    Book a demo →
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 28,
            right: 64,
            fontSize: 15,
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {SITE_NAME}
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    }
  );
}
