import { MarketingDocPage } from '@/components/marketing/MarketingDocPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { LEGAL_LAST_UPDATED, termsContent } from '@/lib/marketing/legalContent';
import { marketingBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

const termsPage = marketingPageByKey('terms');

export const metadata = createPageMetadata({
  title: termsPage.title,
  description: termsPage.description,
  path: termsPage.path,
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageJsonLd({
            path: termsPage.path,
            name: termsContent.title,
            description: termsPage.description,
            dateModified: LEGAL_LAST_UPDATED,
          }),
          marketingBreadcrumbJsonLd(termsPage.title, termsPage.path),
        ]}
      />
      <MarketingDocPage
      title={termsContent.title}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={termsContent.intro}
      sections={termsContent.sections}
    />
    </>
  );
}
