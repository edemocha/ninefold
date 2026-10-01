import type { Conventions, DateIssue, YMD } from './types';

/*
 * Dates are three integers. new Date("1985-06-17") parses as UTC midnight and
 * prints the 16th west of Greenwich, so nothing in the engine builds a Date
 * from a string. Day arithmetic uses the proleptic Gregorian "days from civil"
 * algorithm and never touches a time zone.
 */

export const MIN_BIRTH_YEAR = 1900;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function daysInMonth(year: number, month: number): number {
  return month === 2 && isLeapYear(year) ? 29 : (DAYS[month - 1] as number);
}

export function isValidYMD(d: YMD): boolean {
  return (
    Number.isInteger(d.year) &&
    Number.isInteger(d.month) &&
    Number.isInteger(d.day) &&
    d.month >= 1 &&
    d.month <= 12 &&
    d.day >= 1 &&
    d.day <= daysInMonth(d.year, d.month)
  );
}

export function compareYMD(a: YMD, b: YMD): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

export function sameYMD(a: YMD, b: YMD): boolean {
  return compareYMD(a, b) === 0;
}

/** Days since 1970-01-01. */
export function toOrdinal(d: YMD): number {
  const y = d.month <= 2 ? d.year - 1 : d.year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (d.month + (d.month > 2 ? -3 : 9)) + 2) / 5) + d.day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromOrdinal(ordinal: number): YMD {
  const z = ordinal + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor(
    (doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365,
  );
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  return { year: yoe + era * 400 + (month <= 2 ? 1 : 0), month, day };
}

export function addDays(d: YMD, n: number): YMD {
  return fromOrdinal(toOrdinal(d) + n);
}

/** 0 is Sunday. */
export function weekday(d: YMD): number {
  return (((toOrdinal(d) + 4) % 7) + 7) % 7;
}

/** The date on which the birthday is counted in `year`. 29 Feb births follow `leapBirthday`. */
export function birthdayIn(birth: YMD, year: number, c: Pick<Conventions, 'leapBirthday'>): YMD {
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(year)) {
    return c.leapBirthday === 'mar1'
      ? { year, month: 3, day: 1 }
      : { year, month: 2, day: 28 };
  }
  return { year, month: birth.month, day: birth.day };
}

/** Whole years completed on `date`. */
export function ageOn(birth: YMD, date: YMD, c: Pick<Conventions, 'leapBirthday'>): number {
  const birthday = birthdayIn(birth, date.year, c);
  return date.year - birth.year - (compareYMD(date, birthday) < 0 ? 1 : 0);
}

export function validateBirth(birth: YMD, today: YMD): DateIssue | null {
  if (!isValidYMD(birth)) {
    return { code: 'invalid', message: 'That date does not exist.' };
  }
  if (birth.year < MIN_BIRTH_YEAR) {
    return { code: 'before-1900', message: `Birth years before ${MIN_BIRTH_YEAR} are not supported.` };
  }
  if (compareYMD(birth, today) > 0) {
    return { code: 'future', message: 'A birth date cannot be in the future.' };
  }
  return null;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}
