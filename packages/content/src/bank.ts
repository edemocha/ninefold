import type { CautionFacet, CautionLabel, CoreKey, DayFacet } from './manifest';

/** The runtime shape of each released layer. Keys are the number as a string. */

export type Theme = {
  /** Used as "a reflective month 7": the composer picks a or an. */
  adj: string;
  /** What the number is about, finishing "Day 8 is about ...". */
  activity: string;
  /** A short life-stage phrase, e.g. "steady building". */
  stage: string;
  /** One or two words for a month tile. */
  tile: string;
};

export type CoreLayer = { themes: Record<string, Theme> };

export type Sections<K extends string> = Record<K, string>;

/** A short nudge about a behavior to watch. Never a forecast. */
export type Caution = { label: CautionLabel; headline: string; body: string; link: string };
/** Cautions by number, then facet, with six variants each. */
export type CautionTable = Record<string, Record<CautionFacet, Caution[]>>;

export type LifeLayer = {
  core: Record<CoreKey, Record<string, Sections<'overview' | 'strengths' | 'shadow' | 'relationships' | 'growth'>>>;
  karmicDebt: Record<string, Sections<'overview' | 'working'>>;
  pinnacles: Record<string, Sections<'theme' | 'guidance'>>;
  /** The shadow side of each number in detail, for 1 to 9, 11, 22 and 33. */
  shadow: Record<string, Sections<'root' | 'inner' | 'work' | 'close' | 'resources' | 'stress' | 'signals' | 'feeds' | 'loosen' | 'gift' | 'practice'>>;
  /** One line on what the shadow means when it is read through each core number. */
  shadowLens: Record<CoreKey, string>;
  /** The planet the Chaldean tradition gives each digit, with the digit's shadow in one image. */
  planet: Record<string, string>;
  /** The Chaldean compound numbers, 10 to 52. */
  compound: Record<string, Sections<'overview' | 'shadow' | 'working'>>;
  challenges: Record<string, string>;
  grid: {
    lessons: Record<string, string>;
    passion: Record<string, string>;
    subconscious: Record<string, string>;
  };
};

export type YearLayer = {
  personalYear: Record<string, Sections<'overview' | 'work' | 'relationships' | 'inner' | 'watch' | 'reflect'>>;
  overtones: Record<string, string>;
  yearLifePath: Record<string, Record<string, string>>;
  caution: CautionTable;
};

export type MonthLayer = {
  personalMonth: Record<string, Sections<'theme' | 'focus' | 'reflect'>>;
  monthYear: Record<string, Record<string, string>>;
  caution: CautionTable;
};

export type DayLayer = {
  personalDay: Record<string, Record<DayFacet, string[]>>;
  dayMonth: Record<string, Record<string, string>>;
  dayLifePath: Record<string, Record<string, string>>;
  special: Record<string, string>;
  caution: CautionTable;
};

/** Between us: text about a pair of single-digit numbers, keyed "3-7" with the smaller first. */
export type PairLayer = {
  core: Record<string, Sections<'meet' | 'stretch' | 'talk'>>;
  /** One short note when a master number is in the pair: "11", "22", "33" or "both". */
  master: Record<string, string>;
  /** The gap between two people's cycles, by the shorter way round the nine ("0" to "4"). */
  rhythm: Record<string, Sections<'meaning' | 'use' | 'talk'>>;
  /** One bridge line for two personal-day numbers on the same date, keyed like the pair text ("7-8"). */
  moment: Record<string, string>;
  /** One line on what a name lens (expression, soul urge) is, shown above the pair text read through it. */
  lens: Record<string, string>;
  /** Four questions for each relationship type, chosen by the visitor. */
  type: Record<string, Sections<'q1' | 'q2' | 'q3' | 'q4'>>;
};

export type ReleaseManifest = {
  version: string;
  generatedFrom: string;
  snippets: number;
  words: number;
  /** Counts by status, so a build shows how much of the bank is approved. */
  status: { draft: number; edited: number; approved: number };
  layers: Record<'core' | 'life' | 'year' | 'month' | 'day' | 'pair', { file: string; snippets: number; words: number; sha256: string }>;
};
