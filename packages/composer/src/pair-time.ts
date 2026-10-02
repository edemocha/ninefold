import { cycleGap, numberPair, personalMonthOn, type Conventions, type Result, type YMD } from '@numerology/engine';
import { need, type Bank } from './bank';
import { composeDay } from './day';
import { dateLabel } from './format';
import { composeTimeline, type PeriodReading, type ReadingSection } from './life';
import { composeMonth } from './month';
import { DEFAULT_OTHER, gapSentences } from './pair';

/*
 * Between us over time: two people's day, month and life stages side by side.
 * Every text here is the main bank's own text for each person's own number, so
 * nothing is said about the pair that was not already said about a number. The
 * only new words are the labels and the gap sentence from pair.ts.
 */

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

type Who = 'you' | 'other';
const labelOf = (who: Who, other: string): string => (who === 'you' ? 'You' : cap(other));
const otherName = (label?: string): string => label?.trim() || DEFAULT_OTHER;

// ---------------------------------------------------------------- a day

export type PairDaySide = {
  who: Who;
  label: string;
  personalDay: Result;
  personalMonth: Result;
  personalYear: Result;
  headline: string;
  /** "Day 8 is about effort and follow-through. Inside a reflective month 7 of ..." */
  paragraph: string;
  /** The day's reflection question, for that person to answer. */
  question?: string;
};

export type PairDay = {
  date: YMD;
  label: string;
  sides: [PairDaySide, PairDaySide];
  /** How many steps apart the two day numbers are, on this date. */
  gap: { forward: number; back: number; distance: number; headline: string };
  /**
   * One line on the two day numbers together, from the bank: "A day 7 beside a
   * day 8: ...". It reads the same in either order, and says nothing about the
   * two people beyond what the two numbers tend to bring.
   */
  bridge: { key: string; text: string; source: string };
  /** Snippet ids used, for the snapshot's blast radius. */
  sources: string[];
};

export function composePairDay(
  bank: Bank,
  birthYou: YMD,
  birthOther: YMD,
  date: YMD,
  c: Conventions,
  otherLabel?: string,
): PairDay {
  const other = otherName(otherLabel);
  const cards = [composeDay(bank, birthYou, date, c), composeDay(bank, birthOther, date, c)] as const;
  const sideOf = (who: Who, i: 0 | 1): PairDaySide => {
    const card = cards[i];
    return {
      who,
      label: labelOf(who, other),
      personalDay: card.personalDay,
      personalMonth: card.personalMonth,
      personalYear: card.personalYear,
      headline: card.headline.text,
      paragraph: card.paragraph,
      question: card.facets.find((f) => f.id === 'reflect')?.text,
    };
  };
  const gap = cycleGap(birthYou, birthOther, date, c);
  const { key } = numberPair(cards[0].personalDay, cards[1].personalDay);
  const bridgeText = need(bank, 'pair').moment[key] ?? '';
  return {
    date,
    label: dateLabel(date),
    sides: [sideOf('you', 0), sideOf('other', 1)],
    bridge: { key, text: bridgeText, source: `pair.moment.${key}` },
    gap: {
      forward: gap.forward,
      back: gap.back,
      distance: gap.distance,
      headline: gapSentences(gap, other, c.cycleYear === 'birthday').headline,
    },
    sources: [...new Set([...cards[0].sources, ...cards[1].sources, `pair.moment.${key}`])],
  };
}

// ---------------------------------------------------------------- a month

export type PairMonthSide = {
  who: Who;
  label: string;
  personalMonth: Result;
  display: string;
  /** "an effort-and-results month 8 of a care-and-responsibility year 6" */
  context: string;
  /** The month in a line, from the main bank. */
  theme?: ReadingSection;
};

export type PairMonthDay = { date: YMD; weekday: number; you: number; other: number };

export type PairMonthRow = {
  month: number;
  name: string;
  you: { value: number; tile: string };
  other: { value: number; tile: string };
};

export type PairMonth = {
  year: number;
  month: number;
  name: string;
  sides: [PairMonthSide, PairMonthSide];
  days: PairMonthDay[];
  /** The twelve calendar months of `year`, both people, with each month's one-word tile. */
  yearTable: PairMonthRow[];
  sources: string[];
};

export function composePairMonth(
  bank: Bank,
  birthYou: YMD,
  birthOther: YMD,
  year: number,
  month: number,
  c: Conventions,
  otherLabel?: string,
): PairMonth {
  const themes = need(bank, 'core').themes;
  const other = otherName(otherLabel);
  const readings = [composeMonth(bank, birthYou, year, month, c), composeMonth(bank, birthOther, year, month, c)] as const;
  const sideOf = (who: Who, i: 0 | 1): PairMonthSide => {
    const r = readings[i];
    return { who, label: labelOf(who, other), personalMonth: r.personalMonth, display: r.display, context: r.context, theme: r.sections[0] };
  };

  const days: PairMonthDay[] = readings[0].days.map((d, i) => ({
    date: d.date,
    weekday: d.weekday,
    you: d.personalDay,
    other: readings[1].days[i]?.personalDay ?? 0,
  }));

  const yearTable: PairMonthRow[] = Array.from({ length: 12 }, (_, i) => {
    const on: YMD = { year, month: i + 1, day: 1 };
    const you = personalMonthOn(birthYou, on, c);
    const them = personalMonthOn(birthOther, on, c);
    return {
      month: i + 1,
      name: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i] as string,
      you: { value: you.value, tile: themes[String(you.root)]?.tile ?? '' },
      other: { value: them.value, tile: themes[String(them.root)]?.tile ?? '' },
    };
  });

  return {
    year,
    month,
    name: readings[0].name,
    sides: [sideOf('you', 0), sideOf('other', 1)],
    days,
    yearTable,
    sources: [...new Set([...readings[0].sources, ...readings[1].sources])],
  };
}

// ---------------------------------------------------------------- life stages

export type PairLifeSide = {
  who: Who;
  label: string;
  birthYear: number;
  /** Whole years old today, from 0 to 100. */
  age: number;
  pinnacles: PeriodReading[];
  challenges: PeriodReading[];
  current: { pinnacle: PeriodReading; challenge: PeriodReading };
};

export type PairLife = {
  today: YMD;
  /** The calendar years the chart covers: the earlier birth year to 100 years after the later one. */
  axis: { from: number; to: number };
  sides: [PairLifeSide, PairLifeSide];
};

function currentPeriod(periods: PeriodReading[], age: number): PeriodReading {
  return (periods.find((p) => age >= p.ageFrom && (p.ageTo === null || age <= p.ageTo)) ?? periods[0]) as PeriodReading;
}

/** Both life timelines on one calendar-year axis, so you can see where each person is in life. */
export function composePairLife(
  bank: Bank,
  birthYou: YMD,
  birthOther: YMD,
  today: YMD,
  c: Conventions,
  otherLabel?: string,
): PairLife {
  const other = otherName(otherLabel);
  const timelines = [composeTimeline(bank, birthYou, today, c), composeTimeline(bank, birthOther, today, c)] as const;
  const births = [birthYou, birthOther] as const;
  const sideOf = (who: Who, i: 0 | 1): PairLifeSide => {
    const tl = timelines[i];
    return {
      who,
      label: labelOf(who, other),
      birthYear: births[i].year,
      age: tl.age,
      pinnacles: tl.pinnacles,
      challenges: tl.challenges,
      current: { pinnacle: currentPeriod(tl.pinnacles, tl.age), challenge: currentPeriod(tl.challenges, tl.age) },
    };
  };
  return {
    today,
    axis: { from: Math.min(birthYou.year, birthOther.year), to: Math.max(birthYou.year, birthOther.year) + 100 },
    sides: [sideOf('you', 0), sideOf('other', 1)],
  };
}

