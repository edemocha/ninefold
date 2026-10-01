import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { allSchemas, wordCount, type ReleaseManifest, type Status } from '@numerology/content';
import { buildLayers } from './build';
import { formatReport, lint } from './lint';
import { loadFamilies, loadStatus, statusOf } from './load';

const here = dirname(fileURLToPath(import.meta.url));
export const WEB_CONTENT_DIR = join(here, '..', '..', '..', 'apps', 'web', 'public', 'content');
const PACKAGE_JSON = join(here, '..', '..', '..', 'packages', 'content', 'package.json');

const RANK: Record<Status, number> = { draft: 0, edited: 1, approved: 2 };

export type ReleaseOptions = {
  /** Lowest status a snippet may have to be released. Drafts are allowed in development builds. */
  minStatus?: Status;
  outDir?: string;
  quiet?: boolean;
};

const sha = (text: string): string => createHash('sha256').update(text).digest('hex');

/**
 * Lints, validates against the JSON Schemas, and writes the versioned static
 * layers the site loads on demand. Content is never edited live: a release is
 * a new directory, and current.json points at it.
 */
export function release(options: ReleaseOptions = {}): ReleaseManifest {
  const { minStatus = 'draft', outDir = WEB_CONTENT_DIR, quiet = false } = options;
  const loaded = loadFamilies();

  const report = lint(loaded);
  if (report.errors.length > 0) {
    throw new Error(`Content lint failed.\n${formatReport(report, 40)}`);
  }

  const layers = buildLayers(loaded);
  const ajv = new Ajv({ allErrors: true, strict: false });
  const schemas = allSchemas();
  for (const name of Object.keys(layers) as (keyof typeof layers)[]) {
    const validate = ajv.compile(schemas[name]);
    if (!validate(layers[name])) {
      const first = (validate.errors ?? []).slice(0, 5).map((e) => `${e.instancePath} ${e.message}`);
      throw new Error(`Schema validation failed for ${name}:\n${first.join('\n')}`);
    }
  }

  const status = loadStatus();
  const counts = { draft: 0, edited: 0, approved: 0 };
  let below = 0;
  for (const { snippets } of loaded) {
    for (const s of snippets) {
      const st = statusOf(status, s.id);
      counts[st] += 1;
      if (RANK[st] < RANK[minStatus]) below += 1;
    }
  }
  if (below > 0) {
    throw new Error(`${below} snippets are below the required status "${minStatus}".`);
  }

  const bodies = Object.fromEntries(
    (Object.keys(layers) as (keyof typeof layers)[]).map((name) => [name, JSON.stringify(layers[name])]),
  ) as Record<keyof typeof layers, string>;
  const names = Object.keys(bodies) as (keyof typeof layers)[];
  const hash = sha(names.map((n) => `${n}:${sha(bodies[n])}`).join('|')).slice(0, 8);
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as { version: string };
  const version = `v${pkg.version}-${hash}`;

  const perLayer = (loadedLayer: 'life' | 'year' | 'month' | 'day') => {
    const rows = loaded.filter((l) => l.family.layer === loadedLayer).flatMap((l) => l.snippets);
    return { snippets: rows.length, words: rows.reduce((n, s) => n + wordCount(s.text), 0) };
  };

  const manifest: ReleaseManifest = {
    version,
    generatedFrom: 'packages/content/data',
    snippets: report.snippets,
    words: report.words,
    status: counts,
    layers: {
      core: { file: 'core.json', snippets: 0, words: 0, sha256: sha(bodies.core) },
      life: { file: 'life.json', ...perLayer('life'), sha256: sha(bodies.life) },
      year: { file: 'year.json', ...perLayer('year'), sha256: sha(bodies.year) },
      month: { file: 'month.json', ...perLayer('month'), sha256: sha(bodies.month) },
      day: { file: 'day.json', ...perLayer('day'), sha256: sha(bodies.day) },
    },
  };

  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  const versionDir = join(outDir, version);
  mkdirSync(versionDir, { recursive: true });
  for (const name of names) writeFileSync(join(versionDir, `${name}.json`), bodies[name]);
  writeFileSync(join(versionDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(outDir, 'current.json'), `${JSON.stringify({ version })}\n`);

  if (!quiet) {
    console.log(
      `Released ${version}: ${manifest.snippets} snippets, ${manifest.words.toLocaleString('en-US')} words ` +
        `(${counts.approved} approved, ${counts.edited} edited, ${counts.draft} draft) -> ${versionDir}`,
    );
  }
  return manifest;
}
