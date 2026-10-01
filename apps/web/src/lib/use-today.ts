'use client';

import { useEffect, useState } from 'react';
import type { YMD } from '@numerology/engine';
import { localYMD, msUntilLocalMidnight } from './today';

const same = (a: YMD, b: YMD) => a.year === b.year && a.month === b.month && a.day === b.day;

/**
 * Today's date for this visitor. Null on the server and for the first render,
 * so the static page never bakes in a build-time date. It updates at local
 * midnight, and again when the tab becomes visible after a long sleep.
 */
export function useToday(): YMD | null {
  const [today, setToday] = useState<YMD | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const now = localYMD();
      setToday((prev) => (prev && same(prev, now) ? prev : now));
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilLocalMidnight());
    };
    refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return today;
}
