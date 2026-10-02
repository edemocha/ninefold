import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CoreLayer, LifeLayer, PairLayer } from '@numerology/content';

/*
 * Build-time access to the released content, for the static meaning pages.
 * These pages carry no personal data, so they are rendered ahead of time and
 * can be indexed by search engines.
 */

const ROOT = join(process.cwd(), 'public', 'content');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function releasedVersion(): string {
  return readJson<{ version: string }>(join(ROOT, 'current.json')).version;
}

export function readReleasedLayer<T>(layer: 'core' | 'life' | 'pair'): T {
  return readJson<T>(join(ROOT, releasedVersion(), `${layer}.json`));
}

export function readCore(): CoreLayer {
  return readReleasedLayer<CoreLayer>('core');
}

export function readLife(): LifeLayer {
  return readReleasedLayer<LifeLayer>('life');
}

export function readPair(): PairLayer {
  return readReleasedLayer<PairLayer>('pair');
}
