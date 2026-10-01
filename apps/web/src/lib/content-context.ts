'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { Bank } from '@numerology/composer';

export type LayerName = 'core' | 'life' | 'year' | 'month' | 'day';

/*
 * The content is static JSON, one file per layer, loaded on demand and cached
 * for the life of the page. These requests are fixed URLs; nothing the visitor
 * typed is in them.
 */

const requests = new Map<string, Promise<unknown>>();
const loaded: Partial<Record<LayerName, unknown>> = {};
const failures = new Set<LayerName>();
let revision = 0;
const listeners = new Set<() => void>();

function emit(): void {
  revision += 1;
  listeners.forEach((l) => l());
}

function getJson<T>(url: string): Promise<T> {
  let p = requests.get(url);
  if (!p) {
    p = fetch(url, { credentials: 'omit' }).then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.json();
    });
    requests.set(url, p);
    p.catch(() => requests.delete(url));
  }
  return p as Promise<T>;
}

async function ensure(layers: LayerName[]): Promise<void> {
  const missing = layers.filter((l) => loaded[l] === undefined);
  if (missing.length === 0) return;
  try {
    const { version } = await getJson<{ version: string }>('/content/current.json');
    await Promise.all(
      missing.map(async (layer) => {
        loaded[layer] = await getJson<unknown>(`/content/${version}/${layer}.json`);
        failures.delete(layer);
      }),
    );
  } catch {
    missing.forEach((l) => failures.add(l));
  }
  emit();
}

const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getRevision = (): number => revision;

/**
 * Loads the layers a screen needs and returns the bank once they are all
 * there. `core` (the theme words) is always included.
 */
export function useLayers(layers: LayerName[]): { bank: Bank | null; error: boolean } {
  const rev = useSyncExternalStore(subscribe, getRevision, () => 0);
  const wanted = Array.from(new Set<LayerName>(['core', ...layers]));
  const key = wanted.join(',');

  useEffect(() => {
    void ensure(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const ready = wanted.every((l) => loaded[l] !== undefined);
  const error = !ready && wanted.some((l) => failures.has(l));
  // A new object per revision, so memoised readings update when another layer arrives.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bank = useMemo(() => ({ ...loaded }) as unknown as Bank, [rev]);
  return { bank: ready ? bank : null, error };
}
