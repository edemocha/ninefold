import {
  chainText,
  cycleYearOn,
  digitalRoot,
  lifePath,
  lifeStage,
  monthName,
  personalDay,
  personalMonthOn,
  personalYear,
  variantIndex,
  variantIndexRange,
  type Conventions,
  type Result,
  type Step,
  type YMD,
} from '@numerology/engine';
import type { DayFacet } from '@numerology/content';
import { need, type Bank } from './bank';
import { agesText, dateLabel, displayNumber, ordinal, withArticle } from './format';
import { specialDateKey } from './special';

export const FACET_LABELS: Record<Exclude<DayFacet, 'headline'>, string> = {
  work: 'Work',
  relationships: 'Relationships',
  mind: 'Mind',
  action: 'One small action',
  watch: 'Watch for',
  reflect: 'Reflect',
};

/** Facets are shown in this order. The reflection prompt comes last. */
export const FACET_ORDER = ['work', 'relationships', 'mind', 'action', 'watch', 'reflect'] as const;

/**
 * Each facet starts at a different point in its variant loop, so on the first
 * day a person ever sees the headline and the action line are not both variant 1.
 */
const FACET_OFFSET: Record<DayFacet, number> = {
  headline: 0,
  work: 1,
  relationships: 2,
  mind: 3,
  action: 4,
  watch: 0,
  reflect: 2,
};

export function pickVariant(list: readonly string[], index: number, facet: DayFacet): { text: string; variant: number } {
  const n = list.length;
  const variant = (index + FACET_OFFSET[facet]) % n;
  return { text: list[variant] ?? '', variant: variant + 1 };
}

export type MathGroup = { title: string; summary: string; steps: Step[] };

export type DayFacetReading = { id: Exclude<DayFacet, 'headline'>; label: string; text: string; source: string };

export type DayCard = {
  date: YMD;
  label: string;
  personalDay: Result;
  personalMonth: Result;
  personalYear: Result;
  headline: { text: string; source: string };
  /** "Day 8 is about effort and follow-through. Inside a reflective month 7 of ..." */
  paragraph: string;
  /** "For your life path 1: ..." */
  lifePathLine?: { lifePath: Result; text: string; source: string };
  lifeStage?: { text: string; age: number; pinnacleValue: number };
  special?: { key: string; text: string; source: string };
  facets: DayFacetReading[];
  math: MathGroup[];
  variantIndex: number;
  /** Snippet ids used, for the snapshot's blast radius. */
  sources: string[];
};

function yearSummary(birth: YMD, cycleYear: number, c: Conventions, py: Result): string {
  if (c.dateRule === 'A2' || c.dateRule === 'C') {
    const m = digitalRoot(birth.month);
    const d = digitalRoot(birth.day);
    const y = digitalRoot(cycleYear);
    const tail = py.overtone ? ` (${py.overtone} overtone)` : '';
    return `${m} (${monthName(birth.month)}) + ${d} (${birth.day}) + ${y} (${cycleYear}) = ${m + d + y}, reduced to ${py.value}${tail}`;
  }
  return chainText(py.chain);
}

type Pre = { variantIndex: number };

/**
 * Builds the day card. `pre.variantIndex` lets a caller that already walked a
 * range (a month view, a year export) skip the 46,000-step walk per day.
 */
export function composeDay(
  bank: Bank,
  birth: YMD,
  date: YMD,
  c: Conventions,
  pre?: Pre,
): DayCard {
  const dayLayer = need(bank, 'day');
  const themes = need(bank, 'core').themes;

  const pd = personalDay(birth, date, c);
  const pm = personalMonthOn(birth, date, c);
  const cycle = cycleYearOn(birth, date, c);
  const py = personalYear(birth, cycle, c);
  const lp = lifePath(birth, c);
  const index = pre?.variantIndex ?? variantIndex(birth, date, c);

  const dayKey = String(pd.value);
  const monthKey = String(pm.value);
  const yearKey = String(py.root);
  const sources: string[] = [];

  const facetLists = dayLayer.personalDay[dayKey];
  const pickFacet = (facet: DayFacet): { text: string; source: string } => {
    const list = facetLists?.[facet] ?? [];
    const { text, variant } = pickVariant(list, index, facet);
    const source = `day.personalDay.${dayKey}.${facet}.v${variant}`;
    sources.push(source);
    return { text, source };
  };

  const headline = pickFacet('headline');
  const facets: DayFacetReading[] = FACET_ORDER.map((id) => {
    const { text, source } = pickFacet(id);
    return { id, label: FACET_LABELS[id], text, source };
  });

  const activity = themes[dayKey]?.activity ?? '';
  const monthAdj = themes[monthKey]?.adj ?? '';
  const yearAdj = themes[yearKey]?.adj ?? '';
  const clause = dayLayer.dayMonth[dayKey]?.[monthKey] ?? '';
  if (clause) sources.push(`day.dayMonth.${dayKey}.${monthKey}`);
  const paragraph = [
    `Day ${pd.value} is about ${activity}.`,
    `Inside ${withArticle(monthAdj)} month ${pm.value} of ${withArticle(yearAdj)} year ${displayNumber(py)}, ${clause}`,
  ].join(' ');

  const card: DayCard = {
    date,
    label: dateLabel(date),
    personalDay: pd,
    personalMonth: pm,
    personalYear: py,
    headline,
    paragraph,
    facets,
    math: [],
    variantIndex: index,
    sources,
  };

  const lpLine = dayLayer.dayLifePath[dayKey]?.[String(lp.value)];
  if (lpLine) {
    const source = `day.dayLifePath.${dayKey}.${lp.value}`;
    card.lifePathLine = { lifePath: lp, text: lpLine, source };
    sources.push(source);
  }

  const stage = lifeStage(birth, date, c);
  const pin = stage.pinnacle;
  card.lifeStage = {
    age: stage.age,
    pinnacleValue: pin.value,
    text: `${ordinal(pin.n)} pinnacle (${pin.value > 9 ? `${pin.value}/${pin.root}` : pin.value}, ${agesText(pin.ageFrom, pin.ageTo)}), ${themes[String(pin.value)]?.stage ?? ''}`,
  };

  const specialKey = specialDateKey(birth, date, c);
  if (specialKey && dayLayer.special[specialKey]) {
    const source = `day.special.${specialKey}`;
    card.special = { key: specialKey, text: dayLayer.special[specialKey] as string, source };
    sources.push(source);
  }

  card.math = [
    { title: 'Personal year', summary: yearSummary(birth, cycle, c, py), steps: py.steps },
    {
      title: 'Personal month',
      summary: `${py.root} + ${date.month} (${monthName(date.month)}) = ${py.root + date.month}, reduced to ${pm.value}`,
      steps: pm.steps,
    },
    {
      title: 'Personal day',
      summary: `${pm.value} + ${date.day} = ${pm.value + date.day}${pm.value + date.day > 9 ? `, reduced to ${pd.value}` : ''}`,
      steps: pd.steps,
    },
  ];
  return card;
}

export type HeadlineRow = { date: YMD; personalDay: number; headline: string };

/** One headline per day across a range, from a single walk from 1900. Used by exports. */
export function composeHeadlines(bank: Bank, birth: YMD, from: YMD, to: YMD, c: Conventions): HeadlineRow[] {
  const dayLayer = need(bank, 'day');
  return variantIndexRange(birth, from, to, c).map(({ date, personalDay: pd, variantIndex: idx }) => {
    const list = dayLayer.personalDay[String(pd)]?.headline ?? [];
    return { date, personalDay: pd, headline: pickVariant(list, idx, 'headline').text };
  });
}

