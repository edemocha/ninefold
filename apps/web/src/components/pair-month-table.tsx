'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PairMonthDay, PairMonthRow } from '@numerology/composer';
import { sameYMD, WEEKDAY_NAMES, MONTH_NAMES, type YMD } from '@numerology/engine';
import { AppLink } from './app-link';
import { NumberChip } from './cycle-strip';
import { localeFirstDay } from './month-grid';
import { rootOf } from '@/lib/site';
import { t } from '@/lib/t';

/**
 * A month as a calendar with both people's personal day on each date: yours on
 * the left, theirs on the right. Each date is a link that opens both days.
 */
export function PairMonthTable({
  days,
  year,
  month,
  today,
  otherLabel,
}: {
  days: PairMonthDay[];
  year: number;
  month: number;
  today: YMD | null;
  otherLabel: string;
}) {
  const [first, setFirst] = useState(1);
  useEffect(() => setFirst(localeFirstDay()), []);

  const weeks = useMemo(() => {
    const lead = (((days[0]?.weekday ?? 0) - first) % 7 + 7) % 7;
    const cells: (PairMonthDay | null)[] = [...Array<null>(lead).fill(null), ...days];
    while (cells.length % 7 !== 0) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [days, first]);
  const headers = Array.from({ length: 7 }, (_, i) => (first + i) % 7);

  return (
    <table className="w-full table-fixed border-separate border-spacing-1.5" data-testid="pair-month-table">
      <caption className="sr-only">
        {MONTH_NAMES[month - 1]} {year}: your personal day and {otherLabel}&apos;s for each date
      </caption>
      <thead>
        <tr>
          {headers.map((wd) => (
            <th key={wd} scope="col" className="pb-1 text-center text-xs font-semibold text-muted">
              <abbr title={WEEKDAY_NAMES[wd]} className="no-underline">
                {(WEEKDAY_NAMES[wd] as string).slice(0, 3)}
              </abbr>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, w) => (
          <tr key={w}>
            {week.map((cell, i) => {
              if (!cell) return <td key={i} />;
              const isToday = today ? sameYMD(today, cell.date) : false;
              const label = `${WEEKDAY_NAMES[cell.weekday]} ${cell.date.day} ${MONTH_NAMES[cell.date.month - 1]} ${cell.date.year}: you are on day ${cell.you}, ${otherLabel} is on day ${cell.other}${isToday ? ', today' : ''}. Open both days.`;
              return (
                <td key={i} className="p-0">
                  <AppLink
                    to="/reading/between/days"
                    view={{ dt: cell.date }}
                    aria-label={label}
                    aria-current={isToday ? 'date' : undefined}
                    className={`tile relative flex min-h-16 w-full flex-col overflow-hidden border-[3px] bg-surface-2 text-ink-strong ${isToday ? 'border-ink-strong' : 'border-transparent'}`}
                  >
                    <span className="px-2 pt-1 font-mono text-[0.65rem] text-muted">{cell.date.day}</span>
                    <span className="mt-auto grid grid-cols-2">
                      <span className={`hue-${rootOf(cell.you)} bg-hue-b py-1 text-center font-display text-xl font-extrabold sm:text-2xl`}>{cell.you}</span>
                      <span className={`hue-${rootOf(cell.other)} bg-hue-b py-1 text-center font-display text-xl font-extrabold sm:text-2xl`}>{cell.other}</span>
                    </span>
                  </AppLink>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The twelve months of a year, both people, each with its one-word tile. */
export function PairYearTable({ rows, year, otherLabel, currentMonth }: { rows: PairMonthRow[]; year: number; otherLabel: string; currentMonth: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[20rem] border-separate border-spacing-y-1.5 text-left" data-testid="pair-year-table">
        <caption className="sr-only">
          {t('between.month.yearCaption')}, {year}
        </caption>
        <thead>
          <tr className="text-sm font-semibold text-muted">
            <th scope="col" className="px-4 pb-1 font-semibold">
              Month
            </th>
            <th scope="col" className="px-4 pb-1 font-semibold">
              You
            </th>
            <th scope="col" className="px-4 pb-1 font-semibold">
              {otherLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const current = row.month === currentMonth;
            return (
              <tr key={row.month} aria-current={current ? 'true' : undefined}>
                <th scope="row" className={`rounded-l-2xl px-4 py-2 text-sm font-medium ${current ? 'bg-ink-strong text-white' : 'bg-surface-2 text-ink-strong'}`}>
                  {row.name}
                  {current ? <span className="ml-2 chip chip-info">{t('between.now')}</span> : null}
                </th>
                <td className={`px-4 py-2 ${current ? 'bg-ink-strong text-white' : 'bg-surface-2'}`}>
                  <NumberChip value={row.you.value} className="mr-2" />
                  <span className={`text-sm ${current ? 'text-white' : 'text-muted'}`}>{row.you.tile}</span>
                </td>
                <td className={`rounded-r-2xl px-4 py-2 ${current ? 'bg-ink-strong text-white' : 'bg-surface-2'}`}>
                  <NumberChip value={row.other.value} className="mr-2" />
                  <span className={`text-sm ${current ? 'text-white' : 'text-muted'}`}>{row.other.tile}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
