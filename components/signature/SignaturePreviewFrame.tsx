'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { SignatureLayout } from 'emailsignature-engine';

type Props = {
  html: string;
  animationKey?: string | number;
  variant?: 'desktop' | 'mobile';
  /** Mobile frame width in CSS px; stacked layout uses a slightly wider frame. */
  mobileFrameWidth?: number;
  /** Marketing cards fill the template column up to `mobileFrameWidth` and use fill-width measurement. */
  previewContext?: 'dashboard' | 'marketing';
  /** Flat: no inner card border/padding (dashboard mobile, marketing carousel). */
  appearance?: 'card' | 'flat';
  /** Marketing: scale to fit without scrollbars. */
  fitContained?: boolean;
};

export const DEFAULT_MOBILE_FRAME_WIDTH = 480;
export const STACKED_MOBILE_FRAME_WIDTH = 500;

const CLIP_PADDING_PX = 2;
const PROF_CARD_SHELL_BLEED_PX = 8;
/** Horizontal inset when marketing previews scale to fit (homepage carousel). */
const MARKETING_FIT_INSET_PX = 20;
/** Horizontal inset when dashboard mobile preview scales to fit its card. */
const DASHBOARD_FIT_INSET_PX = 18;
/** Extra clip room for Professional card border/radius in marketing fitContained mode. */
const MARKETING_PROF_CARD_SHELL_BLEED_PX = 16;

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
 *   - constrains width (default 480px; wider when `mobileFrameWidth` is set for stacked)
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
  appearance = 'card',
  fitContained = false,
}: Props) {
  if (variant === 'mobile') {
    return (
      <MobileSignaturePreviewFrame
        html={html}
        animationKey={animationKey}
        mobileFrameWidth={mobileFrameWidth}
        previewContext={previewContext}
        appearance={appearance}
        fitContained={fitContained}
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
  appearance,
  fitContained,
}: {
  html: string;
  animationKey: string | number;
  mobileFrameWidth: number;
  previewContext: 'dashboard' | 'marketing';
  appearance: 'card' | 'flat';
  fitContained: boolean;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const [naturalW, setNaturalW] = useState(1);
  const [naturalH, setNaturalH] = useState(1);
  const [scale, setScale] = useState(1);
  const isMarketing = previewContext === 'marketing';
  const isDashboard = previewContext === 'dashboard';
  const isFlat = appearance === 'flat';
  const useFillWidth = isMarketing || isDashboard;

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;
    if (!frame || !content) return;

    const measure = () => {
      if (!frameRef.current || !contentRef.current) return;
      const frameW = frameRef.current.clientWidth || mobileFrameWidth;
      const marketingInset = isFlat ? 0 : 8;
      const scaleFrameW = isMarketing ? Math.max(1, frameW - marketingInset) : frameW;
      const useFitInset = (fitContained && isMarketing) || isDashboard;
      const fitInsetPx =
        fitContained && isMarketing ? MARKETING_FIT_INSET_PX : DASHBOARD_FIT_INSET_PX;
      const fitScaleW = useFitInset
        ? Math.max(1, scaleFrameW - fitInsetPx)
        : scaleFrameW;

      const transformEl = transformRef.current;
      if (transformEl) transformEl.style.width = '';

      let { width: nw, height: nh } = measureContentSize(contentRef.current);

      // Dashboard only: Professional card shells hug content. Marketing should fill so
      // the carousel doesn't leave a tiny card (scale is capped at 1).
      const skipFillWidth =
        isDashboard && contentRef.current.innerHTML.includes('sig-prof-card-shell');
      if (useFillWidth && !skipFillWidth && nw < fitScaleW * 0.9 && transformEl) {
        transformEl.style.width = `${fitScaleW}px`;
        ({ width: nw, height: nh } = measureContentSize(contentRef.current));
      }

      const nextScale = nw > 0 ? Math.min(1, fitScaleW / nw) : 1;
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
  }, [
    html,
    animationKey,
    mobileFrameWidth,
    previewContext,
    isMarketing,
    isDashboard,
    isFlat,
    fitContained,
    useFillWidth,
  ]);

  const hasProfCardShell = html.includes('sig-prof-card-shell');
  const hasExecutiveRoot = html.includes('sig-executive-root');
  const hasCreatorRoot = html.includes('sig-creator-root');
  const useWideMarketingLayout = hasExecutiveRoot || hasCreatorRoot;
  const useContainedOverflow = (fitContained && isMarketing) || isDashboard;
  const useVisibleOverflow =
    useContainedOverflow
      ? false
      : hasProfCardShell || (isMarketing && !useWideMarketingLayout);
  const borderBleed = hasProfCardShell
    ? fitContained && isMarketing
      ? MARKETING_PROF_CARD_SHELL_BLEED_PX
      : isDashboard
        ? MARKETING_PROF_CARD_SHELL_BLEED_PX
        : PROF_CARD_SHELL_BLEED_PX
    : 0;
  const clipPad = hasProfCardShell ? CLIP_PADDING_PX : 0;
  const scaledW = Math.ceil(naturalW * scale) + borderBleed + clipPad * 2;
  const scaledH = Math.ceil(naturalH * scale) + borderBleed + clipPad * 2;
  const frameOverflowX = useContainedOverflow ? 'hidden' : useVisibleOverflow ? 'auto' : 'hidden';
  const frameOverflowY = useContainedOverflow ? 'hidden' : 'visible';

  const frameClassName = isFlat
    ? isMarketing
      ? 'signature-email-preview signature-email-preview--mobile signature-email-preview--marketing sig-mobile-preview-container w-full p-0 text-left'
      : 'signature-email-preview signature-email-preview--mobile sig-mobile-preview-container w-full p-0 text-left'
    : isMarketing
      ? 'signature-email-preview signature-email-preview--mobile signature-email-preview--marketing sig-mobile-preview-container w-full rounded-md border bg-white p-4 text-left'
      : 'signature-email-preview signature-email-preview--mobile sig-mobile-preview-container w-full rounded-md border bg-white p-4 text-left';

  return (
    <div
      ref={frameRef}
      className={frameClassName}
      style={{
        width: useFillWidth ? '100%' : mobileFrameWidth,
        maxWidth: useFillWidth ? '100%' : mobileFrameWidth,
        minHeight: fitContained && isMarketing ? 0 : isDashboard ? 0 : 200,
        overflowX: frameOverflowX,
        overflowY: frameOverflowY,
      }}
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
          ref={transformRef}
          key={animationKey}
          style={{
            width: useFillWidth ? '100%' : naturalW,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <div
            ref={contentRef}
            className="mobile-signature-scale-root"
            style={
              useFillWidth ? { width: '100%', minWidth: 0, boxSizing: 'border-box' } : undefined
            }
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
