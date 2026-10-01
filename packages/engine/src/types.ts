/** A calendar date as three integers. Never a JavaScript Date (see calendar.ts). */
export type YMD = { year: number; month: number; day: number };

export type System = 'pythagorean' | 'chaldean'; // only 'pythagorean' ships in v1
export type DateRule = 'A2' | 'A' | 'B' | 'C';
export type NameRule = 'per-part' | 'whole-name';
export type CycleYear = 'calendar' | 'birthday';
export type CycleMasters = 'overtone' | 'keep' | 'single';
export type YRule = 'consonant' | 'vowel-if-alone';
export type Particles = 'include' | 'ignore';
export type LeapBirthday = 'feb28' | 'mar1';

export type Conventions = {
  system: System; // default 'pythagorean'
  dateRule: DateRule; // default 'A2'
  nameRule: NameRule; // default 'per-part'
  cycleYear: CycleYear; // default 'calendar'
  cycleMasters: CycleMasters; // default 'overtone'
  yRule: YRule; // default 'consonant'
  particles: Particles; // default 'include'
  leapBirthday: LeapBirthday; // default 'feb28'
};

export type KarmicDebt = 13 | 14 | 16 | 19;

/** One line of arithmetic, worded for the "why this number" panel. */
export type Step = { label: string; text: string };

export type Result = {
  /** 1-9, 11, 22 or 33. For cycles under 'overtone' or 'single', the single digit. */
  value: number;
  /** Single digit, so 11 gives 2. */
  root: number;
  /** Set when the single digit hides a master (cycles under 'overtone'). 33 only arises under date rules A and B. */
  overtone?: 11 | 22 | 33;
  /** Every intermediate total, e.g. [19, 10, 1]. */
  chain: number[];
  karmicDebt?: KarmicDebt;
  steps: Step[];
};

/** A pinnacle or challenge. `ageTo` is null for the last, open-ended period. */
export type Period = {
  n: 1 | 2 | 3 | 4;
  value: number;
  root: number;
  ageFrom: number;
  ageTo: number | null;
  steps: Step[];
};

export type NameIssueCode =
  | 'empty'
  | 'non-latin'
  | 'too-long'
  | 'ignored-characters'
  | 'particles-ignored';

export type NameIssue = {
  code: NameIssueCode;
  blocking: boolean;
  message: string;
};

export type GridLetter = {
  letter: string;
  value: number;
  kind: 'vowel' | 'consonant';
  /** Index into NameProfile.parts. */
  part: number;
};

export type NameGrid = {
  letters: GridLetter[];
  /** counts[n] is how many letters have the value n (index 0 is unused). */
  counts: number[];
  vowelCounts: number[];
  consonantCounts: number[];
};

export type NameProfileOk = {
  ok: true;
  issues: NameIssue[];
  /** Upper-case A-Z parts, after normalisation. */
  parts: string[];
  /** Tokens dropped because the particles switch is set to 'ignore'. */
  droppedParticles: string[];
  expression: Result;
  soulUrge: Result;
  personality: Result;
  grid: NameGrid;
  /** Karmic lessons: digits 1-9 that never appear in the name. */
  lessons: number[];
  /** Hidden passion: the digit or digits that appear most often. */
  passion: number[];
  passionCount: number;
  /** 9 minus the number of missing digits. */
  subconscious: { value: number; missing: number; steps: Step[] };
};

export type NameProfileError = {
  ok: false;
  issues: NameIssue[];
  parts: string[];
};

export type NameProfile = NameProfileOk | NameProfileError;

export type CoreProfile = {
  lifePath: Result;
  birthDay: Result;
  /** Present only when the birth name is valid. */
  expression?: Result;
  soulUrge?: Result;
  personality?: Result;
  maturity?: Result;
};

export type CoreKey =
  | 'lifePath'
  | 'expression'
  | 'soulUrge'
  | 'personality'
  | 'birthDay'
  | 'maturity';

export type DateIssueCode = 'invalid' | 'before-1900' | 'future';
export type DateIssue = { code: DateIssueCode; message: string };
