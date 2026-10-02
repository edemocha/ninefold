'use client';

import { useMemo } from 'react';
import { composePairLife, type Bank, type PairLifeSide, type PeriodReading } from '@numerology/composer';
import type { YMD } from '@numerology/engine';
import { LayerGate } from '@/components/layer-gate';
import { BigNumber } from '@/components/number';
import { PairLifeChart } from '@/components/pair-life-chart';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

/** Two life timelines on one calendar-year axis: where each person is in their pinnacles and challenges. */
export default function PairLifePage() {
  const { profile, partner } = useProfile();
  const today = useToday();
  if (!profile || !partner || !today) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="eyebrow">Pinnacles and challenges</p>
        <h3 className="text-3xl">Where each of you is in life</h3>
        <p className="max-w-[62ch] text-sm text-muted">{t('between.life.intro')}</p>
      </div>
      <LayerGate layers={['life']}>{(bank) => <PairLifeView bank={bank} today={today} />}</LayerGate>
    </div>
  );
}

function PairLifeView({ bank, today }: { bank: Bank; today: YMD }) {
  const { profile, partner, conventions } = useProfile();
  const life = useMemo(
    () => composePairLife(bank, profile!.birth, partner!.birth, today, conventions, partner!.label),
    [bank, profile, partner, today, conventions],
  );

  return (
    <div className="space-y-8" data-testid="pair-life">
      <PairLifeChart life={life} />
      <div className="grid gap-4 md:grid-cols-2">
        {life.sides.map((side) => (
          <SideCard key={side.who} side={side} />
        ))}
      </div>
    </div>
  );
}

const rootOf = (value: number): number => (value === 11 ? 2 : value === 22 ? 4 : value === 33 ? 6 : value);

const years = (p: PeriodReading): string => (p.yearTo === null ? `from ${p.yearFrom}` : `${p.yearFrom} to ${p.yearTo}`);

function SideCard({ side }: { side: PairLifeSide }) {
  const { pinnacle, challenge } = side.current;
  return (
    <article className={`card card-hue hue-${rootOf(pinnacle.value)} space-y-4 p-6`} data-testid={`pair-life-${side.who}`}>
      <p className="eyebrow">{side.label}</p>
      <p className="text-sm text-muted">
        Age {side.age} · born {side.birthYear}
      </p>

      <div className="space-y-1">
        <p className="section-title">Pinnacle now</p>
        <p aria-label={`Pinnacle ${pinnacle.display}`}>
          <BigNumber result={{ value: pinnacle.value, root: rootOf(pinnacle.value) }} className="text-6xl" />
        </p>
        <p className="text-sm text-ink" data-testid={`pair-life-${side.who}-now`}>
          {pinnacle.label}: {pinnacle.stage}, {pinnacle.agesText} ({years(pinnacle)})
        </p>
      </div>

      <div className="space-y-1 border-t border-line pt-3">
        <p className="section-title">Challenge now</p>
        <p className="text-sm text-ink">
          {challenge.label}: {challenge.value}, {challenge.agesText} ({years(challenge)})
        </p>
      </div>

      <details className="group border-t border-line pt-3">
        <summary className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink-strong">Every period for {side.label === 'You' ? 'you' : side.label}</summary>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[20rem] text-left text-sm" data-testid={`pair-life-${side.who}-table`}>
            <caption className="sr-only">Pinnacles and challenges for {side.label}, with ages and calendar years</caption>
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="py-1 pr-3 font-mono font-normal">
                  Period
                </th>
                <th scope="col" className="py-1 pr-3 font-mono font-normal">
                  Number
                </th>
                <th scope="col" className="py-1 pr-3 font-mono font-normal">
                  Ages
                </th>
                <th scope="col" className="py-1 font-mono font-normal">
                  Years
                </th>
              </tr>
            </thead>
            <tbody>
              {[...side.pinnacles, ...side.challenges].map((p, i) => (
                <tr key={`${i}-${p.label}`} className="border-t border-line">
                  <th scope="row" className="py-1.5 pr-3 font-normal text-ink-strong">
                    {p.label}
                  </th>
                  <td className="py-1.5 pr-3 font-serif text-lg text-ink-strong">{p.display}</td>
                  <td className="py-1.5 pr-3 text-muted">{p.agesText.replace(/^ages /, '')}</td>
                  <td className="py-1.5 text-muted">{years(p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
