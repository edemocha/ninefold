/*
 * The content manifest: every slot family the site needs, and every key each
 * family must have. Schemas, coverage tests, lint budgets and the draft prompt
 * all read from here, so the shape of the bank is defined once.
 */

export const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;
export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const PINNACLE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22] as const;
export const CHALLENGE_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const;
export const KARMIC_DEBTS = [13, 14, 16, 19] as const;
export const OVERTONES = [11, 22, 33] as const;

export const CORE_KEYS = [
  'lifePath',
  'expression',
  'soulUrge',
  'personality',
  'birthDay',
  'maturity',
] as const;
export type CoreKey = (typeof CORE_KEYS)[number];

export const CORE_SECTIONS = ['overview', 'strengths', 'shadow', 'relationships', 'growth'] as const;
export const KARMIC_SECTIONS = ['overview', 'working'] as const;
export const PINNACLE_SECTIONS = ['theme', 'guidance'] as const;
export const YEAR_SECTIONS = ['overview', 'work', 'relationships', 'inner', 'watch', 'reflect'] as const;
export const MONTH_SECTIONS = ['theme', 'focus', 'reflect'] as const;

/**
 * Day facets and how many variants each has. The counts differ (5, 6 and 7) so
 * the same headline and action line do not keep pairing up. They add up to 42,
 * which is 7 facets by 6 variants.
 */
export const DAY_FACETS = ['headline', 'work', 'relationships', 'mind', 'action', 'watch', 'reflect'] as const;
export const DAY_FACET_VARIANTS: Record<(typeof DAY_FACETS)[number], number> = {
  headline: 6,
  work: 5,
  relationships: 7,
  mind: 6,
  action: 7,
  watch: 5,
  reflect: 6,
};
export type DayFacet = (typeof DAY_FACETS)[number];

/** Special dates, in the order the composer prefers them when several apply. */
export const SPECIAL_DATES = [
  'birthday',
  'half-birthday',
  'leap-day',
  'new-years-eve',
  'mirror-1-1',
  'mirror-2-2',
  'mirror-3-3',
  'mirror-4-4',
  'mirror-5-5',
  'mirror-6-6',
  'mirror-7-7',
  'mirror-8-8',
  'mirror-9-9',
  'mirror-10-10',
  'mirror-11-11',
  'mirror-12-12',
  'master-11th',
  'master-22nd',
  'month-start',
  'month-end',
] as const;

const str = (xs: readonly (string | number)[]): string[] => xs.map(String);
const coreValues = (key: CoreKey): string[] =>
  str(key === 'birthDay' ? VALUES.filter((v) => v !== 33) : VALUES);

export type Layer = 'life' | 'year' | 'month' | 'day';

export type Family = {
  /** e.g. life.core.lifePath. Also the first part of every snippet id. */
  id: string;
  layer: Layer;
  /** Source file, relative to packages/content/data. */
  file: string;
  /** Where the family sits inside the released layer JSON. */
  path: string[];
  /** Where the family sits inside its source file (empty: the file is the family). */
  within?: string[];
  /** Key lists, outermost first. Leaves are strings, or arrays when `variants` is set. */
  axes: readonly (readonly string[])[];
  /** Variant counts keyed by the last axis value. Leaves become arrays. */
  variants?: Record<string, number>;
  /** Word budget per snippet: [min, max]. */
  words: readonly [number, number];
  /** Snippets whose key at `axis` equals `value` must end on a question. */
  question?: { axis: number; value: string };
};

const coreFamily = (key: CoreKey): Family => ({
  id: `life.core.${key}`,
  layer: 'life',
  file: `life/core-${key}.json`,
  path: ['core', key],
  axes: [coreValues(key), str(CORE_SECTIONS)],
  words: [28, 110],
  question: { axis: 1, value: 'growth' },
});

export const FAMILIES: readonly Family[] = [
  ...CORE_KEYS.map(coreFamily),
  {
    id: 'life.karmicDebt',
    layer: 'life',
    file: 'life/karmicDebt.json',
    path: ['karmicDebt'],
    axes: [str(KARMIC_DEBTS), str(KARMIC_SECTIONS)],
    words: [30, 120],
  },
  {
    id: 'life.pinnacles',
    layer: 'life',
    file: 'life/pinnacles.json',
    path: ['pinnacles'],
    axes: [str(PINNACLE_VALUES), str(PINNACLE_SECTIONS)],
    words: [28, 110],
  },
  {
    id: 'life.challenges',
    layer: 'life',
    file: 'life/challenges.json',
    path: ['challenges'],
    axes: [str(CHALLENGE_VALUES)],
    words: [40, 110],
  },
  {
    id: 'life.grid.lessons',
    layer: 'life',
    file: 'life/grid.json',
    within: ['lessons'],
    path: ['grid', 'lessons'],
    axes: [str(DIGITS)],
    words: [32, 100],
  },
  {
    id: 'life.grid.passion',
    layer: 'life',
    file: 'life/grid.json',
    within: ['passion'],
    path: ['grid', 'passion'],
    axes: [str(DIGITS)],
    words: [32, 100],
  },
  {
    id: 'life.grid.subconscious',
    layer: 'life',
    file: 'life/grid.json',
    within: ['subconscious'],
    path: ['grid', 'subconscious'],
    axes: [str(DIGITS)],
    words: [32, 100],
  },
  {
    id: 'year.personalYear',
    layer: 'year',
    file: 'year/personalYear.json',
    path: ['personalYear'],
    axes: [str(DIGITS), str(YEAR_SECTIONS)],
    words: [22, 120],
    question: { axis: 1, value: 'reflect' },
  },
  {
    id: 'year.overtones',
    layer: 'year',
    file: 'year/overtones.json',
    path: ['overtones'],
    axes: [str(OVERTONES)],
    words: [38, 100],
  },
  {
    id: 'year.yearLifePath',
    layer: 'year',
    file: 'year/yearLifePath.json',
    path: ['yearLifePath'],
    axes: [str(DIGITS), str(VALUES)],
    words: [18, 65],
  },
  {
    id: 'month.personalMonth',
    layer: 'month',
    file: 'month/personalMonth.json',
    path: ['personalMonth'],
    axes: [str(DIGITS), str(MONTH_SECTIONS)],
    words: [18, 100],
    question: { axis: 1, value: 'reflect' },
  },
  {
    id: 'month.monthYear',
    layer: 'month',
    file: 'month/monthYear.json',
    path: ['monthYear'],
    axes: [str(DIGITS), str(DIGITS)],
    words: [16, 55],
  },
  {
    id: 'day.personalDay',
    layer: 'day',
    file: 'day/personalDay.json',
    path: ['personalDay'],
    axes: [str(DIGITS), str(DAY_FACETS)],
    variants: DAY_FACET_VARIANTS,
    words: [3, 32],
    question: { axis: 1, value: 'reflect' },
  },
  {
    id: 'day.dayMonth',
    layer: 'day',
    file: 'day/dayMonth.json',
    path: ['dayMonth'],
    axes: [str(DIGITS), str(DIGITS)],
    words: [7, 40],
  },
  {
    id: 'day.dayLifePath',
    layer: 'day',
    file: 'day/dayLifePath.json',
    path: ['dayLifePath'],
    axes: [str(DIGITS), str(VALUES)],
    words: [14, 60],
  },
  {
    id: 'day.special',
    layer: 'day',
    file: 'day/special.json',
    path: ['special'],
    axes: [str(SPECIAL_DATES)],
    words: [18, 65],
  },
];

export const LAYERS: readonly Layer[] = ['life', 'year', 'month', 'day'];

export type Snippet = {
  /** e.g. life.core.lifePath.1.overview or day.personalDay.8.headline.v3 */
  id: string;
  layer: Layer;
  family: string;
  /** The axis keys, outermost first. */
  keys: string[];
  /** 1-based variant number for families with variants. */
  variant?: number;
  text: string;
};

export type Status = 'draft' | 'edited' | 'approved';

type Json = string | string[] | { [k: string]: Json };

function dig(root: Json | undefined, keys: readonly string[]): Json | undefined {
  let node: Json | undefined = root;
  for (const k of keys) {
    if (node === undefined || typeof node === 'string' || Array.isArray(node)) return undefined;
    node = node[k];
  }
  return node;
}

/** The part of a source file that holds this family. */
export function familyData(family: Family, file: unknown): Json | undefined {
  return dig(file as Json, family.within ?? []);
}

/** Every id the family must contain. */
export function expectedIds(family: Family): string[] {
  const out: string[] = [];
  const walk = (depth: number, keys: string[]): void => {
    if (depth === family.axes.length) {
      const last = keys[keys.length - 1] as string;
      const count = family.variants?.[last];
      if (count !== undefined) {
        for (let v = 1; v <= count; v += 1) out.push(`${family.id}.${keys.join('.')}.v${v}`);
      } else {
        out.push(`${family.id}.${keys.join('.')}`);
      }
      return;
    }
    for (const k of family.axes[depth] as readonly string[]) walk(depth + 1, [...keys, k]);
  };
  walk(0, []);
  return out;
}

/** Walks a family's data and returns the snippets it contains, in id order of the manifest. */
export function flattenFamily(family: Family, data: unknown): Snippet[] {
  const root = data as Json | undefined;
  const out: Snippet[] = [];
  const walk = (depth: number, keys: string[], node: Json | undefined): void => {
    if (depth === family.axes.length) {
      const last = keys[keys.length - 1] as string;
      const count = family.variants?.[last];
      if (count !== undefined) {
        const list = Array.isArray(node) ? node : [];
        list.forEach((text, i) =>
          out.push({
            id: `${family.id}.${keys.join('.')}.v${i + 1}`,
            layer: family.layer,
            family: family.id,
            keys,
            variant: i + 1,
            text: String(text),
          }),
        );
      } else if (typeof node === 'string') {
        out.push({ id: `${family.id}.${keys.join('.')}`, layer: family.layer, family: family.id, keys, text: node });
      }
      return;
    }
    for (const k of family.axes[depth] as readonly string[]) {
      const child = node && typeof node === 'object' && !Array.isArray(node) ? node[k] : undefined;
      walk(depth + 1, [...keys, k], child);
    }
  };
  walk(0, [], root);
  return out;
}

export function expectedCount(): number {
  return FAMILIES.reduce((sum, f) => sum + expectedIds(f).length, 0);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
