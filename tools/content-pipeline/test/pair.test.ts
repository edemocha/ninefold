import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { allSchemas, expectedIds, FAMILIES, PAIR_KEYS, PAIR_SAFETY_LINES, RULES } from '@numerology/content';
import { buildLayers } from '../src/build';
import { buildDraftRequest } from '../src/draft';
import { parseId } from '../src/edit';
import { runPairGate } from '../src/gate';
import { lint } from '../src/lint';
import { loadFamilies, type LoadedFamily } from '../src/load';
import { composePairSnapshot, snapshotProfiles } from '../src/snapshot';

const loaded = loadFamilies();
const pairFamilies = loaded.filter((l) => l.family.layer === 'pair');
const pair = pairFamilies.flatMap((l) => l.snippets);

describe('Between us: the bank', () => {
  it('has five families and 172 snippets, every slot filled', () => {
    expect(FAMILIES.filter((f) => f.layer === 'pair').map((f) => f.id)).toEqual(['pair.core', 'pair.master', 'pair.rhythm', 'pair.lens', 'pair.type']);
    expect(PAIR_KEYS).toHaveLength(45);
    expect(pairFamilies.map((l) => l.snippets.length)).toEqual([135, 4, 15, 2, 16]);
    const present = new Set(pair.map((s) => s.id));
    expect(FAMILIES.filter((f) => f.layer === 'pair').flatMap(expectedIds).filter((id) => !present.has(id))).toEqual([]);
  });

  it('is lint clean, including the pair rules', () => {
    const report = lint(pairFamilies);
    expect(report.errors.map((e) => `${e.rule} ${e.id}: ${e.message}`)).toEqual([]);
  });

  it('ends every talk snippet and every type question on a question', () => {
    for (const s of pair.filter((x) => x.keys[x.keys.length - 1] === 'talk' || x.family === 'pair.type')) expect(s.text.trim().endsWith('?'), s.id).toBe(true);
    expect(pair.filter((x) => x.family === 'pair.type')).toHaveLength(16);
  });

  it('is released as its own layer that the schema accepts', () => {
    const layers = buildLayers(loaded);
    const validate = new Ajv({ allErrors: true, strict: false }).compile(allSchemas().pair);
    expect(validate(layers.pair), JSON.stringify(validate.errors?.slice(0, 2))).toBe(true);
    expect(Object.keys(layers.pair.core)).toEqual([...PAIR_KEYS]);

    const broken = JSON.parse(JSON.stringify(layers.pair));
    delete broken.core['3-7'].talk;
    expect(validate(broken)).toBe(false);
  });

  it('parses a pair id back into its family and keys', () => {
    expect(parseId('pair.core.3-7.meet')).toMatchObject({ keys: ['3-7', 'meet'] });
    expect(parseId('pair.master.both')?.family.id).toBe('pair.master');
    expect(parseId('pair.rhythm.4.use')?.family.id).toBe('pair.rhythm');
    expect(parseId('pair.lens.soulUrge')?.family.id).toBe('pair.lens');
    expect(parseId('pair.type.couple.q3')).toMatchObject({ keys: ['couple', 'q3'] });
    expect(parseId('pair.type.couple.q5')).toBeNull();
    expect(parseId('pair.core.7-3.meet')).toBeNull();
  });
});

describe('Between us: the opt-in lint rules', () => {
  const target = 'pair.core.3-7.meet';
  const filler =
    'A 3 tends to say it out loud and a 7 may think it over first, so the two of you can trade quickly or slowly and still get somewhere good together.';
  // Only the pair families are linted here: re-linting the whole bank for every case is slow and starves the timing tests.
  const cloneWith = (text: string): LoadedFamily[] =>
    pairFamilies.map((l) => ({ ...l, snippets: l.snippets.map((s) => (s.id === target ? { ...s, text } : s)) }));
  const rulesFor = (text: string) =>
    lint(cloneWith(text))
      .errors.filter((e) => e.id === target)
      .map((e) => e.rule);

  it('passes the plain filler', () => {
    expect(rulesFor(filler)).toEqual([]);
  });

  it.each([
    ['These two are compatible.', 'pairVerdict'],
    ['An incompatible pair.', 'pairVerdict'],
    ['A perfect match for each other.', 'pairVerdict'],
    ['They may be soulmates.', 'relationship'],
    ['A twin flame pair.', 'pairVerdict'],
    ['It feels meant to be.', 'pairVerdict'],
    ['A toxic mix.', 'pairVerdict'],
    ['A red flag early on.', 'pairVerdict'],
    ['They score well together.', 'pairVerdict'],
    ['A rating of 8 out of 10.', 'pairVerdict'],
    ['That is 85 percent.', 'pairVerdict'],
    ['The ideal pairing.', 'pairVerdict'],
    ['Your partner is quiet.', 'pairPerson'],
    ['Your husband may agree.', 'pairPerson'],
    ['Your girlfriend may agree.', 'pairPerson'],
    ['He may need quiet.', 'pairPerson'],
    ['She may need quiet.', 'pairPerson'],
    ['A narcissist may dominate.', 'pairPerson'],
    ['It can be abusive.', 'pairPerson'],
    ['You may be attracted to each other.', 'pairFeeling'],
    ['You may fall in love fast.', 'pairFeeling'],
  ])('flags "%s" as %s', (sentence, rule) => {
    expect(rulesFor(`${filler} ${sentence}`)).toContain(rule);
  });

  it('keeps the usual rules on pair text too', () => {
    expect(rulesFor(`${filler} You will always agree.`)).toContain('certainty');
    expect(rulesFor(`${filler} You should leave.`)).toContain('relationship');
    expect(rulesFor(`${filler} Mind your health.`)).toContain('health');
  });

  it('does not apply the pair rules to the rest of the bank', () => {
    const id = 'life.core.lifePath.4.strengths';
    const text =
      'You may notice a steady habit of careful work and plain talk with people close to you, and a wish to keep your days orderly. A partner may notice it too, and he may say so.';
    const lifePath = loaded.filter((l) => l.family.id === 'life.core.lifePath');
    const errors = lint(lifePath.map((l) => ({ ...l, snippets: l.snippets.map((s) => (s.id === id ? { ...s, text } : s)) })))
      .errors.filter((e) => e.id === id)
      .map((e) => e.rule);
    expect(errors).not.toContain('pairPerson');
    expect(errors).not.toContain('pairVerdict');
  });

  it('marks the pair groups opt in and the old groups not', () => {
    expect(RULES.filter((g) => g.optIn).map((g) => g.id)).toEqual(['pairVerdict', 'pairPerson', 'pairFeeling']);
    expect(RULES.filter((g) => !g.optIn).map((g) => g.id)).toContain('certainty');
  });
});

describe('Between us: fixed safety lines', () => {
  it('are fixed text, kept out of the bank, with no number in them', () => {
    expect(PAIR_SAFETY_LINES).toEqual([
      "Numbers can't tell you whether to begin, stay or leave. That is for you to decide.",
      'If you ever feel unsafe with someone, talk to a person you trust or a local support service.',
    ]);
    for (const line of PAIR_SAFETY_LINES) {
      expect(line).not.toMatch(/\d/);
      for (const s of loaded.flatMap((l) => l.snippets)) expect(s.text.includes(line), s.id).toBe(false);
    }
  });
});

describe('Between us: the drafting prompt', () => {
  it('carries the pair brief, both meaning sheets, the pair ban list and the question rule', () => {
    const request = buildDraftRequest('pair.core.3-7.talk');
    expect(request.system).toContain('Between us');
    expect(request.system).toContain('pairVerdict:');
    expect(request.system).toContain('pairPerson:');
    expect(request.system).toContain('compatib');
    expect(request.user).toContain('Expression and play');
    expect(request.user).toContain('Reflection and study');
    expect(request.user).toContain('must end on a question');
    expect(request.user).toContain('24 to 75 words');
    expect(request.user.match(/^- \(/gm)).toHaveLength(3);
    expect(request.tool.name).toBe('submit_snippet');
  });

  it('does not put the pair ban list in the prompt for the rest of the bank', () => {
    expect(buildDraftRequest('life.core.lifePath.8.shadow').system).not.toContain('pairVerdict:');
  });

  it('briefs a lens frame and a type question', () => {
    const lens = buildDraftRequest('pair.lens.soulUrge');
    expect(lens.user).toContain('soul urge');
    expect(lens.user).toContain('18 to 55 words');
    const question = buildDraftRequest('pair.type.family.q2');
    expect(question.user).toContain('question 2 of 4 for two people who are family');
    expect(question.user).toContain('must end on a question');
  });

  it('briefs a gap slot and a master overlay', () => {
    const rhythm = buildDraftRequest('pair.rhythm.3.use');
    expect(rhythm.user).toContain('a gap of 3 steps');
    expect(rhythm.user).toContain('practical way');
    const master = buildDraftRequest('pair.master.22');
    expect(master.user).toContain('a master 22 in a pair');
    expect(master.user).toContain('Building at scale');
  });
});

describe('Between us: gates and snapshots', () => {
  it('gate P1 passes and P2 fails until the owner approves the text', () => {
    expect(runPairGate(1).pass).toBe(true);
    const p2 = runPairGate(2);
    expect(p2.pass).toBe(false);
    expect(p2.checks.find((c) => c.name.startsWith('Every pair snippet'))?.pass).toBe(false);
    expect(p2.checks.find((c) => c.name === 'Pair lint is clean')?.pass).toBe(true);
  });

  it('snapshots 30 pairs, deterministically, with their sources', () => {
    const bank = buildLayers(loaded);
    const a = composePairSnapshot(bank);
    expect(a).toHaveLength(30);
    expect(composePairSnapshot(bank)).toEqual(a);
    expect(snapshotProfiles()).toHaveLength(30);
    expect(a[0]?.sources.some((s) => s.startsWith('pair.core.'))).toBe(true);
    expect(a[0]?.sources.some((s) => s.startsWith('pair.rhythm.'))).toBe(true);
  });

  it('shows the blast radius of a pair edit', () => {
    const bank = buildLayers(loaded);
    const before = composePairSnapshot(bank);
    const edited = JSON.parse(JSON.stringify(bank));
    const key = before[0]?.sources.find((s) => s.startsWith('pair.core.'))?.split('.')[2] as string;
    edited.pair.core[key].meet = 'A changed meeting text for this pair of numbers, written for the test.';
    const after = composePairSnapshot(edited);
    const changed = after.filter((e, i) => e.digest !== before[i]?.digest);
    expect(changed.length).toBeGreaterThan(0);
    expect(changed.every((e) => e.sources.includes(`pair.core.${key}.meet`))).toBe(true);
  });
});
