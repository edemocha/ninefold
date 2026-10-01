import { chainText, DATE_MASTERS, digitalRoot, finish, NAME_MASTERS, reduceChain, sumText } from './reduce';
import { monthName } from './calendar';
import type { Conventions, DateRule, Period, Result, Step, YMD } from './types';

export type DatePart = 'day' | 'month' | 'year';

type Combined = { chain: number[]; steps: Step[] };

function partLabel(part: DatePart): string {
  return part === 'day' ? 'Day' : part === 'month' ? 'Month' : 'Year';
}

/**
 * Adds a date under one of the four rules. `order` is the order the parts are
 * shown and added in. Every rule keeps the same digital root; they differ only
 * in which masters survive.
 */
export function combineDate(ymd: YMD, rule: DateRule, order: readonly DatePart[]): Combined {
  const raw: Record<DatePart, number> = { day: ymd.day, month: ymd.month, year: ymd.year };
  const steps: Step[] = [];

  if (rule === 'B') {
    const digits = order.flatMap((p) => String(raw[p]).split('').map(Number));
    const total = digits.reduce((a, b) => a + b, 0);
    steps.push({
      label: 'Flat digit sum',
      text: `${order.map((p) => `${p} ${raw[p]}`).join(', ')}: ${digits.join(' + ')} = ${total}`,
    });
    const chain = reduceChain(total, NAME_MASTERS);
    steps.push({ label: 'Reduce', text: chainText(chain, NAME_MASTERS) });
    return { chain, steps };
  }

  const keepMasters = rule === 'A';
  const masters = keepMasters ? NAME_MASTERS : [];
  const reduced: number[] = [];
  for (const part of order) {
    const chain = reduceChain(raw[part], masters);
    const value = chain[chain.length - 1] as number;
    reduced.push(value);
    const detail = `${part === 'month' ? `${monthName(ymd.month)}: ` : ''}${chainText(chain, masters)}`;
    steps.push({ label: partLabel(part), text: detail });
  }
  const total = reduced.reduce((a, b) => a + b, 0);
  steps.push({ label: 'Add', text: sumText(reduced) });
  const finalMasters = rule === 'A2' ? DATE_MASTERS : rule === 'A' ? NAME_MASTERS : [];
  const chain = reduceChain(total, finalMasters);
  steps.push({ label: 'Reduce', text: chainText(chain, finalMasters) });
  return { chain, steps };
}

export function lifePath(birth: YMD, c: Conventions): Result {
  const { chain, steps } = combineDate(birth, c.dateRule, ['day', 'month', 'year']);
  return finish(chain, steps, { debt: true });
}

/** Day of the month, reduced. 11 and 22 are kept. */
export function birthDay(birth: YMD): Result {
  const chain = reduceChain(birth.day, DATE_MASTERS);
  const steps: Step[] = [{ label: 'Day', text: chainText(chain, DATE_MASTERS) }];
  return finish(chain, steps, { debt: true });
}

/** Single-digit month, day and year, as every pinnacle and challenge uses them. */
function digitParts(birth: YMD): { month: number; day: number; year: number; steps: Step[] } {
  const single = (n: number): { value: number; text: string } => {
    const chain = reduceChain(n, []);
    return { value: chain[chain.length - 1] as number, text: chainText(chain) };
  };
  const month = single(birth.month);
  const day = single(birth.day);
  const year = single(birth.year);
  return {
    month: month.value,
    day: day.value,
    year: year.value,
    steps: [
      { label: 'Month', text: `${monthName(birth.month)}: ${month.text}` },
      { label: 'Day', text: day.text },
      { label: 'Year', text: year.text },
    ],
  };
}

/** The ages at which the four periods start, from the single-digit life path. */
function periodAges(lifePathRoot: number): [number, number | null][] {
  const p1End = 36 - lifePathRoot;
  return [
    [0, p1End],
    [p1End + 1, p1End + 9],
    [p1End + 10, p1End + 18],
    [p1End + 19, null],
  ];
}

function agesText(ageFrom: number, ageTo: number | null): string {
  return ageTo === null ? `from age ${ageFrom}` : `ages ${ageFrom} to ${ageTo}`;
}

export function pinnacles(birth: YMD, c: Conventions): Period[] {
  const parts = digitParts(birth);
  const ages = periodAges(lifePath(birth, c).root);

  const p1Chain = reduceChain(parts.month + parts.day, DATE_MASTERS);
  const p2Chain = reduceChain(parts.day + parts.year, DATE_MASTERS);
  const p1 = p1Chain[p1Chain.length - 1] as number;
  const p2 = p2Chain[p2Chain.length - 1] as number;
  const p3Chain = reduceChain(p1 + p2, DATE_MASTERS);
  const p4Chain = reduceChain(parts.month + parts.year, DATE_MASTERS);

  const rows: { expr: string; chain: number[] }[] = [
    { expr: `month ${parts.month} + day ${parts.day}`, chain: p1Chain },
    { expr: `day ${parts.day} + year ${parts.year}`, chain: p2Chain },
    { expr: `first pinnacle ${p1} + second pinnacle ${p2}`, chain: p3Chain },
    { expr: `month ${parts.month} + year ${parts.year}`, chain: p4Chain },
  ];

  return rows.map((row, i) => {
    const [ageFrom, ageTo] = ages[i] as [number, number | null];
    const value = row.chain[row.chain.length - 1] as number;
    const steps: Step[] = [
      ...(i === 0 ? parts.steps : []),
      { label: `Pinnacle ${i + 1}`, text: `${row.expr} = ${chainText(row.chain, DATE_MASTERS)}` },
      { label: 'Ages', text: agesText(ageFrom, ageTo) },
    ];
    return { n: (i + 1) as Period['n'], value, root: digitalRoot(value), ageFrom, ageTo, steps };
  });
}

export function challenges(birth: YMD, c: Conventions): Period[] {
  const parts = digitParts(birth);
  const ages = periodAges(lifePath(birth, c).root);
  const c1 = Math.abs(parts.month - parts.day);
  const c2 = Math.abs(parts.day - parts.year);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(parts.month - parts.year);
  const rows = [
    { value: c1, text: `|month ${parts.month} − day ${parts.day}| = ${c1}` },
    { value: c2, text: `|day ${parts.day} − year ${parts.year}| = ${c2}` },
    { value: c3, text: `|first challenge ${c1} − second challenge ${c2}| = ${c3}` },
    { value: c4, text: `|month ${parts.month} − year ${parts.year}| = ${c4}` },
  ];
  return rows.map((row, i) => {
    const [ageFrom, ageTo] = ages[i] as [number, number | null];
    return {
      n: (i + 1) as Period['n'],
      value: row.value,
      root: row.value,
      ageFrom,
      ageTo,
      steps: [
        ...(i === 0 ? parts.steps : []),
        { label: `Challenge ${i + 1}`, text: row.text },
        { label: 'Ages', text: agesText(ageFrom, ageTo) },
      ],
    };
  });
}

/** The period that covers `age`. */
export function periodAt(periods: readonly Period[], age: number): Period {
  const found = periods.find((p) => age >= p.ageFrom && (p.ageTo === null || age <= p.ageTo));
  return (found ?? periods[0]) as Period;
}
