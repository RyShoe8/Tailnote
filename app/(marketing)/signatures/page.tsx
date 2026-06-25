import { connectMongoose } from '@/lib/mongoose';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';
import { FloatingOrbs } from '@/components/marketing/FloatingOrbs';
import { HomePromoBlocksShowcase } from '@/components/marketing/HomePromoBlocksShowcase';
import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';
import { RevealOnScroll } from '@/components/marketing/RevealOnScroll';
import { JsonLd } from '@/components/seo/JsonLd';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import { itemListJsonLd, marketingBreadcrumbJsonLd, webPageJsonLd } from '@/lib/seo/jsonLd';
import { createPageMetadata } from '@/lib/seo/metadata';
import { marketingPageByKey } from '@/lib/seo/marketingPages';

export const dynamic = 'force-dynamic';

const signaturesPage = marketingPageByKey('signatures');

export const metadata = createPageMetadata({
  title: signaturesPage.title,
  description: signaturesPage.description,
  path: signaturesPage.path,
});

export default async function SignaturesMarketingPage() {
  await connectMongoose();
  const presets = await getActiveCatalogPresets();

  const listItems = presets.map((t) => ({
    name: t.name,
    description: t.description?.trim() || undefined,
  }));

  return (
    <div className="relative isolate">
      <JsonLd
        data={[
          webPageJsonLd({
            path: signaturesPage.path,
            name: signaturesPage.title,
            description: signaturesPage.description,
          }),
          marketingBreadcrumbJsonLd(signaturesPage.title, signaturesPage.path),
          ...(listItems.length > 0 ? [itemListJsonLd(listItems)] : []),
        ]}
      />
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[24rem]"
      />
      <FloatingOrbs />
      <div className="container relative py-14 sm:py-20">
        <div className="tn-rise mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Signatures</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Professional email <span className="tn-grad-text">signatures</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Browse our collection of email signature layouts, each designed to maximize click-through
            rates and look pixel-perfect in Gmail, Outlook, and Apple Mail.
          </p>
        </div>
        {presets.length === 0 ? (
          <p className="mx-auto mt-12 max-w-md text-center text-sm text-muted-foreground">
            No signatures are currently available.
          </p>
        ) : (
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2">
            {presets.map((t, index) => {
              const presetId = t.presetId as TemplatePresetId;
              return (
                <RevealOnScroll key={t.presetId} delayMs={index * 70} as="article" className="min-w-0">
                  <div className="group h-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-float ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-ring">
                    <div className="border-b border-slate-100 px-6 py-5">
                      <h2 className="text-lg font-semibold tracking-tight text-foreground">{t.name}</h2>
                      {t.description ? (
                        <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                      ) : null}
                    </div>
                    <div className="bg-gradient-to-b from-slate-50/50 to-white p-6">
                      <div className="overflow-x-visible overflow-y-visible rounded-lg transition-transform duration-500 group-hover:scale-[1.01]">
                        <MarketingLiveSignaturePreview
                          presetId={presetId}
                          html={stripSignaturePreviewLinks(renderMarketingSample(presetId))}
                          className="signature-email-preview--static"
                        />
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        )}
      </div>
      <HomePromoBlocksShowcase />
    </div>
  );
}
