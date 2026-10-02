import {
  cycleGap,
  cycleGapSegments,
  cycleStrip,
  cycleYearOn,
  formatNumber,
  lifePathPair,
  type Conventions,
  type CycleGap,
  type GapSegment,
  type MasterOverlay,
  type Result,
  type Step,
  type YMD,
} from '@numerology/engine';
import { PAIR_SAFETY_LINES, PAIR_SECTIONS, RHYTHM_SECTIONS } from '@numerology/content';
import { need, type Bank } from './bank';
import { displayNumber } from './format';
import type { ReadingSection } from './life';

/*
 * Between us. Two people's numbers, side by side. Nothing here scores a pair or
 * says whether it is a good one: the text is about what each number tends to
 * bring and where the two meet, and the one piece of real structure, the gap
 * between two cycles, is shown with its arithmetic.
 */

/** The same two lines on every Between us screen, whatever the pair. Not generated, never tied to a number. */
export const PAIR_SAFETY: readonly string[] = PAIR_SAFETY_LINES;

export const PAIR_SECTION_TITLES: Record<(typeof PAIR_SECTIONS)[number], string> = {
  meet: 'Where you meet',
  stretch: 'Where each may stretch',
  talk: 'Talk about this',
};

export const RHYTHM_SECTION_TITLES: Record<(typeof RHYTHM_SECTIONS)[number], string> = {
  meaning: 'What this gap means',
  use: 'How to use it',
  talk: 'Talk about this',
};

export const DEFAULT_OTHER = 'the other person';

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const stepsText = (n: number): string => `${n} ${n === 1 ? 'step' : 'steps'}`;
const yearsText = (n: number, approx: boolean): string => `${approx ? 'about ' : ''}${n} ${n === 1 ? 'year' : 'years'}`;

/** "a 3", "an 8", "an 11/2". */
function numberWithArticle(display: string): string {
  return `${/^(8|11)/.test(display) ? 'an' : 'a'} ${display}`;
}

/**
 * The headline and the sentences that say what a gap means for two cycles.
 * `other` is a nickname or "the other person". Under birthday cycles the years
 * are approximate, so they read "about".
 */
export function gapSentences(
  gap: Pick<CycleGap, 'forward' | 'back' | 'distance'>,
  other: string,
  approx: boolean,
): { headline: string; lines: string[] } {
  const headline = gap.distance === 0 ? 'Your numbers are the same.' : `Your numbers are ${stepsText(gap.distance)} apart.`;
  const lines =
    gap.forward === 0
      ? [`You and ${other} have the same year number now.`]
      : [
          `In ${yearsText(gap.forward, approx)}, ${other} has the year number you have now.`,
          `In ${yearsText(gap.back, approx)}, you have the year number ${other} has now.`,
        ];
  return { headline, lines };
}

export type PairSide = {
  who: 'you' | 'other';
  /** "You", or the nickname, or "The other person". */
  label: string;
  lifePath: Result;
  display: string;
  /** How this life path tends to relate, from the main bank. */
  relationships: string;
  source: string;
};

export type RhythmRow = { year: number; a: string; b: string; aRoot: number; bRoot: number; current: boolean };

export type RhythmReading = {
  /** Steps the other person's number must advance to reach yours, and the reverse. */
  forward: number;
  back: number;
  /** The shorter way round the nine: 0 to 4. */
  distance: number;
  /** Each person's personal-year number now, single digit. */
  you: number;
  other: number;
  headline: string;
  /** What the gap means for the two cycles, in plain sentences. */
  lines: string[];
  /** Under calendar years the gap holds all year; under birthday cycles it moves by one between the birthdays. */
  holds: string;
  shifted: boolean;
  approx: boolean;
  segments: GapSegment[];
  stripHeading: string;
  strip: RhythmRow[];
  sections: ReadingSection[];
  steps: Step[];
  sources: string[];
};

export type PairReading = {
  /** "3-7", the two single-digit roots, smaller first. */
  key: string;
  sides: [PairSide, PairSide];
  /** "a 3 and a 7", for headings and the share card. */
  numbers: string;
  overlay: MasterOverlay;
  overlayNote?: { text: string; source: string };
  sections: ReadingSection[];
  rhythm: RhythmReading;
  safety: readonly string[];
  sources: string[];
};

/**
 * `otherLabel` is a nickname the visitor typed, or nothing. It is only ever
 * shown on screen and never put in the share card, a link or analytics.
 */
export function composePair(
  bank: Bank,
  birthYou: YMD,
  birthOther: YMD,
  today: YMD,
  c: Conventions,
  otherLabel?: string,
): PairReading {
  const life = need(bank, 'life');
  const pair = need(bank, 'pair');

  const other = otherLabel?.trim() || DEFAULT_OTHER;
  const otherStart = cap(other);

  const lp = lifePathPair(birthYou, birthOther, c);
  const sideOf = (who: 'you' | 'other', result: Result): PairSide => ({
    who,
    label: who === 'you' ? 'You' : otherStart,
    lifePath: result,
    display: formatNumber(result),
    relationships: life.core.lifePath[String(result.value)]?.relationships ?? '',
    source: `life.core.lifePath.${result.value}.relationships`,
  });
  const sides: [PairSide, PairSide] = [sideOf('you', lp.a), sideOf('other', lp.b)];

  const entry = pair.core[lp.key];
  const sections: ReadingSection[] = entry
    ? PAIR_SECTIONS.map((id) => ({ id, title: PAIR_SECTION_TITLES[id], text: entry[id], source: `pair.core.${lp.key}.${id}` }))
    : [];
  const overlayText = lp.overlay === 'none' ? undefined : pair.master[lp.overlay];
  const overlayNote = overlayText ? { text: overlayText, source: `pair.master.${lp.overlay}` } : undefined;

  const rhythm = composeRhythm(bank, birthYou, birthOther, today, c, other, otherStart);

  const reading: PairReading = {
    key: lp.key,
    sides,
    numbers: `${numberWithArticle(sides[0].display)} and ${numberWithArticle(sides[1].display)}`,
    overlay: lp.overlay,
    sections,
    rhythm,
    safety: PAIR_SAFETY,
    sources: [...sides.map((s) => s.source), ...sections.map((s) => s.source), ...(overlayNote ? [overlayNote.source] : []), ...rhythm.sources],
  };
  if (overlayNote) reading.overlayNote = overlayNote;
  return reading;
}

function composeRhythm(
  bank: Bank,
  birthYou: YMD,
  birthOther: YMD,
  today: YMD,
  c: Conventions,
  other: string,
  otherStart: string,
): RhythmReading {
  const pair = need(bank, 'pair');
  const gap = cycleGap(birthYou, birthOther, today, c, { a: 'You', b: otherStart });
  const approx = c.cycleYear === 'birthday';
  const distanceKey = String(gap.distance);
  const entry = pair.rhythm[distanceKey];
  const sections: ReadingSection[] = entry
    ? RHYTHM_SECTIONS.map((id) => ({
        id,
        title: RHYTHM_SECTION_TITLES[id],
        text: entry[id],
        source: `pair.rhythm.${distanceKey}.${id}`,
      }))
    : [];

  const { headline, lines } = gapSentences(gap, other, approx);
  const holds = approx
    ? gap.baseForward === gap.forward
      ? 'You count cycles from birthdays, so the gap moves by one step between your two birthdays and then returns. Today it is at its usual size.'
      : `You count cycles from birthdays, so the gap moves by one step between your two birthdays and then returns. Today it is one step away from its usual size of ${gap.baseForward}.`
    : 'It holds for every year, month and day, because the year, the month and the day add the same amount to both of you.';

  const startYear = Math.min(cycleYearOn(birthYou, today, c), cycleYearOn(birthOther, today, c));
  const youCycle = cycleYearOn(birthYou, today, c);
  const strip: RhythmRow[] = cycleStrip(birthYou, birthOther, startYear, 9, c).map((row) => ({
    year: row.year,
    a: displayNumber(row.a),
    b: displayNumber(row.b),
    aRoot: row.a.root,
    bRoot: row.b.root,
    current: row.year === youCycle,
  }));

  return {
    forward: gap.forward,
    back: gap.back,
    distance: gap.distance,
    you: gap.a,
    other: gap.b,
    headline,
    lines,
    holds,
    shifted: gap.shifted,
    approx,
    segments: cycleGapSegments(birthYou, birthOther, today.year, c),
    stripHeading: approx ? 'The cycle that starts in' : 'Year',
    strip,
    sections,
    steps: gap.steps,
    sources: sections.map((s) => s.source),
  };
}
