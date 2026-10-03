import { beforeAll, describe, expect, it } from 'vitest';
import { CHALDEAN_CONVENTIONS, PYTHAGOREAN_CONVENTIONS, coreProfile, nameNumbers, type YMD } from '@numerology/engine';
import { COMPOUNDS, CORE_KEYS, SHADOW_SECTIONS, VALUES } from '@numerology/content';
import {
  COMPOUND_ECHOES,
  COMPOUND_TITLES,
  PLANET_NAMES,
  composeCompound,
  composeNumber,
  composePlanet,
  composeShadow,
  type Bank,
} from '../src';
import { loadSourceBank } from '../../../tools/content-pipeline/src/build';

let bank: Bank;
beforeAll(() => {
  bank = loadSourceBank();
});

const birth: YMD = { year: 1985, month: 6, day: 17 };

describe('the compound numbers', () => {
  it('has a title for every compound from 10 to 52, and none outside', () => {
    expect(COMPOUNDS).toHaveLength(43);
    expect(COMPOUNDS[0]).toBe(10);
    expect(COMPOUNDS[42]).toBe(52);
    for (const n of COMPOUNDS) expect(COMPOUND_TITLES[n], String(n)).toBeTruthy();
    expect(composeCompound(bank, 9)).toBeUndefined();
    expect(composeCompound(bank, 53)).toBeUndefined();
  });

  it('has three sections for each, the last a question', () => {
    for (const n of COMPOUNDS) {
      const reading = composeCompound(bank, n);
      expect(reading?.sections.map((s) => s.id), String(n)).toEqual(['overview', 'shadow', 'working']);
      expect(reading?.sections[2]?.text.trim().endsWith('?'), `${n} working`).toBe(true);
      expect(reading?.root).toBe(1 + ((n - 1) % 9));
    }
  });

  it('says plainly which compounds carry the reading of an earlier one, and the earlier one has its own', () => {
    for (const [n, from] of Object.entries(COMPOUND_ECHOES)) {
      const reading = composeCompound(bank, Number(n));
      expect(reading?.echoOf, n).toBe(from);
      expect(COMPOUND_ECHOES[from], `${n} points at ${from}, which should read for itself`).toBeUndefined();
      expect(COMPOUND_TITLES[Number(n)]).toBe(`The Echo of ${from}`);
      // The echo says so in its own words, so nobody reads it as an original image.
      expect(reading?.sections[0]?.text, n).toMatch(/reads like \d+|has no meaning of its own/);
    }
    expect(composeCompound(bank, 16)?.echoOf).toBeUndefined();
  });

  it('keeps the traditional images for the numbers the tradition names', () => {
    expect(COMPOUND_TITLES[10]).toBe('The Wheel of Fortune');
    expect(COMPOUND_TITLES[16]).toBe('The Tower Struck by Lightning');
    expect(COMPOUND_TITLES[19]).toBe('The Prince of Heaven');
    expect(COMPOUND_TITLES[23]).toBe('The Royal Star of the Lion');
    expect(COMPOUND_TITLES[27]).toBe('The Sceptre');
  });
});

describe('the detailed shadows', () => {
  it('has eleven parts for every number, 1 to 9 and the three masters', () => {
    expect(SHADOW_SECTIONS).toHaveLength(11);
    for (const value of VALUES) {
      const shadow = composeShadow(bank, { value, root: 1 + ((value - 1) % 9) });
      expect(shadow?.sections.map((s) => s.id), String(value)).toEqual([...SHADOW_SECTIONS]);
      expect(shadow?.sections.at(-1)?.text.trim().endsWith('?'), `${value} practice`).toBe(true);
      expect(shadow?.display).toBe(value > 9 ? `${value}/${1 + ((value - 1) % 9)}` : String(value));
    }
  });

  it('adds a line for the core number it is read through', () => {
    for (const key of CORE_KEYS) {
      const shadow = composeShadow(bank, { value: 8, root: 8 }, key);
      expect(shadow?.lens?.source).toBe(`life.shadowLens.${key}`);
      expect(shadow?.lens?.text.length).toBeGreaterThan(40);
    }
    expect(composeShadow(bank, { value: 8, root: 8 })?.lens).toBeUndefined();
  });

  it('is detailed: every number has at least 500 words of shadow, and no part is a stub', () => {
    for (const value of VALUES) {
      const shadow = composeShadow(bank, { value, root: 1 + ((value - 1) % 9) });
      const words = shadow!.sections.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
      expect(words, `${value}`).toBeGreaterThanOrEqual(500);
      for (const s of shadow!.sections) expect(s.text.split(/\s+/).length, `${value}.${s.id}`).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('the Chaldean planets', () => {
  it('gives each digit its planet in Cheiro\'s table, and the line names it', () => {
    for (let digit = 1; digit <= 9; digit += 1) {
      const planet = composePlanet(bank, digit);
      expect(planet?.planet).toBe(PLANET_NAMES[digit]);
      expect(planet?.text.toLowerCase(), String(digit)).toContain(PLANET_NAMES[digit]!.toLowerCase());
    }
    expect(PLANET_NAMES[1]).toBe('the Sun');
    expect(PLANET_NAMES[8]).toBe('Saturn');
  });
});

describe('composeNumber under each tradition', () => {
  it('Chaldean: carries the compound, its shadow, the detailed shadow and the planet, and no karmic debt', () => {
    const profile = coreProfile(birth, 'Amelia Rose Carter', CHALDEAN_CONVENTIONS);
    const reading = composeNumber(bank, 'lifePath', profile.lifePath);
    // 17 June 1985 adds to 37, then 10, then 1.
    expect(reading.compound?.number).toBe(37);
    expect(reading.compound?.title).toBe('The Good Friend');
    expect(reading.compound?.sections.map((s) => s.id)).toEqual(['overview', 'shadow', 'working']);
    expect(reading.karmicDebt).toBeUndefined();
    expect(reading.shadow?.value).toBe(1);
    expect(reading.shadow?.lens?.source).toBe('life.shadowLens.lifePath');
    expect(reading.planet?.planet).toBe('the Sun');
    const expression = coreProfile(birth, 'Amelia Rose Carter', CHALDEAN_CONVENTIONS).expression!;
    expect(composeNumber(bank, 'expression', expression).compound?.number).toBe(49);
  });

  it('Pythagorean: no compound, the karmic debt where there is one, and the same detailed shadow', () => {
    const profile = coreProfile(birth, 'Amelia Rose Carter', PYTHAGOREAN_CONVENTIONS);
    const reading = composeNumber(bank, 'lifePath', profile.lifePath);
    expect(reading.compound).toBeUndefined();
    expect(reading.karmicDebt?.debt).toBe(19);
    expect(reading.shadow?.value).toBe(1);
    const names = nameNumbers('Michael', { ...PYTHAGOREAN_CONVENTIONS, nameRule: 'whole-name' });
    if (!names.ok) throw new Error('rejected');
    // M4 I9 C3 H8 A1 E5 L3 = 33, a master that keeps its own shadow.
    expect(composeNumber(bank, 'expression', names.expression).shadow?.value).toBe(33);
  });

  it('names a compound for every name that adds to 10 to 52, and none above or below', () => {
    for (const name of ['Ada', 'Amelia Rose Carter', 'Michael', 'Christopher Alexander Montgomery']) {
      const names = nameNumbers(name, CHALDEAN_CONVENTIONS);
      if (!names.ok) throw new Error('rejected');
      for (const r of [names.expression, names.soulUrge, names.personality]) {
        const reading = composeNumber(bank, 'expression', r);
        expect(Boolean(reading.compound), `${name} ${r.chain.join(',')}`).toBe(r.compound !== undefined);
        if (r.compound !== undefined) expect(COMPOUNDS).toContain(r.compound);
      }
    }
  });
});
