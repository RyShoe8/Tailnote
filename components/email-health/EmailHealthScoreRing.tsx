'use client';

import { motion, useReducedMotion } from 'framer-motion';

type Props = {
  score: number;
  statusLabel: string;
};

export function EmailHealthScoreRing({ score, statusLabel }: Props) {
  const reduceMotion = useReducedMotion();
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200" aria-hidden>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
        />
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-5xl font-semibold tracking-tight text-foreground">{score}</p>
        <p className="mt-1 text-sm text-muted-foreground">out of 100</p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-primary">{statusLabel}</p>
      </div>
    </div>
  );
}
