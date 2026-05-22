'use client';

import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';

type Props = {
  html: string;
};

/** Hero mock signature — scales to fit without horizontal scroll on narrow viewports. */
export function HeroSignaturePreview({ html }: Props) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-3 text-left sm:p-4">
      <MarketingLiveSignaturePreview
        presetId="default"
        html={html}
        appearance="flat"
        fitContained
        className="signature-email-preview--static"
      />
    </div>
  );
}
