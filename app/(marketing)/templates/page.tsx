import { connectMongoose } from '@/lib/mongoose';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';
import { MarketingSignaturePreview } from '@/components/marketing/MarketingSignaturePreview';
import { HomePromoBlocksShowcase } from '@/components/marketing/HomePromoBlocksShowcase';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Templates — Tailnote',
};

export default async function TemplatesMarketingPage() {
  await connectMongoose();
  const presets = await getActiveCatalogPresets();

  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="tn-grad-bg-soft pointer-events-none absolute inset-x-0 -top-20 -z-10 h-[24rem]"
      />
      <div className="container py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Templates</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Signature + promo <span className="tn-grad-text">templates</span>
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            Curated layouts with promotional content blocks built in — book-a-call buttons, offer
            lists, blog feeds, and image banners beside every signature. No drag-and-drop chaos; HTML
            that works in real inboxes.
          </p>
        </div>
        {presets.length === 0 ? (
          <p className="mx-auto mt-12 max-w-md text-center text-sm text-muted-foreground">
            No templates are currently available.
          </p>
        ) : (
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2">
            {presets.map((t) => {
              const presetId = t.presetId as TemplatePresetId;
              return (
                <article
                  key={t.presetId}
                  className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ring"
                >
                  <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{t.name}</h2>
                    {t.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
                    ) : null}
                  </div>
                  <div className="bg-gradient-to-b from-slate-50/50 to-white p-6">
                    <div className="overflow-hidden rounded-lg transition-transform duration-500 group-hover:scale-[1.01]">
                      <MarketingSignaturePreview
                        html={renderMarketingSample(presetId)}
                        alt={`${t.name} signature example`}
                        className="signature-email-preview min-w-0 overflow-x-auto rounded-md border bg-white p-3 text-left"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <HomePromoBlocksShowcase />
    </div>
  );
}
