import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { wordCount, type Status } from '@numerology/content';
import { parseId, setSnippetFields, setSnippetText, writeStatus } from './edit';
import { CONTENT_ROOT, loadFamilies, loadStatus, statusOf } from './load';

/*
 * A spreadsheet is enough to review the first 200 snippets: one row per
 * snippet with a status of draft, edited or approved. Export, edit the text and
 * the status in any spreadsheet program, and import to write the changes back.
 */

export const REVIEW_FILE = join(CONTENT_ROOT, 'review', 'review.csv');
const HEADER = ['id', 'family', 'words', 'status', 'text', 'label', 'headline', 'link'];

export function toCsv(rows: string[][]): string {
  const cell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  return `${rows.map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
}

/** A small RFC 4180 parser: quoted fields, doubled quotes, embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i] as string;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export type ExportOptions = { family?: string; status?: Status; limit?: number };

export function exportRows(options: ExportOptions = {}): string[][] {
  const status = loadStatus();
  const rows: string[][] = [HEADER];
  for (const { snippets } of loadFamilies()) {
    for (const s of snippets) {
      if (options.family && !s.id.startsWith(options.family)) continue;
      const st = statusOf(status, s.id);
      if (options.status && st !== options.status) continue;
      rows.push([s.id, s.family, String(wordCount(s.text)), st, s.text, s.fields?.label ?? '', s.fields?.headline ?? '', s.fields?.link ?? '']);
      if (options.limit && rows.length - 1 >= options.limit) return rows;
    }
  }
  return rows;
}

export function exportSheet(options: ExportOptions = {}, file = REVIEW_FILE): number {
  const rows = exportRows(options);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, toCsv(rows));
  return rows.length - 1;
}

export type ImportResult = { textChanged: string[]; statusChanged: string[]; unknown: string[] };

/** Writes edited text back to the source files and statuses to status.json. */
export function importSheet(csv: string, dryRun = false): ImportResult {
  const [header, ...rows] = parseCsv(csv);
  // The first five columns are the original sheet; the last three carry a caution's other fields.
  const known = [HEADER.join(','), HEADER.slice(0, 5).join(',')];
  if (!header || !known.includes(header.join(','))) throw new Error(`Expected the header ${HEADER.join(',')}`);
  const snippets = loadFamilies().flatMap((l) => l.snippets);
  const current = new Map(snippets.map((s) => [s.id, s.text] as const));
  const currentFields = new Map(snippets.filter((s) => s.fields).map((s) => [s.id, s.fields as Record<string, string>] as const));
  const status = loadStatus();
  const result: ImportResult = { textChanged: [], statusChanged: [], unknown: [] };
  for (const [id, , , st, text, label, headline, link] of rows) {
    if (!id) continue;
    if (!current.has(id)) {
      result.unknown.push(id);
      continue;
    }
    // A snippet made of fields (a caution) changes when any of its fields do.
    const was = currentFields.get(id);
    const fieldsChanged =
      was !== undefined &&
      text !== undefined &&
      (text !== was.body || (label ?? '') !== was.label || (headline ?? '') !== was.headline || (link ?? '') !== was.link);
    if (fieldsChanged) {
      result.textChanged.push(id);
      if (!dryRun) setSnippetFields(id, { label: label ?? '', headline: headline ?? '', body: text ?? '', link: link ?? '' });
      if (st === 'draft' || st === undefined) status[id] = 'edited';
    } else if (was === undefined && text !== undefined && text !== current.get(id)) {
      result.textChanged.push(id);
      if (!dryRun) setSnippetText(id, text);
      // An edited snippet is at least "edited", unless the reviewer set a status.
      if (st === 'draft' || st === undefined) status[id] = 'edited';
    }
    if (st === 'draft' || st === 'edited' || st === 'approved') {
      if (statusOf(status, id) !== st && !(result.textChanged.includes(id) && st === 'draft')) {
        status[id] = st;
        result.statusChanged.push(id);
      }
    }
  }
  if (!dryRun) writeStatus(status);
  return result;
}

export function readSheetFile(file = REVIEW_FILE): string {
  return readFileSync(file, 'utf8');
}
