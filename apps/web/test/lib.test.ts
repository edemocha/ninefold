import { describe, expect, it } from 'vitest';
import { DEFAULT_CONVENTIONS, personalDay, parseConventions, serializeConventions } from '@numerology/engine';
import { buildIcs, escapeIcsText, foldLine } from '../src/lib/ics';
import { hashWith, hrefWith, parseHash, parseYmdParam, ymdParam } from '../src/lib/hash';
import { localYMD, msUntilLocalMidnight, ymdAtOffset } from '../src/lib/today';
import { ALL_VALUES, PAIR_SLUGS, pairSlug } from '../src/lib/site';
import { t } from '../src/lib/t';

describe('calendar files', () => {
  it('escapes text the way RFC 5545 asks', () => {
    expect(escapeIcsText('a, b; c\\d\ne')).toBe('a\\, b\\; c\\\\d\\ne');
  });

  it('folds long lines at 75 octets and never splits a character', () => {
    const line = `SUMMARY:${'é'.repeat(80)}`;
    const folded = foldLine(line).split('\r\n');
    expect(folded.length).toBeGreaterThan(1);
    for (const part of folded) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.map((p, i) => (i === 0 ? p : p.slice(1))).join('')).toBe(line);
  });

  it('builds all-day events with CRLF endings and no personal data', () => {
    const ics = buildIcs(
      [
        { date: { year: 2026, month: 12, day: 31 }, summary: 'Day 8: Finish what you started.', description: 'Symbolic, for reflection.' },
        { date: { year: 2026, month: 1, day: 1 }, summary: 'Day 1' },
      ],
      'Personal days 2026',
      new Date('2026-10-01T12:34:56Z'),
    );
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTAMP:20261001T123456Z');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231');
    expect(ics).toContain('DTEND;VALUE=DATE:20270101'); // across the year end
    expect(ics).toContain('TRANSP:TRANSPARENT');
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
  });
});

describe('the visitor\'s own date', () => {
  // 23:59:59 on 31 October in UTC+14, which is 09:59:59 UTC and still 30 October in UTC-12.
  const instant = Date.UTC(2026, 9, 31, 9, 59, 59);
  const birth = { year: 1985, month: 6, day: 17 };

  it('flips at local midnight, not UTC midnight, in every zone from UTC+14 to UTC-12', () => {
    let zonesThatFlip = 0;
    for (let offset = -12; offset <= 14; offset += 1) {
      const localSecond = Math.floor(instant / 1000) + offset * 3600;
      const lastSecondOfDay = ((localSecond % 86_400) + 86_400) % 86_400 === 86_399;
      const before = ymdAtOffset(instant, offset * 60);
      const after = ymdAtOffset(instant + 1000, offset * 60);
      expect(before.day !== after.day, `UTC${offset >= 0 ? '+' : ''}${offset}`).toBe(lastSecondOfDay);
      if (lastSecondOfDay) zonesThatFlip += 1;
    }
    expect(zonesThatFlip).toBe(2); // UTC+14 and UTC-10 are both at midnight at this instant
    // At +14 the new day has arrived; at -12 it is still the day before.
    expect(ymdAtOffset(instant + 1000, 14 * 60)).toEqual({ year: 2026, month: 11, day: 1 });
    expect(ymdAtOffset(instant + 1000, -12 * 60)).toEqual({ year: 2026, month: 10, day: 30 });
  });

  it('gives different personal days either side of local midnight', () => {
    const before = personalDay(birth, ymdAtOffset(instant, 14 * 60), DEFAULT_CONVENTIONS).value;
    const after = personalDay(birth, ymdAtOffset(instant + 1000, 14 * 60), DEFAULT_CONVENTIONS).value;
    expect(before).toBe(personalDay(birth, { year: 2026, month: 10, day: 31 }, DEFAULT_CONVENTIONS).value);
    expect(after).toBe(personalDay(birth, { year: 2026, month: 11, day: 1 }, DEFAULT_CONVENTIONS).value);
    expect(after).not.toBe(before);
  });

  it('counts the time to the next local midnight', () => {
    const now = new Date(2026, 9, 31, 23, 59, 30);
    expect(msUntilLocalMidnight(now)).toBe(31_000);
    expect(msUntilLocalMidnight(new Date(2026, 9, 31, 0, 0, 0))).toBe(86_401_000);
    expect(localYMD(new Date(2026, 9, 31, 23, 59, 59))).toEqual({ year: 2026, month: 10, day: 31 });
  });
});

describe('the address fragment', () => {
  it('carries conventions and nothing else', () => {
    const c = { ...DEFAULT_CONVENTIONS, dateRule: 'B' as const, cycleYear: 'birthday' as const };
    const fragment = serializeConventions(c).toString();
    expect(fragment).toBe('dr=B&cy=birthday');
    expect(parseConventions(parseHash(fragment))).toEqual(c);
  });

  it('merges updates and drops empty values', () => {
    expect(hashWith('dr=B&who=current', { who: null, cy: 'birthday' })).toBe('dr=B&cy=birthday');
    expect(hrefWith('/reading/day', 'dr=B', {})).toBe('/reading/day#dr=B');
    expect(hrefWith('/reading/day', '', {})).toBe('/reading/day');
  });

  it('formats and reads a date for the picker', () => {
    expect(ymdParam({ year: 2026, month: 3, day: 5 })).toBe('2026-03-05');
    expect(parseYmdParam('2026-03-05')).toEqual({ year: 2026, month: 3, day: 5 });
    expect(parseYmdParam('nope')).toBeNull();
    expect(parseYmdParam(null)).toBeNull();
  });
});

describe('interface strings', () => {
  it('has the privacy sentence the end-to-end test enforces, word for word', () => {
    expect(t('privacy.line')).toBe('Calculated in your browser. Nothing is sent or saved.');
  });

  it('has the disclaimer word for word', () => {
    expect(t('disclaimer')).toBe(
      'Numerology is a symbolic tradition. There is no scientific evidence that it predicts events. Use it for reflection or fun, not for decisions about health, money, legal matters or relationships.',
    );
  });

  it('fills placeholders', () => {
    expect(t('reading.karmic', { debt: '19/1' })).toBe('Karmic debt 19/1');
    expect(t('reading.lifePathLine', { lifePath: '11/2' })).toBe('For your life path 11/2');
  });
});

describe('the public pair pages', () => {
  it('has one page for each pair of single digits, smaller number first, 45 in all', () => {
    expect(PAIR_SLUGS).toHaveLength(45);
    expect(new Set(PAIR_SLUGS).size).toBe(45);
    for (const slug of PAIR_SLUGS) {
      const [a, b] = slug.split('-').map(Number) as [number, number];
      expect(a).toBeGreaterThanOrEqual(1);
      expect(b).toBeLessThanOrEqual(9);
      expect(a).toBeLessThanOrEqual(b);
    }
    expect(PAIR_SLUGS[0]).toBe('1-1');
    expect(PAIR_SLUGS[44]).toBe('9-9');
  });

  it('sends two numbers in either order, and a master number by its root, to the same page', () => {
    expect(pairSlug(7, 3)).toBe('3-7');
    expect(pairSlug(3, 7)).toBe('3-7');
    expect(pairSlug(11, 9)).toBe('2-9');
    expect(pairSlug(22, 22)).toBe('4-4');
    expect(pairSlug(33, 1)).toBe('1-6');
  });

  it('has a page for every pair a visitor can pick from any of the twelve numbers', () => {
    for (const a of ALL_VALUES) for (const b of ALL_VALUES) expect(PAIR_SLUGS, `${a} and ${b}`).toContain(pairSlug(a, b));
  });

  it('names the header link for the public pages', () => {
    expect(t('nav.pairs')).toBe('Two numbers');
  });
});
