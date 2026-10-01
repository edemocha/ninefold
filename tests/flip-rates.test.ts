import { describe, expect, it } from 'vitest';
import {
  variantIndexRange,
  daysInMonth,
  DEFAULT_CONVENTIONS,
  fromOrdinal,
  lifePath,
  personalYear,
  toOrdinal,
  type Conventions,
  type DateRule,
  type YMD,
} from '@numerology/engine';

/*
 * The plan measured how often the date rules disagree. The engine reproduces
 * every one of those figures, which is the strongest evidence that the four
 * rules are read the way the plan reads them.
 */

const conv = (dateRule: DateRule, extra: Partial<Conventions> = {}): Conventions => ({ ...DEFAULT_CONVENTIONS, dateRule, ...extra });
const pairs: [DateRule, DateRule][] = [['A', 'A2'], ['A', 'B'], ['A', 'C'], ['A2', 'B'], ['A2', 'C'], ['B', 'C']];
const pct = (n: number, of: number) => Math.round((1000 * n) / of) / 10;

const PLAN_LIFE_PATH: Record<string, number> = { 'A,A2': 3.9, 'A,B': 13.8, 'A,C': 10.5, 'A2,B': 13.8, 'A2,C': 9.3, 'B,C': 17.5 };
const PLAN_PERSONAL_YEAR: Record<string, number> = { 'A,A2': 4.5, 'A,B': 9.1, 'A,C': 9.7, 'A2,B': 9.8, 'A2,C': 9.4, 'B,C': 10.1 };

describe('the plan\'s measured flip rates', () => {
  it('life path over all 25,933 birthdays from 1 Jan 1940 to 31 Dec 2010', () => {
    const births: YMD[] = [];
    for (let t = toOrdinal({ year: 1940, month: 1, day: 1 }); t <= toOrdinal({ year: 2010, month: 12, day: 31 }); t += 1) births.push(fromOrdinal(t));
    expect(births).toHaveLength(25_933);
    for (const [a, b] of pairs) {
      const differ = births.filter((d) => lifePath(d, conv(a)).value !== lifePath(d, conv(b)).value).length;
      expect(pct(differ, births.length), `${a} vs ${b}`).toBe(PLAN_LIFE_PATH[`${a},${b}`]);
    }
    const share = (rule: DateRule, value: number) => pct(births.filter((d) => lifePath(d, conv(rule)).value === value).length, births.length);
    expect(share('B', 33)).toBe(5.8);
    expect(share('A', 33)).toBe(0.9);
    expect(share('A2', 33)).toBe(0);
    expect(share('A', 2)).toBe(4.6);
    expect(share('B', 2)).toBe(1.6);
  });

  it('personal year over 366 birthdays times the years 2020 to 2040', () => {
    const birthdays: { month: number; day: number }[] = [];
    for (let m = 1; m <= 12; m += 1) for (let d = 1; d <= daysInMonth(2024, m); d += 1) birthdays.push({ month: m, day: d });
    expect(birthdays).toHaveLength(366);
    const keep = (rule: DateRule) => conv(rule, { cycleMasters: 'keep' });
    for (const [a, b] of pairs) {
      let differ = 0;
      let total = 0;
      for (const bd of birthdays) {
        for (let year = 2020; year <= 2040; year += 1) {
          total += 1;
          const birth = { year: 1990, ...bd };
          if (personalYear(birth, year, keep(a)).value !== personalYear(birth, year, keep(b)).value) differ += 1;
        }
      }
      expect(pct(differ, total), `${a} vs ${b}`).toBe(PLAN_PERSONAL_YEAR[`${a},${b}`]);
    }
  });
});

describe('the variety claim in the plan', () => {
  // Shortest gap between two identical headlines, over 10 years and all 366 birthdays.
  function shortestGap(variants: number): number {
    let shortest = Infinity;
    for (let m = 1; m <= 12; m += 1) {
      for (let d = 1; d <= daysInMonth(2024, m); d += 1) {
        const days = variantIndexRange({ year: 1990, month: m, day: d }, { year: 2020, month: 1, day: 1 }, { year: 2029, month: 12, day: 31 }, DEFAULT_CONVENTIONS);
        const last = new Map<string, number>();
        for (const row of days) {
          const key = `${row.personalDay}:${row.variantIndex % variants}`;
          const t = toOrdinal(row.date);
          const prev = last.get(key);
          if (prev !== undefined) shortest = Math.min(shortest, t - prev);
          last.set(key, t);
        }
      }
    }
    return shortest;
  }

  it('is 40 days at 6 variants and 89 days at 12', () => {
    expect(shortestGap(6)).toBe(40);
    expect(shortestGap(12)).toBe(89);
  });
});
