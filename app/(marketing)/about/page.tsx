import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { MarketingDocPage } from '@/components/marketing/MarketingDocPage';
import { JsonLd } from '@/components/seo/JsonLd';
import { aboutContent, LEGAL_LAST_UPDATED } from '@/lib/marketing/legalContent';
import { aboutPageJsonLd, marketingBreadcrumbJsonLd } from '@/lib/seo/jsonLd';
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
        data={[
          aboutPageJsonLd({
            path: aboutPage.path,
            name: aboutContent.title,
            description: aboutPage.description,
          }),
          marketingBreadcrumbJsonLd(aboutPage.title, aboutPage.path),
        ]}
      />
      <div className="relative isolate overflow-hidden">
        <FloatingOrbs
          orbs={[
            {
              size: 280,
              position: 'left-[-5rem] top-[-2rem]',
              background:
                'radial-gradient(circle at 30% 30%, rgba(12,143,163,0.22), rgba(12,143,163,0) 70%)',
              blur: 18,
              animationClass: 'tn-float-slow',
              opacity: 0.85,
            },
          ]}
        />
        <MarketingDocPage
          title={aboutContent.title}
          lastUpdated={LEGAL_LAST_UPDATED}
          intro={aboutContent.intro}
          sections={aboutContent.sections}
        />
      </div>
    </>
  );
}
