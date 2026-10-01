import {
  birthdayIn,
  cycleYearOn,
  lifePath,
  monthName,
  personalMonthOn,
  personalYear,
  yearVariantIndex,
  type Conventions,
  type Result,
  type Step,
  type YMD,
} from '@numerology/engine';
import { YEAR_SECTIONS } from '@numerology/content';
import { need, type Bank } from './bank';
import { composeCautions, type CautionCard } from './cautions';
import { displayNumber } from './format';
import type { ReadingSection } from './life';

const YEAR_TITLES: Record<(typeof YEAR_SECTIONS)[number], string> = {
  overview: 'The year in a line',
  work: 'Work and projects',
  relationships: 'Relationships',
  inner: 'Inner life',
  watch: 'Watch for',
  reflect: 'Reflect',
};

export type MonthTile = {
  year: number;
  month: number;
  name: string;
  value: number;
  tile: string;
  adj: string;
  /** Set when the tile covers only the days from the birthday (birthday convention). */
  fromDay?: number;
};

export type YearReading = {
  /** The cycle year: the calendar year, or the year the cycle starts on the birthday. */
  year: number;
  personalYear: Result;
  display: string;
  adj: string;
  activity: string;
  sections: ReadingSection[];
  overtone?: { value: number; text: string; source: string };
  lifePathLine?: { lifePath: Result; text: string; source: string };
  months: MonthTile[];
  /** Five cautions, one per facet. */
  cautions: CautionCard[];
  steps: Step[];
  sources: string[];
};

/** The 12 dates the month tiles are computed on. */
export function yearMonthDates(birth: YMD, year: number, c: Conventions): YMD[] {
  if (c.cycleYear === 'calendar') {
    return Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1, day: 1 }));
  }
  const first = birthdayIn(birth, year, c);
  return Array.from({ length: 12 }, (_, i) => {
    if (i === 0) return first;
    const month = ((first.month - 1 + i) % 12) + 1;
    return { year: year + (first.month - 1 + i >= 12 ? 1 : 0), month, day: 1 };
  });
}

export function composeYear(bank: Bank, birth: YMD, year: number, c: Conventions): YearReading {
  const yearLayer = need(bank, 'year');
  const themes = need(bank, 'core').themes;
  const py = personalYear(birth, year, c);
  const key = String(py.root);
  const entry = yearLayer.personalYear[key];
  const sections: ReadingSection[] = entry
    ? YEAR_SECTIONS.map((id) => ({
        id,
        title: YEAR_TITLES[id],
        text: entry[id],
        source: `year.personalYear.${key}.${id}`,
      }))
    : [];
  const sources = sections.map((s) => s.source);

  const reading: YearReading = {
    year,
    personalYear: py,
    display: displayNumber(py),
    adj: themes[key]?.adj ?? '',
    activity: themes[key]?.activity ?? '',
    sections,
    months: [],
    cautions: composeCautions(yearLayer.caution, 'year', py.root, yearVariantIndex(birth, year)),
    steps: py.steps,
    sources,
  };
  for (const caution of reading.cautions) sources.push(caution.source);

  const masterKey = py.overtone ?? (py.value > 9 ? py.value : undefined);
  if (masterKey !== undefined && yearLayer.overtones[String(masterKey)]) {
    const source = `year.overtones.${masterKey}`;
    reading.overtone = { value: masterKey, text: yearLayer.overtones[String(masterKey)] as string, source };
    sources.push(source);
  }

  const lp = lifePath(birth, c);
  const line = yearLayer.yearLifePath[key]?.[String(lp.value)];
  if (line) {
    const source = `year.yearLifePath.${key}.${lp.value}`;
    reading.lifePathLine = { lifePath: lp, text: line, source };
    sources.push(source);
  }

  reading.months = yearMonthDates(birth, year, c).map((date) => {
    const pm = personalMonthOn(birth, date, c);
    const theme = themes[String(pm.value)];
    const tile: MonthTile = {
      year: date.year,
      month: date.month,
      name: monthName(date.month),
      value: pm.value,
      tile: theme?.tile ?? '',
      adj: theme?.adj ?? '',
    };
    if (c.cycleYear === 'birthday' && date.day > 1) tile.fromDay = date.day;
    return tile;
  });
  return reading;
}

/** The personal year in force on a date, as its cycle year (for "this year" links). */
export function currentCycleYear(birth: YMD, today: YMD, c: Conventions): number {
  return cycleYearOn(birth, today, c);
}
