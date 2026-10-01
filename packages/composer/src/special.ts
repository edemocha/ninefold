import { birthdayIn, daysInMonth, sameYMD, type Conventions, type YMD } from '@numerology/engine';

/**
 * The most notable calendar quality of a date, if any, as a key into the
 * day.special family. Priority: birthday, half-birthday, leap day, New Year's
 * Eve, mirror dates (month equals day), the 11th, the 22nd, month start, month end.
 */
export function specialDateKey(birth: YMD, date: YMD, c: Pick<Conventions, 'leapBirthday'>): string | undefined {
  if (sameYMD(birthdayIn(birth, date.year, c), date)) return 'birthday';

  const halfMonth = ((birth.month - 1 + 6) % 12) + 1;
  const halfDay = Math.min(birth.day, daysInMonth(date.year, halfMonth));
  if (date.month === halfMonth && date.day === halfDay) return 'half-birthday';

  if (date.month === 2 && date.day === 29) return 'leap-day';
  if (date.month === 12 && date.day === 31) return 'new-years-eve';
  if (date.month === date.day) return `mirror-${date.month}-${date.day}`;
  if (date.day === 11) return 'master-11th';
  if (date.day === 22) return 'master-22nd';
  if (date.day === 1) return 'month-start';
  if (date.day === daysInMonth(date.year, date.month)) return 'month-end';
  return undefined;
}
