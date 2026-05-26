import { EmailClientMock } from '@/components/marketing/EmailClientMock';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';

export function MarketingPromoInEmailShowcase() {
  const signatureHtml = stripSignaturePreviewLinks(renderMarketingSample('creator'));

  return (
    <div className="mx-auto max-w-lg">
      <EmailClientMock signatureHtml={signatureHtml} />
    </div>
  );
}
