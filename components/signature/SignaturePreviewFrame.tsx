'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { SignatureLayout } from 'emailsignature-engine';

type Props = {
  html: string;
  animationKey?: string | number;
  variant?: 'desktop' | 'mobile';
  /** Mobile frame width in CSS px; stacked layout uses a slightly wider frame. */
  mobileFrameWidth?: number;
  /** Marketing cards use wider frames, visible overflow, and centered scale for non-prof layouts. */
  previewContext?: 'dashboard' | 'marketing';
};

export const DEFAULT_MOBILE_FRAME_WIDTH = 404;
export const STACKED_MOBILE_FRAME_WIDTH = 420;

const CLIP_PADDING_PX = 2;
const PROF_CARD_SHELL_BLEED_PX = 8;

export function mobileFrameWidthForLayout(layout?: SignatureLayout): number {
  if (layout === 'stacked') return STACKED_MOBILE_FRAME_WIDTH;
  return DEFAULT_MOBILE_FRAME_WIDTH;
}

function measureContentSize(content: HTMLElement): { width: number; height: number } {
  const rect = content.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width), content.scrollWidth);
  const height = Math.max(1, Math.ceil(rect.height), content.scrollHeight);
  return { width, height };
}

/**
 * Renders signature HTML in either a flexible desktop card or a phone-sized
 * mobile frame. The mobile variant:
 *   - constrains width (default 404px; wider when `mobileFrameWidth` is set for stacked)
 *   - measures intrinsic content width/height, scales down if needed
 *   - clips using an outer box sized to the scaled footprint so transforms do not
 *     spill past overflow:hidden (avoids right-edge clipping)
 */
export function SignaturePreviewFrame({
  html,
  animationKey = 0,
  variant = 'desktop',
  mobileFrameWidth = DEFAULT_MOBILE_FRAME_WIDTH,
  previewContext = 'dashboard',
}: Props) {
  if (variant === 'mobile') {
    return (
      <MobileSignaturePreviewFrame
        html={html}
        animationKey={animationKey}
        mobileFrameWidth={mobileFrameWidth}
        previewContext={previewContext}
      />
    );
  }

  return (
    <div className="max-w-full w-full min-w-0">
      <div className="signature-email-preview rounded-md border bg-white p-6 text-left overflow-x-auto overflow-y-visible min-h-[280px]">
        <div
          key={animationKey}
          style={{ minWidth: 660 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}

function MobileSignaturePreviewFrame({
  html,
  animationKey,
  mobileFrameWidth,
  previewContext,
}: {
  html: string;
  animationKey: string | number;
  mobileFrameWidth: number;
  previewContext: 'dashboard' | 'marketing';
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [naturalW, setNaturalW] = useState(1);
  const [naturalH, setNaturalH] = useState(1);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const measure = () => {
      if (!frameRef.current || !contentRef.current) return;
      const frameW = frameRef.current.clientWidth || mobileFrameWidth;
      const { width: nw, height: nh } = measureContentSize(contentRef.current);
      const nextScale = nw > 0 ? Math.min(1, frameW / nw) : 1;
      setNaturalW(nw);
      setNaturalH(nh);
      setScale(nextScale);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(frame);
    ro.observe(content);
    window.addEventListener('resize', measure);
    const onLoad = () => measure();
    content.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', onLoad, { once: true });
    });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [html, animationKey, mobileFrameWidth]);

  const hasProfCardShell = html.includes('sig-prof-card-shell');
  const hasExecutiveRoot = html.includes('sig-executive-root');
  const isMarketing = previewContext === 'marketing';
  const useVisibleOverflow = hasProfCardShell || (isMarketing && !hasExecutiveRoot);
  const useCenteredScale = isMarketing && !hasProfCardShell && !hasExecutiveRoot;
  const borderBleed = hasProfCardShell ? PROF_CARD_SHELL_BLEED_PX : 0;
  const clipPad = hasProfCardShell ? CLIP_PADDING_PX : 0;
  const scaledW = Math.ceil(naturalW * scale) + borderBleed + clipPad * 2;
  const scaledH = Math.ceil(naturalH * scale) + borderBleed + clipPad * 2;

  return (
    <div
      ref={frameRef}
      className="signature-email-preview signature-email-preview--mobile sig-mobile-preview-container w-full rounded-md border bg-white p-4 text-left overflow-x-auto"
      style={{ maxWidth: mobileFrameWidth, minHeight: 200 }}
    >
      <div
        style={{
          width: scaledW,
          maxWidth: '100%',
          height: scaledH,
          overflow: useVisibleOverflow ? 'visible' : 'hidden',
          boxSizing: 'border-box',
          padding: clipPad,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          key={animationKey}
          style={{
            width: naturalW,
            marginLeft: useCenteredScale ? 'auto' : undefined,
            marginRight: useCenteredScale ? 'auto' : undefined,
            transformOrigin: useCenteredScale ? 'top center' : 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <div ref={contentRef} className="mobile-signature-scale-root" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}
