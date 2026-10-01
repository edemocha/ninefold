import type { CoreKey, DayFacet } from './manifest';

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

export type LifeLayer = {
  core: Record<CoreKey, Record<string, Sections<'overview' | 'strengths' | 'shadow' | 'relationships' | 'growth'>>>;
  karmicDebt: Record<string, Sections<'overview' | 'working'>>;
  pinnacles: Record<string, Sections<'theme' | 'guidance'>>;
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
};

export type MonthLayer = {
  personalMonth: Record<string, Sections<'theme' | 'focus' | 'reflect'>>;
  monthYear: Record<string, Record<string, string>>;
};

export type DayLayer = {
  personalDay: Record<string, Record<DayFacet, string[]>>;
  dayMonth: Record<string, Record<string, string>>;
  dayLifePath: Record<string, Record<string, string>>;
  special: Record<string, string>;
};

export type ReleaseManifest = {
  version: string;
  generatedFrom: string;
  snippets: number;
  words: number;
  /** Counts by status, so a build shows how much of the bank is approved. */
  status: { draft: number; edited: number; approved: number };
  layers: Record<'core' | 'life' | 'year' | 'month' | 'day', { file: string; snippets: number; words: number; sha256: string }>;
};
