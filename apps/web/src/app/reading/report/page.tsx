'use client';

import { composeMonth, composeYear, currentCycleYear } from '@numerology/composer';
import { DISCLAIMER } from '@numerology/content';
import { MONTH_NAMES } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { CautionPanel } from '@/components/caution-panel';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { useProfile } from '@/lib/profile-context';
import { useToday } from '@/lib/use-today';
import { CREDIT, SITE_NAME } from '@/lib/site';

/**
 * The year report. It is a normal page with a print stylesheet: the browser's
 * print dialog turns it into a PDF with no library and no upload. It carries
 * numbers and readings only, never a name or a birth date.
 */
export default function ReportPage() {
  const { profile, conventions, view } = useProfile();
  const today = useToday();
  if (!profile || !today) return null;

  const year = view.yr !== undefined && view.yr >= 1900 && view.yr <= 2200 ? view.yr : currentCycleYear(profile.birth, today, conventions);

  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <AppLink to="/reading/year" view={{ yr: year }} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted hover:text-ink-strong">
          <Icon name="left" size={14} /> Back to the year
        </AppLink>
        <button type="button" className="btn" onClick={() => window.print()}>
          <Icon name="print" size={16} />
          Print or save as PDF
        </button>
      </div>

      <LayerGate layers={['year', 'month']}>
        {(bank) => {
          const y = composeYear(bank, profile.birth, year, conventions);
          const months = y.months.map((tile) => composeMonth(bank, profile.birth, tile.year, tile.month, conventions));
          return (
            <article className="space-y-10" data-testid="report">
              <header className="print-keep space-y-3 border-b border-line pb-6">
                <p className="eyebrow">
                  {SITE_NAME} · year report
                </p>
                <h1 className="text-5xl">
                  Personal year {y.display} <span className="text-muted">· {conventions.cycleYear === 'birthday' ? `from your ${year} birthday` : year}</span>
                </h1>
                <p className="text-muted">
                  A {y.adj} year: {y.activity}. Date rule {conventions.dateRule}, {conventions.cycleYear === 'calendar' ? 'calendar year' : 'birthday to birthday'}.
                </p>
              </header>

              <section className="space-y-5">
                {y.sections.map((s) => (
                  <div key={s.id} className="print-keep">
                    <h2 className="section-title mb-1">{s.title}</h2>
                    <p className="reading leading-relaxed">{s.text}</p>
                  </div>
                ))}
                {y.overtone ? <p className="reading leading-relaxed">{y.overtone.text}</p> : null}
                {y.lifePathLine ? (
                  <p className="reading leading-relaxed">
                    <strong className="font-medium">For your life path {y.lifePathLine.lifePath.value > 9 ? `${y.lifePathLine.lifePath.value}/${y.lifePathLine.lifePath.root}` : y.lifePathLine.lifePath.value}:</strong> {y.lifePathLine.text}
                  </p>
                ) : null}
              </section>

              <CautionPanel id="caution-report" title="Cautions for the year" cautions={y.cautions} className="print-keep" />

              {months.map((m) => (
                <section key={`${m.year}-${m.month}`} className="print-keep space-y-4 border-t border-line pt-6" aria-label={`${MONTH_NAMES[m.month - 1]} ${m.year}`}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-3xl">
                      {MONTH_NAMES[m.month - 1]} {m.year}
                    </h2>
                    <p className="font-serif text-3xl">
                      <span className="text-muted text-lg">month</span> {m.personalMonth.value}
                    </p>
                  </div>
                  {m.sections.slice(0, 2).map((s) => (
                    <div key={s.id}>
                      <h3 className="section-title mb-1">{s.title}</h3>
                      <p className="reading leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                  <div>
                    <h3 className="section-title mb-1">{m.sections[2]?.title}</h3>
                    <p className="reading leading-relaxed">{m.sections[2]?.text}</p>
                  </div>
                  <ol className="grid grid-cols-7 gap-1" aria-label={`Personal days in ${MONTH_NAMES[m.month - 1]}`}>
                    {m.days.map((d) => (
                      <li key={d.date.day} className={`tint-${d.personalDay} flex items-center justify-between rounded border border-line px-1.5 py-0.5 text-xs`}>
                        <span className="font-mono text-muted">{d.date.day}</span>
                        <span className="font-serif text-base text-ink-strong">{d.personalDay}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}

              <footer className="border-t border-line pt-6 text-sm text-muted">
                <p data-testid="report-disclaimer">{DISCLAIMER}</p>
                <p className="mt-3 font-serif italic text-primary" data-testid="report-credit">
                  {CREDIT}
                </p>
              </footer>
            </article>
          );
        }}
      </LayerGate>
    </div>
  );
}
