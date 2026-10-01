'use client';

import { useId, useMemo } from 'react';
import { composeDay } from '@numerology/composer';
import { addDays, isValidYMD, sameYMD, type YMD } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { DayCardView, dayShareSpec } from '@/components/day-card';
import { ShareImageButton } from '@/components/export-buttons';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { ConventionChips } from '@/components/number';
import { parseYmdParam, ymdParam } from '@/lib/hash';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

const MIN = '1900-01-01';
const MAX = '2200-12-31';

export default function DayPage() {
  const { profile, conventions, view, setView } = useProfile();
  const today = useToday();
  const pickerId = useId();
  if (!profile || !today) return null;

  const requested = view.dt ?? null;
  const date: YMD = requested && isValidYMD(requested) && requested.year >= 1900 && requested.year <= 2200 ? requested : today;
  const isToday = sameYMD(date, today);
  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <div className="space-y-8">
      <header className="rise space-y-5">
        <div className="space-y-3">
          <p className="eyebrow">{isToday ? 'Today' : 'Date explorer'}</p>
          <h1 className="text-4xl sm:text-5xl">Day card</h1>
        </div>

        <div className="no-print flex flex-wrap items-end gap-3">
          <AppLink to="/reading/day" view={{ dt: prev }} className="btn-quiet" aria-label={t('day.prev')}>
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
              data-testid="date-picker"
            />
          </div>
          <AppLink to="/reading/day" view={{ dt: next }} className="btn-quiet" aria-label={t('day.next')}>
            <Icon name="right" size={16} />
          </AppLink>
          {!isToday ? (
            <AppLink to="/reading/day" view={{ dt: null }} className="btn-quiet">
              {t('day.backToToday')}
            </AppLink>
          ) : null}
        </div>
        <ConventionChips kind="personalDay" conventions={conventions} />
      </header>

      <LayerGate layers={['day']}>{(bank) => <Card bank={bank} birth={profile.birth} date={date} />}</LayerGate>
    </div>
  );
}

function Card({ bank, birth, date }: { bank: Parameters<typeof composeDay>[0]; birth: YMD; date: YMD }) {
  const { conventions } = useProfile();
  const card = useMemo(() => composeDay(bank, birth, date, conventions), [bank, birth, date, conventions]);
  return (
    <>
      <DayCardView card={card} />
      <section className="card-flat no-print flex flex-wrap items-center justify-between gap-4 p-5" aria-label={t('reading.exports')}>
        <p className="max-w-[48ch] text-sm text-muted">{t('reading.exportNote')}</p>
        <div className="flex flex-wrap gap-3">
          <ShareImageButton spec={dayShareSpec(card)} filename={`personal-day-${card.personalDay.value}.png`} />
          <AppLink to="/reading/year" view={{ yr: date.year }} className="btn-quiet">
            <Icon name="calendar" size={16} />
            Year, ICS and PDF
          </AppLink>
        </div>
      </section>
    </>
  );
}
