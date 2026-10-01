import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Ajv from 'ajv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { allSchemas, expectedCount, expectedIds, FAMILIES, flattenFamily, wordCount } from '@numerology/content';
import { buildLayers } from '../src/build';
import { buildDraftRequest, callClaude } from '../src/draft';
import { parseId, setSnippetText } from '../src/edit';
import { shortestHeadlineGap } from '../src/gate';
import { lint } from '../src/lint';
import { DATA_ROOT, loadFamilies, type LoadedFamily } from '../src/load';
import { release } from '../src/release';
import { importSheet, parseCsv, toCsv } from '../src/sheet';
import { composeSnapshot, diffSnapshots, snapshotProfiles, SNAPSHOT_DATES, textHashes } from '../src/snapshot';

const loaded = loadFamilies();

describe('the content bank', () => {
  it('fills every slot in the manifest, with no gaps and no extras', () => {
    const present = new Set(loaded.flatMap((l) => l.snippets.map((s) => s.id)));
    const expected = FAMILIES.flatMap(expectedIds);
    expect(expected.filter((id) => !present.has(id))).toEqual([]);
    expect([...present].filter((id) => !expected.includes(id))).toEqual([]);
    expect(present.size).toBe(expectedCount());
  });

  it('is the size the plan sized (about 1,279 snippets) plus 810 cautions', () => {
    const base = expectedCount() - FAMILIES.filter((f) => f.caution).flatMap(expectedIds).length;
    expect(base).toBeGreaterThanOrEqual(1270);
    expect(base).toBeLessThanOrEqual(1290);
    expect(expectedCount()).toBe(base + 810);
  });

  it('has lint clean: no banned claims, certainty words, fear hooks or missing reflection prompts', () => {
    const report = lint(loaded);
    expect(report.errors.map((e) => `${e.rule} ${e.id}: ${e.message}`)).toEqual([]);
  });

  it('every reflection slot ends on a question', () => {
    for (const { family, snippets } of loaded) {
      if (!family.question) continue;
      for (const s of snippets.filter((x) => x.keys[family.question!.axis] === family.question!.value)) {
        expect(s.text.trim().endsWith('?'), s.id).toBe(true);
      }
    }
  });

  it('day facets use different variant counts that add up to 7 facets by 6 variants', () => {
    const day = FAMILIES.find((f) => f.id === 'day.personalDay')!;
    const counts = Object.values(day.variants!);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(42);
    expect(new Set(counts).size).toBeGreaterThan(2);
    expect(day.variants!.headline).toBe(6);
  });
});

describe('the lint', () => {
  const cloneWith = (id: string, text: string): LoadedFamily[] =>
    loaded.map((l) => ({
      ...l,
      snippets: l.snippets.map((s) => (s.id === id ? { ...s, text } : s)),
    }));

  const target = 'life.core.lifePath.4.strengths';
  const rulesFor = (text: string) =>
    lint(cloneWith(target, text))
      .errors.filter((e) => e.id === target)
      .map((e) => e.rule);

  const filler = 'You may notice a steady habit of careful work and plain talk with people close to you, and a wish to keep your days orderly and kind.';

  it('flags certainty words, fear hooks, health, money, legal and relationship claims', () => {
    expect(rulesFor(`${filler} You will finish it.`)).toContain('certainty');
    expect(rulesFor(`${filler} This is always true.`)).toContain('certainty');
    expect(rulesFor(`${filler} A cursed year.`)).toContain('fear');
    expect(rulesFor(`${filler} Watch your health.`)).toContain('health');
    expect(rulesFor(`${filler} A good time to invest.`)).toContain('money');
    expect(rulesFor(`${filler} Avoid the lawsuit.`)).toContain('legal');
    expect(rulesFor(`${filler} You should leave him.`)).toContain('relationship');
  });

  it('flags length, placeholders, markup and stray whitespace', () => {
    expect(rulesFor('Too short.')).toContain('length');
    expect(rulesFor(`${filler} TODO`)).toContain('placeholder');
    expect(rulesFor(`${filler} **bold**`)).toContain('markup');
    expect(rulesFor(` ${filler}`)).toContain('whitespace');
  });

  it('requires reflection snippets to end on a question', () => {
    const id = 'life.core.lifePath.4.growth';
    const errors = lint(cloneWith(id, `${filler} Do this.`)).errors.filter((e) => e.id === id);
    expect(errors.map((e) => e.rule)).toContain('reflection');
  });

  it('flags near-duplicates inside a family', () => {
    const a = loaded.find((l) => l.family.id === 'life.core.lifePath')!.snippets.find((s) => s.id === 'life.core.lifePath.4.strengths')!;
    const copy = loaded.map((l) => ({
      ...l,
      snippets: l.snippets.map((s) => (s.id === 'life.core.lifePath.5.strengths' ? { ...s, text: a.text } : s)),
    }));
    expect(lint(copy).errors.some((e) => e.rule === 'near-duplicate')).toBe(true);
  });

  it('reports a gap when a slot is missing', () => {
    const trimmed = loaded.map((l) =>
      l.family.id === 'day.special'
        ? { ...l, snippets: l.snippets.filter((s) => s.id !== 'day.special.birthday'), data: { ...(l.data as object), birthday: undefined } }
        : l,
    );
    expect(lint(trimmed).errors.some((e) => e.rule === 'gap' && e.id === 'day.special.birthday')).toBe(true);
  });
});

describe('release', () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'ninefold-release-'));
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('writes versioned static layers and a pointer to the current one', () => {
    const manifest = release({ outDir: dir, quiet: true });
    expect(manifest.snippets).toBe(expectedCount());
    expect(manifest.version).toMatch(/^v\d+\.\d+\.\d+-[0-9a-f]{8}$/);
    expect(JSON.parse(readFileSync(join(dir, 'current.json'), 'utf8'))).toEqual({ version: manifest.version });
    for (const layer of ['core', 'life', 'year', 'month', 'day']) {
      expect(existsSync(join(dir, manifest.version, `${layer}.json`))).toBe(true);
    }
    expect(manifest.status).toEqual({ draft: expectedCount(), edited: 0, approved: 0 });
  });

  it('gives the same version for the same content', () => {
    const a = release({ outDir: dir, quiet: true });
    const b = release({ outDir: dir, quiet: true });
    expect(a.version).toBe(b.version);
  });

  it('refuses to release drafts when approved text is required', () => {
    expect(() => release({ outDir: dir, quiet: true, minStatus: 'approved' })).toThrow(/below the required status/);
  });
});

describe('the JSON Schemas', () => {
  const layers = buildLayers(loaded);
  const ajv = new Ajv({ allErrors: true, strict: false });

  it('accept the real layers', () => {
    const schemas = allSchemas();
    for (const name of Object.keys(layers) as (keyof typeof layers)[]) {
      const validate = ajv.compile(schemas[name]);
      expect(validate(layers[name]), `${name}: ${JSON.stringify(validate.errors?.slice(0, 2))}`).toBe(true);
    }
  });

  it('reject a missing key, an extra key, a wrong variant count and an empty text', () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(allSchemas().day);
    const clone = () => JSON.parse(JSON.stringify(layers.day));

    const missing = clone();
    delete missing.special.birthday;
    expect(validate(missing)).toBe(false);

    const extra = clone();
    extra.special.surprise = 'x';
    expect(validate(extra)).toBe(false);

    const variants = clone();
    variants.personalDay['8'].headline.pop();
    expect(validate(variants)).toBe(false);

    const empty = clone();
    empty.dayMonth['1']['1'] = '';
    expect(validate(empty)).toBe(false);
  });
});

describe('editing by id', () => {
  let dir: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'ninefold-data-'));
    cpSync(DATA_ROOT, dir, { recursive: true });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('parses ids into family, keys and variant', () => {
    expect(parseId('life.core.lifePath.8.shadow')?.keys).toEqual(['8', 'shadow']);
    expect(parseId('day.personalDay.8.headline.v3')).toMatchObject({ keys: ['8', 'headline'], variant: 3 });
    expect(parseId('life.grid.lessons.7')?.family.id).toBe('life.grid.lessons');
    expect(parseId('nonsense.1')).toBeNull();
    expect(parseId('life.core.lifePath.99.shadow')).toBeNull();
  });

  it('rewrites one snippet and nothing else', () => {
    const before = loadFamilies(dir);
    setSnippetText('day.personalDay.8.headline.v3', 'A new third headline for the eighth day.', dir);
    setSnippetText('life.grid.lessons.7', 'A new lesson text for the missing seven in a name.', dir);
    const after = loadFamilies(dir);
    const changed: string[] = [];
    const was = new Map(before.flatMap((l) => l.snippets.map((s) => [s.id, s.text] as const)));
    for (const s of after.flatMap((l) => l.snippets)) if (was.get(s.id) !== s.text) changed.push(s.id);
    expect(changed.sort()).toEqual(['day.personalDay.8.headline.v3', 'life.grid.lessons.7']);
  });
});

describe('the review spreadsheet', () => {
  it('round-trips quotes, commas and newlines', () => {
    const rows = [
      ['id', 'text'],
      ['a', 'He said "hello", then left.\nSecond line.'],
      ['b', ''],
    ];
    expect(parseCsv(toCsv(rows))).toEqual([rows[0], rows[1], ['b', '']].map((r) => r));
  });

  it('imports edits as a dry run without touching the files', () => {
    const header = 'id,family,words,status,text';
    const csv = `${header}\r\nday.special.birthday,day.special,3,approved,"A changed birthday note, with a comma."\r\nnope.1,x,1,draft,y\r\n`;
    const result = importSheet(csv, true);
    expect(result.textChanged).toEqual(['day.special.birthday']);
    expect(result.statusChanged).toEqual(['day.special.birthday']);
    expect(result.unknown).toEqual(['nope.1']);
    expect(() => importSheet('wrong,header\r\n', true)).toThrow(/Expected the header/);
  });
});

describe('the drafting prompt', () => {
  it('carries the meaning sheet, the word budget, the tone rules, the banned list and three examples', () => {
    const request = buildDraftRequest('life.core.lifePath.8.shadow');
    expect(request.model).toBe('claude-sonnet-5-5');
    expect(request.user).toContain('Effort and follow-through');
    expect(request.user).toContain('28 to 110 words');
    expect(request.system).toContain('Never predict');
    expect(request.system).toContain('certainty:');
    expect(request.system).toContain('guarantee');
    expect(request.user.match(/^- \(/gm)).toHaveLength(3);
    expect(request.tool.name).toBe('submit_snippet');
    expect(Object.keys((request.tool.input_schema as { properties: object }).properties)).toEqual(['id', 'layer', 'key', 'facet', 'variant', 'text']);
  });

  it('asks the final section of a reading to end on a question, and variants to differ', () => {
    expect(buildDraftRequest('life.core.lifePath.8.growth').user).toContain('must end on a reflection question');
    expect(buildDraftRequest('day.personalDay.8.headline.v2').user).toContain('clearly different');
  });

  it('calls the API with a forced tool call and checks the reply', async () => {
    const request = buildDraftRequest('day.special.birthday');
    let seen: { url: string; headers: Record<string, string>; body: Record<string, unknown> } | undefined;
    const ok = async (url: string, init: { headers: Record<string, string>; body: string }) => {
      seen = { url, headers: init.headers, body: JSON.parse(init.body) };
      return {
        ok: true,
        status: 200,
        json: async () => ({ content: [{ type: 'tool_use', input: { id: request.id, text: '  A drafted note.  ' } }] }),
        text: async () => '',
      };
    };
    const result = await callClaude(request, 'test-key', ok as never);
    expect(result).toEqual({ id: request.id, text: 'A drafted note.' });
    expect(seen?.url).toBe('https://api.anthropic.com/v1/messages');
    expect(seen?.headers['x-api-key']).toBe('test-key');
    expect(seen?.body.tool_choice).toEqual({ type: 'tool', name: 'submit_snippet' });

    const wrong = async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', input: { id: 'other', text: 'x' } }] }), text: async () => '' });
    await expect(callClaude(request, 'k', wrong as never)).rejects.toThrow(/did not contain/);
    const failing = async () => ({ ok: false, status: 401, json: async () => ({}), text: async () => 'bad key' });
    await expect(callClaude(request, 'k', failing as never)).rejects.toThrow(/401/);
  });
});

describe('composed-reading snapshots', () => {
  const bank = buildLayers(loaded);

  it('cover 30 profiles by 20 dates and are deterministic', () => {
    expect(snapshotProfiles()).toHaveLength(30);
    expect(SNAPSHOT_DATES).toHaveLength(20);
    const a = composeSnapshot(bank);
    expect(a).toHaveLength(600);
    expect(composeSnapshot(bank)).toEqual(a);
  });

  it('show the blast radius of an edit', () => {
    const before = { composed: composeSnapshot(bank), hashes: textHashes(loaded) };
    const id = 'day.dayMonth.8.7';
    const edited = JSON.parse(JSON.stringify(bank));
    edited.day.dayMonth['8']['7'] = 'it favors something quite different today.';
    const editedLoaded = loaded.map((l) =>
      l.family.id === 'day.dayMonth'
        ? { ...l, snippets: l.snippets.map((s) => (s.id === id ? { ...s, text: 'it favors something quite different today.' } : s)) }
        : l,
    );
    const after = { composed: composeSnapshot(edited), hashes: textHashes(editedLoaded) };
    const report = diffSnapshots(before, after);
    expect(report.changed).toEqual([id]);
    expect(report.added).toEqual([]);
    expect(report.removed).toEqual([]);
    expect(report.blastRadius[id]).toBeGreaterThan(0);
    expect(report.readingsChanged).toBe(report.blastRadius[id]);
    expect(report.readingsChanged).toBeLessThan(report.readingsTotal);
  });

  it('an unchanged bank has no diff', () => {
    const snap = { composed: composeSnapshot(bank), hashes: textHashes(loaded) };
    const report = diffSnapshots(snap, snap);
    expect(report).toMatchObject({ changed: [], added: [], removed: [], readingsChanged: 0 });
  });
});

describe('variety', () => {
  it('no identical headline closer than 40 days at 6 variants', () => {
    expect(shortestHeadlineGap(buildLayers(loaded)).gap).toBeGreaterThanOrEqual(40);
  });
});

describe('counts', () => {
  it('words are tallied the same way by the lint and the release', () => {
    const words = (s: { text: string; fields?: Record<string, string> }) =>
      s.fields
        ? Object.entries(s.fields)
            .filter(([k]) => k !== 'label')
            .reduce((n, [, v]) => n + wordCount(v), 0)
        : wordCount(s.text);
    const total = loaded.flatMap((l) => l.snippets).reduce((n, s) => n + words(s), 0);
    expect(total).toBe(lint(loaded).words);
    expect(flattenFamily(FAMILIES[0]!, loaded[0]!.data)).toHaveLength(loaded[0]!.snippets.length);
  });
});
