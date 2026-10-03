import { beforeAll, describe, expect, it } from 'vitest';
import {
  PYTHAGOREAN_CONVENTIONS,
  fromOrdinal,
  monthVariantIndex,
  personalMonthOn,
  personalYear,
  toOrdinal,
  variantIndexRange,
  yearVariantIndex,
  type YMD,
} from '@numerology/engine';
import { CAUTION_FACETS, CAUTION_SAFETY_LINES, expectedIds, FAMILIES } from '@numerology/content';
import {
  composeDay,
  composeHeadlines,
  composeMonth,
  composeYear,
  DAY_CAUTION_LOOP,
  dayCautionPick,
  SAFETY_LINES,
  type Bank,
} from '../src';
import { loadSourceBank } from '../../../tools/content-pipeline/src/build';

let bank: Bank;
beforeAll(() => {
  bank = loadSourceBank();
});

const c = PYTHAGOREAN_CONVENTIONS;
const birth: YMD = { year: 1985, month: 6, day: 17 };

describe('which caution a day gets', () => {
  it('rotates the facet every occurrence and the variant every fifth (offset by facet), over a loop of 30', () => {
    expect(DAY_CAUTION_LOOP).toBe(30);
    const seen = new Set<string>();
    for (let k = 0; k < 30; k += 1) {
      const { facet, variant } = dayCautionPick(k);
      expect(facet).toBe(CAUTION_FACETS[k % 5]);
      expect(variant).toBe((Math.floor(k / 5) + (k % 5)) % 6);
      seen.add(`${facet}.${variant}`);
    }
    expect(seen.size).toBe(30);
    expect(dayCautionPick(30)).toEqual(dayCautionPick(0));
    expect(dayCautionPick(-1)).toEqual(dayCautionPick(29)); // never throws for an odd index
  });

  it('never repeats the same caution for the same personal day within 30 occurrences', () => {
    const rows = variantIndexRange(birth, { year: 2026, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 }, c);
    const byNumber = new Map<number, string[]>();
    for (const row of rows) {
      const card = composeDay(bank, birth, row.date, c, { variantIndex: row.variantIndex });
      expect(card.caution?.source).toBeTruthy();
      const list = byNumber.get(card.personalDay.value) ?? [];
      list.push(card.caution!.source);
      byNumber.set(card.personalDay.value, list);
    }
    // A year holds about 40 days of each number, so a repeat can only come from the loop of 30.
    for (const [number, list] of byNumber) {
      for (let i = 0; i < list.length; i += 1) {
        const window = list.slice(Math.max(0, i - 29), i);
        expect(window.includes(list[i] as string), `number ${number} at occurrence ${i}`).toBe(false);
      }
    }
  });
});

describe('cautions in the readings', () => {
  it('give a day exactly one caution, with its label, headline, body and shadow trait', () => {
    const card = composeDay(bank, birth, { year: 2026, month: 10, day: 1 }, c);
    expect(card.caution).toMatchObject({ source: expect.stringMatching(/^day\.caution\.8\.[a-z]+\.v[1-6]$/) });
    expect(['WATCH OUT', 'GO EASY ON', 'AVOID']).toContain(card.caution?.label);
    expect(card.caution?.headline.length).toBeGreaterThan(2);
    expect(card.caution?.body.length).toBeGreaterThan(20);
    expect(card.caution?.link).toMatch(/^the 8's/);
    expect(card.sources).toContain(card.caution?.source);
  });

  it('give a year and a month one caution per facet, each a step further along the variants', () => {
    const y = composeYear(bank, birth, 2026, c);
    expect(y.cautions.map((x) => x.facet)).toEqual([...CAUTION_FACETS]);
    const start = yearVariantIndex(birth, 2026);
    expect(y.cautions.map((x) => x.source.split('.').pop())).toEqual(
      CAUTION_FACETS.map((_, f) => `v${((start + f) % 6) + 1}`),
    );
    // So the five cards do not all share a variant, and so a label.
    expect(y.cautions.every((x) => x.source.startsWith('year.caution.6.'))).toBe(true);
    for (const x of y.cautions) expect(y.sources).toContain(x.source);

    const m = composeMonth(bank, birth, 2026, 10, c);
    expect(m.cautions.map((x) => x.facet)).toEqual([...CAUTION_FACETS]);
    expect(m.cautions.every((x) => x.source.startsWith('month.caution.7.'))).toBe(true);
  });

  it('move to a different variant when the same year number comes round again', () => {
    // The same personal year number recurs every 9 years; the variant moves on each time.
    const first = composeYear(bank, birth, 2026, c).cautions[0]?.source;
    const next = composeYear(bank, birth, 2035, c).cautions[0]?.source;
    const again = composeYear(bank, birth, 2044, c).cautions[0]?.source;
    expect(new Set([first, next, again]).size).toBe(3);
  });

  it('have text for every number, facet and variant in every layer', () => {
    for (const family of FAMILIES.filter((f) => f.caution)) {
      for (const id of expectedIds(family)) {
        const [, , number, facet, v] = id.split('.') as [string, string, string, 'money', string];
        const layer = bank[family.layer as 'year' | 'month' | 'day'];
        const entry = layer?.caution[number]?.[facet]?.[Number(v.slice(1)) - 1];
        expect(entry?.headline, id).toBeTruthy();
        expect(entry?.body, id).toBeTruthy();
      }
    }
  });

  it('show the same two safety lines whatever the number', () => {
    expect([...SAFETY_LINES]).toEqual([...CAUTION_SAFETY_LINES]);
  });
});

describe('counting earlier occurrences for the year and month variants', () => {
  it('year: counts earlier years since 1900 with the same personal year', () => {
    for (const year of [1900, 1999, 2026, 2100]) {
      const target = personalYear(birth, year, c).root;
      let brute = 0;
      for (let y = 1900; y < year; y += 1) if (personalYear(birth, y, c).root === target) brute += 1;
      expect(yearVariantIndex(birth, year)).toBe(brute);
    }
  });

  it('month: counts earlier months since January 1900 with the same personal month', () => {
    for (const [year, month] of [[1900, 1], [1900, 9], [2026, 10], [2050, 3]] as const) {
      const first: YMD = { year, month, day: 1 };
      const target = personalMonthOn(birth, first, c).value;
      let brute = 0;
      for (let t = toOrdinal({ year: 1900, month: 1, day: 1 }); t < toOrdinal(first); t += 1) {
        const d = fromOrdinal(t);
        if (d.day === 1 && personalMonthOn(birth, d, c).value === target) brute += 1;
      }
      expect(monthVariantIndex(birth, year, month, c)).toBe(brute);
    }
  });

  it('follows the birthday convention too', () => {
    const bday = { ...c, cycleYear: 'birthday' as const };
    const first: YMD = { year: 2026, month: 10, day: 1 };
    const target = personalMonthOn(birth, first, bday).value;
    let brute = 0;
    for (let t = toOrdinal({ year: 1900, month: 1, day: 1 }); t < toOrdinal(first); t += 1) {
      const d = fromOrdinal(t);
      if (d.day === 1 && personalMonthOn(birth, d, bday).value === target) brute += 1;
    }
    expect(monthVariantIndex(birth, 2026, 10, bday)).toBe(brute);
  });
});

describe('speed', () => {
  it('a year of day cards, with their cautions, is still well under 50 ms', () => {
    const from: YMD = { year: 2026, month: 1, day: 1 };
    const to: YMD = { year: 2026, month: 12, day: 31 };
    // Warm up the whole path, as composer.test.ts does, so the first sample is not a cold start.
    composeHeadlines(bank, birth, from, to, c);
    variantIndexRange(birth, from, to, c);
    // Best of five, as in composer.test.ts: a shared machine can make one sample slow.
    let ms = Infinity;
    let cards: ReturnType<typeof composeDay>[] = [];
    for (let run = 0; run < 5; run += 1) {
      const start = performance.now();
      const rows = variantIndexRange(birth, from, to, c);
      cards = rows.map((r) => composeDay(bank, birth, r.date, c, { variantIndex: r.variantIndex }));
      ms = Math.min(ms, performance.now() - start);
    }
    expect(cards.every((card) => card.caution)).toBe(true);
    expect(ms).toBeLessThan(50);
  });
});
