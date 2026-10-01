'use client';

import { composeYear, currentCycleYear } from '@numerology/composer';
import { AppLink } from '@/components/app-link';
import { CautionPanel } from '@/components/caution-panel';
import { ExportPanel } from '@/components/export-buttons';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { BigNumber, ConventionChips, WhyThisNumber } from '@/components/number';
import { Sections } from '@/components/sections';
import { hrefWith } from '@/lib/hash';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

export default function YearPage() {
  const { profile, conventions, hash, view } = useProfile();
  const today = useToday();
  if (!profile || !today) return null;

  const year = view.yr !== undefined && view.yr >= 1900 && view.yr <= 2200 ? view.yr : currentCycleYear(profile.birth, today, conventions);
  const thisYear = currentCycleYear(profile.birth, today, conventions);

  return (
    <div className="space-y-10">
      <header className="rise flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="eyebrow">Personal year</p>
          <h1 className="text-4xl sm:text-5xl" data-testid="year-title">
            {conventions.cycleYear === 'birthday' ? `Birthday ${year} to ${year + 1}` : year}
          </h1>
        </div>
        <div className="no-print flex items-center gap-2">
          <AppLink to="/reading/year" view={{ yr: year - 1 }} className="btn-quiet" aria-label="Previous year">
            <Icon name="left" size={16} />
          </AppLink>
          {year !== thisYear ? (
            <AppLink to="/reading/year" view={{ yr: null }} className="btn-quiet">
              This year
            </AppLink>
          ) : null}
          <AppLink to="/reading/year" view={{ yr: year + 1 }} className="btn-quiet" aria-label="Next year">
            <Icon name="right" size={16} />
          </AppLink>
        </div>
      </header>

      <LayerGate layers={['year', 'month', 'day']}>
        {(bank) => {
          const reading = composeYear(bank, profile.birth, year, conventions);
          return (
            <>
              <section className="grid gap-8 lg:grid-cols-[18rem_1fr]">
                <div className={`card card-hue hue-${reading.personalYear.root} rise flex flex-col gap-4 p-6 lg:self-start`} style={{ ['--i' as string]: 1 }}>
                  <h2 className="section-title">Personal year</h2>
                  <p aria-label={`Personal year ${reading.display}`} data-testid="personal-year">
                    <BigNumber result={reading.personalYear} className="text-8xl" />
                  </p>
                  {reading.personalYear.overtone ? <span className="chip chip-info w-fit">{reading.personalYear.overtone} overtone</span> : null}
                  <p className="text-sm text-muted">
                    A {reading.adj} year: {reading.activity}.
                  </p>
                  <ConventionChips kind="personalYear" conventions={conventions} />
                  <WhyThisNumber steps={reading.steps} chain={reading.personalYear.chain} />
                </div>
                <div className="space-y-8">
                  <Sections sections={reading.sections} />
                  {reading.overtone ? (
                    <p className="reading card-flat p-5 text-[1rem] leading-relaxed">{reading.overtone.text}</p>
                  ) : null}
                  {reading.lifePathLine ? (
                    <p className="reading border-l-2 border-line-strong pl-5 text-[1.05rem] leading-relaxed">
                      <span className="font-medium text-ink-strong">For your life path {reading.lifePathLine.lifePath.value > 9 ? `${reading.lifePathLine.lifePath.value}/${reading.lifePathLine.lifePath.root}` : reading.lifePathLine.lifePath.value}:</span>{' '}
                      {reading.lifePathLine.text}
                    </p>
                  ) : null}
                </div>
              </section>

              <CautionPanel id="caution-year" title={t('caution.title.year')} cautions={reading.cautions} />

              <section aria-labelledby="months-title" className="space-y-5">
                <h2 id="months-title" className="text-3xl">
                  Twelve months
                </h2>
                <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {reading.months.map((m, i) => {
                    const isNow = today.year === m.year && today.month === m.month;
                    return (
                      <li key={`${m.year}-${m.month}`}>
                        <AppLink
                          to="/reading/month"
                          view={{ my: m.year, mo: m.month }}
                          aria-current={isNow ? 'date' : undefined}
                          className={`rise tint-${m.value} flex min-h-28 flex-col justify-between rounded-xl border p-4 hover:border-[var(--primary)] ${isNow ? 'border-[var(--primary)] border-2' : 'border-line'}`}
                          style={{ ['--i' as string]: i }}
                        >
                          <span className="font-mono text-xs uppercase tracking-wider text-muted">
                            {m.name.slice(0, 3)}
                            {m.fromDay ? ` from day ${m.fromDay}` : ''}
                          </span>
                          <span className="flex items-end justify-between">
                            <span className={`numeral numeral-hue hue-${m.value} text-5xl`}>{m.value}</span>
                            <span className="text-sm text-ink-strong">{m.tile}</span>
                          </span>
                        </AppLink>
                      </li>
                    );
                  })}
                </ol>
              </section>

              <ExportPanel bank={bank} birth={profile.birth} year={year} conventions={conventions} pdfHref={hrefWith('/reading/report', hash)} />
            </>
          );
        }}
      </LayerGate>
    </div>
  );
}
