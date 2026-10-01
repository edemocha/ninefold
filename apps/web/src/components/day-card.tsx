'use client';

import type { DayCard } from '@numerology/composer';
import { Icon } from './icon';
import { RhythmRing } from './rhythm-ring';
import { ShareImageButton } from './export-buttons';
import { t } from '@/lib/t';

/** The personal day, month and year as three small numerals. */
function Triple({ card }: { card: DayCard }) {
  const items = [
    { label: 'Day', value: card.personalDay.value, tint: card.personalDay.value },
    { label: 'Month', value: card.personalMonth.value, tint: card.personalMonth.value },
    { label: 'Year', value: card.personalYear.value, tint: card.personalYear.root, overtone: card.personalYear.overtone },
  ];
  return (
    <ul className="flex gap-2" aria-label="Personal day, month and year">
      {items.map((it) => (
        <li key={it.label} className={`tint-${it.tint} hue-${it.tint} rounded-lg border border-line px-4 py-2.5`}>
          <span className="section-title block">{it.label}</span>
          <span className="numeral numeral-hue text-3xl" data-testid={`personal-${it.label.toLowerCase()}`}>
            {it.value}
          </span>
          {it.overtone ? <span className="ml-1 font-mono text-[0.65rem] text-muted">{it.overtone}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function DayCardView({ card }: { card: DayCard }) {
  const lpValue = card.lifePathLine?.lifePath;
  const lpLabel = lpValue ? (lpValue.value > 9 ? `${lpValue.value}/${lpValue.root}` : String(lpValue.value)) : '';

  return (
    <article className="space-y-8" data-testid="day-card">
      <div className="card p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="eyebrow">{card.label}</p>
          <Triple card={card} />
        </div>

        {card.special ? (
          <p className="reading mt-6 rounded-lg bg-info-bg px-4 py-3 text-sm text-[color:var(--info-ink)]" data-testid="special-date">
            {card.special.text}
          </p>
        ) : null}

        <h2 className="mt-7 max-w-[24ch] font-serif text-4xl leading-[1.1] tracking-tight text-ink-strong sm:text-5xl" data-testid="day-headline">
          {card.headline.text}
        </h2>
        <p className="reading mt-5 text-[1.08rem] leading-relaxed text-ink" data-testid="day-paragraph">
          {card.paragraph}
        </p>

        {card.lifePathLine ? (
          <p className="reading mt-4 text-[1.05rem] leading-relaxed" data-testid="life-path-line">
            <span className="font-medium text-ink-strong">{t('reading.lifePathLine', { lifePath: lpLabel })}:</span> {card.lifePathLine.text}
            {card.lifeStage ? (
              <>
                {' '}
                <span className="text-muted">
                  {t('reading.lifeStage')}: {card.lifeStage.text}.
                </span>
              </>
            ) : null}
          </p>
        ) : null}

        <dl className="mt-8 divide-y divide-line border-y border-line">
          {card.facets.map((f) => (
            <div key={f.id} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6" data-testid={`facet-${f.id}`}>
              <dt className="section-title pt-1">{f.label}</dt>
              <dd className="reading text-[1.05rem] leading-relaxed">{f.text}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <div className="card-flat flex items-center justify-center p-5">
          <RhythmRing lit={card.personalDay.value} />
        </div>
        <details className="card group p-5" data-testid="math-panel">
          <summary className="flex min-h-11 items-center gap-2 font-medium text-ink-strong">
            <Icon name="plus" size={16} className="group-open:hidden" />
            <Icon name="minus" size={16} className="hidden group-open:block" />
            {t('reading.showMath')}
          </summary>
          <div className="mt-4 space-y-5">
            {card.math.map((g) => (
              <section key={g.title}>
                <h3 className="section-title mb-1">{g.title}</h3>
                <p className="font-mono text-[0.88rem] text-ink-strong">{g.summary}</p>
                <ol className="mt-2 space-y-1 text-sm text-muted">
                  {g.steps.map((s, i) => (
                    <li key={`${s.label}-${i}`} className="grid gap-x-3 sm:grid-cols-[8rem_1fr]">
                      <span className="font-mono text-[0.7rem] uppercase tracking-wider">{s.label}</span>
                      <span className="font-mono text-[0.82rem]">{s.text}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            <p className="text-sm text-muted">
              {t('reading.rhythmNote')} The wording rotates by counting earlier days that had the same personal day for your birth month and day: {card.variantIndex} since 1900. Nothing is stored to do this.
            </p>
          </div>
        </details>
      </div>
    </article>
  );
}

export function dayShareSpec(card: DayCard): { title: string; subtitle: string; rows: { label: string; value: string }[]; footer: string } {
  return {
    title: 'Personal numbers',
    subtitle: 'Day, month and year',
    rows: [
      { label: 'Personal day', value: String(card.personalDay.value) },
      { label: 'Personal month', value: String(card.personalMonth.value) },
      { label: 'Personal year', value: String(card.personalYear.value) },
    ],
    footer: t('site.name'),
  };
}

export { ShareImageButton };
