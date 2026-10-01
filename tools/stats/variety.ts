import { DEFAULT_CONVENTIONS, variantIndexRange, daysInMonth, toOrdinal } from '@numerology/engine';

function minGap(V: number, years: [number, number], c = DEFAULT_CONVENTIONS) {
  let worst = Infinity; let worstBirth = '';
  for (let m = 1; m <= 12; m += 1) for (let d = 1; d <= daysInMonth(2024, m); d += 1) {
    const birth = { year: 1990, month: m, day: d };
    const days = variantIndexRange(birth, { year: years[0], month: 1, day: 1 }, { year: years[1], month: 12, day: 31 }, c);
    const last = new Map<string, number>();
    for (const x of days) {
      const key = `${x.personalDay}:${x.variantIndex % V}`;
      const t = toOrdinal(x.date);
      const prev = last.get(key);
      if (prev !== undefined && t - prev < worst) { worst = t - prev; worstBirth = `${m}/${d}`; }
      last.set(key, t);
    }
  }
  return { V, worst, worstBirth };
}
for (const V of [5, 6, 7, 12]) console.log(minGap(V, [2020, 2029]));
