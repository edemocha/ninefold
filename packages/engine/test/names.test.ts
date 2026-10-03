import { describe, expect, it } from 'vitest';
import {
  CHALDEAN_CONVENTIONS,
  DEFAULT_CONVENTIONS,
  PYTHAGOREAN_CONVENTIONS,
  isDefaultConventions,
  nameNumbers,
  normalizeName,
  parseConventions,
  serializeConventions,
  withTradition,
  type Conventions,
} from '../src';

const conv = (over: Partial<Conventions> = {}): Conventions => ({ ...PYTHAGOREAN_CONVENTIONS, ...over });

describe('name normalisation', () => {
  it('strips accents: José becomes JOSE', () => {
    expect(normalizeName('José', conv()).parts).toEqual(['JOSE']);
    expect(normalizeName('Zoë Müller-Åberg', conv()).parts).toEqual(['ZOE', 'MULLER', 'ABERG']);
  });

  it('drops apostrophes and punctuation, and treats hyphens as spaces', () => {
    expect(normalizeName("O'Brien", conv()).parts).toEqual(['OBRIEN']);
    expect(normalizeName('Mary-Jane Smith', conv()).parts).toEqual(['MARY', 'JANE', 'SMITH']);
    expect(normalizeName('J. R. R. Tolkien', conv()).parts).toEqual(['J', 'R', 'R', 'TOLKIEN']);
  });

  it('expands letters that do not decompose', () => {
    expect(normalizeName('Søren Straße', conv()).parts).toEqual(['SOREN', 'STRASSE']);
  });

  it('a one-word name is a single part and initials count as letters', () => {
    const one = nameNumbers('Cher', conv());
    expect(one.ok && one.parts).toEqual(['CHER']);
    const initials = nameNumbers('A B', conv());
    expect(initials.ok && initials.parts).toEqual(['A', 'B']);
  });

  it('includes particles by default and can ignore them, except the first word', () => {
    expect(normalizeName('Ahmad bin Ali', conv()).parts).toEqual(['AHMAD', 'BIN', 'ALI']);
    const ignored = normalizeName('Ahmad bin Ali', conv({ particles: 'ignore' }));
    expect(ignored.parts).toEqual(['AHMAD', 'ALI']);
    expect(ignored.droppedParticles).toEqual(['bin']);
    expect(normalizeName('Muthu a/l Raju', conv({ particles: 'ignore' })).parts).toEqual(['MUTHU', 'RAJU']);
    expect(normalizeName('Muthu a/l Raju', conv()).parts).toEqual(['MUTHU', 'AL', 'RAJU']);
    expect(normalizeName('Ludwig van der Berg', conv({ particles: 'ignore' })).parts).toEqual(['LUDWIG', 'BERG']);
    // A first word that looks like a particle is a name, not a particle.
    expect(normalizeName('Al Pacino', conv({ particles: 'ignore' })).parts).toEqual(['AL', 'PACINO']);
  });

  it('the particles switch changes the numbers', () => {
    const a = nameNumbers('Siti binti Ahmad', conv());
    const b = nameNumbers('Siti binti Ahmad', conv({ particles: 'ignore' }));
    expect(a.ok && b.ok).toBe(true);
    expect(a.parts).not.toEqual(b.parts);
  });

  it('refuses non-Latin names instead of transliterating', () => {
    const chinese = nameNumbers('李小龍', conv());
    expect(chinese.ok).toBe(false);
    expect(chinese.issues[0]?.code).toBe('non-latin');
    expect(nameNumbers('Анна', conv()).ok).toBe(false);
    expect(nameNumbers('محمد', conv()).ok).toBe(false);
  });

  it('has defined behaviour for empty input, symbols and emoji', () => {
    expect(nameNumbers('', conv()).issues[0]?.code).toBe('empty');
    expect(nameNumbers('   ', conv()).issues[0]?.code).toBe('empty');
    expect(nameNumbers('1234 !!!', conv()).issues[0]?.code).toBe('empty');
    const emoji = nameNumbers('Anna 😀', conv());
    expect(emoji.ok).toBe(true);
    expect(emoji.ok && emoji.parts).toEqual(['ANNA']);
    expect(emoji.issues.map((i) => i.code)).toContain('ignored-characters');
    expect(nameNumbers('x'.repeat(500), conv()).issues[0]?.code).toBe('too-long');
  });

  it('follows the Y rule', () => {
    // LYNN has no other vowel, so Y can be the vowel.
    const consonant = nameNumbers('Lynn', conv());
    const alone = nameNumbers('Lynn', conv({ yRule: 'vowel-if-alone' }));
    if (!consonant.ok || !alone.ok) throw new Error('rejected');
    expect(consonant.grid.letters.filter((l) => l.kind === 'vowel')).toHaveLength(0);
    expect(alone.grid.letters.filter((l) => l.kind === 'vowel').map((l) => l.letter)).toEqual(['Y']);
    // MARY has an A, so its Y stays a consonant either way.
    const mary = nameNumbers('Mary', conv({ yRule: 'vowel-if-alone' }));
    expect(mary.ok && mary.grid.letters.filter((l) => l.kind === 'vowel').map((l) => l.letter)).toEqual(['A']);
  });

  it('builds the grid, lessons, passion and subconscious self', () => {
    const p = nameNumbers('Amelia Rose Carter', conv());
    if (!p.ok) throw new Error('rejected');
    expect(p.grid.counts.slice(1)).toEqual([4, 1, 2, 1, 3, 1, 0, 0, 4]);
    expect(p.lessons).toEqual([7, 8]);
    expect(p.passion).toEqual([1, 9]); // a tie
    expect(p.passionCount).toBe(4);
    expect(p.subconscious.value).toBe(7);
  });

  it('reports ties for hidden passion', () => {
    const p = nameNumbers('Ab', conv());
    if (!p.ok) throw new Error('rejected');
    expect(p.passion).toEqual([1, 2]);
  });

  it('flags karmic debt when the unreduced total passes through it', () => {
    const ok = nameNumbers('Zed', conv()); // Z8 + E5 + D4 = 17 -> 8
    expect(ok.ok && ok.expression.karmicDebt).toBeUndefined();
    const debt = nameNumbers('Bad Ed', conv({ nameRule: 'whole-name' })); // B2 A1 D4 E5 D4 = 16 -> 7
    expect(debt.ok && debt.expression.karmicDebt).toBe(16);
    expect(debt.ok && debt.expression.value).toBe(7);
  });
});

describe('conventions in a link', () => {
  const chaldean = (over: Partial<Conventions> = {}): Conventions => ({ ...CHALDEAN_CONVENTIONS, ...over });

  it('makes Chaldean the default, with the switches that belong to it', () => {
    expect(DEFAULT_CONVENTIONS).toEqual(CHALDEAN_CONVENTIONS);
    expect(DEFAULT_CONVENTIONS).toMatchObject({ system: 'chaldean', dateRule: 'D', nameRule: 'whole-name', cycleMasters: 'single' });
  });

  it('round-trips only the switches that differ from the defaults', () => {
    expect(serializeConventions(DEFAULT_CONVENTIONS).toString()).toBe('');
    const c = chaldean({ dateRule: 'B', cycleYear: 'birthday', particles: 'ignore' });
    const q = serializeConventions(c);
    expect([...q.keys()].sort()).toEqual(['cy', 'dr', 'pt']);
    expect(parseConventions(q)).toEqual(c);
    expect(isDefaultConventions(c)).toBe(false);
    expect(isDefaultConventions(DEFAULT_CONVENTIONS)).toBe(true);
  });

  it('carries the whole Pythagorean choice in four short switches', () => {
    const q = serializeConventions(PYTHAGOREAN_CONVENTIONS);
    expect([...q.keys()].sort()).toEqual(['cm', 'dr', 'nr', 'sys']);
    expect(parseConventions(q)).toEqual(PYTHAGOREAN_CONVENTIONS);
  });

  it('switches the tradition together with the three switches that belong to it, and leaves the rest', () => {
    const mine = chaldean({ yRule: 'vowel-if-alone', particles: 'ignore', cycleYear: 'birthday', leapBirthday: 'mar1' });
    const pyth = withTradition(mine, 'pythagorean');
    expect(pyth).toMatchObject({ system: 'pythagorean', dateRule: 'A2', nameRule: 'per-part', cycleMasters: 'overtone' });
    expect(pyth).toMatchObject({ yRule: 'vowel-if-alone', particles: 'ignore', cycleYear: 'birthday', leapBirthday: 'mar1' });
    expect(withTradition(pyth, 'chaldean')).toEqual(mine);
  });

  it('ignores unknown values and never carries a name or a birth date', () => {
    const c = parseConventions(new URLSearchParams('dr=Z&nr=per-part&name=Ada&dob=1985-06-17'));
    expect(c.dateRule).toBe('D');
    expect(c.nameRule).toBe('per-part');
    expect(serializeConventions(c).toString()).toBe('nr=per-part');
  });
});
