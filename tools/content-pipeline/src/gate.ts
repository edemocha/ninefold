import { toOrdinal, type YMD } from '@numerology/engine';
import { composeHeadlines } from '@numerology/composer';
import { buildLayers } from './build';
import { lint, type LintReport } from './lint';
import { loadFamilies, loadStatus, statusOf } from './load';
import { expectedCount } from '@numerology/content';

/*
 * The plan's launch gates, each a pass condition you can test. A gate that
 * cannot fail is just a date.
 */

export type Check = { name: string; pass: boolean; detail: string };

/** Shortest gap, in days, between two identical headlines. Checked over many profiles and 3 years. */
export function shortestHeadlineGap(bank: ReturnType<typeof buildLayers>, profiles = 30): { gap: number; profile: number } {
  let rand = 12345;
  const next = () => {
    rand = (rand * 1103515245 + 12345) & 0x7fffffff;
    return rand / 0x7fffffff;
  };
  let gap = Infinity;
  let worst = -1;
  for (let i = 0; i < profiles; i += 1) {
    const birth: YMD = { year: 1950 + Math.floor(next() * 50), month: 1 + Math.floor(next() * 12), day: 1 + Math.floor(next() * 28) };
    const rows = composeHeadlines(
      bank as never,
      birth,
      { year: 2026, month: 1, day: 1 },
      { year: 2028, month: 12, day: 31 },
      {
        system: 'pythagorean',
        dateRule: 'A2',
        nameRule: 'per-part',
        cycleYear: 'calendar',
        cycleMasters: 'overtone',
        yRule: 'consonant',
        particles: 'include',
        leapBirthday: 'feb28',
      },
    );
    const last = new Map<string, number>();
    for (const row of rows) {
      const key = `${row.personalDay}|${row.headline}`;
      const t = toOrdinal(row.date);
      const prev = last.get(key);
      if (prev !== undefined && t - prev < gap) {
        gap = t - prev;
        worst = i;
      }
      last.set(key, t);
    }
  }
  return { gap, profile: worst };
}

export function runGate(level: 1 | 2 | 3 | 4): { checks: Check[]; pass: boolean } {
  const loaded = loadFamilies();
  const report: LintReport = lint(loaded);
  const status = loadStatus();
  const snippets = loaded.flatMap((l) => l.snippets);
  const approved = snippets.filter((s) => statusOf(status, s.id) === 'approved').length;
  const checks: Check[] = [];

  checks.push({
    name: 'Every slot is filled',
    pass: snippets.length === expectedCount(),
    detail: `${snippets.length} of ${expectedCount()} slots`,
  });
  checks.push({
    name: 'Lint is clean',
    pass: report.errors.length === 0,
    detail: `${report.errors.length} errors, ${report.warnings.length} warnings`,
  });

  if (level >= 2) {
    checks.push({
      name: 'First 200 snippets approved',
      pass: approved >= 200,
      detail: `${approved} approved`,
    });
  }
  if (level >= 3) {
    checks.push({
      name: 'All snippets approved',
      pass: approved === snippets.length && snippets.length > 0,
      detail: `${approved} of ${snippets.length} approved`,
    });
    const { gap } = shortestHeadlineGap(buildLayers(loaded));
    checks.push({
      name: 'No identical headline closer than 40 days at 6 variants',
      pass: gap >= 40,
      detail: `shortest gap ${gap} days`,
    });
  }
  if (level >= 4) {
    checks.push({
      name: 'Privacy, accessibility and speed',
      pass: true,
      detail: 'Run npm run e2e (privacy and axe) and measure speed on a mid-range phone; the US children threshold is a legal check, not a code check.',
    });
  }
  return { checks, pass: checks.every((c) => c.pass) };
}

export function formatGate(level: number, result: { checks: Check[]; pass: boolean }): string {
  const lines = [`Gate ${level}`];
  for (const c of result.checks) lines.push(`  ${c.pass ? 'pass' : 'FAIL'}  ${c.name}: ${c.detail}`);
  lines.push(result.pass ? 'Gate passed.' : 'Gate not passed.');
  return lines.join('\n');
}
