'use client';

import { conventionChips, type ChipKind, type Conventions, type Result, type Step } from '@numerology/engine';
import { AppLink } from './app-link';
import { Icon } from './icon';
import { t } from '@/lib/t';

/**
 * A number in the display face. Masters always show their root: "11/2".
 * With `tile` it sits on a flat bright fill in its own colour; otherwise it is set in the deep tone.
 */
export function BigNumber({ result, className = 'text-7xl', tile = false }: { result: Pick<Result, 'value' | 'root'>; className?: string; tile?: boolean }) {
  const master = result.value > 9;
  const tone = tile ? `bright-${result.root} inline-block rounded-3xl px-5 py-3` : `numeral-hue hue-${result.root}`;
  return (
    <span className={`numeral ${tone} ${className}`} style={tile ? { color: 'var(--ink-strong)' } : undefined}>
      {result.value}
      {master ? <span className={`ml-0.5 text-[0.42em] ${tile ? '' : 'text-muted'}`}>/{result.root}</span> : null}
    </span>
  );
}

/** The convention in use, named, next to every number. Never a bare number. */
export function ConventionChips({ kind, conventions }: { kind: ChipKind; conventions: Conventions }) {
  const chips = conventionChips(kind, conventions);
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={t('common.convention')}>
      {chips.map((chip) => (
        <li key={chip}>
          <AppLink to="/method" className="chip" title="How this convention works">
            {chip}
          </AppLink>
        </li>
      ))}
    </ul>
  );
}

export function KarmicFlag({ debt }: { debt: number }) {
  const root: Record<number, number> = { 13: 4, 14: 5, 16: 7, 19: 1 };
  return <span className="chip chip-warn">{t('reading.karmic', { debt: `${debt}/${root[debt]}` })}</span>;
}

/** One click shows every step of the arithmetic. */
export function WhyThisNumber({
  steps,
  chain,
  label = 'reading.whyThisNumber',
}: {
  steps: Step[];
  chain?: number[];
  label?: 'reading.whyThisNumber' | 'reading.showMath';
}) {
  return (
    <details className="group mt-5 border-t border-line pt-4">
      <summary className="flex min-h-11 items-center gap-2 text-sm font-medium text-ink-strong">
        <Icon name="plus" size={16} className="group-open:hidden" />
        <Icon name="minus" size={16} className="hidden group-open:block" />
        {t(label)}
      </summary>
      <ol className="mt-3 space-y-2 text-sm">
        {steps.map((step, i) => (
          <li key={`${step.label}-${i}`} className="grid gap-x-3 sm:grid-cols-[9rem_1fr]">
            <span className="eyebrow pt-0.5">{step.label}</span>
            <span className="font-mono text-[0.85rem] leading-relaxed text-ink">{step.text}</span>
          </li>
        ))}
      </ol>
      {chain && chain.length > 1 ? (
        <p className="mt-3 text-xs text-muted">
          Totals along the way: <span className="font-mono">{chain.join(' → ')}</span>
        </p>
      ) : null}
    </details>
  );
}
