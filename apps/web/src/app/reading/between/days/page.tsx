'use client';

import { useId, useMemo } from 'react';
import { composePairDay, type Bank } from '@numerology/composer';
import { addDays, isValidYMD, sameYMD, type YMD } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { BigNumber } from '@/components/number';
import { RhythmDuo } from '@/components/rhythm-duo';
import { parseYmdParam, ymdParam } from '@/lib/hash';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

const MIN = '1900-01-01';
const MAX = '2200-12-31';
const HERE = '/reading/between/days';

/** One date, two people: each person's own personal day, side by side. */
export default function PairDaysPage() {
  const { profile, partner, view, setView } = useProfile();
  const today = useToday();
  const pickerId = useId();
  if (!profile || !partner || !today) return null;

  const requested = view.dt ?? null;
  const date: YMD = requested && isValidYMD(requested) && requested.year >= 1900 && requested.year <= 2200 ? requested : today;
  const isToday = sameYMD(date, today);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="eyebrow">{isToday ? 'Today' : 'Date explorer'}</p>
          <h3 className="text-3xl">Two days, side by side</h3>
          <p className="max-w-[62ch] text-sm text-muted">{t('between.days.intro')}</p>
        </div>

        <div className="no-print flex flex-wrap items-end gap-3">
          <AppLink to={HERE} view={{ dt: addDays(date, -1) }} className="btn-quiet" aria-label={t('day.prev')}>
            <Icon name="left" size={16} />
          </AppLink>
          <div>
            <label htmlFor={pickerId} className="section-title mb-1 block">
              {t('day.pick')}
            </label>
            <input
              id={pickerId}
              type="date"
              className="field !w-auto"
              min={MIN}
              max={MAX}
              value={ymdParam(date)}
              onChange={(e) => {
                const picked = parseYmdParam(e.target.value);
                if (picked && isValidYMD(picked) && picked.year >= 1900) setView({ dt: picked });
              }}
              data-testid="pair-date-picker"
            />
          </div>
          <AppLink to={HERE} view={{ dt: addDays(date, 1) }} className="btn-quiet" aria-label={t('day.next')}>
            <Icon name="right" size={16} />
          </AppLink>
          {!isToday ? (
            <AppLink to={HERE} view={{ dt: null }} className="btn-quiet">
              {t('day.backToToday')}
            </AppLink>
          ) : null}
        </div>
      </div>

      <LayerGate layers={['day']}>{(bank) => <PairDayView bank={bank} date={date} />}</LayerGate>
    </div>
  );
}

function PairDayView({ bank, date }: { bank: Bank; date: YMD }) {
  const { profile, partner, partnerLabel: otherName, conventions } = useProfile();
  const day = useMemo(
    () => composePairDay(bank, profile!.birth, partner!.birth, date, conventions, otherName),
    [bank, profile, partner, date, conventions, otherName],
  );
  const [a, b] = day.sides;

  return (
    <div className="space-y-6" data-testid="pair-day">
      <p className="font-serif text-2xl text-ink-strong" data-testid="pair-day-label">
        {day.label}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {day.sides.map((side) => (
          <article key={side.who} className={`card card-hue hue-${side.personalDay.root} space-y-3 p-6`} data-testid={`pair-day-${side.who}`}>
            <p className="eyebrow">{side.label}</p>
            <p aria-label={`Personal day ${side.personalDay.value}`}>
              <BigNumber result={side.personalDay} className="text-7xl" />
            </p>
            <p className="text-sm text-muted">
              Personal day <span className="text-muted">· month {side.personalMonth.value} · year {side.personalYear.value}</span>
            </p>
            <h4 className="font-serif text-2xl leading-snug text-ink-strong" data-bank="true">
              {side.headline}
            </h4>
            <p className="reading leading-relaxed" data-bank="true">
              {side.paragraph}
            </p>
            {side.question ? (
              <div className="border-t border-line pt-3">
                <p className="eyebrow mb-1">{t('between.days.question')}</p>
                <p className="reading leading-relaxed" data-bank="true">
                  {side.question}
                </p>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="card-flat flex flex-wrap items-center gap-6 p-5">
        <RhythmDuo you={a.personalDay.root} other={b.personalDay.root} otherLabel={otherName} size={150} />
        <div className="min-w-48 flex-1 space-y-2">
          <p className="font-serif text-2xl leading-tight text-ink-strong" data-testid="pair-day-gap">
            {day.gap.headline}
          </p>
          <p className="text-sm text-muted">
            The ring is the nine-day rhythm. The personal day counts up by one and wraps from 9 to 1, so each of your numbers comes back about every nine days.
          </p>
          <AppLink to="/reading/between/month" view={{ my: date.year, mo: date.month }} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline">
            See the whole month
            <Icon name="right" size={15} />
          </AppLink>
        </div>
      </div>
    </div>
  );
}
