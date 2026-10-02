import type { CoreLayer, DayLayer, LifeLayer, MonthLayer, PairLayer, YearLayer } from '@numerology/content';

/** The released content, loaded layer by layer. A layer can be missing until it is needed. */
export type Bank = {
  core: CoreLayer;
  life?: LifeLayer;
  year?: YearLayer;
  month?: MonthLayer;
  day?: DayLayer;
  pair?: PairLayer;
};

export class MissingLayerError extends Error {
  constructor(public readonly layer: string) {
    super(`The ${layer} content layer is not loaded.`);
  }
}

export function need<K extends keyof Bank>(bank: Bank, layer: K): NonNullable<Bank[K]> {
  const value = bank[layer];
  if (!value) throw new MissingLayerError(layer);
  return value as NonNullable<Bank[K]>;
}
