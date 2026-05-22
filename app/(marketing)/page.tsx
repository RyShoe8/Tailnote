import { HomeHero } from '@/components/marketing/HomeHero';
import { HomeFeatures } from '@/components/marketing/HomeFeatures';
import { HomeHowItWorks } from '@/components/marketing/HomeHowItWorks';
import { HomePromoBlocksShowcase } from '@/components/marketing/HomePromoBlocksShowcase';
import { HomeTemplateShowcase } from '@/components/marketing/HomeTemplateShowcase';
import { HomePricingTeaser } from '@/components/marketing/HomePricingTeaser';
import { HomeFAQ } from '@/components/marketing/HomeFAQ';
import { HomeFinalCta } from '@/components/marketing/HomeFinalCta';
import { JsonLd } from '@/components/seo/JsonLd';
import { getPublicPricingPlans } from '@/lib/billing/getPublicPricingPlans';
import { HOME_FAQS } from '@/lib/seo/homeFaq';
import {
  faqPageJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';

export const dynamic = 'force-dynamic';

const homePage = marketingPageByKey('home');

export const metadata = createPageMetadata({
  title: homePage.title,
  description: homePage.description,
  path: homePage.path,
});

export default async function HomePage() {
  const [plans, presets] = await Promise.all([getPublicPricingPlans(), getActiveCatalogPresets()]);

  return (
    <div className="min-w-0">
      <JsonLd
        data={[webSiteJsonLd(), softwareApplicationJsonLd(), faqPageJsonLd(HOME_FAQS)]}
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
