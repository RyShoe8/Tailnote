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

function presetPreviewHtml(presetId: TemplatePresetId) {
  return stripSignaturePreviewLinks(renderMarketingSample(presetId));
}

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
  className,
}: {
  activeIndex: number;
  presets: CatalogPresetRow[];
  onGoToIndex: (index: number) => void;
  className?: string;
}) {
  return (
    <div
      className={className ?? 'flex flex-wrap items-center justify-center gap-2'}
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

function MobileSwipeHint({
  hidden,
  activeIndex,
  presets,
  onGoToIndex,
}: {
  hidden: boolean;
  activeIndex: number;
  presets: CatalogPresetRow[];
  onGoToIndex: (index: number) => void;
}) {
  return (
    <div
      className={`mb-3 flex flex-col items-center gap-2 transition-opacity duration-300 md:hidden ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden={hidden}
    >
      <CarouselDots
        activeIndex={activeIndex}
        presets={presets}
        onGoToIndex={onGoToIndex}
        className="flex flex-wrap items-center justify-center gap-2"
      />
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-white px-3 py-1 text-xs font-medium text-foreground shadow-sm">
        Swipe to explore
        <ChevronRight className="tn-swipe-hint h-3.5 w-3.5 text-primary" aria-hidden />
      </span>
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

function TemplateSlidePreview({ preset }: { preset: CatalogPresetRow }) {
  const presetId = preset.presetId as TemplatePresetId;
  return (
    <MarketingLiveSignaturePreview
      presetId={presetId}
      html={presetPreviewHtml(presetId)}
      appearance="flat"
      fitContained
      className="signature-email-preview--static"
    />
  );
}

function SlideCardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-float ring-1 ring-black/5 transition-transform duration-500 hover:-translate-y-1">
      <div className="bg-gradient-to-b from-slate-50/60 to-white p-4 sm:p-6">{children}</div>
    </div>
  );
}

export function HomeTemplateCarousel({ presets }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

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

    setHasSwiped(true);
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
  const slideSharePercent = presets.length > 0 ? 100 / presets.length : 100;
  const trackOffsetPercent = activeIndex * slideSharePercent;

  return (
    <div
      className="relative mt-10"
      role="region"
      aria-roledescription="carousel"
      aria-label="Signature template previews"
    >
      <div className="mb-4 flex items-center justify-center gap-3">
        <CarouselPrevButton activeIndex={activeIndex} onPrev={onPrev} />
        <CarouselDots activeIndex={activeIndex} presets={presets} onGoToIndex={goToIndex} />
        <CarouselNextButton
          activeIndex={activeIndex}
          presetsLength={presets.length}
          onNext={onNext}
        />
      </div>

      <CarouselSlideMeta preset={activePreset} />

      <MobileSwipeHint
        hidden={hasSwiped}
        activeIndex={activeIndex}
        presets={presets}
        onGoToIndex={goToIndex}
      />

      <div
        ref={viewportRef}
        className="relative w-full min-w-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${presets.length * 100}%`,
            transform: `translateX(-${trackOffsetPercent}%)`,
          }}
        >
          {presets.map((preset, index) => (
            <article
              key={preset.presetId}
              className="shrink-0 grow-0"
              style={{ width: `${slideSharePercent}%` }}
              aria-roledescription="slide"
              aria-hidden={index !== activeIndex}
            >
              <SlideCardShell>
                <TemplateSlidePreview preset={preset} />
              </SlideCardShell>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 md:hidden">
        <CarouselDots activeIndex={activeIndex} presets={presets} onGoToIndex={goToIndex} />
      </div>
    </div>
  );
}
