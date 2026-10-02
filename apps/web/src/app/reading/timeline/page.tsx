'use client';

import { useMemo, useState } from 'react';
import { composeTimeline, type PeriodReading } from '@numerology/composer';
import type { YMD } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { ConventionChips, WhyThisNumber } from '@/components/number';
import { TimelineChart } from '@/components/timeline-chart';
import { useProfile } from '@/lib/profile-context';
import { rootOf } from '@/lib/site';
import { useToday } from '@/lib/use-today';

export default function TimelinePage() {
  const { profile } = useProfile();
  const today = useToday();
  if (!profile || !today) return null;

  return (
    <div className="space-y-10">
      <header className="rise space-y-3">
        <p className="eyebrow">Ages 0 to 100</p>
        <h1 className="text-4xl sm:text-5xl">Life timeline</h1>
        <p className="max-w-[62ch] text-muted">
          Four pinnacles are long stretches with a theme. Four challenges are the friction points that go with them. The strip underneath is your personal year, year by year.
        </p>
      </header>
      <LayerGate layers={['life']}>{(bank) => <Timeline bank={bank} today={today} />}</LayerGate>
    </div>
  );
}

function Timeline({ bank, today }: { bank: Parameters<typeof composeTimeline>[0]; today: YMD }) {
  const { profile, conventions } = useProfile();
  const birth = profile!.birth;
  const timeline = useMemo(() => composeTimeline(bank, birth, today, conventions), [bank, birth, today, conventions]);
  const [picked, setPicked] = useState<number | null>(null);
  const age = picked ?? timeline.age;
  const tick = timeline.years[age]!;
  const pinnacle = timeline.pinnacles.find((p) => age >= p.ageFrom && (p.ageTo === null || age <= p.ageTo)) as PeriodReading;
  const challenge = timeline.challenges.find((p) => age >= p.ageFrom && (p.ageTo === null || age <= p.ageTo)) as PeriodReading;
  const here = age === timeline.age;

  return (
    <>
      <section className="card rise p-5 sm:p-6" aria-label="Timeline" style={{ ['--i' as string]: 1 }}>
        <TimelineChart timeline={timeline} age={age} onAge={setPicked} currentAge={timeline.age} />
      </section>

      <section aria-live="polite" aria-atomic="true" className="card-flat grid gap-5 p-6 md:grid-cols-3" data-testid="timeline-readout">
        <div>
          <p className="eyebrow mb-2">{here ? 'You are here' : 'Age'}</p>
          <p className="font-display text-3xl text-ink-strong">
            Age {age} <span className="text-muted">· {tick.year}</span>
          </p>
          {!here ? (
            <button type="button" className="btn-quiet mt-3 !min-h-9 !px-3 !text-sm" onClick={() => setPicked(null)}>
              Back to now
            </button>
          ) : null}
        </div>
        <div>
          <p className="eyebrow mb-2">Personal year</p>
          <p className="font-display text-3xl text-ink-strong">
            {tick.display} <span className="text-muted">· {tick.tile}</span>
          </p>
          <AppLink to="/reading/year" view={{ yr: tick.year }} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-strong underline-offset-4 hover:underline">
            Open {tick.year} <Icon name="right" size={14} />
          </AppLink>
        </div>
        <div>
          <p className="eyebrow mb-2">This stretch</p>
          <p className="text-[0.95rem]">
            <strong className="font-medium text-ink-strong">
              {pinnacle.label} {pinnacle.display}
            </strong>
            , {pinnacle.agesText}: {pinnacle.stage}.
          </p>
          <p className="mt-1 text-[0.95rem]">
            <strong className="font-medium text-ink-strong">
              {challenge.label} {challenge.display}
            </strong>
            .
          </p>
        </div>
      </section>

      <section aria-labelledby="pinnacles-title" className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="pinnacles-title" className="text-3xl">
            The four pinnacles
          </h2>
          <ConventionChips kind="pinnacle" conventions={conventions} />
        </div>
        <ol className="grid gap-4 md:grid-cols-2">
          {timeline.pinnacles.map((p) => (
            <li key={p.n} aria-current={pinnacle.n === p.n ? 'true' : undefined} className={`card card-hue hue-${rootOf(p.value)} p-6 ${pinnacle.n === p.n ? 'border-ink-strong' : ''}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="section-title">{p.label}</h3>
                <span className="text-xs font-medium text-muted">
                  {p.agesText} · {p.yearFrom}
                  {p.yearTo ? ` to ${p.yearTo}` : ' on'}
                </span>
              </div>
              <p className="mt-3">
                <span className="numeral inline-block rounded-3xl bg-hue-b px-5 py-3 text-6xl">{p.display}</span>
              </p>
              <p className="reading mt-4 text-[1rem] leading-relaxed">{p.text}</p>
              {p.guidance ? <p className="reading mt-3 text-[1rem] leading-relaxed">{p.guidance}</p> : null}
              <WhyThisNumber steps={p.steps} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="challenges-title" className="space-y-5">
        <h2 id="challenges-title" className="text-3xl">
          The four challenges
        </h2>
        <ol className="grid gap-4 md:grid-cols-2">
          {timeline.challenges.map((p) => (
            <li key={p.n} aria-current={challenge.n === p.n ? 'true' : undefined} className={`card card-hue hue-${p.value} p-6 ${challenge.n === p.n ? 'border-ink-strong' : ''}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="section-title">{p.label}</h3>
                <span className="text-xs font-medium text-muted">{p.agesText}</span>
              </div>
              <p className="mt-3">
                <span className="numeral inline-block rounded-3xl bg-hue-b px-5 py-3 text-6xl">{p.display}</span>
              </p>
              <p className="reading mt-4 text-[1rem] leading-relaxed">{p.text}</p>
              <WhyThisNumber steps={p.steps} />
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
