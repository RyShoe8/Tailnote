'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { DomainScanForm } from '@/components/email-health/DomainScanForm';

export function EmailHealthHero() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        className="mx-auto max-w-3xl text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Free tool</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          Check your <span className="text-primary">email health</span>
        </h1>
        <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
          Scan your domain for SPF, DKIM, DMARC, and more — plain-English results for founders,
          marketers, and growing teams. No sysadmin jargon required.
        </p>
      </motion.div>

      <div className="mx-auto mt-10 max-w-xl">
        <DomainScanForm size="large" />
      </div>
    </>
  );
}
