import { birthdayIn, compareYMD, monthName } from './calendar';
import { combineDate } from './dates';
import { chainText, digitalRoot, finish, reduceChain } from './reduce';
import type { Conventions, Result, Step, YMD } from './types';

/**
 * The year a personal-year cycle is counted from on `date`.
 * Calendar mode: the calendar year. Birthday mode: the year of the most
 * recent birthday, so 1 January to the day before the birthday still belongs
 * to the previous cycle.
 */
export function cycleYearOn(birth: YMD, date: YMD, c: Pick<Conventions, 'cycleYear' | 'leapBirthday'>): number {
  if (c.cycleYear === 'calendar') return date.year;
  return compareYMD(date, birthdayIn(birth, date.year, c)) >= 0 ? date.year : date.year - 1;
}

/**
 * Personal year: birth month + birth day + the cycle year, under the date rule.
 * `year` is the cycle year: the calendar year, or under 'birthday' the year in
 * which the cycle starts on the birthday.
 */
export function personalYear(birth: YMD, year: number, c: Conventions): Result {
  const { chain, steps } = combineDate(
    { year, month: birth.month, day: birth.day },
    c.dateRule,
    ['month', 'day', 'year'],
  );
  const raw = chain[chain.length - 1] as number;
  const root = digitalRoot(raw);
  const out: Step[] = [...steps];

  if (raw === 11 || raw === 22 || raw === 33) {
    if (c.cycleMasters === 'keep') {
      out.push({ label: 'Master', text: `${raw} is kept as a master number (root ${root}).` });
      return finish(chain, out);
    }
    if (c.cycleMasters === 'overtone') {
      out.push({
        label: 'Overtone',
        text: `${raw} reduces to ${root}. The ${root} drives the reading; the ${raw} is noted as an overtone.`,
      });
      return finish(chain, out, { value: root, overtone: raw, extraChain: [root] });
    }
    out.push({ label: 'Single digit', text: `${raw} reduces to ${root}.` });
    return finish(chain, out, { value: root, extraChain: [root] });
  }
  return finish(chain, out);
}

/** Personal month for the calendar month that contains `date`. */
export function personalMonthOn(birth: YMD, date: YMD, c: Conventions): Result {
  const cycle = cycleYearOn(birth, date, c);
  const py = personalYear(birth, cycle, c);
  const total = py.root + date.month;
  const chain = reduceChain(total, []);
  const steps: Step[] = [
    { label: 'Personal year', text: py.overtone || py.value > 9 ? `${py.overtone ?? py.value} counts as ${py.root}` : String(py.value) },
    { label: 'Month', text: `${monthName(date.month)} = ${date.month}` },
    { label: 'Add', text: `${py.root} + ${date.month} = ${total}` },
    { label: 'Reduce', text: chainText(chain) },
  ];
  return finish(chain, steps);
}

/**
 * Personal month for a calendar month. Under 'birthday' the cycle year in force
 * on the first of the month is used; personalMonthOn is exact for a single day.
 */
export function personalMonth(birth: YMD, year: number, month: number, c: Conventions): Result {
  return personalMonthOn(birth, { year, month, day: 1 }, c);
}

export function personalDay(birth: YMD, date: YMD, c: Conventions): Result {
  const pm = personalMonthOn(birth, date, c);
  const total = pm.value + date.day;
  const chain = reduceChain(total, []);
  const steps: Step[] = [
    { label: 'Personal month', text: String(pm.value) },
    { label: 'Day of the month', text: String(date.day) },
    { label: 'Add', text: `${pm.value} + ${date.day} = ${total}` },
    { label: 'Reduce', text: chainText(chain) },
  ];
  return finish(chain, steps);
}

/**
 * Personal day number without building steps. Every date rule keeps the same
 * digital root, so the personal day is (birth month + birth day + cycle year +
 * month + day) reduced to a digit, whatever the rule. The variant walk calls
 * this about 46,000 times, so it allocates nothing.
 */
export function personalDayNumber(birth: YMD, date: YMD, c: Pick<Conventions, 'cycleYear' | 'leapBirthday'>): number {
  const cycle = cycleYearOn(birth, date, c);
  return digitalRoot(birth.month + birth.day + cycle + date.month + date.day);
}
