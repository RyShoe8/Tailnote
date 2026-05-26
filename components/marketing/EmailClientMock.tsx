import { HeroSignaturePreview } from '@/components/marketing/HeroSignaturePreview';
import { MarketingEmailClientFrame } from '@/components/marketing/MarketingEmailClientFrame';

type Props = {
  signatureHtml: string;
};

/**
 * Marketing hero illustration: realistic email composer window with a live
 * Tailnote signature rendered inside. Server component — `signatureHtml` is
 * produced via `renderMarketingSample` (`emailsignature-engine`).
 */
export function EmailClientMock({ signatureHtml }: Props) {
  return (
    <MarketingEmailClientFrame layout="hero" showAmbience>
      <HeroSignaturePreview html={signatureHtml} />
    </MarketingEmailClientFrame>
  );
}
