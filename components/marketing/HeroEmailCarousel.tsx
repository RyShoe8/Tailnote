'use client';

import { useState, useEffect } from 'react';
import { MarketingEmailClientFrame } from '@/components/marketing/MarketingEmailClientFrame';
import { HeroSignaturePreview } from '@/components/marketing/HeroSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';

export type PresetData = {
  presetId: TemplatePresetId;
  html: string;
};

type Props = {
  presets: PresetData[];
};

export function HeroEmailCarousel({ presets }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (presets.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % presets.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [presets.length]);

  if (presets.length === 0) return null;

  return (
    <MarketingEmailClientFrame layout="hero" showAmbience>
      <div className="grid overflow-visible mt-1 w-full relative">
        {presets.map((preset, index) => {
          let pos = index - activeIndex;
          if (pos < -1) pos += presets.length;
          if (pos > presets.length - 2) pos -= presets.length;
          
          let transformClass = '';
          if (pos === 0) {
            transformClass = 'translate-x-0 opacity-100 scale-100 z-10';
          } else if (pos === 1) {
            transformClass = 'translate-x-[110%] opacity-40 scale-[0.85] z-0 pointer-events-none blur-[1px]';
          } else if (pos === -1) {
            transformClass = '-translate-x-[110%] opacity-40 scale-[0.85] z-0 pointer-events-none blur-[1px]';
          } else if (pos > 1) {
            transformClass = 'translate-x-[200%] opacity-0 scale-75 z-0 pointer-events-none';
          } else {
            transformClass = '-translate-x-[200%] opacity-0 scale-75 z-0 pointer-events-none';
          }
          
          return (
            <div
              key={preset.presetId}
              className={`col-start-1 row-start-1 transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${transformClass}`}
            >
              <HeroSignaturePreview html={preset.html} presetId={preset.presetId} />
            </div>
          );
        })}
      </div>
    </MarketingEmailClientFrame>
  );
}
