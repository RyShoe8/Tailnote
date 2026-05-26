'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HomeTemplateCarousel } from '@/components/marketing/HomeTemplateCarousel';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

type Props = {
  presets: CatalogPresetRow[];
};

/** Buffer so 3D lift and glow stay inside the panel without clipping */
const PANEL_MEASURE_BUFFER_PX = 16;

export function HomeTemplatesShowcasePanel({ presets }: Props) {
  const [panelMinHeight, setPanelMinHeight] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const measure = () => {
      const h = Math.ceil(panel.scrollHeight);
      if (h > 0) setPanelMinHeight(h + PANEL_MEASURE_BUFFER_PX);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(panel);
    panel.querySelectorAll<HTMLElement>('[data-carousel-slide]').forEach((node) => ro.observe(node));

    const onImgLoad = () => measure();
    panel.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', onImgLoad, { once: true });
    });

    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [presets]);

  return (
    <div
      ref={panelRef}
      className="home-templates-showcase-panel relative isolate overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-slate-50/50 to-white p-6 shadow-float ring-1 ring-black/5 sm:p-8 lg:p-10"
      style={panelMinHeight != null ? { minHeight: panelMinHeight } : undefined}
    >
      <div
        data-templates-header
        className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="min-w-0 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Templates</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Layouts built for signatures <span className="tn-grad-text">and</span> promos
          </h2>
          <p className="mt-3 text-muted-foreground">
            Take a look at our templates so you can see how Tailnote turns email into a marketing
            channel.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 self-start gap-2 sm:self-auto">
          <Link href="/templates">
            View all templates
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <HomeTemplateCarousel presets={presets} />
    </div>
  );
}
