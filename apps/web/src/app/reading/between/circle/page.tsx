'use client';

import { useMemo } from 'react';
import { composeCircle } from '@numerology/composer';
import { lifePath } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { Icon } from '@/components/icon';
import { RhythmCircle } from '@/components/rhythm-circle';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Up to five people on one ring: everyone's personal-year number now, and how
 * many steps apart each pair sits. It is a picture of nine positions, so any
 * gap equals the two gaps going round. It says nothing about any pair beyond
 * where they sit; the pair views say the rest.
 */
export default function PairCirclePage() {
  const { profile, partners, partnerLabels, conventions, selectPartner } = useProfile();
  const today = useToday();

  const circle = useMemo(() => {
    if (!profile || !today || partners.length < 2) return null;
    const births = [profile.birth, ...partners.map((p) => p.birth)];
    return composeCircle(
      births,
      ['You', ...partnerLabels.map(cap)],
      births.map((b) => lifePath(b, conventions)),
      today,
      conventions,
    );
  }, [profile, partners, partnerLabels, conventions, today]);

  if (!profile || !today) return null;
  if (!circle) {
    return (
      <p className="card-flat p-5 text-sm text-muted" data-testid="pair-circle-none">
        Add someone else to see everyone on one ring.
      </p>
    );
  }

  return (
    <div className="space-y-10" data-testid="pair-circle">
      <div className="space-y-2">
        <p className="eyebrow">Up to five people</p>
        <h3 className="text-3xl">Everyone on one ring</h3>
        <p className="max-w-[62ch] text-sm text-muted">{t('between.circle.intro')}</p>
      </div>

      <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <RhythmCircle circle={circle} />
        <section aria-labelledby="circle-legend" className="space-y-3">
          <h4 id="circle-legend" className="section-title">
            {t('between.circle.legend')}
          </h4>
          <ul className="space-y-1.5 text-[0.98rem]" data-testid="pair-circle-legend">
            {circle.members.map((m) => (
              <li key={m.letter} className="flex items-center gap-3">
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-ink-strong font-mono text-sm font-semibold text-ink-strong" aria-hidden="true">
                  {m.letter}
                </span>
                <span>
                  {m.label}: year number {m.year}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="circle-members" className="space-y-3">
        <h4 id="circle-members" className="section-title">
          Everyone now
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] border-separate border-spacing-y-1.5 text-left" data-testid="pair-circle-members">
            <caption className="sr-only">{t('between.circle.membersCaption')}</caption>
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-3 pb-1 font-mono font-normal">
                  Person
                </th>
                <th scope="col" className="px-3 pb-1 font-mono font-normal">
                  Life path
                </th>
                <th scope="col" className="px-3 pb-1 font-mono font-normal">
                  Year number
                </th>
              </tr>
            </thead>
            <tbody>
              {circle.members.map((m) => (
                <tr key={m.letter}>
                  <th scope="row" className="rounded-l-md border-y border-l border-line bg-surface px-3 py-1.5 text-sm font-normal text-ink-strong">
                    {m.letter} · {m.label}
                  </th>
                  <td className="border-y border-line bg-surface px-3 py-1.5">
                    <span className={`tint-${m.lifePath.root} inline-block min-w-12 rounded px-2 py-0.5 text-center font-serif text-lg text-ink-strong`}>{m.display}</span>
                  </td>
                  <td className="rounded-r-md border-y border-r border-line bg-surface px-3 py-1.5">
                    <span className={`tint-${m.year} inline-block min-w-12 rounded px-2 py-0.5 text-center font-serif text-lg text-ink-strong`}>{m.year}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="circle-gaps" className="space-y-3">
        <h4 id="circle-gaps" className="section-title">
          Steps apart
        </h4>
        <p className="max-w-[62ch] text-sm text-muted">
          The shorter way round the nine, from 0 (the same number) to 4. {circle.approx ? 'You count cycles from birthdays, so these are as of today and move by one step between birthdays.' : 'Each gap holds for every year, month and day.'}
        </p>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1.5 text-center" data-testid="pair-circle-gaps">
            <caption className="sr-only">{t('between.circle.tableCaption')}</caption>
            <thead>
              <tr>
                <td />
                {circle.members.map((m) => (
                  <th key={m.letter} scope="col" className="px-2 pb-1 font-mono text-xs font-normal text-muted" title={m.label}>
                    {m.letter}
                    <span className="sr-only"> {m.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {circle.members.map((row, i) => (
                <tr key={row.letter}>
                  <th scope="row" className="pr-2 text-left font-mono text-xs font-normal text-muted" title={row.label}>
                    {row.letter}
                    <span className="sr-only"> {row.label}</span>
                  </th>
                  {circle.members.map((col, j) => (
                    <td key={col.letter} className={`size-12 rounded-md border border-line font-serif text-xl ${i === j ? 'bg-surface-2 text-muted' : 'bg-surface text-ink-strong'}`}>
                      {i === j ? <span aria-label="the same person">–</span> : circle.distances[i]?.[j]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="circle-open" className="card-flat space-y-3 p-5 no-print">
        <h4 id="circle-open" className="section-title">
          Read a pair
        </h4>
        <ul className="flex flex-wrap gap-2">
          {partnerLabels.map((label, i) => (
            <li key={`${i}-${label}`}>
              <AppLink to="/reading/between" className="btn-quiet !min-h-9 !px-3 !text-sm" onClick={() => selectPartner(i)}>
                {t('between.circle.open')}: {label}
                <Icon name="right" size={14} />
              </AppLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
