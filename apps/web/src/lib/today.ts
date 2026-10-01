import type { YMD } from '@numerology/engine';

/** The visitor's own calendar date, read from their device clock in their own time zone. */
export function localYMD(now: Date = new Date()): YMD {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/**
 * The calendar date at an instant for a zone `offsetMinutes` east of UTC.
 * The browser uses localYMD; this is the same arithmetic made explicit so tests
 * can check the personal day flips at local midnight from UTC+14 to UTC-12.
 */
export function ymdAtOffset(epochMs: number, offsetMinutes: number): YMD {
  const shifted = new Date(epochMs + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Milliseconds from `now` to the next local midnight, plus a second of slack. */
export function msUntilLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}
