import type { KarmicDebt, Result, Step } from './types';

export const KARMIC_DEBTS: readonly KarmicDebt[] = [13, 14, 16, 19];
/** Masters kept when reducing dates. */
export const DATE_MASTERS: readonly number[] = [11, 22];
/** Masters kept when reducing names (and under date rule A and B). */
export const NAME_MASTERS: readonly number[] = [11, 22, 33];
/** The Chaldean tradition reads compound numbers from 10 to 52. */
export const COMPOUND_MIN = 10;
export const COMPOUND_MAX = 52;

/**
 * The compound number in a reduction chain: the first total from 10 to 52.
 * [37, 10, 1] gives 37, [64, 10, 1] gives 10, [53, 8] and [100, 1] give none.
 */
export function compoundIn(chain: readonly number[]): number | undefined {
  return chain.find((n) => n >= COMPOUND_MIN && n <= COMPOUND_MAX);
}

export function digitSum(n: number): number {
  let sum = 0;
  for (let x = Math.abs(Math.trunc(n)); x > 0; x = Math.floor(x / 10)) sum += x % 10;
  return sum;
}

/** Single-digit root. 0 stays 0. Same as repeated digit sums, without the loop. */
export function digitalRoot(n: number): number {
  return n <= 0 ? 0 : 1 + ((n - 1) % 9);
}

/**
 * Every total on the way from `total` down to a single digit, stopping early
 * at any number in `masters`. reduceChain(19, []) is [19, 10, 1].
 */
export function reduceChain(total: number, masters: readonly number[]): number[] {
  const chain = [total];
  let n = total;
  while (n > 9 && !masters.includes(n)) {
    n = digitSum(n);
    chain.push(n);
  }
  return chain;
}

export function karmicDebtIn(chain: readonly number[]): KarmicDebt | undefined {
  return KARMIC_DEBTS.find((d) => chain.includes(d));
}

/** The step that names the compound number a Chaldean chain passes through, or nothing when there is none. */
export function compoundStep(chain: readonly number[]): Step | undefined {
  const compound = compoundIn(chain);
  if (compound === undefined) return undefined;
  const first = chain[0] as number;
  const root = digitalRoot(chain[chain.length - 1] as number);
  return {
    label: 'Compound number',
    text:
      first === compound
        ? `${compound} is the compound number the tradition reads. It reduces to ${root}.`
        : `${first} is above ${COMPOUND_MAX}, so the tradition reads the next total down: ${compound}. It reduces to ${root}.`,
  };
}

/** The masters a name total keeps: none in the Chaldean tradition, which reads 11, 22 and 33 as compounds. */
export function nameMasters(system: 'pythagorean' | 'chaldean'): readonly number[] {
  return system === 'chaldean' ? [] : NAME_MASTERS;
}

/** 1985 -> "1 + 9 + 8 + 5". */
export function digitsExpr(n: number): string {
  return String(Math.abs(Math.trunc(n))).split('').join(' + ');
}

/**
 * Words a reduction chain: [1985, 23, 5] -> "1985 -> 1 + 9 + 8 + 5 = 23 -> 2 + 3 = 5".
 * A master that stops the chain is named as one.
 */
export function chainText(chain: readonly number[], masters: readonly number[] = []): string {
  const first = chain[0] ?? 0;
  const parts: string[] = [String(first)];
  for (let i = 0; i < chain.length - 1; i += 1) {
    parts.push(`${digitsExpr(chain[i] as number)} = ${chain[i + 1]}`);
  }
  let text = parts.join(' → ');
  const last = chain[chain.length - 1] ?? 0;
  if (last > 9 && masters.includes(last)) {
    text += ` (master number, kept; root ${digitalRoot(last)})`;
  }
  return text;
}

export function sumText(values: readonly number[]): string {
  return `${values.join(' + ')} = ${values.reduce((a, b) => a + b, 0)}`;
}

export type FinishOptions = {
  debt?: boolean;
  /** Chaldean: record the compound number the chain passes through. */
  compound?: boolean;
  masters?: readonly number[];
  overtone?: 11 | 22 | 33;
  value?: number;
  extraChain?: readonly number[];
};

/** Builds a Result from a reduction chain and the steps that led to it. */
export function finish(
  chain: readonly number[],
  steps: Step[],
  options: FinishOptions = {},
): Result {
  const full = [...chain, ...(options.extraChain ?? [])];
  const value = options.value ?? (full[full.length - 1] as number);
  const result: Result = {
    value,
    root: digitalRoot(value),
    chain: full,
    steps,
  };
  if (options.overtone) result.overtone = options.overtone;
  if (options.compound) {
    const compound = compoundIn(full);
    if (compound !== undefined) result.compound = compound;
  }
  if (options.debt) {
    const debt = karmicDebtIn(full);
    if (debt) result.karmicDebt = debt;
  }
  return result;
}

/** "11/2" for masters, "7" otherwise. */
export function formatNumber(result: Pick<Result, 'value' | 'root'>): string {
  return result.value > 9 ? `${result.value}/${result.root}` : String(result.value);
}
