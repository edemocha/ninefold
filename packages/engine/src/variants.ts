import { compareYMD, fromOrdinal, toOrdinal } from './calendar';
import { personalDayNumber } from './cycles';
import type { Conventions, YMD } from './types';

/** Counting starts here, so a variant is stable for a given birthday forever. */
export const VARIANT_EPOCH: YMD = { year: 1900, month: 1, day: 1 };

export type DayIndex = { date: YMD; personalDay: number; variantIndex: number };

/**
 * variantIndex for every day from `from` to `to`, in one pass from 1900.
 * A month view or a year export calls this once instead of once per day.
 */
export function variantIndexRange(birth: YMD, from: YMD, to: YMD, c: Conventions): DayIndex[] {
  const out: DayIndex[] = [];
  if (compareYMD(from, to) > 0) return out;
  const counts = new Array<number>(10).fill(0);
  const first = toOrdinal(from);
  const last = toOrdinal(to);
  for (let t = toOrdinal(VARIANT_EPOCH); t <= last; t += 1) {
    const date = fromOrdinal(t);
    const pd = personalDayNumber(birth, date, c);
    if (t >= first) out.push({ date, personalDay: pd, variantIndex: counts[pd] as number });
    counts[pd] = (counts[pd] as number) + 1;
  }
  return out;
}

/**
 * How many earlier days since 1900 had the same personal day number as `date`
 * for this birth month and day. The reading picks its variant from this count,
 * so nothing has to be stored and the same date always gives the same text.
 * About 46,000 steps for a date in 2026.
 */
export function variantIndex(birth: YMD, date: YMD, c: Conventions): number {
  const [only] = variantIndexRange(birth, date, date, c);
  return only ? only.variantIndex : 0;
}
