import { HeroSignaturePreview } from '@/components/marketing/HeroSignaturePreview';
import { MarketingEmailClientFrame } from '@/components/marketing/MarketingEmailClientFrame';
import type { TemplatePresetId } from '@/lib/email/templatePresets';

type Props = {
  signatureHtml: string;
  presetId?: TemplatePresetId;
};

/**
 * Marketing hero illustration: realistic email composer window with a live
 * Tailnote signature rendered inside. Server component — `signatureHtml` is
 * produced via `renderMarketingSample` (`emailsignature-engine`).
 */
export function EmailClientMock({ signatureHtml, presetId = 'default' }: Props) {
  return (
    <MarketingEmailClientFrame layout="hero" showAmbience>
      <HeroSignaturePreview html={signatureHtml} presetId={presetId} />
    </MarketingEmailClientFrame>
  );
}
