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
      <div className="grid overflow-hidden mt-1">
        {presets.map((preset, index) => {
          const isActive = index === activeIndex;
          
          return (
            <div
              key={preset.presetId}
              className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${
                isActive 
                  ? 'opacity-100 translate-x-0 z-10' 
                  : 'opacity-0 translate-x-8 z-0 pointer-events-none'
              }`}
            >
              <HeroSignaturePreview html={preset.html} presetId={preset.presetId} />
            </div>
          );
        })}
      </div>
    </MarketingEmailClientFrame>
  );
}
