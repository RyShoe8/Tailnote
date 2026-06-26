'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EMAIL_HEALTH_HERO } from '@/lib/email-health/seoCopy';

export function EmailHealthSeoHero() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="mx-auto max-w-3xl text-center"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        {EMAIL_HEALTH_HERO.eyebrow}
      </p>
      <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
        {EMAIL_HEALTH_HERO.h1} —{' '}
        <span className="text-primary">{EMAIL_HEALTH_HERO.h1Highlight}</span>
      </h1>
      <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
        {EMAIL_HEALTH_HERO.subcopy}
      </p>
    </motion.div>
  );
}
