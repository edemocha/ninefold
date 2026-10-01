import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES, flattenFamily, familyData, type Family, type Snippet, type Status } from '@numerology/content';

const here = dirname(fileURLToPath(import.meta.url));
export const CONTENT_ROOT = join(here, '..', '..', '..', 'packages', 'content');
export const DATA_ROOT = join(CONTENT_ROOT, 'data');
export const STATUS_FILE = join(CONTENT_ROOT, 'status.json');

export type LoadedFamily = {
  family: Family;
  /** The part of the file that holds this family, or undefined when the file is missing. */
  data: unknown;
  fileExists: boolean;
  snippets: Snippet[];
};

const cache = new Map<string, unknown>();

export function readSourceFile(relative: string, root = DATA_ROOT): { exists: boolean; json: unknown } {
  const path = join(root, relative);
  if (!existsSync(path)) return { exists: false, json: undefined };
  const key = `${path}`;
  if (!cache.has(key)) cache.set(key, JSON.parse(readFileSync(path, 'utf8')));
  return { exists: true, json: cache.get(key) };
}

export function loadFamilies(root = DATA_ROOT): LoadedFamily[] {
  cache.clear();
  return FAMILIES.map((family) => {
    const { exists, json } = readSourceFile(family.file, root);
    const data = exists ? familyData(family, json) : undefined;
    return { family, data, fileExists: exists, snippets: flattenFamily(family, data) };
  });
}

/** Sparse map of snippet id to status. Anything missing is a draft. */
export function loadStatus(file = STATUS_FILE): Record<string, Status> {
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, Status>;
}

export function statusOf(status: Record<string, Status>, id: string): Status {
  return status[id] ?? 'draft';
}
