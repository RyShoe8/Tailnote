'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

type Props = {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
};

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * One-shot scroll reveal using a per-instance IntersectionObserver.
 * SSR renders fully visible (no flash for crawlers / no-JS). After hydration,
 * elements already in the viewport are treated as immediately revealed (no
 * init flash); elements below the fold get the init opacity, then animate in
 * on first intersect. Honors prefers-reduced-motion via globals.css.
 */
export function RevealOnScroll({ children, delayMs, className, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<'ssr' | 'init' | 'revealed'>('ssr');

  useIsoLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      setState('revealed');
      return;
    }
    const el = ref.current;
    if (!el) {
      setState('revealed');
      return;
    }
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      setState('revealed');
      return;
    }
    setState('init');
  }, []);

  useEffect(() => {
    if (state !== 'init') return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('revealed');
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [state]);

  const style: CSSProperties | undefined =
    state === 'revealed' && delayMs ? { animationDelay: `${delayMs}ms` } : undefined;

  const stateClass =
    state === 'ssr' ? '' : state === 'init' ? 'tn-reveal-init' : 'tn-reveal';

  const composed = [className, stateClass].filter(Boolean).join(' ');

  return (
    <Tag ref={ref as never} className={composed || undefined} style={style}>
      {children}
    </Tag>
  );
}
