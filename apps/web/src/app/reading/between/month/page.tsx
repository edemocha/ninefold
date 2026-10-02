'use client';

import { useMemo } from 'react';
import { composePairMonth, type Bank } from '@numerology/composer';
import { MONTH_NAMES, type YMD } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { BigNumber } from '@/components/number';
import { PairMonthTable, PairYearTable } from '@/components/pair-month-table';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

const HERE = '/reading/between/month';

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** One month, two people: both personal months, a calendar with both days on each date, and the year at a glance. */
export default function PairMonthPage() {
  const { profile, partner, view } = useProfile();
  const today = useToday();
  if (!profile || !partner || !today) return null;

  const year = view.my !== undefined && view.my >= 1900 && view.my <= 2200 ? view.my : today.year;
  const month = view.mo !== undefined && view.mo >= 1 && view.mo <= 12 ? view.mo : today.month;
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const isThisMonth = year === today.year && month === today.month;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">Personal month</p>
          <h3 className="text-3xl" data-testid="pair-month-title">
            {MONTH_NAMES[month - 1]} {year}
          </h3>
        </div>
        <div className="no-print flex items-center gap-2">
          <AppLink to={HERE} view={{ my: prev.year, mo: prev.month }} className="btn-quiet" aria-label={t('month.prev')}>
            <Icon name="left" size={16} />
          </AppLink>
          {!isThisMonth ? (
            <AppLink to={HERE} view={{ my: null, mo: null }} className="btn-quiet">
              This month
            </AppLink>
          ) : null}
          <AppLink to={HERE} view={{ my: next.year, mo: next.month }} className="btn-quiet" aria-label={t('month.next')}>
            <Icon name="right" size={16} />
          </AppLink>
        </div>
      </div>

      <LayerGate layers={['month', 'day']}>{(bank) => <PairMonthView bank={bank} year={year} month={month} today={today} />}</LayerGate>
    </div>
  );
}

function PairMonthView({ bank, year, month, today }: { bank: Bank; year: number; month: number; today: YMD }) {
  const { profile, partner, partnerLabel: otherName, conventions } = useProfile();
  const reading = useMemo(
    () => composePairMonth(bank, profile!.birth, partner!.birth, year, month, conventions, otherName),
    [bank, profile, partner, year, month, conventions, otherName],
  );

  return (
    <div className="space-y-10" data-testid="pair-month">
      <div className="grid gap-4 md:grid-cols-2">
        {reading.sides.map((side) => (
          <article key={side.who} className={`card card-hue hue-${side.personalMonth.root} space-y-3 p-6`} data-testid={`pair-month-${side.who}`}>
            <p className="eyebrow">{side.label}</p>
            <p aria-label={`Personal month ${side.display}`}>
              <BigNumber result={side.personalMonth} className="text-7xl" />
            </p>
            <p className="text-sm text-muted">{cap(side.context)}.</p>
            {side.theme ? (
              <p className="reading leading-relaxed" data-bank="true">
                {side.theme.text}
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <section aria-labelledby="pair-calendar-heading" className="space-y-4">
        <h3 id="pair-calendar-heading" className="section-title">
          Calendar
        </h3>
        <p className="max-w-[62ch] text-sm text-muted">{t('between.month.intro')}</p>
        <PairMonthTable days={reading.days} year={year} month={month} today={today} otherLabel={otherName} />
      </section>

      <section aria-labelledby="pair-year-heading" className="space-y-4">
        <h3 id="pair-year-heading" className="section-title">
          {year} at a glance
        </h3>
        <PairYearTable rows={reading.yearTable} year={year} otherLabel={otherName} currentMonth={year === today.year ? today.month : 0} />
      </section>
    </div>
  );
}
