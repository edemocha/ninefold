import { chainText, compoundStep, finish, nameMasters, reduceChain, sumText } from './reduce';
import type {
  Conventions,
  GridLetter,
  NameGrid,
  NameIssue,
  NameProfile,
  Result,
  Step,
  System,
} from './types';

export const MAX_NAME_LENGTH = 200;

/** Pythagorean: A to I are 1 to 9, then the pattern repeats. */
export function pythagoreanValue(letter: string): number {
  return ((letter.charCodeAt(0) - 65) % 9) + 1;
}

const CHALDEAN: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 8, G: 3, H: 5, I: 1, J: 1, K: 2, L: 3, M: 4,
  N: 5, O: 7, P: 8, Q: 1, R: 2, S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7,
};

export function letterValue(letter: string, system: System): number {
  return system === 'chaldean' ? (CHALDEAN[letter] as number) : pythagoreanValue(letter);
}

const PARTICLES = new Set([
  'bin', 'binti', 'binte', 'bte', 'bt', 'bint', 'ibn', 'a/l', 'a/p', 's/o', 'd/o',
  'van', 'von', 'de', 'der', 'den', 'di', 'da', 'del', 'della', 'dos', 'du', 'la', 'le', 'al', 'el',
]);

/** Letters that do not decompose under NFD. */
const SPECIAL: Record<string, string> = {
  ß: 'SS', æ: 'AE', œ: 'OE', ø: 'O', đ: 'D', ð: 'D', þ: 'TH', ł: 'L', ı: 'I',
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export type NormalizedName = {
  parts: string[];
  droppedParticles: string[];
  issues: NameIssue[];
};

function stripToLatin(token: string): { text: string; hadNonLatin: boolean; hadOther: boolean } {
  const decomposed = token.normalize('NFD').replace(/\p{M}+/gu, '');
  let text = '';
  let hadNonLatin = false;
  let hadOther = false;
  for (const ch of decomposed.toLowerCase()) {
    if (ch >= 'a' && ch <= 'z') {
      text += ch.toUpperCase();
    } else if (SPECIAL[ch]) {
      text += SPECIAL[ch];
    } else if (/\p{L}/u.test(ch)) {
      hadNonLatin = true;
    } else if (/['’‘`´.,]/.test(ch) || /[^\p{L}\p{N}]/u.test(ch)) {
      // Punctuation, symbols and emoji are dropped. Apostrophes and dots are expected.
      if (!/['’‘`´.,/]/.test(ch)) hadOther = true;
    } else {
      hadOther = true;
    }
  }
  return { text, hadNonLatin, hadOther };
}

/**
 * Normalises a typed name into upper-case A-Z parts.
 * NFD with combining marks stripped (José becomes JOSE), apostrophes and
 * punctuation dropped, hyphens treated as spaces. Non-Latin letters are
 * refused, not transliterated: two valid romanisations give two numbers.
 */
export function normalizeName(raw: string, c: Pick<Conventions, 'particles'>): NormalizedName {
  const issues: NameIssue[] = [];
  const droppedParticles: string[] = [];

  if (raw.length > MAX_NAME_LENGTH) {
    issues.push({
      code: 'too-long',
      blocking: true,
      message: `Names are limited to ${MAX_NAME_LENGTH} characters.`,
    });
    return { parts: [], droppedParticles, issues };
  }

  const tokens = raw
    .normalize('NFC')
    .split(/[\s\-‐-―_]+/u)
    .filter((t) => t.length > 0);

  const parts: string[] = [];
  let nonLatin = false;
  let other = false;

  tokens.forEach((token, index) => {
    const lowered = token.toLowerCase().replace(/[’‘`´]/g, "'");
    if (c.particles === 'ignore' && index > 0 && PARTICLES.has(lowered.replace(/[.,]/g, ''))) {
      droppedParticles.push(token);
      return;
    }
    const stripped = stripToLatin(token);
    nonLatin ||= stripped.hadNonLatin;
    other ||= stripped.hadOther;
    if (stripped.text) parts.push(stripped.text);
  });

  if (nonLatin) {
    issues.push({
      code: 'non-latin',
      blocking: true,
      message: 'Please type your name with Latin letters (A to Z). Names are not transliterated automatically, because two spellings can give two different numbers.',
    });
  }
  if (parts.length === 0 && !nonLatin) {
    issues.push({ code: 'empty', blocking: true, message: 'Enter a name that has at least one letter.' });
  }
  if (other && parts.length > 0) {
    issues.push({
      code: 'ignored-characters',
      blocking: false,
      message: 'Digits, symbols and emoji were ignored.',
    });
  }
  if (droppedParticles.length > 0) {
    issues.push({
      code: 'particles-ignored',
      blocking: false,
      message: `Ignored: ${droppedParticles.join(', ')}.`,
    });
  }
  return { parts, droppedParticles, issues };
}

/** Which letters of one word are vowels. Y follows the yRule. */
function vowelFlags(word: string, yRule: Conventions['yRule']): boolean[] {
  const flags = [...word].map((ch) => VOWELS.has(ch));
  if (yRule === 'vowel-if-alone' && !flags.some(Boolean)) {
    return [...word].map((ch) => ch === 'Y');
  }
  return flags;
}

type Selector = 'all' | 'vowel' | 'consonant';

function partSum(letters: GridLetter[], part: number, select: Selector): number {
  return letters
    .filter((l) => l.part === part && (select === 'all' || l.kind === select))
    .reduce((sum, l) => sum + l.value, 0);
}

function letterText(letters: GridLetter[], part: number, select: Selector): string {
  return letters
    .filter((l) => l.part === part && (select === 'all' || l.kind === select))
    .map((l) => `${l.letter}${l.value}`)
    .join(' + ');
}

/** Expression, soul urge and personality all share this: sum chosen letters, per part or whole. */
function nameTotal(
  parts: string[],
  letters: GridLetter[],
  select: Selector,
  c: Pick<Conventions, 'nameRule' | 'system'>,
  title: string,
): Result {
  const nameRule = c.nameRule;
  const masters = nameMasters(c.system);
  const chaldean = c.system === 'chaldean';
  const steps: Step[] = [];
  const perPart = parts.map((word, i) => ({ word, sum: partSum(letters, i, select), text: letterText(letters, i, select) }));

  if (nameRule === 'whole-name' || parts.length === 1) {
    const total = perPart.reduce((s, p) => s + p.sum, 0);
    for (const p of perPart) {
      if (p.text) steps.push({ label: p.word, text: `${p.text} = ${p.sum}` });
    }
    if (perPart.length > 1) steps.push({ label: 'Add every part', text: sumText(perPart.map((p) => p.sum)) });
    const chain = reduceChain(total, masters);
    steps.push({ label: `Reduce ${title}`, text: chainText(chain, masters) });
    return conclude(chain, steps, chaldean);
  }

  const reduced: number[] = [];
  for (const p of perPart) {
    const chain = reduceChain(p.sum, masters);
    reduced.push(chain[chain.length - 1] as number);
    steps.push({
      label: p.word,
      text: p.text ? `${p.text} = ${chainText(chain, masters)}` : 'no letters of this kind = 0',
    });
  }
  steps.push({ label: 'Add the parts', text: sumText(reduced) });
  const chain = reduceChain(reduced.reduce((a, b) => a + b, 0), masters);
  steps.push({ label: `Reduce ${title}`, text: chainText(chain, masters) });
  return conclude(chain, steps, chaldean);
}

/** Pythagorean flags karmic debt; Chaldean names the compound number instead. */
function conclude(chain: number[], steps: Step[], chaldean: boolean): Result {
  if (!chaldean) return finish(chain, steps, { debt: true });
  const step = compoundStep(chain);
  if (step) steps.push(step);
  return finish(chain, steps, { compound: true });
}

/** The numbers a letter table can give. Chaldean keeps the 9 back from every letter. */
export function tableDigits(system: Conventions['system']): number[] {
  return system === 'chaldean' ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8, 9];
}

export function buildGrid(parts: string[], c: Conventions): NameGrid {
  const letters: GridLetter[] = [];
  parts.forEach((word, part) => {
    const flags = vowelFlags(word, c.yRule);
    [...word].forEach((letter, i) => {
      letters.push({
        letter,
        value: letterValue(letter, c.system),
        kind: flags[i] ? 'vowel' : 'consonant',
        part,
      });
    });
  });
  const counts = new Array<number>(10).fill(0);
  const vowelCounts = new Array<number>(10).fill(0);
  const consonantCounts = new Array<number>(10).fill(0);
  for (const l of letters) {
    counts[l.value] = (counts[l.value] as number) + 1;
    const target = l.kind === 'vowel' ? vowelCounts : consonantCounts;
    target[l.value] = (target[l.value] as number) + 1;
  }
  return { digits: tableDigits(c.system), letters, counts, vowelCounts, consonantCounts };
}

/**
 * Expression, soul urge, personality, the letter grid, karmic lessons, hidden
 * passion and subconscious self for a name. Returns { ok: false } with the
 * reasons when the name cannot be used. It never throws.
 */
export function nameNumbers(name: string, c: Conventions): NameProfile {
  const normalized = normalizeName(name, c);
  if (normalized.issues.some((i) => i.blocking) || normalized.parts.length === 0) {
    return { ok: false, issues: normalized.issues, parts: normalized.parts };
  }
  const { parts } = normalized;
  const grid = buildGrid(parts, c);
  const expression = nameTotal(parts, grid.letters, 'all', c, 'expression');
  const soulUrge = nameTotal(parts, grid.letters, 'vowel', c, 'soul urge');
  const personality = nameTotal(parts, grid.letters, 'consonant', c, 'personality');

  const lessons: number[] = [];
  let max = 0;
  for (const n of grid.digits) {
    const count = grid.counts[n] as number;
    if (count === 0) lessons.push(n);
    if (count > max) max = count;
  }
  const passion = grid.digits.filter((n) => (grid.counts[n] as number) === max && max > 0);
  const span = grid.digits.length;
  const subconscious = {
    value: span - lessons.length,
    missing: lessons.length,
    steps: [
      {
        label: 'Subconscious self',
        text: `${span} − ${lessons.length} missing ${lessons.length === 1 ? 'number' : 'numbers'}${lessons.length ? ` (${lessons.join(', ')})` : ''} = ${span - lessons.length}`,
      },
    ],
  };

  return {
    ok: true,
    issues: normalized.issues,
    parts,
    droppedParticles: normalized.droppedParticles,
    expression,
    soulUrge,
    personality,
    grid,
    lessons,
    passion,
    passionCount: max,
    subconscious,
  };
}
