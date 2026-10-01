export const SITE_NAME = 'Ninefold';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ninefold.invalid';

/** Every value a number can take, in display order. */
export const ALL_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

export function rootOf(value: number): number {
  return value === 11 ? 2 : value === 22 ? 4 : value === 33 ? 6 : value;
}
