'use client';

import { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

const SWIPE_THRESHOLD_PX = 50;

type Props = {
  presets: CatalogPresetRow[];
};

function CarouselPrevButton({
  activeIndex,
  onPrev,
}: {
  activeIndex: number;
  onPrev: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0"
      aria-label="Previous template"
      disabled={activeIndex <= 0}
      onClick={onPrev}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
    </Button>
  );
}

function CarouselNextButton({
  activeIndex,
  presetsLength,
  onNext,
}: {
  activeIndex: number;
  presetsLength: number;
  onNext: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="shrink-0"
      aria-label="Next template"
      disabled={activeIndex >= presetsLength - 1}
      onClick={onNext}
    >
      <ChevronRight className="h-4 w-4" aria-hidden />
    </Button>
  );
}

function CarouselDots({
  activeIndex,
  presets,
  onGoToIndex,
}: {
  activeIndex: number;
  presets: CatalogPresetRow[];
  onGoToIndex: (index: number) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-2"
      role="tablist"
      aria-label="Template slides"
    >
      {presets.map((preset, index) => (
        <button
          key={preset.presetId}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={`Show ${preset.name} template`}
          className={`h-2.5 rounded-full transition-all ${
            index === activeIndex ? 'w-8 bg-primary' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
          }`}
          onClick={() => onGoToIndex(index)}
        />
      ))}
    </div>
  );
}

function TemplateSlide({
  preset,
  isActive,
}: {
  preset: CatalogPresetRow;
  isActive: boolean;
}) {
  const presetId = preset.presetId as TemplatePresetId;

  return (
    <article
      className={isActive ? 'block' : 'hidden'}
      aria-roledescription="slide"
      aria-hidden={!isActive}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="border-b border-slate-100 px-6 py-5">
          <h3
            className="text-lg font-semibold tracking-tight text-foreground"
            {...(isActive ? { 'aria-live': 'polite' as const } : {})}
          >
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
}

export function HomeTemplateCarousel({ presets }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goToIndex = useCallback(
    (index: number) => {
      if (presets.length === 0) return;
      setActiveIndex(Math.min(Math.max(0, index), presets.length - 1));
    },
    [presets.length]
  );

  function scrollBySlide(delta: number) {
    goToIndex(activeIndex + delta);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (startX === null) return;

    const endX = e.changedTouches[0]?.clientX;
    if (endX === undefined) return;

    const deltaX = endX - startX;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    if (deltaX < 0) {
      scrollBySlide(1);
    } else {
      scrollBySlide(-1);
    }
  }

  if (presets.length === 0) return null;

  const onPrev = () => scrollBySlide(-1);
  const onNext = () => scrollBySlide(1);

  return (
    <div
      className="relative mt-10"
      role="region"
      aria-roledescription="carousel"
      aria-label="Signature template previews"
    >
      {/* Desktop: fixed controls above the card */}
      <div className="mb-4 hidden items-center justify-center gap-3 md:flex">
        <CarouselPrevButton activeIndex={activeIndex} onPrev={onPrev} />
        <CarouselDots activeIndex={activeIndex} presets={presets} onGoToIndex={goToIndex} />
        <CarouselNextButton
          activeIndex={activeIndex}
          presetsLength={presets.length}
          onNext={onNext}
        />
      </div>

      {/* Mobile: arrows flanking the preview */}
      <div className="flex items-center gap-2 md:hidden">
        <CarouselPrevButton activeIndex={activeIndex} onPrev={onPrev} />
        <div
          className="min-w-0 flex-1 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {presets.map((preset, index) => (
            <TemplateSlide key={preset.presetId} preset={preset} isActive={index === activeIndex} />
          ))}
        </div>
        <CarouselNextButton
          activeIndex={activeIndex}
          presetsLength={presets.length}
          onNext={onNext}
        />
      </div>

      {/* Desktop: card only */}
      <div className="hidden md:block">
        {presets.map((preset, index) => (
          <TemplateSlide key={preset.presetId} preset={preset} isActive={index === activeIndex} />
        ))}
      </div>
    </div>
  );
}
