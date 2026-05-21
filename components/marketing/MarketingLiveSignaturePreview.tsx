'use client';

import {
  mobileFrameWidthForLayout,
  SignaturePreviewFrame,
} from '@/components/signature/SignaturePreviewFrame';
import { presetToEngineTemplate, type TemplatePresetId } from '@/lib/email/templatePresets';

type Props = {
  presetId: TemplatePresetId;
  html: string;
  className?: string;
};

/** Live marketing signature in a phone-width frame so @media mobile rules apply. */
export function MarketingLiveSignaturePreview({ presetId, html, className }: Props) {
  const layout = presetToEngineTemplate(presetId, `marketing-preview-${presetId}`).layout;

  return (
    <div className={className ?? 'mx-auto flex w-full min-w-0 justify-center'}>
      <SignaturePreviewFrame
        html={html}
        variant="mobile"
        mobileFrameWidth={mobileFrameWidthForLayout(layout)}
      />
    </div>
  );
}
