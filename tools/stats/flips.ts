import {
  PYTHAGOREAN_CONVENTIONS, fromOrdinal, lifePath, personalYear, toOrdinal, daysInMonth,
  type Conventions, type DateRule, type YMD,
} from '@numerology/engine';

const rules: DateRule[] = ['A', 'A2', 'B', 'C'];
const conv = (dateRule: DateRule, extra: Partial<Conventions> = {}): Conventions => ({ ...PYTHAGOREAN_CONVENTIONS, dateRule, ...extra });

// Life path over every birthday 1 Jan 1940 .. 31 Dec 2010.
const births: YMD[] = [];
for (let t = toOrdinal({ year: 1940, month: 1, day: 1 }); t <= toOrdinal({ year: 2010, month: 12, day: 31 }); t += 1) births.push(fromOrdinal(t));

export function lifePathFlips() {
  const rows: Record<string, number> = {};
  for (let i = 0; i < rules.length; i += 1) for (let j = i + 1; j < rules.length; j += 1) {
    const a = rules[i]!, b = rules[j]!;
    let diff = 0;
    for (const bd of births) if (lifePath(bd, conv(a)).value !== lifePath(bd, conv(b)).value) diff += 1;
    rows[`${a} vs ${b}`] = +(100 * diff / births.length).toFixed(1);
  }
  const share = (rule: DateRule, v: number) => +(100 * births.filter((bd) => lifePath(bd, conv(rule)).value === v).length / births.length).toFixed(1);
  return { n: births.length, rows, lp33: { A: share('A', 33), A2: share('A2', 33), B: share('B', 33) }, lp2: { A: share('A', 2), B: share('B', 2) } };
}

// Personal year: 366 birthdays x years 2020..2040, masters kept.
export function personalYearFlips() {
  const bdays: { month: number; day: number }[] = [];
  for (let m = 1; m <= 12; m += 1) for (let d = 1; d <= daysInMonth(2024, m); d += 1) bdays.push({ month: m, day: d });
  const rows: Record<string, number> = {};
  for (let i = 0; i < rules.length; i += 1) for (let j = i + 1; j < rules.length; j += 1) {
    const a = rules[i]!, b = rules[j]!;
    let diff = 0, n = 0;
    for (const bd of bdays) for (let y = 2020; y <= 2040; y += 1) {
      const birth = { year: 1990, ...bd };
      n += 1;
      if (personalYear(birth, y, conv(a, { cycleMasters: 'keep' })).value !== personalYear(birth, y, conv(b, { cycleMasters: 'keep' })).value) diff += 1;
    }
    rows[`${a} vs ${b}`] = +(100 * diff / n).toFixed(1);
  }
  return { n: bdays.length * 21, rows };
}

console.log(JSON.stringify({ lifePath: lifePathFlips(), personalYear: personalYearFlips() }, null, 1));
