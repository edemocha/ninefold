import {
  cycleGap,
  formatNumber,
  numberPair,
  type Conventions,
  type MasterOverlay,
  type NameProfile,
  type Result,
  type YMD,
} from '@numerology/engine';
import { PAIR_LENSES, PAIR_SECTIONS, PAIR_TYPE_QUESTIONS, type PairLens, type PairType } from '@numerology/content';
import { need, type Bank } from './bank';
import type { ReadingSection } from './life';
import { cap, DEFAULT_OTHER, numberWithArticle, PAIR_SECTION_TITLES } from './pair';

/*
 * Between us, phase 3: name numbers read as a pair, questions for a kind of
 * relationship, and a small circle of up to five people. Nothing here scores
 * anyone. The pair text is the same text the life path pair uses; the lens
 * frame only says what a name number is about.
 */

// ---------------------------------------------------------------- names

export const PAIR_LENS_TITLES: Record<PairLens, string> = {
  expression: 'Expression',
  soulUrge: 'Soul urge',
};

export type NamePairSide = { who: 'you' | 'other'; label: string; result: Result; display: string };

export type NamePairReading = {
  lens: PairLens;
  title: string;
  /** One line on what this name number is about, from the bank. */
  frame: { text: string; source: string };
  sides: [NamePairSide, NamePairSide];
  /** "a 3 and a 7". */
  numbers: string;
  /** The pair of single-digit roots, smaller first: the same key as a life path pair uses. */
  key: string;
  overlay: MasterOverlay;
  overlayNote?: { text: string; source: string };
  sections: ReadingSection[];
  sources: string[];
};

/**
 * The expression and the soul urge of two people, each read as a pair. Both
 * names have to be valid (Latin letters); otherwise there is nothing to read
 * and the result is empty. The names themselves are never in the result, only
 * the numbers they make.
 */
export function composeNamePair(bank: Bank, you: NameProfile, other: NameProfile, otherLabel?: string): NamePairReading[] {
  if (!you.ok || !other.ok) return [];
  const pair = need(bank, 'pair');
  const otherStart = cap(otherLabel?.trim() || DEFAULT_OTHER);

  return PAIR_LENSES.map((lens): NamePairReading => {
    const a = you[lens];
    const b = other[lens];
    const { key, overlay } = numberPair(a, b);
    const entry = pair.core[key];
    const sections: ReadingSection[] = entry
      ? PAIR_SECTIONS.map((id) => ({ id, title: PAIR_SECTION_TITLES[id], text: entry[id], source: `pair.core.${key}.${id}` }))
      : [];
    const overlayText = overlay === 'none' ? undefined : pair.master[overlay];
    const display = [formatNumber(a), formatNumber(b)] as const;
    const reading: NamePairReading = {
      lens,
      title: PAIR_LENS_TITLES[lens],
      frame: { text: pair.lens[lens] ?? '', source: `pair.lens.${lens}` },
      sides: [
        { who: 'you', label: 'You', result: a, display: display[0] },
        { who: 'other', label: otherStart, result: b, display: display[1] },
      ],
      numbers: `${numberWithArticle(display[0])} and ${numberWithArticle(display[1])}`,
      key,
      overlay,
      sections,
      sources: [`pair.lens.${lens}`, ...sections.map((s) => s.source)],
    };
    if (overlayText) {
      reading.overlayNote = { text: overlayText, source: `pair.master.${overlay}` };
      reading.sources.push(`pair.master.${overlay}`);
    }
    return reading;
  });
}

// ---------------------------------------------------------------- a kind of relationship

export const PAIR_TYPE_TITLES: Record<PairType, string> = {
  friends: 'Friends',
  family: 'Family',
  colleagues: 'Colleagues',
  couple: 'A couple',
};

export type TypeTalk = {
  type: PairType;
  title: string;
  questions: { id: string; text: string; source: string }[];
};

/**
 * Four questions for a kind of relationship. The choice only changes these
 * questions; it never changes anything said about the numbers.
 */
export function composeTypeTalk(bank: Bank, type: PairType): TypeTalk | undefined {
  const entry = need(bank, 'pair').type[type];
  if (!entry) return undefined;
  return {
    type,
    title: PAIR_TYPE_TITLES[type],
    questions: PAIR_TYPE_QUESTIONS.map((id) => ({ id, text: entry[id], source: `pair.type.${type}.${id}` })),
  };
}

// ---------------------------------------------------------------- a circle

/** You and up to four others. */
export const MAX_PEOPLE = 5;

export type CircleMember = {
  index: number;
  /** A, B, C: the mark on the ring, with a legend in words. */
  letter: string;
  label: string;
  lifePath: Result;
  display: string;
  /** Personal-year number now, single digit. */
  year: number;
};

export type Circle = {
  members: CircleMember[];
  /** distances[i][j]: steps apart the shorter way round, 0 to 4. Symmetric. */
  distances: number[][];
  /** forwards[i][j]: steps person j's number must advance to reach person i's. forwards[i][j] + forwards[j][i] is 0 or 9. */
  forwards: number[][];
  /** The nine numbers, with the letters of everyone whose year number it is. */
  ring: { number: number; letters: string[] }[];
  /** Under birthday cycles the gaps are as of today and move by one between birthdays. */
  approx: boolean;
};

/**
 * Where everyone's cycles sit now. Each pair of people has the same fixed gap
 * as in a pair view, so the table is a picture of nine positions on one ring,
 * and any gap equals the sum of two others going round.
 */
export function composeCircle(births: YMD[], labels: string[], lifePaths: Result[], today: YMD, c: Conventions): Circle {
  const n = births.length;
  const forwards = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const distances = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const year: number[] = [];
  for (let i = 0; i < n; i += 1) {
    year.push(cycleGap(births[i] as YMD, births[i] as YMD, today, c).a);
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue;
      const gap = cycleGap(births[i] as YMD, births[j] as YMD, today, c);
      (forwards[i] as number[])[j] = gap.forward;
      (distances[i] as number[])[j] = gap.distance;
    }
  }
  const members: CircleMember[] = births.map((_, i) => ({
    index: i,
    letter: String.fromCharCode(65 + i),
    label: labels[i] ?? `Person ${i + 1}`,
    lifePath: lifePaths[i] as Result,
    display: formatNumber(lifePaths[i] as Result),
    year: year[i] as number,
  }));
  const ring = Array.from({ length: 9 }, (_, k) => ({
    number: k + 1,
    letters: members.filter((m) => m.year === k + 1).map((m) => m.letter),
  }));
  return { members, distances, forwards, ring, approx: c.cycleYear === 'birthday' };
}
