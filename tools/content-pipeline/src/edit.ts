import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FAMILIES, type Family, type Status } from '@numerology/content';
import { DATA_ROOT, STATUS_FILE } from './load';

export type ParsedId = { family: Family; keys: string[]; variant?: number };

/** Splits a snippet id such as day.personalDay.8.headline.v3 into its family, keys and variant. */
export function parseId(id: string): ParsedId | null {
  const family = [...FAMILIES]
    .sort((a, b) => b.id.length - a.id.length)
    .find((f) => id.startsWith(`${f.id}.`));
  if (!family) return null;
  const rest = id.slice(family.id.length + 1).split('.');
  let variant: number | undefined;
  if (family.variants) {
    const last = rest.pop() ?? '';
    const m = last.match(/^v(\d+)$/);
    if (!m) return null;
    variant = Number(m[1]);
  }
  if (rest.length !== family.axes.length) return null;
  const valid = rest.every((key, i) => (family.axes[i] as readonly string[]).includes(key));
  if (!valid) return null;
  return { family, keys: rest, variant };
}

type Obj = Record<string, unknown>;

/** Replaces one snippet's text in its source file. The file keeps its key order. */
export function setSnippetText(id: string, text: string, root = DATA_ROOT): void {
  const parsed = parseId(id);
  if (!parsed) throw new Error(`Unknown snippet id: ${id}`);
  const path = join(root, parsed.family.file);
  const json = JSON.parse(readFileSync(path, 'utf8')) as Obj;
  let node: Obj = json;
  for (const key of [...(parsed.family.within ?? []), ...parsed.keys.slice(0, -1)]) node = node[key] as Obj;
  const last = parsed.keys[parsed.keys.length - 1] as string;
  if (parsed.variant !== undefined) {
    const list = node[last] as string[];
    if (!Array.isArray(list) || parsed.variant < 1 || parsed.variant > list.length) throw new Error(`No variant ${parsed.variant} for ${id}`);
    list[parsed.variant - 1] = text;
  } else {
    node[last] = text;
  }
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

/** Replaces all fields of a snippet that has them (a caution's label, headline, body and link). */
export function setSnippetFields(id: string, fields: Record<string, string>, root = DATA_ROOT): void {
  const parsed = parseId(id);
  if (!parsed || !parsed.family.fields) throw new Error(`${id} has no fields`);
  const path = join(root, parsed.family.file);
  const json = JSON.parse(readFileSync(path, 'utf8')) as Obj;
  let node: Obj = json;
  for (const key of [...(parsed.family.within ?? []), ...parsed.keys.slice(0, -1)]) node = node[key] as Obj;
  const last = parsed.keys[parsed.keys.length - 1] as string;
  const value = Object.fromEntries(parsed.family.fields.map((f) => [f, fields[f] ?? '']));
  if (parsed.variant !== undefined) {
    const list = node[last] as Obj[];
    if (!Array.isArray(list) || parsed.variant < 1 || parsed.variant > list.length) throw new Error(`No variant ${parsed.variant} for ${id}`);
    list[parsed.variant - 1] = value;
  } else {
    node[last] = value;
  }
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
}

/** Records a status. Drafts are the default, so the file only holds edited and approved snippets. */
export function writeStatus(map: Record<string, Status>, file = STATUS_FILE): void {
  const sparse = Object.fromEntries(
    Object.entries(map)
      .filter(([, s]) => s !== 'draft')
      .sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(file, `${JSON.stringify(sparse, null, 1)}\n`);
}
