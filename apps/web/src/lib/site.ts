import { PAIR_KEYS } from '@numerology/content';
import { pairKey } from '@numerology/engine';

export const SITE_NAME = 'Ninefold';
/** The maker's credit. It shows in the footer, on the printed report and on the share image. */
export const CREDIT = 'Built by Danial Adam';
export const AUTHOR = 'Danial Adam';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ninefold.invalid';

/** Every value a number can take, in display order. */
export const ALL_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

/** The 45 public pair pages: "1-1" to "9-9", smaller number first. */
export const PAIR_SLUGS: readonly string[] = PAIR_KEYS;

/** The page for two numbers, in either order. A master number uses its root. */
export function pairSlug(a: number, b: number): string {
  return pairKey(a, b);
}

export function rootOf(value: number): number {
  return value === 11 ? 2 : value === 22 ? 4 : value === 33 ? 6 : value;
}

/** The single digit any total reduces to: 37 gives 1, 29 gives 2. Use this for compound numbers, which rootOf does not reduce. */
export function digitalRootOf(value: number): number {
  return value <= 0 ? 0 : 1 + ((value - 1) % 9);
}
