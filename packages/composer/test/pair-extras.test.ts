import { beforeAll, describe, expect, it } from 'vitest';
import { cycleGap, PYTHAGOREAN_CONVENTIONS, lifePath, nameNumbers, personalYear, cycleYearOn, type Conventions, type YMD } from '@numerology/engine';
import { PAIR_TYPES, PAIR_LENSES, RULES } from '@numerology/content';
import { composeCircle, composeNamePair, composePair, composeTypeTalk, MAX_PEOPLE, PAIR_TYPE_TITLES, type Bank } from '../src';
import { loadSourceBank } from '../../../tools/content-pipeline/src/build';
import { loadFamilies } from '../../../tools/content-pipeline/src/load';

let bank: Bank;
let ids: Set<string>;
beforeAll(() => {
  bank = loadSourceBank();
  ids = new Set(loadFamilies().flatMap((l) => l.snippets.map((s) => s.id)));
});

const c: Conventions = { ...PYTHAGOREAN_CONVENTIONS };
const today: YMD = { year: 2026, month: 10, day: 1 };
const mod9 = (n: number) => ((n % 9) + 9) % 9;

describe('name numbers read as a pair', () => {
  const amelia = nameNumbers('Amelia Rose Carter', c);
  const david = nameNumbers('David', c);

  it('reads the expression and the soul urge, each with the same pair text a life path pair uses', () => {
    const [expression, soulUrge] = composeNamePair(bank, amelia, david, 'Dav');
    expect(expression?.lens).toBe('expression');
    expect(soulUrge?.lens).toBe('soulUrge');
    expect(expression?.title).toBe('Expression');
    expect(soulUrge?.title).toBe('Soul urge');

    // Amelia Rose Carter's expression is 1 (through 19) and DAVID's is 22, a master: the pair of 1 and 4, with a 22 note.
    expect(expression?.sides.map((s) => [s.label, s.display])).toEqual([
      ['You', '1'],
      ['Dav', '22/4'],
    ]);
    expect(expression?.key).toBe('1-4');
    expect(expression?.overlay).toBe('22');
    expect(expression?.numbers).toBe('a 1 and a 22/4');
    expect(expression?.overlayNote?.source).toBe('pair.master.22');

    // The same key gives the same text a life path pair would show.
    const a: YMD = { year: 1985, month: 6, day: 17 };
    const b: YMD = { year: 1990, month: 3, day: 14 }; // life path 9: pair 1-9 for a life path 1
    const viaLife = composePair(bank, a, b, today, c);
    const viaName = composeNamePair(bank, nameNumbers('Amelia Rose Carter', c), nameNumbers('Amelia Rose Carter', c))[0];
    expect(viaLife.key).toBe('1-9');
    expect(viaName?.sections.map((s) => s.id)).toEqual(['meet', 'stretch', 'talk']);
    expect(viaLife.sections.map((s) => s.id)).toEqual(['meet', 'stretch', 'talk']);
    expect(bank.pair?.core[expression?.key ?? '']?.meet).toBe(expression?.sections[0]?.text);
  });

  it('puts the lens frame from the bank above each', () => {
    const readings = composeNamePair(bank, amelia, david);
    expect(readings).toHaveLength(2);
    expect(readings[0]?.frame.text).toContain('Expression is what each of you brings');
    expect(readings[1]?.frame.text).toContain('Soul urge is what each of you wants underneath');
    for (const lens of PAIR_LENSES) expect(bank.pair?.lens[lens]?.length).toBeGreaterThan(40);
  });

  it('gives nothing when either name cannot be read, and carries only numbers and their arithmetic', () => {
    expect(composeNamePair(bank, amelia, nameNumbers('', c))).toEqual([]);
    expect(composeNamePair(bank, amelia, nameNumbers('张伟', c))).toEqual([]);
    expect(composeNamePair(bank, nameNumbers('', c), david)).toEqual([]);
    // The arithmetic shows each part's letters, as it does for the first person; the typed name never appears as one string.
    const json = JSON.stringify(composeNamePair(bank, amelia, nameNumbers('Zephyrine Quillfeather', c), 'Zeph'));
    expect(json.toLowerCase()).not.toContain('zephyrine quillfeather');
    expect(json.toLowerCase()).not.toContain('amelia rose carter');
    expect(JSON.parse(json)[0]).not.toHaveProperty('name');
  });

  it('names real snippets as its sources', () => {
    for (const r of composeNamePair(bank, amelia, david)) for (const source of r.sources) expect(ids.has(source), source).toBe(true);
  });

  it('keeps the pair rules: no verdicts or relationship types in the frames', () => {
    const patterns = RULES.filter((g) => g.optIn).flatMap((g) => g.patterns);
    for (const lens of PAIR_LENSES) for (const p of patterns) expect(bank.pair?.lens[lens]?.match(p)?.[0]).toBeUndefined();
  });
});

describe('questions for a kind of relationship', () => {
  it('has four questions for each of four kinds, each ending on a question', () => {
    expect(PAIR_TYPES).toEqual(['friends', 'family', 'colleagues', 'couple']);
    for (const type of PAIR_TYPES) {
      const talk = composeTypeTalk(bank, type);
      expect(talk?.title).toBe(PAIR_TYPE_TITLES[type]);
      expect(talk?.questions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
      for (const q of talk?.questions ?? []) {
        expect(q.text.endsWith('?'), q.source).toBe(true);
        expect(ids.has(q.source), q.source).toBe(true);
      }
    }
  });

  it('differs between kinds, and changes nothing else about a pair', () => {
    const texts = PAIR_TYPES.map((t) => composeTypeTalk(bank, t)?.questions.map((q) => q.text).join('|'));
    expect(new Set(texts).size).toBe(4);
    const a: YMD = { year: 1985, month: 6, day: 17 };
    const b: YMD = { year: 1988, month: 11, day: 2 };
    // composePair takes no relationship type at all, so a type cannot alter what is said about the numbers.
    expect(composePair(bank, a, b, today, c).sections.map((s) => s.text)).toEqual(composePair(bank, a, b, today, c).sections.map((s) => s.text));
  });
});

describe('a circle of up to five', () => {
  const births: YMD[] = [
    { year: 1985, month: 6, day: 17 },
    { year: 1988, month: 11, day: 2 },
    { year: 1960, month: 2, day: 29 },
    { year: 2014, month: 3, day: 10 },
    { year: 1999, month: 12, day: 31 },
  ];
  const labels = ['You', 'Sam', 'Person 3', 'Kit', 'Ro'];
  const lifePaths = births.map((b) => lifePath(b, c));

  it('says how many people at most', () => {
    expect(MAX_PEOPLE).toBe(5);
  });

  it('puts everyone on the nine-number ring and agrees with the pair gap', () => {
    const circle = composeCircle(births, labels, lifePaths, today, c);
    expect(circle.members.map((m) => [m.letter, m.label])).toEqual([
      ['A', 'You'],
      ['B', 'Sam'],
      ['C', 'Person 3'],
      ['D', 'Kit'],
      ['E', 'Ro'],
    ]);
    // Amelia is in a year 6 and Sam in a year 5, as in the pair view.
    expect([circle.members[0]?.year, circle.members[1]?.year]).toEqual([6, 5]);
    expect(circle.distances[0]?.[1]).toBe(1);
    expect(circle.forwards[0]?.[1]).toBe(cycleGap(births[0] as YMD, births[1] as YMD, today, c).forward);
    expect(circle.ring).toHaveLength(9);
    expect(circle.ring.flatMap((r) => r.letters).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(circle.ring[5]?.letters).toContain('A'); // year 6
    expect(circle.members[0]?.display).toBe('1');
    expect(circle.approx).toBe(false);
  });

  it('is symmetric, and every gap equals the two gaps going round (mod 9)', () => {
    const circle = composeCircle(births, labels, lifePaths, today, c);
    const n = births.length;
    for (let i = 0; i < n; i += 1) {
      expect(circle.distances[i]?.[i]).toBe(0);
      for (let j = 0; j < n; j += 1) {
        expect(circle.distances[i]?.[j]).toBe(circle.distances[j]?.[i]);
        if (i !== j) expect(mod9((circle.forwards[i]?.[j] ?? 0) + (circle.forwards[j]?.[i] ?? 0))).toBe(0);
        for (let k = 0; k < n; k += 1) {
          if (i === j || j === k || i === k) continue;
          expect(mod9((circle.forwards[i]?.[j] ?? 0) + (circle.forwards[j]?.[k] ?? 0))).toBe(circle.forwards[i]?.[k]);
        }
      }
    }
  });

  it("matches each person's own personal year, under either cycle convention", () => {
    for (const cycleYear of ['calendar', 'birthday'] as const) {
      const conv: Conventions = { ...c, cycleYear };
      const circle = composeCircle(births, labels, lifePaths, today, conv);
      births.forEach((b, i) => {
        expect(circle.members[i]?.year, `${cycleYear} ${i}`).toBe(personalYear(b, cycleYearOn(b, today, conv), conv).root);
      });
      expect(circle.approx).toBe(cycleYear === 'birthday');
    }
  });

  it('works for two people, and gives each a default label when none is given', () => {
    const circle = composeCircle(births.slice(0, 2), [], lifePaths.slice(0, 2), today, c);
    expect(circle.members.map((m) => m.label)).toEqual(['Person 1', 'Person 2']);
    expect(circle.distances).toEqual([
      [0, 1],
      [1, 0],
    ]);
  });
});
