import { birthdayIn, compareYMD } from './calendar';
import { cycleYearOn, personalYear } from './cycles';
import { lifePath } from './dates';
import { chainText, digitalRoot, reduceChain } from './reduce';
import type { Conventions, Result, Step, YMD } from './types';

/*
 * Two people, side by side. Nothing here scores or ranks a pair. It reports two
 * facts the method already contains: the pair of life paths, and the gap
 * between two people's cycles. A personal year is the digital root of birth
 * month + birth day + the cycle year, and the personal month and day add the
 * same month and day for both people, so the year, month and day terms cancel
 * in a difference: the gap between two people's numbers is fixed by their birth
 * months and days alone (in calendar-year mode).
 */

/** 0 to 8. A gap of 0 means the same number. */
const mod9 = (n: number): number => ((n % 9) + 9) % 9;

/** "3-7": the two single-digit roots, smaller first, so the key reads the same in either order. */
export function pairKey(a: number, b: number): string {
  const x = digitalRoot(a);
  const y = digitalRoot(b);
  return x <= y ? `${x}-${y}` : `${y}-${x}`;
}

export type MasterOverlay = 'none' | '11' | '22' | '33' | 'both';

export type LifePathPair = {
  a: Result;
  b: Result;
  /** The pair of single-digit roots, e.g. "2-3" for an 11/2 and a 3. */
  key: string;
  /** Set when one or both life paths is a master number. */
  overlay: MasterOverlay;
};

export function lifePathPair(birthA: YMD, birthB: YMD, c: Conventions): LifePathPair {
  const a = lifePath(birthA, c);
  const b = lifePath(birthB, c);
  const masterA = a.value > 9;
  const masterB = b.value > 9;
  let overlay: MasterOverlay = 'none';
  if (masterA && masterB) overlay = 'both';
  else if (masterA) overlay = String(a.value) as MasterOverlay;
  else if (masterB) overlay = String(b.value) as MasterOverlay;
  return { a, b, key: pairKey(a.value, b.value), overlay };
}

export type PairLabels = { a: string; b: string };
const DEFAULT_LABELS: PairLabels = { a: 'First person', b: 'Second person' };

export type CycleGap = {
  /** Steps the second person's number must advance to reach the first person's: (A - B) mod 9. */
  forward: number;
  /** Steps the first person's number must advance to reach the second person's: (B - A) mod 9. */
  back: number;
  /** The shorter way round the nine, 0 to 4. */
  distance: number;
  /** Each person's personal-year number (single digit) on this date. */
  a: number;
  b: number;
  /** Under birthday cycles, true while the gap differs from the gap between full cycles. */
  shifted: boolean;
  /** The gap between full cycles: the one that never changes. */
  baseForward: number;
  steps: Step[];
};

const seedChain = (birth: YMD): number[] => reduceChain(birth.month + birth.day, []);

/**
 * The gap between two people's personal-year numbers on `on`. The same gap
 * holds for their personal months and days. Under calendar years it is one
 * constant; under birthday cycles it moves by one between the two birthdays.
 */
export function cycleGap(
  birthA: YMD,
  birthB: YMD,
  on: YMD,
  c: Pick<Conventions, 'cycleYear' | 'leapBirthday'>,
  labels: PairLabels = DEFAULT_LABELS,
): CycleGap {
  const cycleA = cycleYearOn(birthA, on, c);
  const cycleB = cycleYearOn(birthB, on, c);
  const a = digitalRoot(birthA.month + birthA.day + cycleA);
  const b = digitalRoot(birthB.month + birthB.day + cycleB);
  const forward = mod9(a - b);
  const back = mod9(b - a);

  const seedA = seedChain(birthA);
  const seedB = seedChain(birthB);
  const rootA = seedA[seedA.length - 1] as number;
  const rootB = seedB[seedB.length - 1] as number;
  const baseForward = mod9(rootA - rootB);

  const diff = rootA - rootB;
  const steps: Step[] = [
    { label: labels.a, text: `${birthA.month} + ${birthA.day} = ${chainText(seedA)}` },
    { label: labels.b, text: `${birthB.month} + ${birthB.day} = ${chainText(seedB)}` },
    {
      label: 'Difference',
      text:
        diff < 0
          ? `${rootA} − ${rootB} = ${diff}, and ${diff} + 9 = ${baseForward}`
          : `${rootA} − ${rootB} = ${diff}`,
    },
  ];
  if (c.cycleYear === 'calendar') {
    steps.push({
      label: 'The year',
      text: 'Each year adds the same amount to both of your numbers, so it cancels out. The gap does not move.',
    });
  } else {
    steps.push({
      label: 'Birthday cycles',
      text: "Each number moves up on its own person's birthday. Between the two birthdays the gap is one step different, and it returns after the second.",
    });
  }

  return { forward, back, distance: Math.min(forward, back), a, b, shifted: forward !== baseForward, baseForward, steps };
}

export type GapSegment = { from: YMD; forward: number };

/**
 * The gap across one calendar year, as segments. One segment under calendar
 * years. Under birthday cycles, up to three: before the first birthday, between
 * the two, and after the second.
 */
export function cycleGapSegments(
  birthA: YMD,
  birthB: YMD,
  year: number,
  c: Pick<Conventions, 'cycleYear' | 'leapBirthday'>,
): GapSegment[] {
  const start: YMD = { year, month: 1, day: 1 };
  if (c.cycleYear === 'calendar') return [{ from: start, forward: cycleGap(birthA, birthB, start, c).forward }];
  const marks = [start, birthdayIn(birthA, year, c), birthdayIn(birthB, year, c)].sort(compareYMD);
  const out: GapSegment[] = [];
  for (const mark of marks) {
    const forward = cycleGap(birthA, birthB, mark, c).forward;
    const last = out[out.length - 1];
    if (!last || last.forward !== forward) out.push({ from: mark, forward });
  }
  return out;
}

export type StripRow = { year: number; a: Result; b: Result };

/**
 * Both people's personal-year numbers for `count` cycle years from `startYear`.
 * Under birthday cycles a row is the cycle that starts in that year.
 */
export function cycleStrip(birthA: YMD, birthB: YMD, startYear: number, count: number, c: Conventions): StripRow[] {
  return Array.from({ length: count }, (_, i) => {
    const year = startYear + i;
    return { year, a: personalYear(birthA, year, c), b: personalYear(birthB, year, c) };
  });
}
