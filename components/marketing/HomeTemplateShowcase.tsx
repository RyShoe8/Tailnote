import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

type Props = {
  presets: CatalogPresetRow[];
};

export function HomeTemplateShowcase({ presets }: Props) {
  if (presets.length === 0) return null;

  return (
    <section className="container py-16 sm:py-20 lg:py-24">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Templates</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Layouts built for signatures <span className="tn-grad-text">and</span> promos
          </h2>
          <p className="mt-3 text-muted-foreground">
            Real customer-style examples with promotional blocks — so you can see how Tailnote turns
            email into a marketing channel.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 self-start gap-2 sm:self-auto">
          <Link href="/templates">
            View all templates
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {presets.map((preset) => {
          const presetId = preset.presetId as TemplatePresetId;
          return (
            <article
              key={preset.presetId}
              className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-ring"
            >
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{preset.name}</h3>
                {preset.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{preset.description}</p>
                ) : null}
              </div>
              <div className="bg-gradient-to-b from-slate-50/50 to-white p-6">
                <div className="overflow-hidden rounded-lg transition-transform duration-500 group-hover:scale-[1.01]">
                  <MarketingLiveSignaturePreview
                    presetId={presetId}
                    html={stripSignaturePreviewLinks(renderMarketingSample(presetId))}
                    className="signature-email-preview--static"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
