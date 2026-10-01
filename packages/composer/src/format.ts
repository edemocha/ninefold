import { MONTH_NAMES, WEEKDAY_NAMES, formatNumber, weekday, type Result, type YMD } from '@numerology/engine';

/** "a" or "an", by the first letter of the word that follows. */
export function article(next: string): 'a' | 'an' {
  return /^[aeio]/i.test(next) ? 'an' : 'a';
}

export function withArticle(next: string): string {
  return `${article(next)} ${next}`;
}

export function ordinal(n: number): string {
  return ['first', 'second', 'third', 'fourth'][n - 1] ?? `${n}th`;
}

export function agesText(ageFrom: number, ageTo: number | null): string {
  return ageTo === null ? `from age ${ageFrom}` : `ages ${ageFrom} to ${ageTo}`;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Thursday 1 Oct 2026". */
export function dateLabel(d: YMD): string {
  return `${WEEKDAY_NAMES[weekday(d)]} ${d.day} ${SHORT_MONTHS[d.month - 1]} ${d.year}`;
}

export function longDateLabel(d: YMD): string {
  return `${d.day} ${MONTH_NAMES[d.month - 1]} ${d.year}`;
}

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * How a number is shown: "7", "11/2", or for a cycle that carries an overtone,
 * "4 (22 overtone)". Never a bare master.
 */
export function displayNumber(r: Result): string {
  if (r.overtone) return `${r.value} (${r.overtone} overtone)`;
  return formatNumber(r);
}
