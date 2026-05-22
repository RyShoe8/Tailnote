import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeTemplateCarousel } from '@/components/marketing/HomeTemplateCarousel';
import { sortPresetsForHomeShowcase } from '@/lib/marketing/homeTemplateShowcaseOrder';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

type Props = {
  presets: CatalogPresetRow[];
};

export function HomeTemplateShowcase({ presets }: Props) {
  const ordered = sortPresetsForHomeShowcase(presets);
  if (ordered.length === 0) return null;

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
      <HomeTemplateCarousel presets={ordered} />
    </section>
  );
}
