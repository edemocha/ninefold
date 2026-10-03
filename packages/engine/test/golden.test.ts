import { describe, expect, it } from 'vitest';
import {
  challenges,
  PYTHAGOREAN_CONVENTIONS,
  letterValue,
  lifePath,
  nameNumbers,
  personalDay,
  personalMonth,
  personalYear,
  pinnacles,
  type Conventions,
  type DateRule,
} from '../src';
import vectors from '../../../tests/golden/vectors.json';

const conv = (over: Partial<Conventions> = {}): Conventions => ({ ...PYTHAGOREAN_CONVENTIONS, ...over });

type DateVector = {
  id: string;
  birth: { year: number; month: number; day: number };
  lifePath: Record<string, number>;
  lifePathA2?: { chain: number[]; karmicDebt: number };
  karmicDebt?: Record<string, number>;
  pinnacles?: number[];
  challenges?: number[];
  pinnacleAges?: [number, number | null][];
};
const dateVectors = vectors.dates as unknown as DateVector[];

describe('golden vectors: dates', () => {
  for (const v of dateVectors) {
    it(v.id, () => {
      for (const [rule, expected] of Object.entries(v.lifePath)) {
        expect(lifePath(v.birth, conv({ dateRule: rule as DateRule })).value, `rule ${rule}`).toBe(expected);
      }
      const a2 = lifePath(v.birth, conv());
      if (v.lifePathA2) {
        expect(a2.chain).toEqual(v.lifePathA2.chain);
        expect(a2.karmicDebt).toBe(v.lifePathA2.karmicDebt);
      }
      if (v.karmicDebt) {
        for (const [rule, debt] of Object.entries(v.karmicDebt)) {
          expect(lifePath(v.birth, conv({ dateRule: rule as DateRule })).karmicDebt, `debt ${rule}`).toBe(debt);
        }
        expect(lifePath(v.birth, conv({ dateRule: 'B' })).karmicDebt).toBeUndefined();
      }
      if (v.pinnacles) {
        expect(pinnacles(v.birth, conv()).map((p) => p.value)).toEqual(v.pinnacles);
        expect(challenges(v.birth, conv()).map((p) => p.value)).toEqual(v.challenges);
        expect(pinnacles(v.birth, conv()).map((p) => [p.ageFrom, p.ageTo])).toEqual(v.pinnacleAges);
      }
    });
  }
});

describe('golden vectors: cycles', () => {
  const rhythm = vectors.cycles[3] as (typeof vectors.cycles)[3];
  it('helenthomas: 2 Apr 1969 in 2023', () => {
    const v = vectors.cycles[0] as (typeof vectors.cycles)[0];
    const c = conv();
    expect(personalYear(v.birth, 2023, c).value).toBe(4);
    expect(personalMonth(v.birth, 2023, 10, c).value).toBe(5);
    expect(personalDay(v.birth, { year: 2023, month: 10, day: 15 }, c).value).toBe(2);
  });

  it('substack: 15 Jul in 2025 is 22 with masters kept, 4 as a single digit', () => {
    const v = vectors.cycles[1] as (typeof vectors.cycles)[1];
    expect(personalYear(v.birth, 2025, conv({ cycleMasters: 'keep' })).value).toBe(22);
    const overtone = personalYear(v.birth, 2025, conv({ cycleMasters: 'overtone' }));
    expect(overtone.value).toBe(4);
    expect(overtone.overtone).toBe(22);
    const single = personalYear(v.birth, 2025, conv({ cycleMasters: 'single' }));
    expect(single.value).toBe(4);
    expect(single.overtone).toBeUndefined();
  });

  it('1 Jan in 2025 is 11 under A with masters kept, 2 as a single digit', () => {
    const v = vectors.cycles[2] as (typeof vectors.cycles)[2];
    expect(personalYear(v.birth, 2025, conv({ dateRule: 'A', cycleMasters: 'keep' })).value).toBe(11);
    expect(personalYear(v.birth, 2025, conv({ dateRule: 'A', cycleMasters: 'single' })).value).toBe(2);
  });

  it('17 Jun 1985 on 1 Oct 2026: year 6, month 7, day 8; 1 to 7 Oct is 8 9 1 2 3 4 5', () => {
    const c = conv();
    expect(personalYear(rhythm.birth, 2026, c).value).toBe(6);
    expect(personalMonth(rhythm.birth, 2026, 10, c).value).toBe(7);
    expect(personalDay(rhythm.birth, { year: 2026, month: 10, day: 1 }, c).value).toBe(8);
    const days = [1, 2, 3, 4, 5, 6, 7].map(
      (day) => personalDay(rhythm.birth, { year: 2026, month: 10, day }, c).value,
    );
    expect(days).toEqual(rhythm.days?.numbers);
  });
});

describe('golden vectors: names', () => {
  for (const v of vectors.names) {
    if ('pythagorean' in v) {
      it(`${v.name}: Pythagorean ${v.pythagorean}, Chaldean ${v.chaldean}`, () => {
        const py = nameNumbers(v.name, conv());
        const ch = nameNumbers(v.name, conv({ system: 'chaldean' }));
        expect(py.ok && py.expression.value).toBe(v.pythagorean);
        // The vector keeps a master where one turns up; the Chaldean tradition reads it as a compound and reduces it.
        const total = v.chaldean ?? 0;
        const root = total > 9 ? 1 + ((total - 1) % 9) : total;
        expect(ch.ok && ch.expression.value).toBe(root);
      });
    }
  }

  it('Amelia Rose Carter: per-part and whole-name', () => {
    const v = vectors.names[4] as { perPart: Record<string, number>; wholeName: Record<string, number> };
    const per = nameNumbers('Amelia Rose Carter', conv({ nameRule: 'per-part' }));
    const whole = nameNumbers('Amelia Rose Carter', conv({ nameRule: 'whole-name' }));
    if (!per.ok || !whole.ok) throw new Error('name rejected');
    expect([per.expression.value, per.soulUrge.value, per.personality.value]).toEqual([
      v.perPart.expression,
      v.perPart.soulUrge,
      v.perPart.personality,
    ]);
    expect([whole.expression.value, whole.soulUrge.value, whole.personality.value]).toEqual([
      v.wholeName.expression,
      v.wholeName.soulUrge,
      v.wholeName.personality,
    ]);
  });

  it('letter values: A to I are 1 to 9 and the pattern repeats', () => {
    expect([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => letterValue(l, 'pythagorean'))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });
});
