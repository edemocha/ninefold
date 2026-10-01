'use client';

import type { ChipKind, CoreKey, Result } from '@numerology/engine';
import { personalDay, personalMonthOn, personalYear, cycleYearOn } from '@numerology/engine';
import { CORE_LABELS, dateLabel, displayNumber } from '@numerology/composer';
import { AppLink } from '@/components/app-link';
import { ShareImageButton } from '@/components/export-buttons';
import { Icon } from '@/components/icon';
import { BigNumber, ConventionChips, KarmicFlag, WhyThisNumber } from '@/components/number';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

const ORDER: { key: CoreKey; span: string }[] = [
  { key: 'lifePath', span: 'lg:col-span-2' },
  { key: 'expression', span: '' },
  { key: 'soulUrge', span: '' },
  { key: 'personality', span: '' },
  { key: 'birthDay', span: '' },
  { key: 'maturity', span: '' },
];

export default function SnapshotPage() {
  const { core, names, profile, conventions, who, under16 } = useProfile();
  const today = useToday();
  if (!core || !profile) return null;

  const results: Record<CoreKey, Result | undefined> = {
    lifePath: core.lifePath,
    expression: core.expression,
    soulUrge: core.soulUrge,
    personality: core.personality,
    birthDay: core.birthDay,
    maturity: core.maturity,
  };

  const nameIssues = names && !names.ok ? names.issues : names?.issues.filter((i) => !i.blocking) ?? [];
  const todayNumbers = today
    ? {
        pd: personalDay(profile.birth, today, conventions),
        pm: personalMonthOn(profile.birth, today, conventions),
        py: personalYear(profile.birth, cycleYearOn(profile.birth, today, conventions), conventions),
      }
    : null;

  return (
    <div className="space-y-10">
      <header className="rise space-y-3">
        <p className="eyebrow">{who === 'current' ? 'Name you use now' : 'Birth name'}</p>
        <h1 className="text-4xl sm:text-5xl">Your core numbers</h1>
        <p className="max-w-[60ch] text-muted">
          Six numbers from your birth date and name. Each one is shown with the convention behind it, and one click shows the arithmetic.
        </p>
      </header>

      {under16 ? (
        <p role="status" className="rounded-lg bg-info-bg px-4 py-3 text-sm text-[color:var(--info-ink)]" data-testid="under16-notice">
          {t('form.under16')}
        </p>
      ) : null}

      {nameIssues.length > 0 ? (
        <ul className="space-y-1 rounded-lg bg-warn-bg px-4 py-3 text-sm text-[color:var(--warn-ink)]" role="status">
          {nameIssues.map((i) => (
            <li key={i.code}>{i.message}</li>
          ))}
        </ul>
      ) : null}

      {todayNumbers && today ? (
        <section aria-label="Today" className="card rise flex flex-wrap items-center justify-between gap-4 p-5" style={{ ['--i' as string]: 1 }}>
          <div>
            <p className="eyebrow mb-1">Today, {dateLabel(today)}</p>
            <p className="font-serif text-2xl text-ink-strong">
              Personal day {todayNumbers.pd.value} <span className="text-muted">· month {todayNumbers.pm.value} · year {todayNumbers.py.value}</span>
            </p>
          </div>
          <AppLink to="/reading/day" view={{ dt: null }} className="btn">
            Open today&apos;s card
            <Icon name="right" size={16} />
          </AppLink>
        </section>
      ) : null}

      <section aria-label="Core numbers" className="grid gap-4 lg:grid-cols-3">
        {ORDER.map(({ key, span }, i) => {
          const result = results[key];
          const label = CORE_LABELS[key];
          return (
            <article
              key={key}
              className={`card rise flex flex-col p-6 ${span}`}
              style={{ ['--i' as string]: i + 2 }}
              data-testid={`core-${key}`}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="section-title">{label.title}</h2>
                {result?.karmicDebt ? <KarmicFlag debt={result.karmicDebt} /> : null}
              </div>
              {result ? (
                <>
                  <p className="mt-4" aria-label={`${label.title} ${result.value}`}>
                    <BigNumber result={result} className={span ? 'text-8xl' : 'text-7xl'} />
                  </p>
                  <p className="mt-3 text-sm text-muted">{label.lens}</p>
                  <div className="mt-4">
                    <ConventionChips kind={key as ChipKind} conventions={conventions} />
                  </div>
                  <WhyThisNumber steps={result.steps} chain={result.chain} />
                  <AppLink to={`/reading/number/${key}`} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-strong underline-offset-4 hover:underline">
                    Read the {label.title.toLowerCase()} reading
                    <Icon name="right" size={15} />
                  </AppLink>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted">
                  This number needs a valid birth name. Go back and enter the name as it appears on the birth certificate, using Latin letters.
                </p>
              )}
            </article>
          );
        })}

        <aside className="card-flat rise flex flex-col justify-between p-6 lg:col-span-2" style={{ ['--i' as string]: 8 }}>
          <div>
            <h2 className="section-title">Keep going</h2>
            <ul className="mt-4 space-y-2 text-[0.95rem]">
              {[
                ['/reading/grid', 'Name grid and missing numbers'],
                ['/reading/timeline', 'Life timeline, ages 0 to 100'],
                ['/reading/year', 'Personal year and months'],
                ['/reading/month', 'Calendar of personal days'],
              ].map(([to, label]) => (
                <li key={to}>
                  <AppLink to={to as string} className="flex min-h-11 items-center justify-between gap-3 border-b border-line py-1 hover:text-ink-strong">
                    {label}
                    <Icon name="right" size={15} />
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="card-flat no-print flex flex-wrap items-center justify-between gap-4 p-5" aria-label="Share">
        <p className="max-w-[48ch] text-sm text-muted">A picture of your six numbers, drawn in your browser. It carries numbers only: no name, no birth date.</p>
        <ShareImageButton
          filename="my-core-numbers.png"
          spec={{
            title: 'Core numbers',
            rows: ORDER.map(({ key }) => ({ label: CORE_LABELS[key].title, value: results[key] ? displayNumber(results[key] as Result) : '-' })),
            footer: 'Ninefold',
          }}
        />
      </section>
    </div>
  );
}

