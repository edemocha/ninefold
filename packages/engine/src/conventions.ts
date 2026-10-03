import type { Conventions } from './types';

/** The modern tradition: A to I are 1 to 9, 11, 22 and 33 are masters, and each name part is reduced first. */
export const PYTHAGOREAN_CONVENTIONS: Conventions = {
  system: 'pythagorean',
  dateRule: 'A2',
  nameRule: 'per-part',
  cycleYear: 'calendar',
  cycleMasters: 'overtone',
  yRule: 'consonant',
  particles: 'include',
  leapBirthday: 'feb28',
};

/**
 * The older tradition, and the default here: the Chaldean letter table (no
 * letter carries the 9), every letter of the whole name added once, every digit
 * of the date added in one flat sum, and no master numbers. The total before
 * the last reduction is the compound number the tradition reads.
 */
export const CHALDEAN_CONVENTIONS: Conventions = {
  ...PYTHAGOREAN_CONVENTIONS,
  system: 'chaldean',
  dateRule: 'D',
  nameRule: 'whole-name',
  cycleMasters: 'single',
};

export const DEFAULT_CONVENTIONS: Conventions = CHALDEAN_CONVENTIONS;

/**
 * Switches the tradition together with the three switches that belong to it
 * (date rule, name rule and masters in cycles). The rest are left as they were.
 */
export function withTradition(c: Conventions, system: Conventions['system']): Conventions {
  const preset = system === 'chaldean' ? CHALDEAN_CONVENTIONS : PYTHAGOREAN_CONVENTIONS;
  return { ...c, system, dateRule: preset.dateRule, nameRule: preset.nameRule, cycleMasters: preset.cycleMasters };
}

export type Tradition = { value: Conventions['system']; label: string; help: string };

/** The choice shown first on the form. Chaldean comes first because it is the default. */
export const TRADITIONS: readonly Tradition[] = [
  {
    value: 'chaldean',
    label: 'Chaldean',
    help: 'The older table, traced to Babylon and set down in its modern form by writers such as Cheiro. No letter is worth 9, there are no master numbers, and a total from 10 to 52 is read as a compound number with its own image.',
  },
  {
    value: 'pythagorean',
    label: 'Pythagorean',
    help: 'The modern table, A to I as 1 to 9 and repeating. It keeps 11, 22 and 33 as master numbers and flags karmic debt in 13, 14, 16 and 19.',
  },
];

/** Short query-string keys, so a shared link can carry the conventions and nothing personal. */
const KEYS: Record<keyof Conventions, string> = {
  system: 'sys',
  dateRule: 'dr',
  nameRule: 'nr',
  cycleYear: 'cy',
  cycleMasters: 'cm',
  yRule: 'y',
  particles: 'pt',
  leapBirthday: 'lb',
};

const ALLOWED: { [K in keyof Conventions]: readonly Conventions[K][] } = {
  system: ['pythagorean', 'chaldean'],
  dateRule: ['A2', 'A', 'B', 'C', 'D'],
  nameRule: ['per-part', 'whole-name'],
  cycleYear: ['calendar', 'birthday'],
  cycleMasters: ['overtone', 'keep', 'single'],
  yRule: ['consonant', 'vowel-if-alone'],
  particles: ['include', 'ignore'],
  leapBirthday: ['feb28', 'mar1'],
};

/** Only the switches that differ from the defaults. */
export function serializeConventions(c: Conventions): URLSearchParams {
  const params = new URLSearchParams();
  for (const field of Object.keys(KEYS) as (keyof Conventions)[]) {
    if (c[field] !== DEFAULT_CONVENTIONS[field]) params.set(KEYS[field], c[field]);
  }
  return params;
}

/** Unknown or out-of-range values fall back to the default. */
export function parseConventions(params: URLSearchParams): Conventions {
  const out: Conventions = { ...DEFAULT_CONVENTIONS };
  for (const field of Object.keys(KEYS) as (keyof Conventions)[]) {
    const raw = params.get(KEYS[field]);
    if (raw !== null && (ALLOWED[field] as readonly string[]).includes(raw)) {
      (out as Record<string, string>)[field] = raw;
    }
  }
  return out;
}

export function isDefaultConventions(c: Conventions): boolean {
  return (Object.keys(KEYS) as (keyof Conventions)[]).every(
    (f) => c[f] === DEFAULT_CONVENTIONS[f],
  );
}

export type ConventionOption<K extends keyof Conventions> = {
  value: Conventions[K];
  label: string;
  help: string;
};

export type ConventionSpec = {
  [K in keyof Conventions]: {
    label: string;
    help: string;
    options: readonly ConventionOption<K>[];
  };
};

/** The switches under Advanced, worded for the interface. `system` is chosen first on the form, through TRADITIONS. */
export const CONVENTION_SPEC: Omit<ConventionSpec, 'system'> = {
  dateRule: {
    label: 'Date rule',
    help: 'How the birth date is added up. Published sources disagree, and 4% to 18% of results change with the choice. Choosing a tradition above sets the rule that belongs to it.',
    options: [
      {
        value: 'D',
        label: 'D (Chaldean default)',
        help: 'Every digit in the date is added in one flat sum, with no masters. The sum is the compound number the Chaldean tradition reads.',
      },
      {
        value: 'A2',
        label: 'A2 (Pythagorean default)',
        help: 'Day, month and year are each cut to a single digit, added, then reduced. 11 and 22 are kept at the end.',
      },
      {
        value: 'A',
        label: 'A',
        help: 'Each part is reduced but keeps 11, 22 and 33, then the parts are added and reduced with masters kept.',
      },
      {
        value: 'B',
        label: 'B',
        help: 'Every digit in the date is added in one flat sum. Masters are kept. This inflates masters.',
      },
      {
        value: 'C',
        label: 'C',
        help: 'Always cut to a single digit. No master numbers at all.',
      },
    ],
  },
  nameRule: {
    label: 'Name rule',
    help: 'Whether each name part is reduced before the parts are added.',
    options: [
      {
        value: 'per-part',
        label: 'Per part (Pythagorean default)',
        help: 'Reduce each name part, add the results, then reduce.',
      },
      {
        value: 'whole-name',
        label: 'Whole name (Chaldean default)',
        help: 'Add every letter in the name, then reduce once.',
      },
    ],
  },
  cycleYear: {
    label: 'Personal year runs',
    help: 'Calendar-year and birthday-to-birthday personal years pick a different year on about half of all days.',
    options: [
      {
        value: 'calendar',
        label: 'January to December (default)',
        help: 'The personal year uses the current calendar year.',
      },
      {
        value: 'birthday',
        label: 'Birthday to birthday',
        help: 'The personal year changes on your birthday.',
      },
    ],
  },
  cycleMasters: {
    label: 'Masters in yearly cycles',
    help: 'What to do when a personal year adds up to 11 or 22.',
    options: [
      {
        value: 'overtone',
        label: 'Single digit plus an overtone flag (Pythagorean default)',
        help: 'The single digit drives the text. An 11 or 22 shows as an overtone note.',
      },
      {
        value: 'keep',
        label: 'Keep 11 and 22',
        help: 'The master number is the personal year.',
      },
      {
        value: 'single',
        label: 'Single digit only (Chaldean default)',
        help: 'Always cut to a single digit and say nothing more.',
      },
    ],
  },
  yRule: {
    label: 'The letter Y',
    help: 'No source settles this. Test both against a printed book.',
    options: [
      {
        value: 'consonant',
        label: 'Always a consonant (default)',
        help: 'Y never counts as a vowel.',
      },
      {
        value: 'vowel-if-alone',
        label: 'Vowel when it is the only vowel in the word',
        help: 'LYNN has a vowel Y. MARY does not.',
      },
    ],
  },
  particles: {
    label: 'Name particles',
    help: 'Words such as bin, binti, a/l, a/p, van and de. Nobody settles this, so the choice is yours.',
    options: [
      {
        value: 'include',
        label: 'Include as written (default)',
        help: 'Count every word on the birth certificate.',
      },
      {
        value: 'ignore',
        label: 'Ignore particles',
        help: 'Skip these words, except the first word of a name.',
      },
    ],
  },
  leapBirthday: {
    label: '29 February births',
    help: 'Which day counts as the birthday in common years.',
    options: [
      { value: 'feb28', label: '28 February (default)', help: 'The birthday is the day before 1 March.' },
      { value: 'mar1', label: '1 March', help: 'The birthday is the first of March.' },
    ],
  },
};

export type ChipKind =
  | 'lifePath'
  | 'birthDay'
  | 'expression'
  | 'soulUrge'
  | 'personality'
  | 'maturity'
  | 'pinnacle'
  | 'challenge'
  | 'personalYear'
  | 'personalMonth'
  | 'personalDay';

const DATE_RULE_CHIP: Record<Conventions['dateRule'], string> = {
  A2: 'Date rule A2',
  A: 'Date rule A',
  B: 'Date rule B',
  C: 'Date rule C',
  D: 'Date rule D',
};

/**
 * The convention chip shown next to every number: the switches that could
 * change that number, named. Never show a bare number.
 */
export function conventionChips(kind: ChipKind, c: Conventions): string[] {
  const nameChip = c.nameRule === 'per-part' ? 'Name: per part' : 'Name: whole name';
  const table = c.system === 'chaldean' ? ['Chaldean letters'] : [];
  const letters: string[] = [];
  if (c.yRule === 'vowel-if-alone') letters.push('Y: vowel if alone');
  if (c.particles === 'ignore') letters.push('Particles ignored');
  switch (kind) {
    case 'lifePath':
      return [DATE_RULE_CHIP[c.dateRule]];
    case 'birthDay':
      return ['Day of the month'];
    case 'expression':
      return [...table, nameChip, ...(c.particles === 'ignore' ? ['Particles ignored'] : [])];
    case 'soulUrge':
    case 'personality':
      return [...table, nameChip, ...letters];
    case 'maturity':
      return ['Life path + expression', ...[DATE_RULE_CHIP[c.dateRule], ...table, nameChip]];
    case 'pinnacle':
    case 'challenge':
      return ['Single-digit date parts', DATE_RULE_CHIP[c.dateRule] + ' for ages'];
    case 'personalYear': {
      const chips = [
        DATE_RULE_CHIP[c.dateRule],
        c.cycleYear === 'calendar' ? 'Calendar year' : 'Birthday to birthday',
      ];
      chips.push(
        c.cycleMasters === 'keep'
          ? 'Masters kept'
          : c.cycleMasters === 'overtone'
            ? 'Overtone flag'
            : 'Single digit',
      );
      return chips;
    }
    case 'personalMonth':
    case 'personalDay':
      return [c.cycleYear === 'calendar' ? 'Calendar year' : 'Birthday to birthday', 'Single digit'];
  }
}
