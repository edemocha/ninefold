/*
 * The writing guardrails, in one place. The lint enforces them and the draft
 * prompt quotes them, so a snippet that breaks one is rewritten, not argued with.
 */

export type RuleGroup = {
  id: 'certainty' | 'fear' | 'health' | 'money' | 'spending' | 'legal' | 'relationship' | 'pairVerdict' | 'pairPerson' | 'pairFeeling';
  /** Why the rule exists, shown with every finding. */
  reason: string;
  /** Applies only to families that name this group in `also` (see manifest.ts). */
  optIn?: boolean;
  /** Case-insensitive whole-word patterns. */
  patterns: RegExp[];
  suggest: string;
};

const words = (list: string[]): RegExp[] => list.map((w) => new RegExp(`\\b${w}\\b`, 'i'));

export const RULES: readonly RuleGroup[] = [
  {
    id: 'certainty',
    reason: 'Certainty words turn a reflection into a prediction.',
    patterns: words([
      'will',
      "won'?t",
      'guarantee[sd]?',
      'always',
      'never',
      'certainly',
      'definitely',
      'inevitabl[ey]',
      'undoubtedly',
      'destined',
      'fated?',
      'fates?',
      'must',
      'for sure',
    ]),
    suggest: 'Write "tends to", "may" or "you may notice".',
  },
  {
    id: 'fear',
    reason: 'Fear hooks make people anxious and keep them clicking.',
    patterns: words([
      'cursed?',
      'doomed?',
      'disaster',
      'catastroph(?:e|ic)',
      'tragic',
      'ruin(?:ed|s)?',
      'unlucky',
      'bad luck',
      'misfortune',
      'beware',
      'danger(?:s|ous)?',
      'deadly',
      'fatal(?:ly)?',
      'warning signs?',
      'omens?',
    ]),
    suggest: 'Name the pattern in neutral words and end on a question.',
  },
  {
    id: 'health',
    reason: 'No predictions or advice about illness, death, pregnancy, accidents or the body.',
    patterns: words([
      'ill',
      'illness(?:es)?',
      'sick(?:ness)?',
      'diseases?',
      'cancer',
      'deaths?',
      'die[sd]?',
      'dying',
      'dead',
      'pregnan(?:t|cy)',
      'conceive',
      'accidents?',
      'injur(?:y|ies|ed)',
      'surgery',
      'diagnos(?:is|ed|e)',
      'health',
      'medical',
      'doctors?',
      'medication',
      'diet(?:s|ing)?',
      'calor(?:y|ie|ies)',
      'portions?',
      'over-?eat(?:s|ing)?',
      'bing(?:e|ing)',
      'fasting',
      '(?:lose|losing|gain|gaining|body) weight',
      'weight loss',
      'burn-?out',
    ]),
    suggest: 'Leave the body and its outcomes out. Write about habits, attention and energy.',
  },
  {
    id: 'money',
    reason: 'No money moves: buying, selling, investing or quitting.',
    patterns: words([
      'sell(?:ing)?',
      'sold',
      'invest(?:s|ed|ing|ment|ments)?',
      'quit(?:s|ting)?',
      'resign(?:s|ed|ing)?',
      'borrow(?:s|ed|ing)?',
      'lottery',
      'gambl(?:e|ing)',
      'stocks?',
      'loans?',
      'windfall',
    ]),
    suggest: 'Write about effort, attention and how you spend a day, not what to do with money.',
  },
  {
    id: 'spending',
    reason: 'Buying and purchasing are for caution snippets in the money facet only, as a nudge to pause, never a tip about what to buy.',
    patterns: words(['buy(?:s|ing)?', 'bought', 'purchas(?:e|es|ed|ing)']),
    suggest: 'Outside a caution about impulse spending, write about effort and attention instead.',
  },
  {
    id: 'legal',
    reason: 'No legal outcomes or legal advice.',
    patterns: words(['lawsuits?', 'litigation', 'court', 'sue[sd]?', 'verdict', 'legal(?:ly)?', 'lawyers?']),
    suggest: 'Leave legal matters out of the reading.',
  },
  {
    id: 'relationship',
    reason: 'No relationship verdicts: whether to leave, marry or break up.',
    patterns: words([
      'leave[sd]?',
      'leaving',
      'marry',
      'married',
      'marriage',
      'divorce[sd]?',
      'break ?ups?',
      'break up',
      'cheat(?:s|ed|ing)?',
      'affairs?',
      'soul ?mates?',
    ]),
    suggest: 'Describe how someone tends to relate. Do not rule on what they should do.',
  },
  {
    id: 'pairVerdict',
    optIn: true,
    reason: 'No scores, matches or verdicts about two people: the research does not support them and a verdict can do harm.',
    patterns: words([
      'compatib\\w*',
      'incompatib\\w*',
      'match(?:es|ed|ing)?',
      'mismatch\\w*',
      'twin flames?',
      'meant to be',
      'made for each other',
      'destiny',
      'perfect(?:ly)?',
      'ideal',
      '(?:best|worst) (?:pair|couple|fit|combination)',
      '(?:good|bad) for each other',
      '(?:right|wrong) (?:person|one)',
      'toxic',
      'red flags?',
      'scores?',
      'scored',
      'rating',
      'rank(?:s|ed|ing)?',
      'per ?cent',
      'out of (?:10|100|ten)',
    ]),
    suggest: 'Describe what each number tends to bring and where the two meet. Do not rate or rule on the pair.',
  },
  {
    id: 'pairPerson',
    optIn: true,
    reason: 'Describe numbers, not the other person: no relationship-type nouns, no gendered pronouns, no labels for a person.',
    patterns: words([
      'partners?',
      'husbands?',
      'wife',
      'wives',
      'boyfriends?',
      'girlfriends?',
      'spouses?',
      'lovers?',
      'fianc\\w*',
      'exes',
      'ex',
      'romance',
      'romantic',
      'he',
      'she',
      'him',
      'her',
      'hers',
      'his',
      'himself',
      'herself',
      'narciss\\w*',
      'abus(?:e|es|ed|ive|er)',
      'manipulat\\w*',
      'gaslight\\w*',
      'codependen\\w*',
    ]),
    suggest: 'Write "a 3" and "a 7", or "the two of you", so it reads right for any two people.',
  },
  {
    id: 'pairFeeling',
    optIn: true,
    reason: 'Do not predict what two people will feel for each other.',
    patterns: words(['attract\\w*', 'in love', 'love at first sight', 'fall(?:s|ing)? for', 'infatuat\\w*']),
    suggest: 'Describe how the two numbers tend to meet. Leave feelings between people to them.',
  },
];

/** Reading level, as a Flesch-Kincaid grade. */
export const READING_LEVEL = { warn: 10.5, error: 13 } as const;

/**
 * Near-duplicate threshold: Jaccard similarity of three-word shingles between
 * two snippets in the same family.
 */
export const NEAR_DUPLICATE = { warn: 0.34, error: 0.5 } as const;

/** Heuristic syllable count, good enough for a reading-level estimate. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const cleaned = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = cleaned.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function fleschKincaidGrade(text: string): number {
  const sentences = Math.max(1, (text.match(/[.!?]+(?=\s|$)/g) ?? []).length);
  const tokens = text.split(/\s+/).filter((t) => /[A-Za-z]/.test(t));
  if (tokens.length === 0) return 0;
  const syl = tokens.reduce((n, t) => n + syllables(t), 0);
  return 0.39 * (tokens.length / sentences) + 11.8 * (syl / tokens.length) - 15.59;
}

export function shingles(text: string, size = 3): Set<string> {
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + size <= tokens.length; i += 1) out.add(tokens.slice(i, i + size).join(' '));
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const x of a) if (b.has(x)) shared += 1;
  return shared / (a.size + b.size - shared);
}

export const DISCLAIMER =
  'Numerology is a symbolic tradition. There is no scientific evidence that it predicts events. Use it for reflection or fun, not for decisions about health, money, legal matters or relationships.';
