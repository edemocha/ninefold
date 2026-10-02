/*
 * A second, independent implementation of the engine arithmetic.
 *
 * It is written from the plan's formula table, not from the engine: digits are
 * handled as strings, masters are explicit lists, dates go through Date.UTC
 * and letters through a lookup string. It imports nothing from
 * packages/engine, so when the two agree on 200 random profiles the agreement
 * means something.
 */

export type RefRule = 'A' | 'A2' | 'B' | 'C';

const digitsOf = (n: number): number[] => String(n).split('').map(Number);
const sumDigits = (n: number): number => digitsOf(n).reduce((a, b) => a + b, 0);

/** Reduce until one digit, stopping at any master in `keep`. Returns every total. */
export function refChain(n: number, keep: number[]): number[] {
  const out = [n];
  while (out[out.length - 1]! > 9 && !keep.includes(out[out.length - 1]!)) {
    out.push(sumDigits(out[out.length - 1]!));
  }
  return out;
}
const last = (xs: number[]): number => xs[xs.length - 1]!;
export const refSingle = (n: number): number => last(refChain(n, []));

const M2 = [11, 22];
const M3 = [11, 22, 33];

export type RefDate = { y: number; m: number; d: number };

export function refDateChain(date: RefDate, rule: RefRule): number[] {
  if (rule === 'B') {
    return refChain(sumDigits(date.d) + sumDigits(date.m) + sumDigits(date.y), M3);
  }
  if (rule === 'C') {
    return refChain(refSingle(date.d) + refSingle(date.m) + refSingle(date.y), []);
  }
  if (rule === 'A') {
    const part = (n: number) => last(refChain(n, M3));
    return refChain(part(date.d) + part(date.m) + part(date.y), M3);
  }
  return refChain(refSingle(date.d) + refSingle(date.m) + refSingle(date.y), M2);
}

export const refLifePath = (b: RefDate, rule: RefRule): number => last(refDateChain(b, rule));

export function refKarmic(chain: number[]): number | undefined {
  return [13, 14, 16, 19].find((k) => chain.includes(k));
}

export function refPinnacles(b: RefDate, rule: RefRule): { value: number; from: number; to: number | null }[] {
  const m = refSingle(b.m);
  const d = refSingle(b.d);
  const y = refSingle(b.y);
  const p1 = last(refChain(m + d, M2));
  const p2 = last(refChain(d + y, M2));
  const p3 = last(refChain(p1 + p2, M2));
  const p4 = last(refChain(m + y, M2));
  const root = refSingle(refLifePath(b, rule));
  const end = 36 - root;
  return [
    { value: p1, from: 0, to: end },
    { value: p2, from: end + 1, to: end + 9 },
    { value: p3, from: end + 10, to: end + 18 },
    { value: p4, from: end + 19, to: null },
  ];
}

export function refChallenges(b: RefDate): number[] {
  const m = refSingle(b.m);
  const d = refSingle(b.d);
  const y = refSingle(b.y);
  const c1 = Math.abs(m - d);
  const c2 = Math.abs(d - y);
  return [c1, c2, Math.abs(c1 - c2), Math.abs(m - y)];
}

export type RefMasters = 'overtone' | 'keep' | 'single';

/** Personal year. Returns the displayed value and the overtone, if any. */
export function refPersonalYear(
  b: RefDate,
  cycleYear: number,
  rule: RefRule,
  masters: RefMasters,
): { value: number; overtone?: number } {
  const raw = last(refDateChain({ y: cycleYear, m: b.m, d: b.d }, rule));
  if (raw === 11 || raw === 22 || raw === 33) {
    if (masters === 'keep') return { value: raw };
    const single = refSingle(raw);
    return masters === 'overtone' ? { value: single, overtone: raw } : { value: single };
  }
  return { value: raw };
}

/** Which calendar year the cycle is counted from, using Date.UTC for the comparison. */
export function refCycleYear(
  b: RefDate,
  on: RefDate,
  mode: 'calendar' | 'birthday',
  leap: 'feb28' | 'mar1',
): number {
  if (mode === 'calendar') return on.y;
  let bm = b.m;
  let bd = b.d;
  const isLeap = new Date(Date.UTC(on.y, 1, 29)).getUTCMonth() === 1;
  if (bm === 2 && bd === 29 && !isLeap) {
    if (leap === 'mar1') {
      bm = 3;
      bd = 1;
    } else {
      bd = 28;
    }
  }
  const birthday = Date.UTC(on.y, bm - 1, bd);
  const today = Date.UTC(on.y, on.m - 1, on.d);
  return today >= birthday ? on.y : on.y - 1;
}

export function refPersonalMonth(
  b: RefDate,
  on: RefDate,
  rule: RefRule,
  masters: RefMasters,
  mode: 'calendar' | 'birthday',
  leap: 'feb28' | 'mar1',
): number {
  const py = refPersonalYear(b, refCycleYear(b, on, mode, leap), rule, masters).value;
  return refSingle(refSingle(py) + on.m);
}

export function refPersonalDay(
  b: RefDate,
  on: RefDate,
  rule: RefRule,
  masters: RefMasters,
  mode: 'calendar' | 'birthday',
  leap: 'feb28' | 'mar1',
): number {
  return refSingle(refPersonalMonth(b, on, rule, masters, mode, leap) + on.d);
}

/**
 * The gap between two people's personal-day numbers on one date, (A - B) mod 9.
 * It goes through each person's own day-by-day reading, not through the
 * fact that the terms cancel, so it checks that fact too.
 */
export function refPairGap(
  a: RefDate,
  b: RefDate,
  on: RefDate,
  rule: RefRule,
  masters: RefMasters,
  mode: 'calendar' | 'birthday',
  leap: 'feb28' | 'mar1',
): number {
  const da = refPersonalDay(a, on, rule, masters, mode, leap);
  const db = refPersonalDay(b, on, rule, masters, mode, leap);
  return (((da - db) % 9) + 9) % 9;
}

// ---------------------------------------------------------------- names

const PY_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const refPyValue = (ch: string): number => (PY_LETTERS.indexOf(ch) % 9) + 1;

const CH_TABLE: Record<number, string> = {
  1: 'AIJQY',
  2: 'BKR',
  3: 'CGLS',
  4: 'DMT',
  5: 'EHNX',
  6: 'UVW',
  7: 'OZ',
  8: 'FP',
};
const refChValue = (ch: string): number => Number(Object.keys(CH_TABLE).find((k) => CH_TABLE[Number(k)]!.includes(ch)));

export type RefNameOptions = {
  system: 'pythagorean' | 'chaldean';
  nameRule: 'per-part' | 'whole-name';
  yRule: 'consonant' | 'vowel-if-alone';
};

/** `words` are already upper-case A-Z. */
export function refNameNumbers(
  words: string[],
  o: RefNameOptions,
): { expression: number; soulUrge: number; personality: number } {
  const value = o.system === 'pythagorean' ? refPyValue : refChValue;
  const isVowelIn = (word: string, i: number): boolean => {
    const ch = word[i]!;
    if ('AEIOU'.includes(ch)) return true;
    if (o.yRule === 'vowel-if-alone' && ch === 'Y') return ![...word].some((x) => 'AEIOU'.includes(x));
    return false;
  };
  const kinds = {
    expression: (_w: string, _i: number) => true,
    soulUrge: (w: string, i: number) => isVowelIn(w, i),
    personality: (w: string, i: number) => !isVowelIn(w, i),
  };
  const out = {} as { expression: number; soulUrge: number; personality: number };
  for (const key of ['expression', 'soulUrge', 'personality'] as const) {
    const sums = words.map((w) => [...w].reduce((acc, ch, i) => acc + (kinds[key](w, i) ? value(ch) : 0), 0));
    if (o.nameRule === 'whole-name' || words.length === 1) {
      out[key] = last(refChain(sums.reduce((a, b) => a + b, 0), M3));
    } else {
      const reduced = sums.map((s) => last(refChain(s, M3)));
      out[key] = last(refChain(reduced.reduce((a, b) => a + b, 0), M3));
    }
  }
  return out;
}

export function refGrid(words: string[], system: 'pythagorean' | 'chaldean' = 'pythagorean') {
  const value = system === 'pythagorean' ? refPyValue : refChValue;
  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n += 1) counts[n] = 0;
  for (const w of words) for (const ch of w) counts[value(ch)] = (counts[value(ch)] ?? 0) + 1;
  const lessons = Object.keys(counts).map(Number).filter((n) => counts[n] === 0);
  const top = Math.max(...Object.values(counts));
  const passion = Object.keys(counts).map(Number).filter((n) => counts[n] === top && top > 0);
  return { lessons, passion, subconscious: 9 - lessons.length };
}
