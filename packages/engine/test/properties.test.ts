import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  addDays,
  ageOn,
  challenges,
  cycleYearOn,
  DEFAULT_CONVENTIONS,
  daysInMonth,
  digitalRoot,
  fromOrdinal,
  isValidYMD,
  lifePath,
  nameNumbers,
  personalDay,
  personalDayNumber,
  personalMonth,
  personalYear,
  pinnacles,
  reduceChain,
  toOrdinal,
  validateBirth,
  variantIndex,
  variantIndexRange,
  weekday,
  type Conventions,
  type YMD,
} from '../src';

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
    .chain(([year, month]) =>
      fc.integer({ min: 1, max: daysInMonth(year, month) }).map((day) => ({ year, month, day })),
    );

const birthdays = dateIn(1900, 2025);
const VALID = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]);
const runs = { numRuns: 2000 };

describe('reduction', () => {
  it('is idempotent', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100000 }), fc.constantFrom([], [11, 22], [11, 22, 33]), (n, masters) => {
        const once = reduceChain(n, masters);
        const end = once[once.length - 1] as number;
        expect(reduceChain(end, masters)).toEqual([end]);
      }),
      runs,
    );
  });

  it('a single-digit result equals the digital root of the digit sum', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (n) => {
        const chain = reduceChain(n, []);
        const end = chain[chain.length - 1] as number;
        expect(end).toBe(digitalRoot(n));
        expect(end).toBeGreaterThanOrEqual(1);
        expect(end).toBeLessThanOrEqual(9);
      }),
      runs,
    );
  });
});

describe('numbers stay inside 1-9, 11, 22 and 33', () => {
  it('life path and cycle numbers under every convention', () => {
    fc.assert(
      fc.property(birthdays, dateIn(1900, 2100), conventions, (birth, date, c) => {
        expect(VALID.has(lifePath(birth, c).value)).toBe(true);
        expect(VALID.has(personalYear(birth, date.year, c).value)).toBe(true);
        const pm = personalMonth(birth, date.year, date.month, c).value;
        const pd = personalDay(birth, date, c).value;
        expect(pm >= 1 && pm <= 9).toBe(true);
        expect(pd >= 1 && pd <= 9).toBe(true);
        for (const p of pinnacles(birth, c)) expect(VALID.has(p.value)).toBe(true);
        for (const ch of challenges(birth, c)) expect(ch.value >= 0 && ch.value <= 8).toBe(true);
      }),
      runs,
    );
  });

  it('A2 never produces 33', () => {
    fc.assert(
      fc.property(birthdays, (birth) => {
        expect(lifePath(birth, { ...DEFAULT_CONVENTIONS, dateRule: 'A2' }).value).not.toBe(33);
      }),
      runs,
    );
  });
});

describe('personal day', () => {
  it('rises by one (mod 9) from one day to the next inside a month', () => {
    fc.assert(
      fc.property(birthdays, dateIn(1900, 2100), conventions, (birth, date, c) => {
        fc.pre(date.day < daysInMonth(date.year, date.month));
        // Under the birthday convention the cycle can change mid-month; stay inside one cycle.
        const next = { ...date, day: date.day + 1 };
        fc.pre(cycleYearOn(birth, date, c) === cycleYearOn(birth, next, c));
        const a = personalDay(birth, date, c).value;
        const b = personalDay(birth, next, c).value;
        expect(b).toBe((a % 9) + 1);
      }),
      runs,
    );
  });

  it('29 Feb and 1 Mar share a personal day number', () => {
    fc.assert(
      fc.property(birthdays, fc.constantFrom(1904, 1908, 1996, 2000, 2024, 2028, 2096), (birth, year) => {
        const c = { ...DEFAULT_CONVENTIONS };
        const feb29 = personalDay(birth, { year, month: 2, day: 29 }, c).value;
        const mar1 = personalDay(birth, { year, month: 3, day: 1 }, c).value;
        expect(feb29).toBe(mar1);
      }),
      runs,
    );
  });

  it('the fast path agrees with the full result', () => {
    fc.assert(
      fc.property(birthdays, dateIn(1900, 2100), conventions, (birth, date, c) => {
        expect(personalDayNumber(birth, date, c)).toBe(personalDay(birth, date, c).value);
      }),
      runs,
    );
  });

  it('does not depend on the date rule', () => {
    fc.assert(
      fc.property(birthdays, dateIn(1900, 2100), (birth, date) => {
        const seen = new Set(
          (['A2', 'A', 'B', 'C'] as const).map(
            (dateRule) => personalDay(birth, date, { ...DEFAULT_CONVENTIONS, dateRule }).value,
          ),
        );
        expect(seen.size).toBe(1);
      }),
      { numRuns: 500 },
    );
  });
});

describe('calendar', () => {
  it('ordinals round-trip and agree with Date.UTC', () => {
    fc.assert(
      fc.property(dateIn(1600, 2400), (d) => {
        expect(fromOrdinal(toOrdinal(d))).toEqual(d);
        expect(toOrdinal(d) * 86_400_000).toBe(Date.UTC(d.year, d.month - 1, d.day));
        expect(weekday(d)).toBe(new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay());
        expect(isValidYMD(addDays(d, 1))).toBe(true);
      }),
      runs,
    );
  });

  it('rejects impossible dates, years before 1900 and future births', () => {
    const today = { year: 2026, month: 10, day: 1 };
    expect(validateBirth({ year: 1990, month: 2, day: 30 }, today)?.code).toBe('invalid');
    expect(validateBirth({ year: 1990, month: 13, day: 1 }, today)?.code).toBe('invalid');
    expect(validateBirth({ year: 1899, month: 12, day: 31 }, today)?.code).toBe('before-1900');
    expect(validateBirth({ year: 2026, month: 10, day: 2 }, today)?.code).toBe('future');
    expect(validateBirth({ year: 2026, month: 10, day: 1 }, today)).toBeNull();
    expect(validateBirth({ year: 1900, month: 2, day: 29 }, today)?.code).toBe('invalid'); // 1900 is not a leap year
    expect(validateBirth({ year: 2000, month: 2, day: 29 }, today)).toBeNull();
  });

  it('counts a 29 February birthday on 28 Feb or 1 Mar in common years', () => {
    const birth = { year: 2000, month: 2, day: 29 };
    expect(ageOn(birth, { year: 2023, month: 2, day: 27 }, { leapBirthday: 'feb28' })).toBe(22);
    expect(ageOn(birth, { year: 2023, month: 2, day: 28 }, { leapBirthday: 'feb28' })).toBe(23);
    expect(ageOn(birth, { year: 2023, month: 2, day: 28 }, { leapBirthday: 'mar1' })).toBe(22);
    expect(ageOn(birth, { year: 2023, month: 3, day: 1 }, { leapBirthday: 'mar1' })).toBe(23);
    expect(ageOn(birth, { year: 2024, month: 2, day: 29 }, { leapBirthday: 'mar1' })).toBe(24);
  });
});

describe('names never crash', () => {
  it('returns a defined result for any string', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 300 }), (name) => {
        const profile = nameNumbers(name, DEFAULT_CONVENTIONS);
        if (profile.ok) expect(VALID.has(profile.expression.value)).toBe(true);
        else expect(profile.issues.length).toBeGreaterThan(0);
      }),
      runs,
    );
  });
});

describe('variants', () => {
  it('a single-day index matches the range walk', () => {
    const birth = { year: 1985, month: 6, day: 17 };
    const day = { year: 2026, month: 10, day: 1 };
    const [entry] = variantIndexRange(birth, day, day, DEFAULT_CONVENTIONS);
    expect(entry?.variantIndex).toBe(variantIndex(birth, day, DEFAULT_CONVENTIONS));
    expect(entry?.personalDay).toBe(8);
  });

  it('the index counts earlier days with the same personal day', () => {
    const birth = { year: 1985, month: 6, day: 17 };
    const days = variantIndexRange(birth, { year: 2026, month: 1, day: 1 }, { year: 2026, month: 3, day: 1 }, DEFAULT_CONVENTIONS);
    const seen = new Map<number, number>();
    for (const d of days) {
      const prev = seen.get(d.personalDay);
      if (prev !== undefined) expect(d.variantIndex).toBe(prev + 1);
      seen.set(d.personalDay, d.variantIndex);
    }
  });
});
