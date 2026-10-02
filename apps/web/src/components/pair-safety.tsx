import { PAIR_SAFETY } from '@numerology/composer';
import { t } from '@/lib/t';

/**
 * The two safety lines for Between us. They are the same for every pair, they
 * are never generated, and they are never tied to a number.
 */
export function PairSafetyLines({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl border-2 border-ink-strong bg-white px-5 py-4 ${className}`} data-testid="pair-safety">
      <p className="section-title mb-1.5">{t('between.safety.heading')}</p>
      <ul className="space-y-1 text-sm text-ink-strong">
        {PAIR_SAFETY.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
