import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { allSchemas, CAUTION_SAFETY_LINES, expectedIds, FAMILIES, wordCount } from '@numerology/content';
import { buildLayers } from '../src/build';
import { buildDraftRequest, callClaude } from '../src/draft';
import { setSnippetFields } from '../src/edit';
import { lint } from '../src/lint';
import { DATA_ROOT, loadFamilies, type LoadedFamily } from '../src/load';
import { importSheet } from '../src/sheet';

const loaded = loadFamilies();
const cautions = loaded.filter((l) => l.family.caution).flatMap((l) => l.snippets);

describe('cautions: a behavior to watch, never a forecast', () => {
  it('fill every slot: 3 layers by 9 numbers by 5 facets by 6 variants', () => {
    const families = FAMILIES.filter((f) => f.caution);
    expect(families.map((f) => f.id)).toEqual(['year.caution', 'month.caution', 'day.caution']);
    expect(families.flatMap(expectedIds)).toHaveLength(810);
    expect(cautions).toHaveLength(810);
  });

  it('pass every guardrail', () => {
    const errors = lint(loaded).errors.filter((e) => e.id.includes('.caution.'));
    expect(errors.map((e) => `${e.rule} ${e.id}: ${e.message}`)).toEqual([]);
  });

  it('use one of three labels, a short headline, a short body and a named shadow trait', () => {
    for (const s of cautions) {
      expect(['WATCH OUT', 'GO EASY ON', 'AVOID'], s.id).toContain(s.fields?.label);
      expect(wordCount(s.fields?.headline ?? ''), s.id).toBeLessThanOrEqual(8);
      expect(wordCount(s.fields?.body ?? ''), s.id).toBeLessThanOrEqual(35);
      expect(wordCount(s.fields?.link ?? ''), s.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('use every label, and keep AVOID to behaviors', () => {
    expect(new Set(cautions.map((s) => s.fields?.label))).toEqual(new Set(['WATCH OUT', 'GO EASY ON', 'AVOID']));
    for (const s of cautions.filter((x) => x.fields?.label === 'AVOID')) {
      expect(`${s.fields?.headline} ${s.fields?.body}`, s.id).not.toMatch(
        /\b(today|tomorrow|tonight|this (?:week|month|year)|travel|trip|drive|driving)\b/i,
      );
    }
  });

  it('keep the two safety lines out of the bank, so they cannot be tied to a number', () => {
    expect(CAUTION_SAFETY_LINES).toEqual([
      'Never drive tired, upset or impaired, on any day.',
      'For health, money or legal decisions, talk to a qualified person, not a number.',
    ]);
    for (const line of CAUTION_SAFETY_LINES) {
      for (const s of loaded.flatMap((l) => l.snippets)) {
        expect(Object.values(s.fields ?? { text: s.text }).join(' ').includes(line), s.id).toBe(false);
      }
    }
  });

  it("include the owner's two example snippets word for word", () => {
    const byId = new Map(cautions.map((s) => [s.id, s]));
    expect(byId.get('year.caution.5.money.v1')?.fields).toMatchObject({
      label: 'GO EASY ON',
      headline: 'Big buys on a whim',
      body: 'A 5 year pulls toward novelty and quick exits. Before any purchase over your usual, wait 48 hours and see if you still want it.',
    });
    expect(byId.get('day.caution.8.energy.v1')?.fields).toMatchObject({
      label: 'WATCH OUT',
      headline: 'Pushing past your limit',
      body: "8 days lean on effort and control. Pick a stop time this morning and keep it, even if the list isn't done.",
    });
  });
});

describe('the lint rules for cautions', () => {
  const target = 'year.caution.3.work.v2';
  const good = 'A 3 year can bring a new idea every week. Finish one small piece of the oldest task before you open another.';

  const cloneWith = (id: string, fields: Record<string, string>): LoadedFamily[] =>
    loaded.map((l) => ({
      ...l,
      snippets: l.snippets.map((s) =>
        s.id === id ? { ...s, fields: { ...s.fields, ...fields } as Record<string, string>, text: fields.body ?? s.text } : s,
      ),
    }));
  const rulesFor = (fields: Record<string, string>, id = target) =>
    lint(cloneWith(id, fields))
      .errors.filter((e) => e.id === id)
      .map((e) => e.rule);

  it('catches certainty, fear, health, money and the brief\'s banned words', () => {
    expect(rulesFor({ body: `${good} This will end well.` })).toContain('certainty');
    expect(rulesFor({ body: `${good} Fate is on your side.` })).toContain('certainty');
    expect(rulesFor({ body: `${good} A dangerous habit.` })).toContain('fear');
    expect(rulesFor({ body: `${good} A fatal mistake.` })).toContain('fear');
    expect(rulesFor({ body: `${good} Count every calorie.` })).toContain('health');
    expect(rulesFor({ body: `${good} Watch your diet.` })).toContain('health');
    expect(rulesFor({ body: `${good} A fine time to invest.` })).toContain('money');
    expect(rulesFor({ body: `${good} Do not borrow more.` })).toContain('money');
    expect(rulesFor({ headline: 'Not a bad luck day' })).toContain('fear');
  });

  it('checks the label and the length of every field', () => {
    expect(rulesFor({ label: 'AVOID IT' })).toContain('label');
    expect(rulesFor({ headline: 'One' })).toContain('length');
    expect(rulesFor({ headline: 'A headline that runs on past the eight word limit' })).toContain('length');
    expect(rulesFor({ link: 'trait' })).toContain('length');
  });

  it('lets buy and purchase through in the money facet only', () => {
    const money = 'year.caution.3.money.v2';
    expect(
      rulesFor({ body: 'A 3 year can make a small purchase feel like a mood fix. Wait a day and see whether the wish survives.' }, money),
    ).not.toContain('spending');
    expect(rulesFor({ body: `${good} Wait before you buy it.` })).toContain('spending');
  });

  it('holds AVOID to behaviors, wants a tendency and keeps headlines unique', () => {
    expect(rulesFor({ label: 'AVOID', body: `${good} Skip it today.` })).toContain('avoid-activity');
    expect(rulesFor({ label: 'AVOID', headline: 'Booking a trip' })).toContain('avoid-activity');
    expect(rulesFor({ body: 'A busy week of requests arrives. Say what you do within the day and stop there.' })).toContain('tendency');
    const other = cautions.find((s) => s.id === 'year.caution.3.work.v1')?.fields?.headline ?? '';
    const dup = lint(cloneWith(target, { headline: other }));
    expect(dup.errors.some((e) => e.rule === 'duplicate-headline' && e.id === target)).toBe(true);
  });
});

describe('releasing cautions', () => {
  const layers = buildLayers(loaded);

  it('carries every field into the released layer', () => {
    expect(layers.year.caution['5']?.money[0]).toEqual({
      label: 'GO EASY ON',
      headline: 'Big buys on a whim',
      body: 'A 5 year pulls toward novelty and quick exits. Before any purchase over your usual, wait 48 hours and see if you still want it.',
      link: "the 5's impulsiveness",
    });
  });

  it('validates against the schema, which rejects a wrong label or a missing field', () => {
    const validate = new Ajv({ allErrors: true, strict: false }).compile(allSchemas().year);
    expect(validate(layers.year)).toBe(true);
    const broken = JSON.parse(JSON.stringify(layers.year));
    broken.caution['5'].money[0].label = 'DANGER';
    expect(validate(broken)).toBe(false);
    broken.caution['5'].money[0].label = 'AVOID';
    delete broken.caution['5'].money[0].link;
    expect(validate(broken)).toBe(false);
  });
});

describe('the caution drafting prompt', () => {
  it("is the owner's brief, filled in for one slot", () => {
    const request = buildDraftRequest('day.caution.8.energy.v2');
    expect(request.expectId).toBe('day-8-energy-caution-2');
    expect(request.system).toContain("turn a number's theme into a short, practical nudge");
    expect(request.system).toContain('"AVOID" applies only to a behavior, never to a date');
    expect(request.system).toContain('Big buys on a whim');
    expect(request.system).toContain('REJECTED: "AVOID driving today');
    expect(request.system).toContain('Never drive tired, upset or impaired, on any day.');
    expect(request.system).toContain('For health, money or legal decisions, talk to a qualified person, not a number.');
    expect(request.user).toContain('- layer: day');
    expect(request.user).toContain('- number: 8');
    expect(request.user).toContain('- facet: energy');
    expect(request.user).toContain('- variant: 2');
    expect(request.user).toContain('Effort and follow-through');
    // The five other variants are listed, so none is repeated.
    expect(request.user.match(/^- \[(WATCH OUT|GO EASY ON|AVOID)\]/gm)).toHaveLength(5);
    expect(request.user).toContain('Pushing past your limit');
    const props = Object.keys((request.tool.input_schema as { properties: object }).properties);
    expect(props).toEqual(['id', 'label', 'headline', 'body', 'link_to_theme']);
  });

  it('returns the fields of a caution from the reply, and refuses a reply for another slot', async () => {
    const request = buildDraftRequest('year.caution.2.money.v1');
    const reply = {
      ok: true,
      status: 200,
      json: async () => ({
        content: [
          {
            type: 'tool_use',
            input: { id: 'year-2-money-caution-1', label: 'WATCH OUT', headline: ' A headline ', body: ' A body that may help. ', link_to_theme: " the 2's habit " },
          },
        ],
      }),
      text: async () => '',
    };
    const result = await callClaude(request, 'k', (async () => reply) as never);
    expect(result.id).toBe('year.caution.2.money.v1');
    expect(result.fields).toEqual({ label: 'WATCH OUT', headline: 'A headline', body: 'A body that may help.', link: "the 2's habit" });
    const wrong = { ...reply, json: async () => ({ content: [{ type: 'tool_use', input: { id: 'year.caution.2.money.v1', label: 'AVOID', headline: 'x', body: 'y', link_to_theme: 'z' } }] }) };
    await expect(callClaude(request, 'k', (async () => wrong) as never)).rejects.toThrow(/did not contain/);
  });
});

describe('editing a caution', () => {
  it('rewrites all of its fields by id', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ninefold-caution-'));
    try {
      cpSync(DATA_ROOT, dir, { recursive: true });
      const fields = { label: 'AVOID', headline: 'A new headline', body: 'A body that can help you pause before you act on a first idea.', link: 'the 1 pull' };
      setSnippetFields('day.caution.1.work.v1', fields, dir);
      const after = loadFamilies(dir)
        .flatMap((l) => l.snippets)
        .find((s) => s.id === 'day.caution.1.work.v1');
      expect(after?.fields).toEqual(fields);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reads a change to any field from the review sheet', () => {
    const header = 'id,family,words,status,text,label,headline,link';
    const csv = `${header}\r\nday.caution.1.work.v1,day.caution,12,edited,"A changed body, with a comma, that can help.",WATCH OUT,Changed headline,the 1 pull\r\n`;
    const result = importSheet(csv, true);
    expect(result.textChanged).toEqual(['day.caution.1.work.v1']);
  });
});
