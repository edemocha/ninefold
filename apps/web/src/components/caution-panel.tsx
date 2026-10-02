import { SAFETY_LINES, type CautionCard } from '@numerology/composer';
import { t } from '@/lib/t';

const FACET_NAMES: Record<string, string> = {
  money: 'Money',
  work: 'Work',
  relationships: 'Relationships',
  energy: 'Energy',
  mind: 'Mind',
};

const LABEL_CLASS: Record<string, string> = {
  'WATCH OUT': 'chip chip-warn',
  'GO EASY ON': 'chip chip-info',
  AVOID: 'chip chip-bad',
};

/**
 * The two safety lines. They are the same on every caution, whatever the
 * number, and they are never generated or tied to a number.
 */
export function SafetyLines({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border-2 border-ink-strong bg-white px-5 py-4 ${className}`} data-testid="caution-safety">
      <p className="section-title mb-1.5">{t('caution.safety.heading')}</p>
      <ul className="space-y-1 text-sm text-ink-strong">
        {SAFETY_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

/** One or more cautions: a behavior to watch, with where it comes from. Never a forecast. */
export function CautionPanel({
  title,
  cautions,
  id,
  className = '',
}: {
  title: string;
  cautions: CautionCard[];
  id: string;
  className?: string;
}) {
  if (cautions.length === 0) return null;
  return (
    <section aria-labelledby={id} className={`card-flat space-y-5 p-6 ${className}`} data-testid="caution-panel">
      <div>
        <h2 id={id} className="section-title">
          {title}
        </h2>
        <p className="mt-1 max-w-[60ch] text-sm text-muted">{t('caution.intro')}</p>
      </div>
      <ul className={`grid gap-3 ${cautions.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {cautions.map((c) => (
          <li key={c.source} className="card p-5" data-testid="caution-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={LABEL_CLASS[c.label] ?? 'chip'} data-testid="caution-label">
                {c.label}
              </span>
              <span className="text-xs font-semibold text-muted">{FACET_NAMES[c.facet]}</span>
            </div>
            <h3 className="mt-3 font-display text-xl font-bold leading-snug tracking-tight text-ink-strong">{c.headline}</h3>
            <p className="reading mt-2 text-[0.98rem] leading-relaxed">{c.body}</p>
            <p className="mt-3 text-xs text-muted">
              <span className="font-semibold">{t('caution.why')}</span> {c.link}
            </p>
          </li>
        ))}
      </ul>
      <SafetyLines />
    </section>
  );
}
