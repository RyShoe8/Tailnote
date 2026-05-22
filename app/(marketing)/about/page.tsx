import { MarketingDocPage } from '@/components/marketing/MarketingDocPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { aboutContent, LEGAL_LAST_UPDATED } from '@/lib/marketing/legalContent';
import { aboutPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

const aboutPage = marketingPageByKey('about');

export const metadata = createPageMetadata({
  title: aboutPage.title,
  description: aboutPage.description,
  path: aboutPage.path,
});

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={aboutPageJsonLd({
          path: aboutPage.path,
          name: aboutContent.title,
          description: aboutPage.description,
        })}
      />
      <MarketingDocPage
      title={aboutContent.title}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={aboutContent.intro}
      sections={aboutContent.sections}
    />
    </>
  );
}
