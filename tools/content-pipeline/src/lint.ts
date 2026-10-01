import {
  expectedIds,
  fleschKincaidGrade,
  jaccard,
  NEAR_DUPLICATE,
  READING_LEVEL,
  RULES,
  shingles,
  wordCount,
  type Family,
  type Snippet,
} from '@numerology/content';
import type { LoadedFamily } from './load';

export type Finding = {
  severity: 'error' | 'warning';
  id: string;
  rule: string;
  message: string;
};

export type LintReport = {
  errors: Finding[];
  warnings: Finding[];
  snippets: number;
  words: number;
};

const PLACEHOLDER = /\b(todo|tbd|lorem|ipsum|placeholder|xxx)\b/i;

function unexpectedKeys(family: Family, data: unknown): string[] {
  const out: string[] = [];
  const walk = (depth: number, node: unknown, trail: string[]): void => {
    if (depth === family.axes.length) return;
    if (node === null || typeof node !== 'object' || Array.isArray(node)) return;
    const allowed = new Set(family.axes[depth]);
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (!allowed.has(key)) out.push([...trail, key].join('.'));
      else walk(depth + 1, child, [...trail, key]);
    }
  };
  walk(0, data, []);
  return out;
}

function checkSnippet(family: Family, s: Snippet, report: LintReport): void {
  const push = (severity: Finding['severity'], rule: string, message: string): void => {
    (severity === 'error' ? report.errors : report.warnings).push({ severity, id: s.id, rule, message });
  };
  const text = s.text;
  if (text.trim().length === 0) return push('error', 'empty', 'The snippet is empty.');
  if (text !== text.trim() || /\s{2,}/.test(text)) push('error', 'whitespace', 'Stray or doubled whitespace.');
  if (/[<>{}[\]]|\*\*|^#/.test(text)) push('error', 'markup', 'Plain text only: no markup or brackets.');
  if (PLACEHOLDER.test(text)) push('error', 'placeholder', 'Placeholder text.');

  const words = wordCount(text);
  const [min, max] = family.words;
  if (words < min) push('error', 'length', `${words} words; the budget for ${family.id} is ${min} to ${max}.`);
  if (words > max) push('error', 'length', `${words} words; the budget for ${family.id} is ${min} to ${max}.`);

  // Every field is held to the guardrails, not only the one the word budget measures.
  const haystack = s.fields ? Object.values(s.fields).join(' | ') : text;
  const facet = family.caution ? s.keys[1] : undefined;
  for (const group of RULES) {
    // A family can relax a group, and the spending group only applies to the money facet.
    if (family.allow?.includes(group.id) && (group.id !== 'spending' || facet === 'money')) continue;
    for (const pattern of group.patterns) {
      const match = haystack.match(pattern);
      if (match) {
        push('error', group.id, `"${match[0]}": ${group.reason} ${group.suggest}`);
        break;
      }
    }
  }

  if (s.fields) checkFields(family, s, push);

  if (words >= 12) {
    const grade = fleschKincaidGrade(text);
    if (grade > READING_LEVEL.error) push('error', 'reading-level', `Grade ${grade.toFixed(1)}; keep it under ${READING_LEVEL.error}.`);
    else if (grade > READING_LEVEL.warn) push('warning', 'reading-level', `Grade ${grade.toFixed(1)}; aim for under ${READING_LEVEL.warn}.`);
  }

  const q = family.question;
  if (q && s.keys[q.axis] === q.value && !/\?\s*["”']?$/.test(text.trim())) {
    push('error', 'reflection', 'A reading ends on a reflection prompt: this one must end with a question.');
  }
}

const AVOID_ACTIVITY = /\b(today|tomorrow|tonight|this (?:week|month|year)|travel(?:ing|s)?|trips?|driv(?:e|es|ing)|flights?|flying)\b/i;
const TENDENCY = /\b(tends?|tendency|may|might|can|easy to|pulls?|leans?|often|likely|slips?|slides?|creeps?|drifts?|tempting)\b/i;

/** Checks that apply to snippets made of fields: labels, per-field budgets and the caution rules. */
function checkFields(
  family: Family,
  s: Snippet,
  push: (severity: Finding['severity'], rule: string, message: string) => void,
): void {
  const fields = s.fields as Record<string, string>;
  for (const [field, allowed] of Object.entries(family.enums ?? {})) {
    if (!allowed.includes(fields[field] ?? '')) push('error', 'label', `${field} must be one of ${allowed.join(', ')}.`);
  }
  for (const [field, [min, max]] of Object.entries(family.fieldWords ?? {})) {
    const value = fields[field] ?? '';
    const n = wordCount(value);
    if (value !== value.trim() || /\s{2,}/.test(value)) push('error', 'whitespace', `Stray whitespace in ${field}.`);
    if (n < min || n > max) push('error', 'length', `${field} has ${n} words; the budget is ${min} to ${max}.`);
  }
  if (!family.caution) return;
  const headline = fields.headline ?? '';
  const body = fields.body ?? '';
  if (!TENDENCY.test(`${headline} ${body}`)) {
    push('error', 'tendency', 'Write a caution as a tendency: "tends to", "you may notice", "easy to slip into".');
  }
  if (fields.label === 'AVOID') {
    const match = `${headline} ${body}`.match(AVOID_ACTIVITY);
    if (match) push('error', 'avoid-activity', `"${match[0]}": AVOID applies to a behavior, never to a date or an activity in general.`);
  }
}

/** A caution headline is not repeated inside its family. */
function checkHeadlines(snippets: Snippet[], report: LintReport): void {
  const seen = new Map<string, string>();
  for (const s of snippets) {
    const headline = s.fields?.headline?.trim().toLowerCase();
    if (!headline) continue;
    const other = seen.get(headline);
    if (other) report.errors.push({ severity: 'error', id: s.id, rule: 'duplicate-headline', message: `Same headline as ${other}.` });
    else seen.set(headline, s.id);
  }
}

/** Near-duplicates inside one slot family, by three-word shingles. */
function checkDuplicates(snippets: Snippet[], report: LintReport): void {
  const sets = snippets.map((s) => shingles(s.text));
  for (let i = 0; i < snippets.length; i += 1) {
    for (let j = i + 1; j < snippets.length; j += 1) {
      const sim = jaccard(sets[i] as Set<string>, sets[j] as Set<string>);
      if (sim >= NEAR_DUPLICATE.warn) {
        const a = snippets[i] as Snippet;
        const b = snippets[j] as Snippet;
        const finding: Finding = {
          severity: sim >= NEAR_DUPLICATE.error ? 'error' : 'warning',
          id: a.id,
          rule: 'near-duplicate',
          message: `${(sim * 100).toFixed(0)}% similar to ${b.id}.`,
        };
        (finding.severity === 'error' ? report.errors : report.warnings).push(finding);
      }
    }
  }
}

export function lint(loaded: LoadedFamily[]): LintReport {
  const report: LintReport = { errors: [], warnings: [], snippets: 0, words: 0 };

  for (const { family, data, fileExists, snippets } of loaded) {
    if (!fileExists) {
      report.errors.push({ severity: 'error', id: family.id, rule: 'missing-file', message: `Missing ${family.file}.` });
      continue;
    }
    const present = new Set(snippets.map((s) => s.id));
    const missing = expectedIds(family).filter((id) => !present.has(id));
    for (const id of missing) report.errors.push({ severity: 'error', id, rule: 'gap', message: 'Missing snippet.' });
    for (const key of unexpectedKeys(family, data)) {
      report.errors.push({ severity: 'error', id: `${family.id}.${key}`, rule: 'unexpected-key', message: 'Not a slot in the manifest.' });
    }
    for (const s of snippets) {
      checkSnippet(family, s, report);
      report.snippets += 1;
      report.words += s.fields ? Object.entries(s.fields).filter(([k]) => k !== 'label').reduce((n, [, v]) => n + wordCount(v), 0) : wordCount(s.text);
    }
    checkDuplicates(snippets, report);
    if (family.caution) checkHeadlines(snippets, report);
  }
  return report;
}

export function formatReport(report: LintReport, limit = 60): string {
  const lines: string[] = [];
  const show = (title: string, list: Finding[]): void => {
    if (list.length === 0) return;
    lines.push(`${title} (${list.length})`);
    for (const f of list.slice(0, limit)) lines.push(`  ${f.rule.padEnd(14)} ${f.id}  ${f.message}`);
    if (list.length > limit) lines.push(`  ... and ${list.length - limit} more`);
  };
  show('Errors', report.errors);
  show('Warnings', report.warnings);
  lines.push(
    `${report.snippets} snippets, ${report.words.toLocaleString('en-US')} words, ${report.errors.length} errors, ${report.warnings.length} warnings`,
  );
  return lines.join('\n');
}
