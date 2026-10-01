import { describe, expect, it } from 'vitest';
import {
  challenges,
  DEFAULT_CONVENTIONS,
  lifePath,
  nameNumbers,
  personalDay,
  personalMonthOn,
  personalYear,
  pinnacles,
  cycleYearOn,
  type Conventions,
  type DateRule,
  type YMD,
} from '@numerology/engine';
import {
  refChallenges,
  refCycleYear,
  refGrid,
  refKarmic,
  refLifePath,
  refDateChain,
  refNameNumbers,
  refPersonalDay,
  refPersonalMonth,
  refPersonalYear,
  refPinnacles,
} from './reference/reference';

/** Small seeded PRNG so a failure reproduces. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const daysIn = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const pick = <T,>(rand: () => number, xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;
const int = (rand: () => number, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

function randomDate(rand: () => number, y0: number, y1: number): YMD {
  const year = int(rand, y0, y1);
  const month = int(rand, 1, 12);
  return { year, month, day: int(rand, 1, daysIn(year, month)) };
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function randomWord(rand: () => number): string {
  const len = int(rand, 1, 9);
  let w = '';
  for (let i = 0; i < len; i += 1) w += LETTERS[int(rand, 0, 25)];
  return w;
}

type Profile = {
  birth: YMD;
  words: string[];
  c: Conventions;
  on: YMD;
};

function profiles(count: number, seed: number): Profile[] {
  const rand = mulberry32(seed);
  const out: Profile[] = [];
  for (let i = 0; i < count; i += 1) {
    const birth =
      i < 8 // make sure 29 February births are in the mix
        ? { year: pick(rand, [1904, 1940, 1972, 1996, 2000, 2008]), month: 2, day: 29 }
        : randomDate(rand, 1900, 2010);
    out.push({
      birth,
      words: Array.from({ length: int(rand, 1, 4) }, () => randomWord(rand)),
      c: {
        ...DEFAULT_CONVENTIONS,
        dateRule: pick(rand, ['A2', 'A', 'B', 'C'] as DateRule[]),
        nameRule: pick(rand, ['per-part', 'whole-name'] as const),
        yRule: pick(rand, ['consonant', 'vowel-if-alone'] as const),
        cycleYear: pick(rand, ['calendar', 'birthday'] as const),
        cycleMasters: pick(rand, ['overtone', 'keep', 'single'] as const),
        leapBirthday: pick(rand, ['feb28', 'mar1'] as const),
      },
      on: randomDate(rand, 2000, 2060),
    });
  }
  return out;
}

describe('engine against the independent reference: 200 random profiles', () => {
  const sample = profiles(200, 20261001);
  const ymd = (d: YMD) => ({ y: d.year, m: d.month, d: d.day });

  it('life path, karmic debt, pinnacles, challenges and ages agree', () => {
    for (const p of sample) {
      const b = ymd(p.birth);
      const lp = lifePath(p.birth, p.c);
      expect(lp.value, JSON.stringify(p)).toBe(refLifePath(b, p.c.dateRule));
      expect(lp.karmicDebt).toBe(refKarmic(refDateChain(b, p.c.dateRule)));

      const pin = pinnacles(p.birth, p.c);
      const refPin = refPinnacles(b, p.c.dateRule);
      expect(pin.map((x) => [x.value, x.ageFrom, x.ageTo])).toEqual(
        refPin.map((x) => [x.value, x.from, x.to]),
      );
      expect(challenges(p.birth, p.c).map((x) => x.value)).toEqual(refChallenges(b));
    }
  });

  it('personal year, month and day agree under every cycle convention', () => {
    for (const p of sample) {
      const b = ymd(p.birth);
      const o = ymd(p.on);
      const cycle = cycleYearOn(p.birth, p.on, p.c);
      expect(cycle, JSON.stringify(p)).toBe(refCycleYear(b, o, p.c.cycleYear, p.c.leapBirthday));

      const py = personalYear(p.birth, cycle, p.c);
      const refPy = refPersonalYear(b, cycle, p.c.dateRule, p.c.cycleMasters);
      expect(py.value).toBe(refPy.value);
      expect(py.overtone).toBe(refPy.overtone);

      expect(personalMonthOn(p.birth, p.on, p.c).value).toBe(
        refPersonalMonth(b, o, p.c.dateRule, p.c.cycleMasters, p.c.cycleYear, p.c.leapBirthday),
      );
      expect(personalDay(p.birth, p.on, p.c).value).toBe(
        refPersonalDay(b, o, p.c.dateRule, p.c.cycleMasters, p.c.cycleYear, p.c.leapBirthday),
      );
    }
  });

  it('expression, soul urge, personality, lessons, passion and subconscious self agree', () => {
    for (const p of sample) {
      for (const system of ['pythagorean', 'chaldean'] as const) {
        const conv: Conventions = { ...p.c, system };
        const profile = nameNumbers(p.words.join(' '), conv);
        if (!profile.ok) throw new Error(`rejected ${p.words.join(' ')}`);
        const ref = refNameNumbers(p.words, { system, nameRule: conv.nameRule, yRule: conv.yRule });
        expect(
          [profile.expression.value, profile.soulUrge.value, profile.personality.value],
          `${p.words.join(' ')} ${system} ${conv.nameRule} ${conv.yRule}`,
        ).toEqual([ref.expression, ref.soulUrge, ref.personality]);
        if (system === 'pythagorean') {
          const grid = refGrid(p.words, system);
          expect(profile.lessons).toEqual(grid.lessons);
          expect(profile.passion).toEqual(grid.passion);
          expect(profile.subconscious.value).toBe(grid.subconscious);
        }
      }
    }
  });
});
