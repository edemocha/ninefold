'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { daysInMonth, sameYMD, WEEKDAY_NAMES, MONTH_NAMES, type YMD } from '@numerology/engine';
import type { MonthReading } from '@numerology/composer';

/** First day of the week from the visitor's locale: 0 is Sunday, 1 is Monday. */
export function localeFirstDay(): number {
  try {
    const locale = new Intl.Locale(navigator.language) as Intl.Locale & {
      weekInfo?: { firstDay: number };
      getWeekInfo?: () => { firstDay: number };
    };
    const info = locale.getWeekInfo ? locale.getWeekInfo() : locale.weekInfo;
    if (info) return info.firstDay % 7;
  } catch {
    // fall through
  }
  return 1;
}

/**
 * A keyboard-operable calendar of personal days. One cell is in the tab order;
 * arrow keys move between days, Page Up and Page Down change month.
 */
export function MonthGrid({
  reading,
  today,
  onOpen,
  onMonth,
  focusDay,
}: {
  reading: MonthReading;
  today: YMD | null;
  onOpen: (date: YMD) => void;
  onMonth: (delta: number, day?: number) => void;
  /** Set when the month changed by keyboard, so focus lands on the right day. */
  focusDay?: number | null;
}) {
  const [first, setFirst] = useState(1);
  useEffect(() => setFirst(localeFirstDay()), []);

  const start = today && today.year === reading.year && today.month === reading.month ? today.day : 1;
  const [focus, setFocus] = useState(start);
  const [moved, setMoved] = useState(false);
  useEffect(() => {
    setFocus(focusDay ?? start);
    setMoved(focusDay != null);
  }, [start, focusDay, reading.year, reading.month]);

  const last = daysInMonth(reading.year, reading.month);
  const refs = useRef<Record<number, HTMLButtonElement | null>>({});
  useEffect(() => {
    if (moved) refs.current[focus]?.focus();
  }, [focus, moved]);

  const weeks = useMemo(() => {
    const lead = (((reading.days[0]?.weekday ?? 0) - first) % 7 + 7) % 7;
    const cells: (typeof reading.days[number] | null)[] = [...Array<null>(lead).fill(null), ...reading.days];
    while (cells.length % 7 !== 0) cells.push(null);
    return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [reading.days, first]);

  const headers = Array.from({ length: 7 }, (_, i) => (first + i) % 7);

  function onKeyDown(e: KeyboardEvent<HTMLTableElement>) {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let next: number | null = null;
    if (e.key in deltas) next = focus + (deltas[e.key] as number);
    else if (e.key === 'Home') next = focus - ((((reading.days[focus - 1]?.weekday ?? 0) - first) % 7) + 7) % 7;
    else if (e.key === 'End') next = focus + (6 - ((((reading.days[focus - 1]?.weekday ?? 0) - first) % 7) + 7) % 7);
    else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault();
      onMonth(e.key === 'PageUp' ? -1 : 1, focus);
      return;
    }
    if (next === null) return;
    e.preventDefault();
    if (next < 1) onMonth(-1, daysInMonth(reading.month === 1 ? reading.year - 1 : reading.year, reading.month === 1 ? 12 : reading.month - 1) + next);
    else if (next > last) onMonth(1, next - last);
    else {
      setMoved(true);
      setFocus(next);
    }
  }

  return (
    <table
      role="grid"
      aria-label={`${MONTH_NAMES[reading.month - 1]} ${reading.year}, personal day for each date`}
      className="w-full table-fixed border-separate border-spacing-1.5"
      onKeyDown={onKeyDown}
      data-testid="month-grid"
    >
      <thead>
        <tr>
          {headers.map((wd) => (
            <th key={wd} scope="col" className="pb-1 text-center font-mono text-[0.7rem] font-normal uppercase tracking-wider text-muted">
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
              if (!cell) return <td key={i} role="presentation" />;
              const isToday = today ? sameYMD(today, cell.date) : false;
              const label = `${WEEKDAY_NAMES[cell.weekday]} ${cell.date.day} ${MONTH_NAMES[cell.date.month - 1]} ${cell.date.year}, personal day ${cell.personalDay}${cell.loopStart ? ', starts a new nine-day loop' : ''}${isToday ? ', today' : ''}`;
              return (
                <td key={i} role="gridcell" className="p-0">
                  <button
                    type="button"
                    ref={(el) => {
                      refs.current[cell.date.day] = el;
                    }}
                    tabIndex={cell.date.day === focus ? 0 : -1}
                    aria-label={label}
                    aria-current={isToday ? 'date' : undefined}
                    onFocus={() => setFocus(cell.date.day)}
                    onClick={() => onOpen(cell.date)}
                    className={`tint-${cell.personalDay} hue-${cell.personalDay} relative flex aspect-square w-full flex-col items-center justify-center rounded-lg border text-ink-strong transition-transform hover:scale-[1.03] active:scale-[0.98] ${isToday ? 'border-[3px] border-[var(--gold)]' : 'border-line'} ${cell.loopStart ? 'outline outline-2 outline-offset-2 outline-[var(--primary)]' : ''}`}
                  >
                    <span className="absolute left-1.5 top-1 font-mono text-[0.65rem] text-muted">{cell.date.day}</span>
                    <span className="numeral numeral-hue text-2xl sm:text-3xl">{cell.personalDay}</span>
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
