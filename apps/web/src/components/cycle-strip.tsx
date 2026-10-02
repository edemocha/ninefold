import type { RhythmRow } from '@numerology/composer';
import { rootOf } from '@/lib/site';
import { t } from '@/lib/t';

/** A number on its own bright fill. The colour is the number's, whoever it belongs to. */
export function NumberChip({ value, className = '' }: { value: number | string; className?: string }) {
  const n = Number.parseInt(String(value), 10);
  const hue = Number.isFinite(n) ? rootOf(n) : 0;
  return <span className={`bright-${hue} inline-flex min-w-11 items-center justify-center rounded-xl px-2 py-0.5 font-display text-xl font-extrabold ${className}`}>{value}</span>;
}

/**
 * Nine years of both people's personal-year numbers, as a real table: a row per
 * year, a column per person. The current row is marked in words as well as in
 * colour, and each number wraps from 9 to 1.
 */
export function CycleStrip({ rows, heading, otherLabel }: { rows: RhythmRow[]; heading: string; otherLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[18rem] border-separate border-spacing-y-1.5 text-left" data-testid="cycle-strip">
        <caption className="sr-only">{t('between.stripCaption')}</caption>
        <thead>
          <tr className="text-sm font-semibold text-muted">
            <th scope="col" className="px-4 pb-1 font-semibold">
              {heading}
            </th>
            <th scope="col" className="px-4 pb-1 font-semibold">
              You
            </th>
            <th scope="col" className="px-4 pb-1 font-semibold">
              {otherLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const base = row.current ? 'bg-ink-strong' : 'bg-surface-2';
            return (
              <tr key={row.year} aria-current={row.current ? 'true' : undefined}>
                <th scope="row" className={`rounded-l-2xl px-4 py-2 font-mono text-sm font-medium ${base} ${row.current ? 'text-white' : 'text-ink-strong'}`}>
                  {row.year}
                  {row.current ? <span className="chip chip-info ml-2">{t('between.now')}</span> : null}
                </th>
                <td className={`px-4 py-2 ${base}`}>
                  <NumberChip value={row.a} />
                </td>
                <td className={`rounded-r-2xl px-4 py-2 ${base}`}>
                  <NumberChip value={row.b} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
