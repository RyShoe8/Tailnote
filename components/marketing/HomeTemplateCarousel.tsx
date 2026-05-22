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

/** Stable preview viewport — tuned for tallest marketing samples with promos. */
const PREVIEW_VIEWPORT_MIN_H = 'min-h-[440px] md:min-h-[540px]';

type Props = {
  presets: CatalogPresetRow[];
};

function CarouselPrevButton({
  activeIndex,
  onPrev,
  compact,
}: {
  activeIndex: number;
  onPrev: () => void;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={compact ? 'h-8 w-8 shrink-0' : 'shrink-0'}
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
  compact,
}: {
  activeIndex: number;
  presetsLength: number;
  onNext: () => void;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={compact ? 'h-8 w-8 shrink-0' : 'shrink-0'}
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

function CarouselSlideMeta({ preset }: { preset: CatalogPresetRow }) {
  return (
    <div className="mb-4 min-h-[5.5rem]">
      <h3 className="text-lg font-semibold tracking-tight text-foreground" aria-live="polite">
        {preset.name}
      </h3>
      <p className="mt-1 min-h-[2.75rem] line-clamp-2 text-sm text-muted-foreground">
        {preset.description?.trim() ? preset.description : '\u00a0'}
      </p>
    </div>
  );
}

function TemplateSlide({
  preset,
  isActive,
  layout,
}: {
  preset: CatalogPresetRow;
  isActive: boolean;
  layout: 'mobile' | 'desktop';
}) {
  const presetId = preset.presetId as TemplatePresetId;
  const preview = (
    <MarketingLiveSignaturePreview
      presetId={presetId}
      html={stripSignaturePreviewLinks(renderMarketingSample(presetId))}
      appearance={layout === 'mobile' ? 'flat' : 'card'}
      className="signature-email-preview--static"
    />
  );

  if (layout === 'mobile') {
    return (
      <article
        className={isActive ? 'block w-full' : 'hidden'}
        aria-roledescription="slide"
        aria-hidden={!isActive}
      >
        {preview}
      </article>
    );
  }

  return (
    <article
      className={isActive ? 'block' : 'hidden'}
      aria-roledescription="slide"
      aria-hidden={!isActive}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        <div className="bg-gradient-to-b from-slate-50/50 to-white p-4 sm:p-6">{preview}</div>
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

  const activePreset = presets[activeIndex];
  const onPrev = () => scrollBySlide(-1);
  const onNext = () => scrollBySlide(1);

  return (
    <div
      className="relative mt-10"
      role="region"
      aria-roledescription="carousel"
      aria-label="Signature template previews"
    >
      <div className="mb-4 hidden items-center justify-center gap-3 md:flex">
        <CarouselPrevButton activeIndex={activeIndex} onPrev={onPrev} />
        <CarouselDots activeIndex={activeIndex} presets={presets} onGoToIndex={goToIndex} />
        <CarouselNextButton
          activeIndex={activeIndex}
          presetsLength={presets.length}
          onNext={onNext}
        />
      </div>

      <CarouselSlideMeta preset={activePreset} />

      <div className={`flex items-start gap-1 md:hidden ${PREVIEW_VIEWPORT_MIN_H}`}>
        <CarouselPrevButton activeIndex={activeIndex} onPrev={onPrev} compact />
        <div
          className="flex min-w-0 flex-1 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {presets.map((preset, index) => (
            <TemplateSlide
              key={preset.presetId}
              preset={preset}
              isActive={index === activeIndex}
              layout="mobile"
            />
          ))}
        </div>
        <CarouselNextButton
          activeIndex={activeIndex}
          presetsLength={presets.length}
          onNext={onNext}
          compact
        />
      </div>

      <div className={`hidden md:block ${PREVIEW_VIEWPORT_MIN_H}`}>
        {presets.map((preset, index) => (
          <TemplateSlide
            key={preset.presetId}
            preset={preset}
            isActive={index === activeIndex}
            layout="desktop"
          />
        ))}
      </div>
    </div>
  );
}
