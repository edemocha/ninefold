import { cap, numberWithArticle } from '@numerology/composer';
import Link from '@/components/link';
import { pairSlug } from '@/lib/site';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Nine numbers by nine, every cell a link to the page for that pair. The cells
 * are all alike, so the grid cannot be read as a map of which pairs are better:
 * colour appears only on the headings, where it names the number. Each pair is
 * in the grid twice, and both cells go to the same page.
 */
export function PairGrid({ current }: { current?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="mx-auto w-full max-w-xl table-fixed border-separate border-spacing-1" data-testid="pair-grid">
        <caption className="sr-only">Pick a number for each of the two people: every cell opens the page for that pair</caption>
        <thead>
          <tr>
            <td className="w-9" />
            {DIGITS.map((n) => (
              <th key={n} scope="col" className="p-0 pb-1 font-normal">
                <span className={`bright-${n} mx-auto flex size-8 items-center justify-center rounded-lg font-display text-lg font-extrabold`}>{n}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIGITS.map((row) => (
            <tr key={row}>
              <th scope="row" className="p-0 pr-1 font-normal">
                <span className={`bright-${row} flex size-8 items-center justify-center rounded-lg font-display text-lg font-extrabold`}>{row}</span>
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
                      className="flex min-h-9 items-center justify-center rounded-lg bg-surface-2 font-mono text-xs text-ink-strong hover:bg-mark aria-[current=page]:bg-ink-strong aria-[current=page]:text-white"
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
