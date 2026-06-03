'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingEmailClientFrame } from '@/components/marketing/MarketingEmailClientFrame';
import { MarketingLiveSignaturePreview } from '@/components/marketing/MarketingLiveSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';
import { stripSignaturePreviewLinks } from '@/lib/marketing/stripSignaturePreviewLinks';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

const SWIPE_THRESHOLD_PX = 50;
const RESERVE_BUFFER_PX = 12;
const RESERVE_MAX_HEIGHT_PX = 1200;

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
      aria-label="Previous signature"
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
      aria-label="Next signature"
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
      aria-label="Signature slides"
    >
      {presets.map((preset, index) => (
        <button
          key={preset.presetId}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={`Show ${preset.name} signature`}
          className={`h-2.5 rounded-full transition-all ${
            index === activeIndex ? 'w-8 bg-primary' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
          }`}
          onClick={() => onGoToIndex(index)}
        />
      ))}
    </div>
  );
}

function MobileSwipeHint({ hidden }: { hidden: boolean }) {
  return (
    <div
      className={`mb-2 flex justify-center transition-opacity duration-300 md:mb-3 md:hidden ${
        hidden ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden={hidden}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-white px-3 py-1 text-xs font-medium text-foreground shadow-sm">
        Swipe to explore
        <ChevronRight className="tn-swipe-hint h-3.5 w-3.5 text-primary" aria-hidden />
      </span>
    </div>
  );
}

function CarouselSlideMeta({ preset }: { preset: CatalogPresetRow }) {
  return (
    <div className="mb-2 md:mb-4 md:min-h-[5.5rem]">
      <h3 className="text-lg font-semibold tracking-tight text-foreground" aria-live="polite">
        {preset.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground md:line-clamp-2 md:min-h-[2.75rem]">
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

export function HomeTemplateCarousel({ presets }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [reserveMinHeight, setReserveMinHeight] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const chromeRef = useRef<HTMLDivElement | null>(null);
  const floatZoneRef = useRef<HTMLDivElement | null>(null);
  const reserveMinHeightRef = useRef<number | null>(null);

  const goToIndex = useCallback(
    (index: number) => {
      if (presets.length === 0) return;
      setActiveIndex(Math.min(Math.max(0, index), presets.length - 1));
    },
    [presets.length]
  );

  useLayoutEffect(() => {
    const chrome = chromeRef.current;
    const floatZone = floatZoneRef.current;
    if (!chrome || !floatZone) return;

    const measure = () => {
      let maxSlide = 0;
      floatZone.querySelectorAll<HTMLElement>('[data-carousel-slide]').forEach((node) => {
        maxSlide = Math.max(maxSlide, Math.ceil(node.getBoundingClientRect().height));
      });

      const style = getComputedStyle(floatZone);
      const padTop = parseFloat(style.paddingTop) || 0;
      const padBottom = parseFloat(style.paddingBottom) || 0;
      const chromeH = Math.ceil(chrome.offsetHeight);
      const next = Math.min(
        RESERVE_MAX_HEIGHT_PX,
        chromeH + padTop + padBottom + maxSlide + RESERVE_BUFFER_PX
      );

      if (next <= 0) return;
      const prev = reserveMinHeightRef.current;
      if (prev != null && Math.abs(next - prev) <= 2) return;

      reserveMinHeightRef.current = next;
      setReserveMinHeight(next);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    floatZone.querySelectorAll<HTMLElement>('[data-carousel-slide]').forEach((node) => {
      ro.observe(node);
    });

    const onImgLoad = () => measure();
    floatZone.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', onImgLoad, { once: true });
    });

    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [presets]);

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
      className="relative mt-8 md:mt-10"
      style={reserveMinHeight != null ? { minHeight: reserveMinHeight } : undefined}
      role="region"
      aria-roledescription="carousel"
      aria-label="Signature previews"
    >
      <div ref={chromeRef} data-templates-carousel-chrome>
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

        <MobileSwipeHint hidden={hasSwiped} />
      </div>

      <div
        ref={floatZoneRef}
        data-templates-float-zone
        className="relative overflow-x-clip pt-12 pb-10 sm:pt-14"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex items-start transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${presets.length * 100}%`,
            transform: `translateX(-${trackOffsetPercent}%)`,
          }}
        >
          {presets.map((preset, index) => {
            const isActive = index === activeIndex;
            return (
              <article
                key={preset.presetId}
                data-carousel-slide
                data-carousel-active={isActive ? 'true' : 'false'}
                className="shrink-0 grow-0 px-1 sm:px-2"
                style={{ width: `${slideSharePercent}%` }}
                aria-roledescription="slide"
                aria-hidden={!isActive}
              >
                <MarketingEmailClientFrame
                  layout="carousel"
                  showAmbience={isActive}
                  active={isActive}
                >
                  <TemplateSlidePreview preset={preset} />
                </MarketingEmailClientFrame>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
