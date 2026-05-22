import { MarketingDocPage } from '@/components/marketing/MarketingDocPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { LEGAL_LAST_UPDATED, privacyContent } from '@/lib/marketing/legalContent';
import { webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

const privacyPage = marketingPageByKey('privacy');

export const metadata = createPageMetadata({
  title: privacyPage.title,
  description: privacyPage.description,
  path: privacyPage.path,
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          path: privacyPage.path,
          name: privacyContent.title,
          description: privacyPage.description,
          dateModified: LEGAL_LAST_UPDATED,
        })}
      />
      <MarketingDocPage
      title={privacyContent.title}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={privacyContent.intro}
      sections={privacyContent.sections}
    />
    </>
  );
}
