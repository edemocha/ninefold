import { beforeAll, describe, expect, it } from 'vitest';
import { daysInMonth, DEFAULT_CONVENTIONS, type Conventions, type YMD } from '@numerology/engine';
import { composePairDay, composePairLife, composePairMonth, type Bank } from '../src';
import { loadSourceBank } from '../../../tools/content-pipeline/src/build';
import { loadFamilies } from '../../../tools/content-pipeline/src/load';

let bank: Bank;
let ids: Set<string>;
beforeAll(() => {
  bank = loadSourceBank();
  ids = new Set(loadFamilies().flatMap((l) => l.snippets.map((s) => s.id)));
});

const c: Conventions = { ...DEFAULT_CONVENTIONS };
const you: YMD = { year: 1985, month: 6, day: 17 }; // the plan's Amelia
const other: YMD = { year: 1988, month: 11, day: 2 };
const today: YMD = { year: 2026, month: 10, day: 1 };
const mod9 = (n: number) => ((n % 9) + 9) % 9;

describe('a day, side by side', () => {
  it('shows each person their own day, with the headline, the paragraph and a question', () => {
    const d = composePairDay(bank, you, other, today, c, 'Sam');
    expect(d.label).toBe('Thursday 1 Oct 2026');
    // Amelia is on day 8 (the plan's sample card); Sam is on 5 + 10 = 15 -> 6, then 6 + 1 = 7.
    expect(d.sides.map((s) => [s.label, s.personalDay.value, s.personalMonth.value, s.personalYear.value])).toEqual([
      ['You', 8, 7, 6],
      ['Sam', 7, 6, 5],
    ]);
    expect(d.sides[0].paragraph).toBe(
      'Day 8 is about effort and follow-through. Inside a reflective month 7 of a care-and-responsibility year 6, it favors quiet, careful work over big moves.',
    );
    for (const s of d.sides) {
      expect(s.headline.length).toBeGreaterThan(5);
      expect(s.question?.endsWith('?')).toBe(true);
    }
    expect(d.sides[0].headline).not.toBe(d.sides[1].headline);
  });

  it('says how far apart the two day numbers are', () => {
    const d = composePairDay(bank, you, other, today, c, 'Sam');
    expect(d.gap).toEqual({ forward: 1, back: 8, distance: 1, headline: 'Your numbers are 1 step apart.' });
  });

  it('names real snippets as its sources', () => {
    const d = composePairDay(bank, you, other, today, c);
    expect(d.sources.length).toBeGreaterThan(8);
    for (const source of d.sources) expect(ids.has(source), source).toBe(true);
  });

  it('keeps the gap between two day numbers the same on every day of a year', () => {
    const base = composePairDay(bank, you, other, { year: 2026, month: 1, day: 1 }, c).gap.forward;
    for (let m = 1; m <= 12; m += 1) {
      for (const day of [1, 9, 17, daysInMonth(2026, m)]) {
        const d = composePairDay(bank, you, other, { year: 2026, month: m, day }, c);
        expect(mod9(d.sides[0].personalDay.value - d.sides[1].personalDay.value), `${m}/${day}`).toBe(d.gap.forward);
        expect(d.gap.forward).toBe(base);
      }
    }
  });

  it('says "about" in the sentence only under birthday cycles, and the gap can differ between birthdays', () => {
    const b: Conventions = { ...c, cycleYear: 'birthday' };
    const between = composePairDay(bank, you, other, { year: 2026, month: 10, day: 1 }, b, 'Sam');
    expect(mod9(between.sides[0].personalDay.value - between.sides[1].personalDay.value)).toBe(between.gap.forward);
    expect(between.gap.forward).toBe(2); // one step off its usual 1, until Sam's birthday on 2 November
    const after = composePairDay(bank, you, other, { year: 2026, month: 12, day: 1 }, b, 'Sam');
    expect(after.gap.forward).toBe(1);
  });
});

describe('a month, side by side', () => {
  it('has a row for every date with both people numbers, and the same gap all month', () => {
    const m = composePairMonth(bank, you, other, 2026, 10, c, 'Sam');
    expect(m.name).toBe('October');
    expect(m.days).toHaveLength(31);
    expect(m.days[0]).toMatchObject({ date: { year: 2026, month: 10, day: 1 }, weekday: 4, you: 8, other: 7 });
    for (const day of m.days) expect(mod9(day.you - day.other)).toBe(1);
    expect(m.sides.map((s) => [s.label, s.display])).toEqual([
      ['You', '7'],
      ['Sam', '6'],
    ]);
    expect(m.sides[0].context).toBe('a reflective month 7 of a care-and-responsibility year 6');
    expect(m.sides[0].theme?.id).toBe('theme');
    expect(m.sides[0].theme?.text.length).toBeGreaterThan(40);
  });

  it('lists the twelve calendar months for both people with their one-word tiles', () => {
    const m = composePairMonth(bank, you, other, 2026, 10, c);
    expect(m.yearTable).toHaveLength(12);
    expect(m.yearTable[9]).toMatchObject({ month: 10, name: 'October', you: { value: 7 }, other: { value: 6 } });
    expect(m.yearTable.every((r) => r.you.tile.length > 0 && r.other.tile.length > 0)).toBe(true);
    // A month number is one more than the one before it, wrapping from 9 to 1.
    for (let i = 1; i < 12; i += 1) {
      const prev = m.yearTable[i - 1]?.you.value as number;
      expect(m.yearTable[i]?.you.value).toBe(prev === 9 ? 1 : prev + 1);
    }
  });

  it('works for a month with 28 days and for a leap February', () => {
    expect(composePairMonth(bank, you, other, 2027, 2, c).days).toHaveLength(28);
    expect(composePairMonth(bank, you, other, 2028, 2, c).days).toHaveLength(29);
  });

  it('names real snippets as its sources', () => {
    for (const source of composePairMonth(bank, you, other, 2026, 10, c).sources) expect(ids.has(source), source).toBe(true);
  });
});

describe('life stages, side by side', () => {
  it('puts both timelines on one calendar-year axis', () => {
    const life = composePairLife(bank, you, other, today, c, 'Sam');
    expect(life.axis).toEqual({ from: 1985, to: 2088 });
    expect(life.sides.map((s) => [s.label, s.birthYear, s.age])).toEqual([
      ['You', 1985, 41],
      ['Sam', 1988, 37],
    ]);
    for (const s of life.sides) {
      expect(s.pinnacles).toHaveLength(4);
      expect(s.challenges).toHaveLength(4);
    }
  });

  it("finds each person's current pinnacle and challenge", () => {
    const life = composePairLife(bank, you, other, today, c);
    // The plan's example: Amelia, 41, is in her second pinnacle, 4, ages 36 to 44.
    expect(life.sides[0].current.pinnacle).toMatchObject({ n: 2, value: 4, ageFrom: 36, ageTo: 44, yearFrom: 2021, yearTo: 2029 });
    // Sam: life path 3, so the first pinnacle ends at 33 and the second runs 34 to 42.
    expect(life.sides[1].current.pinnacle).toMatchObject({ n: 2, ageFrom: 34, ageTo: 42, yearFrom: 2022, yearTo: 2030 });
    for (const s of life.sides) {
      expect(s.age).toBeGreaterThanOrEqual(s.current.pinnacle.ageFrom);
      expect(s.current.challenge.n).toBeGreaterThanOrEqual(1);
    }
  });

  it('covers a parent and a child, with the open last period running to the end of the axis', () => {
    const child: YMD = { year: 2014, month: 3, day: 10 };
    const life = composePairLife(bank, you, child, today, c);
    expect(life.axis).toEqual({ from: 1985, to: 2114 });
    const last = life.sides[1].pinnacles[3];
    expect(last?.ageTo).toBeNull();
    expect(life.sides[1].age).toBe(12);
    expect(life.sides[1].current.pinnacle.n).toBe(1);
  });
});
