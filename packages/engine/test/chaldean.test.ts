import { describe, expect, it } from 'vitest';
import {
  CHALDEAN_CONVENTIONS,
  PYTHAGOREAN_CONVENTIONS,
  buildGrid,
  challenges,
  combineDate,
  compoundIn,
  compoundStep,
  conventionChips,
  coreProfile,
  letterValue,
  lifePath,
  birthDay,
  maturity,
  nameNumbers,
  pinnacles,
  tableDigits,
  type Conventions,
} from '../src';

const chal = (over: Partial<Conventions> = {}): Conventions => ({ ...CHALDEAN_CONVENTIONS, ...over });
const AMELIA = { year: 1985, month: 6, day: 17 };

describe('the Chaldean letter table', () => {
  it('gives eight groups of letters and holds the 9 back', () => {
    const groups: Record<number, string> = { 1: 'AIJQY', 2: 'BKR', 3: 'CGLS', 4: 'DMT', 5: 'EHNX', 6: 'UVW', 7: 'OZ', 8: 'FP' };
    for (const [value, letters] of Object.entries(groups)) {
      for (const letter of letters) expect(letterValue(letter, 'chaldean'), letter).toBe(Number(value));
    }
    const all = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((l) => letterValue(l, 'chaldean'));
    expect(all).not.toContain(9);
    expect(Math.min(...all)).toBe(1);
    expect(Math.max(...all)).toBe(8);
  });

  it('has a grid of eight numbers, so a name can never be short of a 9', () => {
    expect(tableDigits('chaldean')).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(tableDigits('pythagorean')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(buildGrid(['ADA'], chal()).digits).toHaveLength(8);
    const name = nameNumbers('Amelia Rose Carter', chal());
    expect(name.ok && name.lessons).not.toContain(9);
    // Pythagorean still counts the 9 as a number a name can lack.
    const pyth = nameNumbers('Ada', PYTHAGOREAN_CONVENTIONS);
    expect(pyth.ok && pyth.lessons).toContain(9);
  });
});

describe('compound numbers', () => {
  it('takes the first total from 10 to 52 on the way down', () => {
    expect(compoundIn([37, 10, 1])).toBe(37);
    expect(compoundIn([52, 7])).toBe(52);
    expect(compoundIn([10, 1])).toBe(10);
    expect(compoundIn([64, 10, 1])).toBe(10);
    expect(compoundIn([99, 18, 9])).toBe(18);
    expect(compoundIn([53, 8])).toBeUndefined();
    expect(compoundIn([100, 1])).toBeUndefined();
    expect(compoundIn([8])).toBeUndefined();
  });

  it('says which total it is reading, and why, when the sum is above 52', () => {
    expect(compoundStep([37, 10, 1])?.text).toBe('37 is the compound number the tradition reads. It reduces to 1.');
    expect(compoundStep([64, 10, 1])?.text).toBe('64 is above 52, so the tradition reads the next total down: 10. It reduces to 1.');
    expect(compoundStep([8])).toBeUndefined();
  });

  it('names a compound for Amelia Rose Carter, with no master and no karmic debt', () => {
    const n = nameNumbers('Amelia Rose Carter', chal());
    if (!n.ok) throw new Error('rejected');
    // AMELIA 1+4+5+3+1+1 = 15, ROSE 2+7+3+5 = 17, CARTER 3+1+2+4+5+2 = 17: 49 reduces 13 then 4.
    expect(n.expression.chain).toEqual([49, 13, 4]);
    expect(n.expression.value).toBe(4);
    expect(n.expression.compound).toBe(49);
    expect(n.expression.karmicDebt).toBeUndefined();
    // Vowels 8 + 12 + 6 = 26 reduces to 8. Consonants 49 - 26 = 23 reduces to 5.
    expect([n.soulUrge.compound, n.soulUrge.value]).toEqual([26, 8]);
    expect([n.personality.compound, n.personality.value]).toEqual([23, 5]);
    expect(n.expression.steps.map((s) => s.label)).toContain('Compound number');
  });

  it('reads 22 as a compound that reduces to 4, not as a master', () => {
    const n = nameNumbers('Michael', chal()); // M4 I1 C3 H5 A1 E5 L3 = 22
    expect(n.ok && [n.expression.value, n.expression.compound]).toEqual([4, 22]);
    const py = nameNumbers('Michael', { ...PYTHAGOREAN_CONVENTIONS, system: 'chaldean', nameRule: 'whole-name' });
    expect(py.ok && py.expression.value).toBe(4);
  });

  it('gives no compound when the total is a single digit', () => {
    const n = nameNumbers('Ada', chal()); // A1 D4 A1 = 6
    expect(n.ok && n.expression.value).toBe(6);
    expect(n.ok && n.expression.compound).toBeUndefined();
  });

  it('never gives a compound under the Pythagorean tradition', () => {
    const n = nameNumbers('Amelia Rose Carter', PYTHAGOREAN_CONVENTIONS);
    expect(n.ok && n.expression.compound).toBeUndefined();
    expect(lifePath(AMELIA, PYTHAGOREAN_CONVENTIONS).compound).toBeUndefined();
  });
});

describe('rule D, the Chaldean date rule', () => {
  it('adds every digit in one flat sum: 17 June 1985 is 37, then 10, then 1', () => {
    const { chain, steps } = combineDate(AMELIA, 'D', ['day', 'month', 'year']);
    expect(chain).toEqual([37, 10, 1]);
    expect(steps[0]?.text).toContain('1 + 7 + 6 + 1 + 9 + 8 + 5 = 37');
    const lp = lifePath(AMELIA, chal());
    expect([lp.value, lp.compound, lp.karmicDebt]).toEqual([1, 37, undefined]);
    expect(lp.steps.map((s) => s.label)).toContain('Compound number');
  });

  it('keeps no masters: a flat sum of 11, 22 or 33 reduces', () => {
    // 29 Nov 2000: 2 + 9 + 1 + 1 + 2 = 15 ... use a date that sums to 22 instead: 4 Apr 2002 = 4 + 4 + 2 + 0 + 0 + 2 = 12.
    const lp = lifePath({ year: 1999, month: 9, day: 12 }, chal()); // 1+2 + 9 + 1+9+9+9 = 40 -> 4
    expect(lp.value).toBe(4);
    const b = lifePath({ year: 1976, month: 2, day: 9 }, { ...chal(), dateRule: 'B' }); // 9 + 2 + 1+9+7+6 = 34 -> 7
    expect(b.value).toBe(7);
    // Sum 29 (a master 11 on the way down under rule B) reduces straight through under rule D.
    const d = combineDate({ year: 1980, month: 9, day: 29 }, 'D', ['day', 'month', 'year']); // 2+9 + 9 + 1+9+8+0 = 38
    expect(d.chain).toEqual([38, 11, 2]);
    expect(combineDate({ year: 1980, month: 9, day: 29 }, 'B', ['day', 'month', 'year']).chain).toEqual([38, 11]);
  });

  it('reads the birth day as a compound when it is 10 or more', () => {
    const d17 = birthDay(AMELIA, chal());
    expect([d17.value, d17.compound]).toEqual([8, 17]);
    const d29 = birthDay({ year: 1990, month: 1, day: 29 }, chal());
    expect([d29.value, d29.compound]).toEqual([2, 29]);
    const d5 = birthDay({ year: 1990, month: 1, day: 5 }, chal());
    expect([d5.value, d5.compound]).toEqual([5, undefined]);
    // Pythagorean keeps 11 and 22 as masters and gives no compound.
    const p22 = birthDay({ year: 1990, month: 1, day: 22 }, PYTHAGOREAN_CONVENTIONS);
    expect([p22.value, p22.compound]).toEqual([22, undefined]);
    const c22 = birthDay({ year: 1990, month: 1, day: 22 }, chal());
    expect([c22.value, c22.compound]).toEqual([4, 22]);
  });

  it('keeps no masters in the pinnacles either', () => {
    const birth = { year: 1990, month: 2, day: 9 }; // month 2 + day 9 = 11
    expect(pinnacles(birth, PYTHAGOREAN_CONVENTIONS)[0]?.value).toBe(11);
    expect(pinnacles(birth, chal())[0]?.value).toBe(2);
    expect(challenges(birth, chal()).map((p) => p.value)).toEqual(challenges(birth, PYTHAGOREAN_CONVENTIONS).map((p) => p.value));
  });

  it('has the same single-digit roots as every other rule, so the cycles do not move', () => {
    for (let day = 1; day <= 28; day += 3) {
      const birth = { year: 1950 + day, month: (day % 12) + 1, day };
      const roots = (['A2', 'A', 'B', 'C', 'D'] as const).map((rule) => lifePath(birth, { ...chal(), dateRule: rule }).root);
      expect(new Set(roots).size, JSON.stringify(birth)).toBe(1);
    }
  });
});

describe('maturity in the Chaldean tradition', () => {
  it('has no master and names a compound when life path and expression add to 10 or more', () => {
    const profile = coreProfile({ year: 1985, month: 6, day: 17 }, 'Amelia Rose Carter', chal());
    // Life path 1 + expression 4 = 5: a single digit, so no compound.
    expect([profile.maturity?.value, profile.maturity?.compound]).toEqual([5, undefined]);
    const nine = maturity(
      { value: 8, root: 8, chain: [8], steps: [] },
      { value: 9, root: 9, chain: [9], steps: [] },
      chal(),
    );
    expect([nine.value, nine.compound]).toEqual([8, 17]);
  });

  it('keeps the master in the Pythagorean tradition', () => {
    const eleven = maturity(
      { value: 5, root: 5, chain: [5], steps: [] },
      { value: 6, root: 6, chain: [6], steps: [] },
      PYTHAGOREAN_CONVENTIONS,
    );
    expect(eleven.value).toBe(11);
  });
});

describe('the chips beside a Chaldean number', () => {
  it('name the table, the rule and the date rule', () => {
    expect(conventionChips('expression', chal())).toEqual(['Chaldean letters', 'Name: whole name']);
    expect(conventionChips('lifePath', chal())).toEqual(['Date rule D']);
    expect(conventionChips('maturity', chal())).toEqual(['Life path + expression', 'Date rule D', 'Chaldean letters', 'Name: whole name']);
    expect(conventionChips('expression', PYTHAGOREAN_CONVENTIONS)).toEqual(['Name: per part']);
  });
});
