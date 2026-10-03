import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addDays,
  cycleGap,
  cycleGapSegments,
  cycleStrip,
  daysInMonth,
  PYTHAGOREAN_CONVENTIONS,
  digitalRoot,
  lifePathPair,
  pairKey,
  personalDayNumber,
  personalYear,
  toOrdinal,
  type Conventions,
  type YMD,
} from '../src';

const here = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(readFileSync(join(here, '..', '..', '..', 'tests', 'golden', 'pair.json'), 'utf8')) as {
  lifePaths: { a: string; b: string; aValue: number; bValue: number; key: string; overlay: string }[];
  gaps: {
    a: string;
    b: string;
    on: string;
    conventions: Partial<Conventions>;
    forward: number;
    back: number;
    distance: number;
    aYear: number;
    bYear: number;
    shifted: boolean;
  }[];
};

const ymd = (s: string): YMD => {
  const [year, month, day] = s.split('-').map(Number) as [number, number, number];
  return { year, month, day };
};

const conventions = fc.record({
  system: fc.constant('pythagorean' as const),
  dateRule: fc.constantFrom('A2', 'A', 'B', 'C' as const),
  nameRule: fc.constantFrom('per-part', 'whole-name' as const),
  cycleYear: fc.constantFrom('calendar', 'birthday' as const),
  cycleMasters: fc.constantFrom('overtone', 'keep', 'single' as const),
  yRule: fc.constantFrom('consonant', 'vowel-if-alone' as const),
  particles: fc.constantFrom('include', 'ignore' as const),
  leapBirthday: fc.constantFrom('feb28', 'mar1' as const),
}) as fc.Arbitrary<Conventions>;

const dateIn = (y0: number, y1: number): fc.Arbitrary<YMD> =>
  fc
    .tuple(fc.integer({ min: y0, max: y1 }), fc.integer({ min: 1, max: 12 }))
    .chain(([year, month]) => fc.integer({ min: 1, max: daysInMonth(year, month) }).map((day) => ({ year, month, day })));

const birthdays = dateIn(1900, 2025);
const mod9 = (n: number) => ((n % 9) + 9) % 9;
const calendar: Conventions = { ...PYTHAGOREAN_CONVENTIONS, cycleYear: 'calendar' };

describe('pair key', () => {
  it('reads the same in either order and uses the single-digit roots', () => {
    expect(pairKey(7, 3)).toBe('3-7');
    expect(pairKey(3, 7)).toBe('3-7');
    expect(pairKey(11, 9)).toBe('2-9');
    expect(pairKey(22, 22)).toBe('4-4');
    expect(pairKey(33, 1)).toBe('1-6');
  });
});

describe('golden pair vectors', () => {
  it.each(golden.lifePaths)('life path pair $a and $b', (v) => {
    const pair = lifePathPair(ymd(v.a), ymd(v.b), PYTHAGOREAN_CONVENTIONS);
    expect(pair.a.value).toBe(v.aValue);
    expect(pair.b.value).toBe(v.bValue);
    expect(pair.key).toBe(v.key);
    expect(pair.overlay).toBe(v.overlay);
  });

  it.each(golden.gaps)('cycle gap $a and $b on $on', (v) => {
    const c: Conventions = { ...PYTHAGOREAN_CONVENTIONS, ...v.conventions };
    const gap = cycleGap(ymd(v.a), ymd(v.b), ymd(v.on), c);
    expect(gap.forward).toBe(v.forward);
    expect(gap.back).toBe(v.back);
    expect(gap.distance).toBe(v.distance);
    expect(gap.a).toBe(v.aYear);
    expect(gap.b).toBe(v.bYear);
    expect(gap.shifted).toBe(v.shifted);
  });

  it('shows the arithmetic, with the borrow when the difference is negative', () => {
    const gap = cycleGap(ymd('2000-02-29'), ymd('1999-12-31'), ymd('2027-01-05'), calendar, { a: 'You', b: 'Sam' });
    expect(gap.steps.map((s) => s.label)).toEqual(['You', 'Sam', 'Difference', 'The year']);
    expect(gap.steps[0]?.text).toBe('2 + 29 = 31 → 3 + 1 = 4');
    expect(gap.steps[1]?.text).toBe('12 + 31 = 43 → 4 + 3 = 7');
    expect(gap.steps[2]?.text).toBe('4 − 7 = -3, and -3 + 9 = 6');
  });
});

describe('the cycle gap', () => {
  it('is one constant for every day of the year under calendar years, whatever the date rule', () => {
    fc.assert(
      fc.property(birthdays, birthdays, fc.integer({ min: 1950, max: 2090 }), conventions, (a, b, year, c) => {
        const cc: Conventions = { ...c, cycleYear: 'calendar' };
        const expected = mod9(a.month + a.day - (b.month + b.day));
        const start = { year, month: 1, day: 1 };
        for (let i = 0; i < 366; i += 7) {
          const on = addDays(start, i);
          expect(cycleGap(a, b, on, cc).forward).toBe(expected);
        }
      }),
      { numRuns: 300 },
    );
  });

  it('matches the difference of the two personal-day numbers, every day', () => {
    fc.assert(
      fc.property(birthdays, birthdays, dateIn(1990, 2060), (a, b, on) => {
        const c = calendar;
        expect(cycleGap(a, b, on, c).forward).toBe(mod9(personalDayNumber(a, on, c) - personalDayNumber(b, on, c)));
      }),
      { numRuns: 2000 },
    );
  });

  it('matches the difference of the two personal-year roots under every date rule', () => {
    fc.assert(
      fc.property(birthdays, birthdays, fc.integer({ min: 1950, max: 2090 }), conventions, (a, b, year, c) => {
        const cc: Conventions = { ...c, cycleYear: 'calendar', cycleMasters: 'single' };
        const gap = cycleGap(a, b, { year, month: 6, day: 15 }, cc);
        expect(mod9(personalYear(a, year, cc).root - personalYear(b, year, cc).root)).toBe(gap.forward);
      }),
      { numRuns: 1000 },
    );
  });

  it('runs both ways: forward and back add to nine, and swapping the people swaps them', () => {
    fc.assert(
      fc.property(birthdays, birthdays, dateIn(1990, 2060), conventions, (a, b, on, c) => {
        const ab = cycleGap(a, b, on, c);
        const ba = cycleGap(b, a, on, c);
        expect(ab.forward).toBe(ba.back);
        expect(ab.back).toBe(ba.forward);
        expect(ab.distance).toBe(ba.distance);
        expect(mod9(ab.forward + ab.back)).toBe(0);
        expect(ab.distance).toBeLessThanOrEqual(4);
        expect(ab.distance).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 1500 },
    );
  });

  it('is 0 exactly when the two month-and-day sums share a digital root (calendar years)', () => {
    fc.assert(
      fc.property(birthdays, birthdays, (a, b) => {
        const gap = cycleGap(a, b, { year: 2026, month: 1, day: 1 }, calendar).forward;
        if (a.month === b.month && a.day === b.day) expect(gap).toBe(0);
        expect(gap === 0).toBe(digitalRoot(a.month + a.day) === digitalRoot(b.month + b.day));
      }),
      { numRuns: 2000 },
    );
  });

  it('each person moves up one step a year, so the gap reaches every number in turn', () => {
    const a = ymd('1990-03-14');
    const b = ymd('1988-11-02');
    const gap = cycleGap(a, b, ymd('2026-10-01'), calendar);
    // The second person reaches the first person's current number after `forward` years.
    const later = cycleGap(a, b, { year: 2026 + gap.forward, month: 10, day: 1 }, calendar);
    expect(later.b).toBe(gap.a);
    // And the first person reaches the second person's current number after `back` years.
    const backLater = cycleGap(a, b, { year: 2026 + gap.back, month: 10, day: 1 }, calendar);
    expect(backLater.a).toBe(gap.b);
  });
});

describe('birthday cycles', () => {
  it('has at most two gaps in a calendar year, and they differ by exactly one step', () => {
    fc.assert(
      fc.property(birthdays, birthdays, fc.integer({ min: 1950, max: 2090 }), fc.constantFrom('feb28', 'mar1' as const), (a, b, year, leapBirthday) => {
        const c = { cycleYear: 'birthday' as const, leapBirthday };
        const segments = cycleGapSegments(a, b, year, c);
        const values = new Set(segments.map((s) => s.forward));
        expect(values.size).toBeLessThanOrEqual(2);
        if (values.size === 2) {
          const [x, y] = [...values] as [number, number];
          expect(mod9(x - y) === 1 || mod9(y - x) === 1).toBe(true);
        }
        // Segments are in date order.
        for (let i = 1; i < segments.length; i += 1) {
          expect(toOrdinal((segments[i] as { from: YMD }).from)).toBeGreaterThan(toOrdinal((segments[i - 1] as { from: YMD }).from));
        }
      }),
      { numRuns: 1000 },
    );
  });

  it('agrees with the segment boundaries day by day', () => {
    const a = ymd('1990-03-14');
    const b = ymd('1988-11-02');
    const c = { cycleYear: 'birthday' as const, leapBirthday: 'feb28' as const };
    const segments = cycleGapSegments(a, b, 2026, c);
    expect(segments.map((s) => s.forward)).toEqual([4, 5, 4]);
    for (let i = 0; i < 365; i += 1) {
      const on = addDays({ year: 2026, month: 1, day: 1 }, i);
      const seg = [...segments].reverse().find((s) => toOrdinal(s.from) <= toOrdinal(on)) as { forward: number };
      expect(cycleGap(a, b, on, c).forward).toBe(seg.forward);
    }
  });

  it('is a single segment for two people born on the same day', () => {
    const c = { cycleYear: 'birthday' as const, leapBirthday: 'feb28' as const };
    expect(cycleGapSegments(ymd('1990-03-14'), ymd('1985-03-14'), 2026, c)).toHaveLength(1);
  });

  it('is a single segment under calendar years', () => {
    expect(cycleGapSegments(ymd('1990-03-14'), ymd('1988-11-02'), 2026, calendar)).toHaveLength(1);
  });
});

describe('the nine-year strip', () => {
  it('lists both people for each year and wraps from 9 to 1', () => {
    const rows = cycleStrip(ymd('1990-03-14'), ymd('1988-11-02'), 2026, 9, calendar);
    expect(rows).toHaveLength(9);
    expect(rows[0]?.year).toBe(2026);
    expect(rows.map((r) => r.a.root)).toEqual([9, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(rows.map((r) => r.b.root)).toEqual([5, 6, 7, 8, 9, 1, 2, 3, 4]);
  });
});

describe('life path pair', () => {
  it('has one canonical key for every order of every pair', () => {
    fc.assert(
      fc.property(birthdays, birthdays, conventions, (a, b, c) => {
        const ab = lifePathPair(a, b, c);
        const ba = lifePathPair(b, a, c);
        expect(ab.key).toBe(ba.key);
        expect(ab.overlay).toBe(ba.overlay);
        expect(ab.key).toMatch(/^[1-9]-[1-9]$/);
        const [x, y] = ab.key.split('-').map(Number) as [number, number];
        expect(x).toBeLessThanOrEqual(y);
      }),
      { numRuns: 1500 },
    );
  });
});
