import { cap, numberWithArticle } from '@numerology/composer';
import Link from '@/components/link';
import { pairSlug } from '@/lib/site';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Nine numbers by nine, every cell a link to the page for that pair. The cells
 * are all alike, and so are the headings, so the grid cannot be read as a map of
 * which pairs are better. Each pair is in the grid twice, and both cells go to
 * the same page.
 */
export function PairGrid({ current }: { current?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto w-full max-w-xl table-fixed border-separate border-spacing-1" data-testid="pair-grid">
        <caption className="sr-only">Pick a number for each of the two people: every cell opens the page for that pair</caption>
        <thead>
          <tr>
            <td className="w-8" />
            {DIGITS.map((n) => (
              <th key={n} scope="col" className="border-b-2 border-ink-strong py-1.5 font-serif text-lg font-normal text-ink-strong">
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIGITS.map((row) => (
            <tr key={row}>
              <th scope="row" className="border-r-2 border-ink-strong px-1 font-serif text-lg font-normal text-ink-strong">
                {row}
              </th>
              {DIGITS.map((col) => {
                const slug = pairSlug(row, col);
                const isCurrent = slug === current;
                return (
                  <td key={col} className="p-0">
                    <Link
                      href={`/between/${slug}`}
                      aria-label={cap(`${numberWithArticle(String(row))} and ${numberWithArticle(String(col))}`)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`flex min-h-9 items-center justify-center rounded-md border bg-surface font-mono text-xs text-ink hover:border-[var(--primary)] hover:text-primary aria-[current=page]:border-[var(--primary)] aria-[current=page]:bg-[var(--primary-soft)] ${isCurrent ? 'border-[var(--primary)]' : 'border-line'}`}
                    >
                      {row}·{col}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
