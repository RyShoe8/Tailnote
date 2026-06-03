'use client';

import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';

type Props = {
  html: string;
  presetId?: TemplatePresetId;
};

/** Hero mock signature — scales to fit without horizontal scroll on narrow viewports. */
export function HeroSignaturePreview({ html, presetId = 'default' }: Props) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-3 text-left sm:p-4">
      <MarketingLiveSignaturePreview
        presetId={presetId}
        html={html}
        appearance="flat"
        fitContained
        className="signature-email-preview--static"
      />
    </div>
  );
}
