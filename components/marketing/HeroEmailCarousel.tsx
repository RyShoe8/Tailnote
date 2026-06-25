'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    }, 4500); // slightly longer pause to enjoy the design
    return () => clearInterval(interval);
  }, [presets.length]);

  if (presets.length === 0) return null;

  return (
    <MarketingEmailClientFrame layout="hero" showAmbience>
      <div className="grid overflow-visible mt-1 w-full relative">
        <AnimatePresence initial={false}>
          {presets.map((preset, index) => {
            let pos = index - activeIndex;
            if (pos < -1) pos += presets.length;
            if (pos > presets.length - 2) pos -= presets.length;
            
            let animateProps: any = {};
            let zIndex = 0;
            
            if (pos === 0) {
              animateProps = { x: '0%', scale: 1, opacity: 1, filter: 'blur(0px)' };
              zIndex = 10;
            } else if (pos === 1) {
              animateProps = { x: '110%', scale: 0.85, opacity: 0.4, filter: 'blur(1px)' };
              zIndex = 0;
            } else if (pos === -1) {
              animateProps = { x: '-110%', scale: 0.85, opacity: 0.4, filter: 'blur(1px)' };
              zIndex = 0;
            } else if (pos > 1) {
              animateProps = { x: '200%', scale: 0.75, opacity: 0, filter: 'blur(0px)' };
            } else {
              animateProps = { x: '-200%', scale: 0.75, opacity: 0, filter: 'blur(0px)' };
            }
            
            return (
              <motion.div
                key={preset.presetId}
                initial={false}
                animate={animateProps}
                transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.9 }}
                className="col-start-1 row-start-1"
                style={{ zIndex, pointerEvents: pos === 0 ? 'auto' : 'none' }}
              >
                <HeroSignaturePreview html={preset.html} presetId={preset.presetId} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </MarketingEmailClientFrame>
  );
}
