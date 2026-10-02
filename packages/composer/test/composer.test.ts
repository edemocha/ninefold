import { beforeAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_CONVENTIONS,
  lifePath,
  nameNumbers,
  toOrdinal,
  type Conventions,
  type YMD,
} from '@numerology/engine';
import { CORE_KEYS, expectedIds, FAMILIES } from '@numerology/content';
import {
  composeDay,
  composeHeadlines,
  composeMonth,
  composeNameGrid,
  composeNumber,
  composeTimeline,
  composeYear,
  specialDateKey,
  type Bank,
} from '../src';
import { loadSourceBank } from '../../../tools/content-pipeline/src/build';
import { variantIndexRange } from '@numerology/engine';

let bank: Bank;
beforeAll(() => {
  bank = loadSourceBank();
});

const c: Conventions = { ...DEFAULT_CONVENTIONS };
const birth: YMD = { year: 1985, month: 6, day: 17 };
const today: YMD = { year: 2026, month: 10, day: 1 };

describe('the sample day card in the plan', () => {
  it('reproduces 1 Oct 2026 for someone born 17 Jun 1985', () => {
    const card = composeDay(bank, birth, today, c);
    expect(card.label).toBe('Thursday 1 Oct 2026');
    expect([card.personalYear.value, card.personalMonth.value, card.personalDay.value]).toEqual([6, 7, 8]);
    expect(card.paragraph).toBe(
      'Day 8 is about effort and follow-through. Inside a reflective month 7 of a care-and-responsibility year 6, it favors quiet, careful work over big moves.',
    );
    expect(card.lifePathLine?.text.startsWith('independence')).toBe(false);
    expect(card.lifePathLine?.lifePath.value).toBe(1);
    expect(card.lifePathLine?.text).toContain("today's 8");
    expect(card.lifeStage?.text).toBe('second pinnacle (4, ages 36 to 44), steady building');
    expect(card.math.map((m) => m.summary)).toEqual([
      '6 (June) + 8 (17) + 1 (2026) = 15, reduced to 6',
      '6 + 10 (October) = 16, reduced to 7',
      '7 + 1 = 8',
    ]);
  });

  it('has a headline, six facets, and ends on a reflection prompt', () => {
    const card = composeDay(bank, birth, today, c);
    expect(card.headline.text.length).toBeGreaterThan(0);
    expect(card.facets.map((f) => f.id)).toEqual(['work', 'relationships', 'mind', 'action', 'watch', 'reflect']);
    expect(card.facets[5]?.text.endsWith('?')).toBe(true);
  });

  it('gives the same card for the same date, and different cards for different life paths', () => {
    expect(composeDay(bank, birth, today, c)).toEqual(composeDay(bank, birth, today, c));
    // Same month and day (so the same personal day), different birth year (so a different life path).
    const other = composeDay(bank, { year: 1990, month: 6, day: 17 }, today, c);
    const first = composeDay(bank, birth, today, c);
    expect(other.personalDay.value).toBe(first.personalDay.value);
    expect(other.lifePathLine?.lifePath.value).not.toBe(first.lifePathLine?.lifePath.value);
    expect(other.lifePathLine?.text).not.toBe(first.lifePathLine?.text);
  });
});

describe('every reading can be composed', () => {
  it('has text for every number under every core key', () => {
    for (const key of CORE_KEYS) {
      const values = key === 'birthDay' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
      for (const value of values) {
        const reading = composeNumber(bank, key, { value, root: value > 9 ? (value === 11 ? 2 : value === 22 ? 4 : 6) : value, chain: [value], steps: [] });
        expect(reading.sections).toHaveLength(5);
        for (const s of reading.sections) expect(s.text.length, `${key} ${value} ${s.id}`).toBeGreaterThan(20);
      }
    }
  });

  it('composes karmic debt, the grid and the timeline', () => {
    const lp = lifePath({ year: 1940, month: 1, day: 7 }, c);
    expect(lp.karmicDebt).toBe(13);
    const reading = composeNumber(bank, 'lifePath', lp);
    expect(reading.karmicDebt?.display).toBe('13/4');
    expect(reading.karmicDebt?.overview.length).toBeGreaterThan(20);

    const name = nameNumbers('Amelia Rose Carter', c);
    if (!name.ok) throw new Error('rejected');
    const grid = composeNameGrid(bank, name);
    expect(grid.lessons.map((l) => l.n)).toEqual([7, 8]);
    expect(grid.passion.map((l) => l.n)).toEqual([1, 9]);
    expect(grid.lessons.every((l) => l.text.length > 20)).toBe(true);
    expect(grid.subconscious.value).toBe(7);

    const t = composeTimeline(bank, birth, today, c);
    expect(t.age).toBe(41);
    expect(t.pinnacles.map((p) => p.value)).toEqual([5, 4, 9, 11]);
    expect(t.challenges.map((p) => p.value)).toEqual([2, 3, 1, 1]);
    expect(t.pinnacles[3]?.agesText).toBe('from age 54');
    expect(t.years).toHaveLength(101);
    expect(t.years[0]?.year).toBe(1985);
    expect(t.pinnacles.every((p) => p.text.length > 20 && (p.guidance?.length ?? 0) > 20)).toBe(true);
  });

  it('composes a year with twelve tiles, an overtone and a life-path line', () => {
    const y = composeYear(bank, birth, 2026, c);
    expect(y.personalYear.value).toBe(6);
    expect(y.months).toHaveLength(12);
    expect(y.months[9]).toMatchObject({ month: 10, value: 7, tile: 'Reflect' });
    expect(y.sections.map((s) => s.id)).toEqual(['overview', 'work', 'relationships', 'inner', 'watch', 'reflect']);
    expect(y.lifePathLine?.text.length).toBeGreaterThan(10);
    expect(y.overtone).toBeUndefined();

    // 15 Jul 2025 is a 22 overtone year.
    const m = composeYear(bank, { year: 1990, month: 7, day: 15 }, 2025, c);
    expect(m.personalYear.value).toBe(4);
    expect(m.overtone?.value).toBe(22);
    expect(m.display).toBe('4 (22 overtone)');
  });

  it('composes a month with a calendar grid and the month-by-year line', () => {
    const m = composeMonth(bank, birth, 2026, 10, c);
    expect(m.personalMonth.value).toBe(7);
    expect(m.days).toHaveLength(31);
    expect(m.days.slice(0, 7).map((d) => d.personalDay)).toEqual([8, 9, 1, 2, 3, 4, 5]);
    expect(m.days[2]?.loopStart).toBe(true);
    expect(m.monthYearLine?.text.length).toBeGreaterThan(10);
    expect(m.context).toBe('a reflective month 7 of a care-and-responsibility year 6');
    expect(m.segments).toHaveLength(1);
  });

  it('splits a month in two when the birthday falls inside it (birthday convention)', () => {
    const m = composeMonth(bank, birth, 2026, 6, { ...c, cycleYear: 'birthday' });
    expect(m.segments).toHaveLength(2);
    expect(m.segments[1]?.from).toEqual({ year: 2026, month: 6, day: 17 });
  });

  it('every combination of day, month, year and life path has text', () => {
    for (const lpValue of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33]) {
      for (let pd = 1; pd <= 9; pd += 1) {
        expect(bank.day?.dayLifePath[String(pd)]?.[String(lpValue)], `${pd} x ${lpValue}`).toBeTruthy();
      }
      for (let py = 1; py <= 9; py += 1) {
        expect(bank.year?.yearLifePath[String(py)]?.[String(lpValue)], `${py} x ${lpValue}`).toBeTruthy();
      }
    }
  });
});

describe('special dates', () => {
  it('finds the most notable quality of a date', () => {
    const key = (d: YMD) => specialDateKey({ year: 1990, month: 3, day: 9 }, d, c);
    expect(key({ year: 2026, month: 3, day: 9 })).toBe('birthday');
    expect(key({ year: 2026, month: 9, day: 9 })).toBe('half-birthday');
    expect(key({ year: 2024, month: 2, day: 29 })).toBe('leap-day');
    expect(key({ year: 2026, month: 12, day: 31 })).toBe('new-years-eve');
    expect(key({ year: 2026, month: 6, day: 6 })).toBe('mirror-6-6');
    expect(key({ year: 2026, month: 11, day: 11 })).toBe('mirror-11-11');
    expect(key({ year: 2026, month: 5, day: 11 })).toBe('master-11th');
    expect(key({ year: 2026, month: 5, day: 22 })).toBe('master-22nd');
    expect(key({ year: 2026, month: 5, day: 1 })).toBe('month-start');
    expect(key({ year: 2026, month: 5, day: 31 })).toBe('month-end');
    expect(key({ year: 2026, month: 5, day: 14 })).toBeUndefined();
  });

  it('a special date shows up on the card', () => {
    const card = composeDay(bank, birth, { year: 2026, month: 6, day: 17 }, c);
    expect(card.special?.key).toBe('birthday');
    expect(card.special?.text).toContain('birthday');
  });
});

describe('sources', () => {
  it('only name snippets that exist in the manifest', () => {
    const known = new Set(FAMILIES.flatMap(expectedIds));
    const card = composeDay(bank, birth, today, c);
    for (const id of card.sources) expect(known.has(id), id).toBe(true);
    const y = composeYear(bank, birth, 2026, c);
    for (const id of y.sources) expect(known.has(id), id).toBe(true);
    const m = composeMonth(bank, birth, 2026, 10, c);
    for (const id of m.sources) expect(known.has(id), id).toBe(true);
  });
});

describe('variety', () => {
  const rand = (seed: number) => {
    let a = seed;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  it('no identical headline closer than 40 days at 6 variants (30 profiles, 3 years)', () => {
    const r = rand(7);
    for (let i = 0; i < 30; i += 1) {
      const month = 1 + Math.floor(r() * 12);
      const day = 1 + Math.floor(r() * 28);
      const b = { year: 1950 + Math.floor(r() * 50), month, day };
      const rows = composeHeadlines(bank, b, { year: 2026, month: 1, day: 1 }, { year: 2028, month: 12, day: 31 }, c);
      const last = new Map<string, number>();
      let shortest = Infinity;
      for (const row of rows) {
        const key = `${row.personalDay}|${row.headline}`;
        const t = toOrdinal(row.date);
        const prev = last.get(key);
        if (prev !== undefined) shortest = Math.min(shortest, t - prev);
        last.set(key, t);
      }
      expect(shortest, `profile ${i}`).toBeGreaterThanOrEqual(40);
    }
  });

  it('every day facet cycles through all of its variants', () => {
    const rows = variantIndexRange(birth, { year: 2020, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 }, c);
    const seen = new Map<string, Set<string>>();
    for (const row of rows.slice(-1500)) {
      const card = composeDay(bank, birth, row.date, c, { variantIndex: row.variantIndex });
      for (const f of card.facets) {
        const key = `${card.personalDay.value}.${f.id}`;
        seen.set(key, (seen.get(key) ?? new Set()).add(f.text));
      }
    }
    for (const [key, set] of seen) {
      const facet = key.split('.')[1] as string;
      const expected = { work: 5, relationships: 7, mind: 6, action: 7, watch: 5, reflect: 6 }[facet as 'work'];
      expect(set.size, key).toBe(expected);
    }
  });
});

describe('speed', () => {
  it('composes a full year of day cards well under 50 ms', () => {
    const from: YMD = { year: 2026, month: 1, day: 1 };
    const to: YMD = { year: 2026, month: 12, day: 31 };
    composeHeadlines(bank, birth, from, to, c); // warm up
    // Best of five: other test files share the machine, so one sample can land on a busy moment.
    // A real slowdown raises the best time as well.
    let ms = Infinity;
    let cards: ReturnType<typeof composeDay>[] = [];
    for (let run = 0; run < 5; run += 1) {
      const start = performance.now();
      const rows = variantIndexRange(birth, from, to, c);
      cards = rows.map((r) => composeDay(bank, birth, r.date, c, { variantIndex: r.variantIndex }));
      ms = Math.min(ms, performance.now() - start);
    }
    expect(cards).toHaveLength(365);
    console.log(`365 day cards in ${ms.toFixed(1)} ms (best of 5)`);
    expect(ms).toBeLessThan(50);
  });
});

