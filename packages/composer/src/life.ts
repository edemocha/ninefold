import {
  ageOn,
  challenges,
  lifePath,
  personalYear,
  pinnacles,
  periodAt,
  type Conventions,
  type CoreKey,
  type NameProfileOk,
  type Period,
  type Result,
  type Step,
  type YMD,
} from '@numerology/engine';
import { CORE_SECTIONS } from '@numerology/content';
import { need, type Bank } from './bank';
import { agesText, displayNumber, ordinal } from './format';

export const CORE_LABELS: Record<CoreKey, { title: string; lens: string }> = {
  lifePath: { title: 'Life path', lens: 'The main road: patterns that tend to recur across a lifetime.' },
  expression: {
    title: 'Expression',
    lens: 'What you bring to the world and how you tend to work. It describes a style, not a fate.',
  },
  soulUrge: {
    title: 'Soul urge',
    lens: 'What you want underneath: the motive behind your choices, often quieter than your stated goals.',
  },
  personality: { title: 'Personality', lens: 'How other people tend to meet you first.' },
  birthDay: { title: 'Birth day', lens: 'A knack from the day you were born, as distinct from the long road.' },
  maturity: { title: 'Maturity', lens: 'A direction you may grow toward after midlife.' },
};

export const SECTION_TITLES: Record<(typeof CORE_SECTIONS)[number], string> = {
  overview: 'Overview',
  strengths: 'Strengths',
  shadow: 'Shadow side',
  relationships: 'Relationships',
  growth: 'Growth practice',
};

export type ReadingSection = { id: string; title: string; text: string; source: string };

export type NumberReading = {
  key: CoreKey;
  title: string;
  lens: string;
  value: number;
  root: number;
  display: string;
  chain: number[];
  steps: Step[];
  sections: ReadingSection[];
  karmicDebt?: { debt: number; display: string; overview: string; working: string; sources: string[] };
};

const DEBT_ROOT: Record<number, number> = { 13: 4, 14: 5, 16: 7, 19: 1 };

export function composeNumber(bank: Bank, key: CoreKey, result: Result): NumberReading {
  const life = need(bank, 'life');
  const entry = life.core[key]?.[String(result.value)];
  const sections: ReadingSection[] = entry
    ? CORE_SECTIONS.map((id) => ({
        id,
        title: SECTION_TITLES[id],
        text: entry[id],
        source: `life.core.${key}.${result.value}.${id}`,
      }))
    : [];
  const reading: NumberReading = {
    key,
    title: CORE_LABELS[key].title,
    lens: CORE_LABELS[key].lens,
    value: result.value,
    root: result.root,
    display: displayNumber(result),
    chain: result.chain,
    steps: result.steps,
    sections,
  };
  if (result.karmicDebt) {
    const debt = life.karmicDebt[String(result.karmicDebt)];
    if (debt) {
      reading.karmicDebt = {
        debt: result.karmicDebt,
        display: `${result.karmicDebt}/${DEBT_ROOT[result.karmicDebt]}`,
        overview: debt.overview,
        working: debt.working,
        sources: [`life.karmicDebt.${result.karmicDebt}.overview`, `life.karmicDebt.${result.karmicDebt}.working`],
      };
    }
  }
  return reading;
}

export type GridReading = {
  parts: string[];
  letters: NameProfileOk['grid']['letters'];
  counts: number[];
  vowelCounts: number[];
  consonantCounts: number[];
  lessons: { n: number; text: string; source: string }[];
  passion: { n: number; text: string; source: string }[];
  passionCount: number;
  subconscious: { value: number; missing: number; text: string; steps: Step[]; source: string };
};

export function composeNameGrid(bank: Bank, name: NameProfileOk): GridReading {
  const grid = need(bank, 'life').grid;
  return {
    parts: name.parts,
    letters: name.grid.letters,
    counts: name.grid.counts,
    vowelCounts: name.grid.vowelCounts,
    consonantCounts: name.grid.consonantCounts,
    lessons: name.lessons.map((n) => ({ n, text: grid.lessons[String(n)] ?? '', source: `life.grid.lessons.${n}` })),
    passion: name.passion.map((n) => ({ n, text: grid.passion[String(n)] ?? '', source: `life.grid.passion.${n}` })),
    passionCount: name.passionCount,
    subconscious: {
      value: name.subconscious.value,
      missing: name.subconscious.missing,
      text: grid.subconscious[String(name.subconscious.value)] ?? '',
      steps: name.subconscious.steps,
      source: `life.grid.subconscious.${name.subconscious.value}`,
    },
  };
}

export type PeriodReading = {
  n: 1 | 2 | 3 | 4;
  label: string;
  value: number;
  display: string;
  ageFrom: number;
  ageTo: number | null;
  yearFrom: number;
  yearTo: number | null;
  agesText: string;
  /** What the period is about, in one phrase. */
  stage: string;
  text: string;
  guidance?: string;
  steps: Step[];
  sources: string[];
};

export type YearTick = { age: number; year: number; value: number; display: string; tile: string };

export type TimelineReading = {
  lifePath: Result;
  /** Current age, clamped to 0 to 100. */
  age: number;
  pinnacles: PeriodReading[];
  challenges: PeriodReading[];
  years: YearTick[];
};

function periodRead(
  period: Period,
  birth: YMD,
  kind: 'pinnacle' | 'challenge',
  bank: Bank,
): PeriodReading {
  const life = need(bank, 'life');
  const themes = need(bank, 'core').themes;
  const key = String(period.value);
  const label = `${ordinal(period.n)} ${kind}`;
  const base = {
    n: period.n,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value: period.value,
    display: period.value > 9 ? `${period.value}/${period.root}` : String(period.value),
    ageFrom: period.ageFrom,
    ageTo: period.ageTo,
    yearFrom: birth.year + period.ageFrom,
    yearTo: period.ageTo === null ? null : birth.year + period.ageTo,
    agesText: agesText(period.ageFrom, period.ageTo),
    steps: period.steps,
  };
  if (kind === 'pinnacle') {
    const entry = life.pinnacles[key];
    return {
      ...base,
      stage: themes[key]?.stage ?? '',
      text: entry?.theme ?? '',
      guidance: entry?.guidance,
      sources: [`life.pinnacles.${key}.theme`, `life.pinnacles.${key}.guidance`],
    };
  }
  return {
    ...base,
    stage: '',
    text: life.challenges[key] ?? '',
    sources: [`life.challenges.${key}`],
  };
}

/** The life timeline: four pinnacles, four challenges and a personal-year strip for ages 0 to 100. */
export function composeTimeline(bank: Bank, birth: YMD, today: YMD, c: Conventions): TimelineReading {
  const themes = need(bank, 'core').themes;
  const lp = lifePath(birth, c);
  const pins = pinnacles(birth, c).map((p) => periodRead(p, birth, 'pinnacle', bank));
  const chals = challenges(birth, c).map((p) => periodRead(p, birth, 'challenge', bank));
  const years: YearTick[] = [];
  for (let age = 0; age <= 100; age += 1) {
    const year = birth.year + age;
    const py = personalYear(birth, year, c);
    years.push({
      age,
      year,
      value: py.value,
      display: displayNumber(py),
      tile: themes[String(py.root)]?.tile ?? '',
    });
  }
  const age = Math.min(100, Math.max(0, ageOn(birth, today, c)));
  return { lifePath: lp, age, pinnacles: pins, challenges: chals, years };
}

export { periodAt };
