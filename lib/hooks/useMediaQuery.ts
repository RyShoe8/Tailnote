'use client';

import { useSyncExternalStore } from 'react';

function subscribeMediaQuery(query: string, callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia(query);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getMediaQuerySnapshot(query: string, fallback: boolean) {
  if (typeof window === 'undefined') return fallback;
  return window.matchMedia(query).matches;
}

/** `true` when viewport is at least Tailwind `lg` (1024px). */
export function useIsLgUp(): boolean {
  const query = '(min-width: 1024px)';
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query, true),
    () => true
  );
}

/** `true` on typical phone/tablet narrow viewports. */
export function useIsMobileUserAgent(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => {
      if (typeof navigator === 'undefined') return false;
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    },
    () => false
  );
}
