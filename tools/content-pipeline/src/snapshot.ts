import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DEFAULT_CONVENTIONS, type Conventions, type YMD } from '@numerology/engine';
import { composeDay, composeMonth, composeYear, type Bank } from '@numerology/composer';
import { CONTENT_ROOT, loadFamilies, type LoadedFamily } from './load';

/*
 * Composed-reading snapshots: 30 profiles by 20 dates. Every content edit shows
 * its blast radius as a diff: which snippets changed, and how many composed
 * readings they appear in.
 */

export const SNAPSHOT_DIR = join(CONTENT_ROOT, 'snapshots');
export const COMPOSED_FILE = join(SNAPSHOT_DIR, 'composed.json');
export const HASHES_FILE = join(SNAPSHOT_DIR, 'hashes.json');

export type SnapshotProfile = { id: string; birth: YMD; conventions: Conventions };
export type SnapshotEntry = {
  profile: string;
  date: string;
  headline: string;
  digest: string;
  sources: string[];
};

/** A small seeded generator so the profiles never change. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function snapshotProfiles(count = 30): SnapshotProfile[] {
  const rand = mulberry32(1900_2026);
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return Array.from({ length: count }, (_, i) => {
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * (days[month - 1] as number));
    const conventions: Conventions =
      i % 10 === 9 ? { ...DEFAULT_CONVENTIONS, dateRule: 'B', cycleYear: 'birthday' } : { ...DEFAULT_CONVENTIONS };
    return {
      id: `p${String(i + 1).padStart(2, '0')}`,
      birth: { year: 1940 + Math.floor(rand() * 70), month, day },
      conventions,
    };
  });
}

/** 20 dates: spread over a year, plus the special-date kinds. */
export const SNAPSHOT_DATES: YMD[] = [
  { year: 2026, month: 1, day: 1 },
  { year: 2026, month: 1, day: 11 },
  { year: 2026, month: 2, day: 2 },
  { year: 2026, month: 2, day: 22 },
  { year: 2026, month: 3, day: 15 },
  { year: 2026, month: 4, day: 4 },
  { year: 2026, month: 5, day: 9 },
  { year: 2026, month: 6, day: 6 },
  { year: 2026, month: 6, day: 30 },
  { year: 2026, month: 7, day: 21 },
  { year: 2026, month: 8, day: 8 },
  { year: 2026, month: 9, day: 17 },
  { year: 2026, month: 10, day: 1 },
  { year: 2026, month: 10, day: 19 },
  { year: 2026, month: 11, day: 11 },
  { year: 2026, month: 11, day: 29 },
  { year: 2026, month: 12, day: 12 },
  { year: 2026, month: 12, day: 31 },
  { year: 2028, month: 2, day: 29 },
  { year: 2030, month: 7, day: 4 },
];

const sha = (text: string, length = 12): string => createHash('sha1').update(text).digest('hex').slice(0, length);

export function composeSnapshot(bank: Bank, profiles = snapshotProfiles(), dates = SNAPSHOT_DATES): SnapshotEntry[] {
  const out: SnapshotEntry[] = [];
  for (const p of profiles) {
    for (const date of dates) {
      const day = composeDay(bank, p.birth, date, p.conventions);
      const month = composeMonth(bank, p.birth, date.year, date.month, p.conventions);
      const year = composeYear(bank, p.birth, p.conventions.cycleYear === 'birthday' ? date.year : date.year, p.conventions);
      const text = [
        day.headline.text,
        day.paragraph,
        day.lifePathLine?.text,
        day.special?.text,
        ...day.facets.map((f) => f.text),
        ...month.sections.map((s) => s.text),
        month.monthYearLine?.text,
        ...year.sections.map((s) => s.text),
        year.lifePathLine?.text,
        year.overtone?.text,
      ]
        .filter(Boolean)
        .join('\n');
      out.push({
        profile: p.id,
        date: `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
        headline: day.headline.text,
        digest: sha(text),
        sources: [...new Set([...day.sources, ...month.sources, ...year.sources])].sort(),
      });
    }
  }
  return out;
}

export function textHashes(loaded: LoadedFamily[] = loadFamilies()): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { snippets } of loaded) for (const s of snippets) out[s.id] = sha(s.text, 10);
  return out;
}

export type DiffReport = {
  changed: string[];
  added: string[];
  removed: string[];
  /** For each changed or removed snippet, how many of the snapshot readings include it. */
  blastRadius: Record<string, number>;
  readingsChanged: number;
  readingsTotal: number;
};

export function diffSnapshots(
  saved: { composed: SnapshotEntry[]; hashes: Record<string, string> },
  current: { composed: SnapshotEntry[]; hashes: Record<string, string> },
): DiffReport {
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  for (const [id, hash] of Object.entries(current.hashes)) {
    if (!(id in saved.hashes)) added.push(id);
    else if (saved.hashes[id] !== hash) changed.push(id);
  }
  for (const id of Object.keys(saved.hashes)) if (!(id in current.hashes)) removed.push(id);

  const blastRadius: Record<string, number> = {};
  for (const id of [...changed, ...removed]) {
    blastRadius[id] = saved.composed.filter((e) => e.sources.includes(id)).length;
  }
  const before = new Map(saved.composed.map((e) => [`${e.profile}|${e.date}`, e.digest]));
  const readingsChanged = current.composed.filter((e) => before.get(`${e.profile}|${e.date}`) !== e.digest).length;
  return { changed, added, removed, blastRadius, readingsChanged, readingsTotal: current.composed.length };
}

export function writeSnapshot(bank: Bank): { readings: number; snippets: number } {
  const composed = composeSnapshot(bank);
  const hashes = textHashes();
  mkdirSync(dirname(COMPOSED_FILE), { recursive: true });
  writeFileSync(COMPOSED_FILE, `${JSON.stringify(composed, null, 1)}\n`);
  writeFileSync(HASHES_FILE, `${JSON.stringify(hashes, null, 1)}\n`);
  return { readings: composed.length, snippets: Object.keys(hashes).length };
}

export function readSavedSnapshot(): { composed: SnapshotEntry[]; hashes: Record<string, string> } | null {
  if (!existsSync(COMPOSED_FILE) || !existsSync(HASHES_FILE)) return null;
  return {
    composed: JSON.parse(readFileSync(COMPOSED_FILE, 'utf8')) as SnapshotEntry[],
    hashes: JSON.parse(readFileSync(HASHES_FILE, 'utf8')) as Record<string, string>,
  };
}

export function formatDiff(report: DiffReport): string {
  const lines: string[] = [];
  lines.push(
    `${report.changed.length} snippets changed, ${report.added.length} added, ${report.removed.length} removed. ` +
      `${report.readingsChanged} of ${report.readingsTotal} composed readings differ.`,
  );
  const top = Object.entries(report.blastRadius).sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [id, n] of top) lines.push(`  ${String(n).padStart(4)} readings  ${id}`);
  if (Object.keys(report.blastRadius).length > top.length) lines.push(`  ... and ${Object.keys(report.blastRadius).length - top.length} more`);
  return lines.join('\n');
}
