import type { RhythmRow } from '@numerology/composer';
import { t } from '@/lib/t';

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
          <tr className="text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="px-3 pb-1 font-mono font-normal">
              {heading}
            </th>
            <th scope="col" className="px-3 pb-1 font-mono font-normal">
              You
            </th>
            <th scope="col" className="px-3 pb-1 font-mono font-normal">
              {otherLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year} aria-current={row.current ? 'true' : undefined} className={row.current ? 'font-medium' : ''}>
              <th scope="row" className="rounded-l-md border-y border-l border-line bg-surface px-3 py-1.5 font-mono text-sm font-normal text-ink-strong">
                {row.year}
                {row.current ? <span className="ml-2 chip chip-info">{t('between.now')}</span> : null}
              </th>
              <td className="border-y border-line bg-surface px-3 py-1.5">
                <span className="inline-block min-w-12 py-0.5 text-center font-serif text-lg text-ink-strong">{row.a}</span>
              </td>
              <td className="rounded-r-md border-y border-r border-line bg-surface px-3 py-1.5">
                <span className="inline-block min-w-12 py-0.5 text-center font-serif text-lg text-accent">{row.b}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
