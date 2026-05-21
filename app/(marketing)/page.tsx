import { HomeHero } from '@/components/marketing/HomeHero';
import { HomeFeatures } from '@/components/marketing/HomeFeatures';
import { HomeHowItWorks } from '@/components/marketing/HomeHowItWorks';
import { HomePromoBlocksShowcase } from '@/components/marketing/HomePromoBlocksShowcase';
import { HomeTemplateShowcase } from '@/components/marketing/HomeTemplateShowcase';
import { HomePricingTeaser } from '@/components/marketing/HomePricingTeaser';
import { HomeFAQ } from '@/components/marketing/HomeFAQ';
import { HomeFinalCta } from '@/components/marketing/HomeFinalCta';
import { getPublicPricingPlans } from '@/lib/billing/getPublicPricingPlans';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tailnote — Email signatures that market your business',
  description:
    'Turn every employee email into a marketing touchpoint with promotional content blocks, built-in UTM tracking, and polished signature templates.',
};

export default async function HomePage() {
  const [plans, presets] = await Promise.all([getPublicPricingPlans(), getActiveCatalogPresets()]);

  return (
    <div className="min-w-0">
      <HomeHero />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomePromoBlocksShowcase />
      <HomeTemplateShowcase presets={presets} />
      <HomePricingTeaser plans={plans} />
      <HomeFAQ />
      <HomeFinalCta />
    </div>
  );
}
