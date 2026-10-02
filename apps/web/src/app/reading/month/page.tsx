'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { composeMonth } from '@numerology/composer';
import { MONTH_NAMES, type YMD } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { MonthGrid } from '@/components/month-grid';
import { CautionPanel } from '@/components/caution-panel';
import { BigNumber, ConventionChips, WhyThisNumber } from '@/components/number';
import { RhythmRing } from '@/components/rhythm-ring';
import { Sections } from '@/components/sections';
import { hrefWith } from '@/lib/hash';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export default function MonthPage() {
  const { profile, conventions, hash, view, setView } = useProfile();
  const router = useRouter();
  const today = useToday();
  const [pendingDay, setPendingDay] = useState<number | null>(null);
  if (!profile || !today) return null;

  const year = view.my !== undefined && view.my >= 1900 && view.my <= 2200 ? view.my : today.year;
  const month = view.mo !== undefined && view.mo >= 1 && view.mo <= 12 ? view.mo : today.month;
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const isThisMonth = year === today.year && month === today.month;

  const open = (date: YMD) => {
    setView({ dt: date });
    router.push(hrefWith('/reading/day', hash));
  };
  const move = (delta: number, day?: number) => {
    const target = shiftMonth(year, month, delta);
    setPendingDay(day ?? null);
    setView({ my: target.year, mo: target.month });
  };

  return (
    <div className="space-y-10">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="eyebrow">Personal month</p>
          <h1 className="text-4xl sm:text-5xl" data-testid="month-title">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
        </div>
        <div className="no-print flex items-center gap-2">
          <AppLink to="/reading/month" view={{ my: prev.year, mo: prev.month }} className="btn-quiet" aria-label={t('month.prev')}>
            <Icon name="left" size={16} />
          </AppLink>
          {!isThisMonth ? (
            <AppLink to="/reading/month" view={{ my: null, mo: null }} className="btn-quiet">
              This month
            </AppLink>
          ) : null}
          <AppLink to="/reading/month" view={{ my: next.year, mo: next.month }} className="btn-quiet" aria-label={t('month.next')}>
            <Icon name="right" size={16} />
          </AppLink>
        </div>
      </header>

      <LayerGate layers={['month', 'day']}>
        {(bank) => {
          const reading = composeMonth(bank, profile.birth, year, month, conventions);
          const todayCell = reading.days.find((d) => d.date.year === today.year && d.date.month === today.month && d.date.day === today.day);
          const litDay = todayCell?.personalDay ?? reading.days[0]?.personalDay ?? 1;
          const split = reading.segments.length > 1 ? reading.segments[1] : null;
          return (
            <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
              <section aria-label="Calendar" className="space-y-5">
                <MonthGrid reading={reading} today={today} onOpen={open} onMonth={move} focusDay={pendingDay} />
                <p className="text-sm text-muted">
                  Tap a date to open its card. <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> move between days, <kbd>Page Up</kbd> and <kbd>Page Down</kbd> change month.
                </p>
                <div className="card-flat flex flex-wrap items-center gap-5 p-5">
                  <RhythmRing lit={litDay} size={140} label={`${t('reading.rhythm')}: ${isThisMonth ? 'today is' : 'the first of the month is'} day ${litDay}`} />
                  <div className="min-w-48 flex-1 space-y-2">
                    <h2 className="section-title">{t('reading.rhythm')}</h2>
                    <p className="text-sm text-muted">{t('reading.rhythmNote')}</p>
                    <p className="flex items-center gap-2 text-sm">
                      <span className="inline-block size-4 border border-line outline outline-2 outline-offset-2 outline-[var(--ink-strong)]" />
                      Outlined dates start a new loop.
                    </p>
                    <p className="flex items-center gap-2 text-sm">
                      <span className="inline-block size-4 border border-ink-strong bg-mark" />
                      Yellow marks today.
                    </p>
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className={`card card-hue hue-${reading.personalMonth.root} rise space-y-4 p-6`}>
                  <h2 className="section-title">Personal month</h2>
                  <p aria-label={`Personal month ${reading.display}`} data-testid="personal-month">
                    <BigNumber result={reading.personalMonth} className="text-8xl" />
                  </p>
                  <p className="text-sm text-muted">{reading.context.charAt(0).toUpperCase() + reading.context.slice(1)}.</p>
                  <ConventionChips kind="personalMonth" conventions={conventions} />
                  {split ? (
                    <p className="rounded-md bg-info-bg px-3 py-2 text-sm text-[color:var(--info-ink)]">
                      Your birthday falls on the {split.from.day}th, and the personal year changes then. From that day the month number is {split.personalMonth}.
                    </p>
                  ) : null}
                  <WhyThisNumber steps={reading.steps} chain={reading.personalMonth.chain} />
                </div>
              </aside>

              <div className="space-y-8 lg:col-span-2">
                <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
                  <Sections sections={reading.sections} />
                  {reading.monthYearLine ? <p className="reading card-flat self-start p-5 text-[1.02rem] leading-relaxed">{reading.monthYearLine.text}</p> : null}
                </div>
                <CautionPanel id="caution-month" title={t('caution.title.month')} cautions={reading.cautions} />
              </div>
            </div>
          );
        }}
      </LayerGate>
    </div>
  );
}

