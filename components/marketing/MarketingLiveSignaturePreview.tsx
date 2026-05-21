'use client';

import { SignaturePreviewFrame } from '@/components/signature/SignaturePreviewFrame';
import { presetToEngineTemplate, type TemplatePresetId } from '@/lib/email/templatePresets';
import type { SignatureLayout } from 'emailsignature-engine';

/** Wider than dashboard mobile preview; fills marketing card column up to cap. */
const MARKETING_MOBILE_FRAME_WIDTH = 600;
const MARKETING_STACKED_MOBILE_FRAME_WIDTH = 620;

function marketingMobileFrameWidthForLayout(layout?: SignatureLayout): number {
  if (layout === 'stacked') return MARKETING_STACKED_MOBILE_FRAME_WIDTH;
  return MARKETING_MOBILE_FRAME_WIDTH;
}

type Props = {
  presetId: TemplatePresetId;
  html: string;
  className?: string;
};

/** Live marketing signature in a phone-width frame so @media mobile rules apply. */
export function MarketingLiveSignaturePreview({ presetId, html, className }: Props) {
  const layout = presetToEngineTemplate(presetId, `marketing-preview-${presetId}`).layout;

  return (
    <div
      className={
        className
          ? `${className} mx-auto flex w-full min-w-0 max-w-none justify-center`
          : 'mx-auto flex w-full min-w-0 max-w-none justify-center'
      }
    >
      <SignaturePreviewFrame
        html={html}
        variant="mobile"
        previewContext="marketing"
        mobileFrameWidth={marketingMobileFrameWidthForLayout(layout)}
      />
    </div>
  );
}
