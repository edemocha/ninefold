import {
  addDays,
  cycleYearOn,
  daysInMonth,
  monthName,
  personalDayNumber,
  personalMonthOn,
  personalYear,
  weekday,
  type Conventions,
  type Result,
  type Step,
  type YMD,
} from '@numerology/engine';
import { MONTH_SECTIONS } from '@numerology/content';
import { need, type Bank } from './bank';
import { displayNumber, withArticle } from './format';
import type { ReadingSection } from './life';

const MONTH_TITLES: Record<(typeof MONTH_SECTIONS)[number], string> = {
  theme: 'The month in a line',
  focus: 'Focus',
  reflect: 'Reflect',
};

export type DayCell = {
  date: YMD;
  /** 0 is Sunday. */
  weekday: number;
  personalDay: number;
  /** A 1 starts a new loop of the nine-day rhythm. */
  loopStart: boolean;
};

export type MonthSegment = { from: YMD; to: YMD; personalMonth: number; personalYear: number };

export type MonthReading = {
  year: number;
  month: number;
  name: string;
  personalMonth: Result;
  personalYear: Result;
  display: string;
  adj: string;
  yearAdj: string;
  /** "an effort-and-results month 8 of a care-and-responsibility year 6" */
  context: string;
  sections: ReadingSection[];
  monthYearLine?: { text: string; source: string };
  days: DayCell[];
  /** More than one entry when the birthday falls inside the month (birthday convention). */
  segments: MonthSegment[];
  steps: Step[];
  sources: string[];
};

export function composeMonth(bank: Bank, birth: YMD, year: number, month: number, c: Conventions): MonthReading {
  const monthLayer = need(bank, 'month');
  const themes = need(bank, 'core').themes;
  const first: YMD = { year, month, day: 1 };
  const last: YMD = { year, month, day: daysInMonth(year, month) };

  const pm = personalMonthOn(birth, first, c);
  const py = personalYear(birth, cycleYearOn(birth, first, c), c);
  const key = String(pm.value);
  const yearKey = String(py.root);
  const entry = monthLayer.personalMonth[key];
  const sections: ReadingSection[] = entry
    ? MONTH_SECTIONS.map((id) => ({
        id,
        title: MONTH_TITLES[id],
        text: entry[id],
        source: `month.personalMonth.${key}.${id}`,
      }))
    : [];
  const sources = sections.map((s) => s.source);

  const adj = themes[key]?.adj ?? '';
  const yearAdj = themes[yearKey]?.adj ?? '';
  const reading: MonthReading = {
    year,
    month,
    name: monthName(month),
    personalMonth: pm,
    personalYear: py,
    display: displayNumber(pm),
    adj,
    yearAdj,
    context: `${withArticle(adj)} month ${pm.value} of ${withArticle(yearAdj)} year ${displayNumber(py)}`,
    sections,
    days: [],
    segments: [],
    steps: pm.steps,
    sources,
  };

  const line = monthLayer.monthYear[key]?.[yearKey];
  if (line) {
    const source = `month.monthYear.${key}.${yearKey}`;
    reading.monthYearLine = { text: line, source };
    sources.push(source);
  }

  for (let day = 1; day <= last.day; day += 1) {
    const date = { year, month, day };
    const pd = personalDayNumber(birth, date, c);
    reading.days.push({ date, weekday: weekday(date), personalDay: pd, loopStart: pd === 1 });
  }

  // Birthday convention: the personal year can change inside the month.
  const cycleFirst = cycleYearOn(birth, first, c);
  const cycleLast = cycleYearOn(birth, last, c);
  if (cycleFirst === cycleLast) {
    reading.segments.push({
      from: first,
      to: last,
      personalMonth: pm.value,
      personalYear: py.root,
    });
  } else {
    let split = first;
    for (let d = 2; d <= last.day; d += 1) {
      const date = { year, month, day: d };
      if (cycleYearOn(birth, date, c) !== cycleFirst) {
        split = date;
        break;
      }
    }
    const before = addDays(split, -1);
    const pyAfter = personalYear(birth, cycleLast, c);
    const pmAfter = personalMonthOn(birth, split, c);
    reading.segments.push(
      { from: first, to: before, personalMonth: pm.value, personalYear: py.root },
      { from: split, to: last, personalMonth: pmAfter.value, personalYear: pyAfter.root },
    );
  }
  return reading;
}
