'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

type Props = {
  presets: CatalogPresetRow[];
};

export function HomeTemplateCarousel({ presets }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track || presets.length === 0) return;
    const slideWidth = track.clientWidth;
    if (slideWidth <= 0) return;
    const index = Math.round(track.scrollLeft / slideWidth);
    setActiveIndex(Math.min(Math.max(0, index), presets.length - 1));
  }, [presets.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateActiveIndex();
    track.addEventListener('scroll', updateActiveIndex, { passive: true });
    window.addEventListener('resize', updateActiveIndex);
    return () => {
      track.removeEventListener('scroll', updateActiveIndex);
      window.removeEventListener('resize', updateActiveIndex);
    };
  }, [updateActiveIndex]);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(Math.max(0, index), presets.length - 1);
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
    setActiveIndex(clamped);
  }

  function scrollBySlide(delta: number) {
    scrollToIndex(activeIndex + delta);
  }

  if (presets.length === 0) return null;

  return (
    <div className="relative mt-10">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-16 bg-gradient-to-r from-background to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-16 bg-gradient-to-l from-background to-transparent sm:block" />

      <div
        ref={trackRef}
        className="hide-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        role="region"
        aria-roledescription="carousel"
        aria-label="Signature template previews"
      >
        {presets.map((preset) => {
          const presetId = preset.presetId as TemplatePresetId;
          return (
            <article
              key={preset.presetId}
              className="w-full shrink-0 snap-center px-0.5 sm:px-1"
              aria-roledescription="slide"
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {preset.name}
                  </h3>
                  {preset.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{preset.description}</p>
                  ) : null}
                </div>
                <div className="bg-gradient-to-b from-slate-50/50 to-white p-6">
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

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Previous template"
          disabled={activeIndex <= 0}
          onClick={() => scrollBySlide(-1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Template slides">
          {presets.map((preset, index) => (
            <button
              key={preset.presetId}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Show ${preset.name} template`}
              className={`h-2.5 rounded-full transition-all ${
                index === activeIndex
                  ? 'w-8 bg-primary'
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              onClick={() => scrollToIndex(index)}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Next template"
          disabled={activeIndex >= presets.length - 1}
          onClick={() => scrollBySlide(1)}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
