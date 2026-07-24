import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroEmailCarousel, type PresetData } from '@/components/marketing/HeroEmailCarousel';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import { sortPresetsForHomeShowcase } from '@/lib/marketing/homeTemplateShowcaseOrder';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';
import type { TemplatePresetId } from '@/lib/email/templatePresets';

type Props = {
  presets: CatalogPresetRow[];
};

export function HomeHero({ presets }: Props) {
  const ordered = sortPresetsForHomeShowcase(presets);
  const carouselPresets: PresetData[] = ordered.map((p) => {
    const presetId = p.presetId as TemplatePresetId;
    return {
      presetId,
      html: stripSignaturePreviewLinks(renderMarketingSample(presetId)),
    };
  });

  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div className="container relative pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="tn-rise">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              New: Modern Professional template
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-7xl">
              Every email you send is a chance to{' '}
              <br className="hidden sm:block" />
              <span className="tn-grad-text">market your business</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-xl">
              Tailnote pairs on-brand email signatures with promotional content
              blocks and built-in UTM tracking — so every message drives clicks
              and shows you what&apos;s working. Built for solopreneurs and small
              teams. No IT, no OAuth, ready in two minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2 px-8 py-6 text-base shadow-card tn-glow">
                <Link href="/signup">
                  Get started free
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="tn-rise tn-rise-delay-2 mx-auto mt-16 max-w-3xl sm:mt-24">
          <HeroEmailCarousel presets={carouselPresets} />
          
          <p className="mt-8 text-center text-sm text-muted-foreground sm:mt-12 font-medium">
            Works with Gmail, Outlook &amp; Apple Mail · Free plan available · Setup in 2 minutes
          </p>
        </div>
      </div>
    </section>
  );
}
