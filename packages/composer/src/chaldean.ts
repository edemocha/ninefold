import type { CoreKey, Result } from '@numerology/engine';
import { COMPOUNDS, COMPOUND_SECTIONS, SHADOW_SECTIONS } from '@numerology/content';
import { need, type Bank } from './bank';

/**
 * The traditional name of each compound number, 10 to 52. Cheiro gave images to
 * the first thirty-two and to a few more; for the rest he wrote that a number
 * carries the reading of an earlier one, and the title says so.
 */
export const COMPOUND_TITLES: Record<number, string> = {
  10: 'The Wheel of Fortune',
  11: 'The Clenched Hand',
  12: 'The Sacrifice',
  13: 'The Great Change',
  14: 'Movement and Combination',
  15: 'The Magician',
  16: 'The Tower Struck by Lightning',
  17: 'The Star of the Magi',
  18: 'The Rayed Moon',
  19: 'The Prince of Heaven',
  20: 'The Awakening',
  21: 'The Crown of the Magi',
  22: 'The Good Man, Blinded',
  23: 'The Royal Star of the Lion',
  24: 'The Promise of Help',
  25: 'Strength Through Experience',
  26: 'Partnerships Tested',
  27: 'The Sceptre',
  28: 'The Contradictions',
  29: 'The Uncertain Road',
  30: 'The Thinker',
  31: 'The Recluse',
  32: 'The Communicator',
  33: 'The Echo of 24',
  34: 'The Echo of 25',
  35: 'The Echo of 26',
  36: 'The Echo of 27',
  37: 'The Good Friend',
  38: 'The Echo of 29',
  39: 'The Echo of 30',
  40: 'The Echo of 31',
  41: 'The Echo of 32',
  42: 'The Echo of 24',
  43: 'The Great Upheaval',
  44: 'The Echo of 26',
  45: 'The Echo of 27',
  46: 'The Echo of 37',
  47: 'The Echo of 29',
  48: 'The Echo of 30',
  49: 'The Echo of 31',
  50: 'The Echo of 32',
  51: 'The Warrior',
  52: 'The Echo of 43',
};

/** The compounds that carry the reading of an earlier one, and which. */
export const COMPOUND_ECHOES: Record<number, number> = {
  33: 24,
  34: 25,
  35: 26,
  36: 27,
  38: 29,
  39: 30,
  40: 31,
  41: 32,
  42: 24,
  44: 26,
  45: 27,
  46: 37,
  47: 29,
  48: 30,
  49: 31,
  50: 32,
  52: 43,
};

export const COMPOUND_SECTION_TITLES: Record<(typeof COMPOUND_SECTIONS)[number], string> = {
  overview: 'What the tradition says',
  shadow: 'The shadow side',
  working: 'Working with it',
};

export const SHADOW_SECTION_TITLES: Record<(typeof SHADOW_SECTIONS)[number], string> = {
  root: 'Where it comes from',
  inner: 'How it sounds inside',
  work: 'At work',
  close: 'With people close to you',
  resources: 'With time and energy',
  stress: 'Under pressure',
  signals: 'Early signals',
  feeds: 'What feeds it',
  loosen: 'What loosens it',
  gift: 'The gift inside it',
  practice: 'A seven-day practice',
};

/** The planet each digit belongs to in Cheiro's Chaldean table. */
export const PLANET_NAMES: Record<number, string> = {
  1: 'the Sun',
  2: 'the Moon',
  3: 'Jupiter',
  4: 'Uranus',
  5: 'Mercury',
  6: 'Venus',
  7: 'Neptune',
  8: 'Saturn',
  9: 'Mars',
};

/** What Chaldean books call each core number. */
export const CHALDEAN_NAMES: Partial<Record<CoreKey, string>> = {
  lifePath: 'Destiny number',
  birthDay: 'Birth number',
  expression: 'Name number',
};

export type CompoundReading = {
  number: number;
  title: string;
  root: number;
  /** The earlier compound whose reading this one carries, when it has none of its own. */
  echoOf?: number;
  sections: { id: (typeof COMPOUND_SECTIONS)[number]; title: string; text: string; source: string }[];
};

/** The reading for one compound number, or nothing when the layer is not loaded or the number is out of range. */
export function composeCompound(bank: Bank, compound: number): CompoundReading | undefined {
  if (!COMPOUNDS.includes(compound)) return undefined;
  const entry = need(bank, 'life').compound[String(compound)];
  if (!entry) return undefined;
  const reading: CompoundReading = {
    number: compound,
    title: COMPOUND_TITLES[compound] ?? `Compound ${compound}`,
    root: 1 + ((compound - 1) % 9),
    sections: COMPOUND_SECTIONS.map((id) => ({
      id,
      title: COMPOUND_SECTION_TITLES[id],
      text: entry[id],
      source: `life.compound.${compound}.${id}`,
    })),
  };
  const echo = COMPOUND_ECHOES[compound];
  if (echo !== undefined) reading.echoOf = echo;
  return reading;
}

export type ShadowReading = {
  /** The number whose shadow this is: 1 to 9, or a master under the Pythagorean tradition. */
  value: number;
  display: string;
  /** One line on what the shadow means when it is read through this core number. */
  lens?: { text: string; source: string };
  sections: { id: (typeof SHADOW_SECTIONS)[number]; title: string; text: string; source: string }[];
};

/** The shadow side of a number in detail, read through a core number when one is given. */
export function composeShadow(bank: Bank, result: Pick<Result, 'value' | 'root'>, key?: CoreKey): ShadowReading | undefined {
  const life = need(bank, 'life');
  const entry = life.shadow[String(result.value)];
  if (!entry) return undefined;
  const reading: ShadowReading = {
    value: result.value,
    display: result.value > 9 ? `${result.value}/${result.root}` : String(result.value),
    sections: SHADOW_SECTIONS.map((id) => ({
      id,
      title: SHADOW_SECTION_TITLES[id],
      text: entry[id],
      source: `life.shadow.${result.value}.${id}`,
    })),
  };
  const lens = key ? life.shadowLens[key] : undefined;
  if (key && lens) reading.lens = { text: lens, source: `life.shadowLens.${key}` };
  return reading;
}

/** The planet line for a digit, or nothing when the layer is not loaded. */
export function composePlanet(bank: Bank, digit: number): { planet: string; text: string; source: string } | undefined {
  const text = need(bank, 'life').planet[String(digit)];
  const planet = PLANET_NAMES[digit];
  return text && planet ? { planet, text, source: `life.planet.${digit}` } : undefined;
}

export type ShadowGroup = {
  value: number;
  root: number;
  display: string;
  /** The core numbers that carry this number, in reading order. */
  keys: CoreKey[];
  shadow: ShadowReading;
  /** One line for each core number the shadow is read through. */
  lenses: { key: CoreKey; text: string; source: string }[];
};

const CORE_ORDER: CoreKey[] = ['lifePath', 'expression', 'soulUrge', 'personality', 'birthDay', 'maturity'];

/**
 * The shadows of someone's core numbers, one reading for each different number.
 * When a number appears more than once (a life path 1 and an expression 1) its
 * detail is shown once, with a line for each place it turns up.
 */
export function composeShadows(bank: Bank, results: Partial<Record<CoreKey, Result>>): ShadowGroup[] {
  const life = need(bank, 'life');
  const groups: ShadowGroup[] = [];
  for (const key of CORE_ORDER) {
    const result = results[key];
    if (!result) continue;
    let group = groups.find((g) => g.value === result.value);
    if (!group) {
      const shadow = composeShadow(bank, result);
      if (!shadow) continue;
      group = { value: result.value, root: result.root, display: shadow.display, keys: [], shadow, lenses: [] };
      groups.push(group);
    }
    group.keys.push(key);
    group.lenses.push({ key, text: life.shadowLens[key], source: `life.shadowLens.${key}` });
  }
  return groups;
}
