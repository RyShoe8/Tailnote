import '@/lib/billing-engine';
import { HomeHero } from '@/components/marketing/HomeHero';
import { HomeFeatures } from '@/components/marketing/HomeFeatures';
import { HomeHowItWorks } from '@/components/marketing/HomeHowItWorks';
import { HomePromoBlocksShowcase } from '@/components/marketing/HomePromoBlocksShowcase';
import { HomeTemplateShowcase } from '@/components/marketing/HomeTemplateShowcase';
import { HomePricingTeaser } from '@/components/marketing/HomePricingTeaser';
import { HomeFAQ } from '@/components/marketing/HomeFAQ';
import { HomeFinalCta } from '@/components/marketing/HomeFinalCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPublicPricingPlans } from 'billing-engine';
import { HOME_FAQS } from '@/lib/seo/homeFaq';
import {
  faqPageJsonLd,
  softwareApplicationJsonLd,
  webPageJsonLd,
  webSiteJsonLd,
} from '@/lib/seo/jsonLd';
import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';
import { SITE_TITLE_DEFAULT } from '@/lib/seo/site';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';

export const dynamic = 'force-dynamic';

const homePage = marketingPageByKey('home');

export const metadata: Metadata = {
  ...createPageMetadata({
    title: homePage.title,
    description: homePage.description,
    path: homePage.path,
  }),
  title: { absolute: SITE_TITLE_DEFAULT },
  openGraph: {
    title: SITE_TITLE_DEFAULT,
    description: homePage.description,
  },
  twitter: {
    title: SITE_TITLE_DEFAULT,
    description: homePage.description,
  },
};

export default async function HomePage() {
  const [plans, presets] = await Promise.all([getPublicPricingPlans(), getActiveCatalogPresets()]);

  return (
    <div className="min-w-0">
      <JsonLd
        data={[
          webSiteJsonLd(),
          webPageJsonLd({
            path: homePage.path,
            name: homePage.title,
            description: homePage.description,
          }),
          softwareApplicationJsonLd(),
          faqPageJsonLd(HOME_FAQS),
        ]}
      />
      <HomeHero />
      <HomeFeatures />
      <HomeTemplateShowcase presets={presets} />
      <HomeHowItWorks />
      <HomePromoBlocksShowcase />
      <HomePricingTeaser plans={plans} />
      <HomeFAQ />
      <HomeFinalCta />
    </div>
  );
}
