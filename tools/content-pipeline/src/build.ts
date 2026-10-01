import type { CoreLayer, DayLayer, LifeLayer, MonthLayer, YearLayer } from '@numerology/content';
import type { Bank } from '@numerology/composer';
import { loadFamilies, readSourceFile, type LoadedFamily } from './load';

export type Layers = {
  core: CoreLayer;
  life: LifeLayer;
  year: YearLayer;
  month: MonthLayer;
  day: DayLayer;
};

type Obj = Record<string, unknown>;

function setPath(root: Obj, path: string[], value: unknown): void {
  let cur = root;
  path.slice(0, -1).forEach((key) => {
    cur[key] = (cur[key] as Obj | undefined) ?? {};
    cur = cur[key] as Obj;
  });
  cur[path[path.length - 1] as string] = value;
}

/** Assembles the five released layers from the source files. */
export function buildLayers(loaded: LoadedFamily[] = loadFamilies()): Layers {
  const layers: Record<'life' | 'year' | 'month' | 'day', Obj> = { life: {}, year: {}, month: {}, day: {} };
  for (const { family, data } of loaded) {
    setPath(layers[family.layer], family.path, data);
  }
  const themes = readSourceFile('core/themes.json').json as CoreLayer['themes'];
  return {
    core: { themes },
    life: layers.life as unknown as LifeLayer,
    year: layers.year as unknown as YearLayer,
    month: layers.month as unknown as MonthLayer,
    day: layers.day as unknown as DayLayer,
  };
}

/** The whole bank, straight from the source files. For tests and the snapshot tool. */
export function loadSourceBank(): Bank {
  return buildLayers();
}
