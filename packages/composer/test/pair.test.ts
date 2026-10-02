import { beforeAll, describe, expect, it } from 'vitest';
import { DEFAULT_CONVENTIONS, pairKey, type Conventions, type YMD } from '@numerology/engine';
import { DIGITS, PAIR_KEYS, PAIR_OVERLAYS, PAIR_SAFETY_LINES, RULES } from '@numerology/content';
import { composePair, PAIR_SAFETY, type Bank, type PairReading } from '../src';
import { loadSourceBank } from '../../../tools/content-pipeline/src/build';
import { loadFamilies } from '../../../tools/content-pipeline/src/load';

let bank: Bank;
let ids: Set<string>;
beforeAll(() => {
  bank = loadSourceBank();
  ids = new Set(loadFamilies().flatMap((l) => l.snippets.map((s) => s.id)));
});

const c: Conventions = { ...DEFAULT_CONVENTIONS };
const you: YMD = { year: 1990, month: 3, day: 14 };
const other: YMD = { year: 1988, month: 11, day: 2 };
const today: YMD = { year: 2026, month: 10, day: 1 };

describe('the sample pair', () => {
  it('reads two life paths, three sections and the cycle gap', () => {
    const r = composePair(bank, you, other, today, c, 'Sam');
    expect(r.key).toBe('3-9');
    expect(r.numbers).toBe('a 9 and a 3');
    expect(r.sides.map((s) => [s.label, s.display])).toEqual([
      ['You', '9'],
      ['Sam', '3'],
    ]);
    expect(r.sections.map((s) => s.id)).toEqual(['meet', 'stretch', 'talk']);
    expect(r.sections[2]?.text.endsWith('?')).toBe(true);
    expect(r.sides[0].relationships.length).toBeGreaterThan(20);
    expect(r.overlay).toBe('none');
    expect(r.overlayNote).toBeUndefined();
  });

  it('states the gap and what it means for each person', () => {
    const r = composePair(bank, you, other, today, c, 'Sam').rhythm;
    expect([r.forward, r.back, r.distance, r.you, r.other]).toEqual([4, 5, 4, 9, 5]);
    expect(r.headline).toBe('Your numbers are 4 steps apart.');
    expect(r.lines).toEqual(['In 4 years, Sam has the year number you have now.', 'In 5 years, you have the year number Sam has now.']);
    expect(r.holds).toContain('every year, month and day');
    expect(r.sections.map((s) => s.id)).toEqual(['meaning', 'use', 'talk']);
    expect(r.sections[2]?.text.endsWith('?')).toBe(true);
    expect(r.steps.map((s) => s.label)).toEqual(['You', 'Sam', 'Difference', 'The year']);
  });

  it('lists nine years of both numbers, wrapping 9 to 1, and marks the current one', () => {
    const r = composePair(bank, you, other, today, c).rhythm;
    expect(r.strip).toHaveLength(9);
    expect(r.strip[0]).toMatchObject({ year: 2026, aRoot: 9, bRoot: 5, current: true });
    expect(r.strip.map((x) => x.aRoot)).toEqual([9, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(r.strip.filter((x) => x.current)).toHaveLength(1);
  });

  it('uses a neutral label when there is no nickname', () => {
    const r = composePair(bank, you, other, today, c);
    expect(r.sides[1].label).toBe('The other person');
    expect(r.rhythm.lines[0]).toBe('In 4 years, the other person has the year number you have now.');
  });

  it('says one step and one year in the singular', () => {
    const next: YMD = { year: 1990, month: 3, day: 13 }; // 3 + 13 = 16, root 7; yours is 8
    const r = composePair(bank, you, next, today, c).rhythm;
    expect(r.distance).toBe(1);
    expect(r.headline).toBe('Your numbers are 1 step apart.');
    expect(r.lines[0]).toBe('In 1 year, the other person has the year number you have now.');
    expect(r.lines[1]).toBe('In 8 years, you have the year number the other person has now.');
  });

  it('says the same under a shared month and day', () => {
    const r = composePair(bank, you, { year: 2001, month: 3, day: 14 }, today, c).rhythm;
    expect(r.distance).toBe(0);
    expect(r.headline).toBe('Your numbers are the same.');
    expect(r.lines).toEqual(['You and the other person have the same year number now.']);
  });
});

describe('symmetry', () => {
  it('gives the same bank text in either order and swaps only who is who', () => {
    const ab = composePair(bank, you, other, today, c, 'Sam');
    const ba = composePair(bank, other, you, today, c, 'Sam');
    expect(ab.key).toBe(ba.key);
    expect(ab.sections.map((s) => s.text)).toEqual(ba.sections.map((s) => s.text));
    expect(ab.rhythm.sections.map((s) => s.text)).toEqual(ba.rhythm.sections.map((s) => s.text));
    expect(ab.rhythm.forward).toBe(ba.rhythm.back);
    expect(ab.rhythm.back).toBe(ba.rhythm.forward);
    expect(ab.sides[0].display).toBe(ba.sides[1].display);
  });
});

describe('master numbers', () => {
  const master: YMD = { year: 2003, month: 3, day: 3 }; // life path 11
  const master22: YMD = { year: 2002, month: 9, day: 9 }; // life path 22

  it('uses the root pair and adds one short note', () => {
    const r = composePair(bank, master, you, today, c);
    expect(r.key).toBe('2-9');
    expect(r.numbers).toBe('an 11/2 and a 9');
    expect(r.overlay).toBe('11');
    expect(r.overlayNote?.source).toBe('pair.master.11');
    expect(r.overlayNote?.text).toContain('An 11 is a 2');
  });

  it('has a note for 22 and for two masters', () => {
    expect(composePair(bank, master22, you, today, c).overlayNote?.source).toBe('pair.master.22');
    const both = composePair(bank, master, master22, today, c);
    expect(both.key).toBe('2-4');
    expect(both.overlay).toBe('both');
    expect(both.overlayNote?.source).toBe('pair.master.both');
  });

  it('has text for every overlay', () => {
    for (const key of PAIR_OVERLAYS) expect(bank.pair?.master[key]?.length).toBeGreaterThan(20);
  });
});

describe('birthday cycles', () => {
  const b: Conventions = { ...c, cycleYear: 'birthday' };

  it('says "about" and explains that the gap moves between birthdays', () => {
    const r = composePair(bank, you, other, { year: 2026, month: 6, day: 1 }, b, 'Sam').rhythm;
    expect(r.approx).toBe(true);
    expect(r.shifted).toBe(true);
    expect([r.forward, r.back]).toEqual([5, 4]);
    expect(r.lines[0]).toBe('In about 5 years, Sam has the year number you have now.');
    expect(r.holds).toContain('one step away from its usual size of 4');
    expect(r.stripHeading).toBe('The cycle that starts in');
    expect(r.segments.map((s) => s.forward)).toEqual([4, 5, 4]);
  });

  it('is at its usual size outside the two birthdays', () => {
    const r = composePair(bank, you, other, { year: 2026, month: 12, day: 1 }, b).rhythm;
    expect(r.shifted).toBe(false);
    expect(r.holds).toContain('Today it is at its usual size');
  });
});

describe('the bank', () => {
  it('has text for every pair of single digits, in the order the engine keys them', () => {
    expect(PAIR_KEYS).toHaveLength(45);
    for (const x of DIGITS) {
      for (const y of DIGITS) {
        const entry = bank.pair?.core[pairKey(x, y)];
        expect(entry, `${x}-${y}`).toBeDefined();
        expect(entry?.meet.length).toBeGreaterThan(30);
      }
    }
  });

  it('names real snippets as its sources', () => {
    for (const [a, b, label] of [
      [you, other, 'Sam'],
      [{ year: 2003, month: 3, day: 3 }, { year: 2002, month: 9, day: 9 }, undefined],
    ] as const) {
      const r = composePair(bank, a, b, today, c, label);
      for (const source of r.sources) expect(ids.has(source), source).toBe(true);
    }
  });
});

describe('the two safety lines', () => {
  const lines = [...PAIR_SAFETY_LINES];

  it('are the same on every pair and carry no number', () => {
    const readings: PairReading[] = [
      composePair(bank, you, other, today, c),
      composePair(bank, { year: 1975, month: 8, day: 8 }, { year: 2010, month: 1, day: 5 }, today, c),
      composePair(bank, { year: 2003, month: 3, day: 3 }, { year: 2002, month: 9, day: 9 }, today, c),
    ];
    for (const r of readings) expect([...r.safety]).toEqual(lines);
    expect([...PAIR_SAFETY]).toEqual(lines);
    for (const line of lines) expect(line).not.toMatch(/\d/);
  });
});

/** A seeded generator so the sweep below never changes. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('the language guard', () => {
  const pairRules = RULES.filter((g) => g.optIn);
  const patterns = pairRules.flatMap((g) => g.patterns.map((pattern) => ({ group: g.id, pattern })));

  /** Every string a visitor can read that this feature adds, apart from the main bank's life path text. */
  function ownText(r: PairReading): string[] {
    return [
      r.numbers,
      ...r.sections.flatMap((s) => [s.title, s.text]),
      ...(r.overlayNote ? [r.overlayNote.text] : []),
      r.rhythm.headline,
      ...r.rhythm.lines,
      r.rhythm.holds,
      r.rhythm.stripHeading,
      ...r.rhythm.sections.flatMap((s) => [s.title, s.text]),
      ...r.rhythm.steps.flatMap((s) => [s.label, s.text]),
    ];
  }

  it('never shows a score, a verdict or a relationship type, over 300 random pairs and every convention', () => {
    const rand = mulberry32(20261001);
    const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
    const date = (y0: number, y1: number): YMD => {
      const year = int(y0, y1);
      const month = int(1, 12);
      return { year, month, day: int(1, [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] as number) };
    };
    for (let i = 0; i < 300; i += 1) {
      const conv: Conventions = {
        ...DEFAULT_CONVENTIONS,
        dateRule: (['A2', 'A', 'B', 'C'] as const)[int(0, 3)] as Conventions['dateRule'],
        cycleYear: int(0, 1) === 0 ? 'calendar' : 'birthday',
        cycleMasters: (['overtone', 'keep', 'single'] as const)[int(0, 2)] as Conventions['cycleMasters'],
      };
      const r = composePair(bank, date(1930, 2020), date(1930, 2020), date(2024, 2040), conv, i % 3 === 0 ? 'Sam' : undefined);
      for (const text of ownText(r)) {
        const hit = patterns.find((x) => x.pattern.test(text));
        expect(hit ? `${hit.group}: ${hit.pattern.source} in "${text}"` : undefined).toBeUndefined();
      }
    }
  });
});
