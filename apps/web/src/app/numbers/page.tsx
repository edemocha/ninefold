import type { Metadata } from 'next';
import Link from '@/components/link';
import { readCore } from '@/lib/content-fs';
import { ALL_VALUES, rootOf } from '@/lib/site';

export const metadata: Metadata = {
  title: 'The numbers: what 1 to 9, 11, 22 and 33 mean',
  description: 'The twelve numbers of numerology, what each one is about, and its shadow side. No predictions, and no personal data.',
};

export default function NumbersIndex() {
  const themes = readCore().themes;
  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <p className="eyebrow mb-4">Reference</p>
      <h1 className="max-w-[18ch] text-5xl">The twelve numbers</h1>
      <p className="mt-5 max-w-[56ch] text-lg text-muted">
        Numerology works with the digits 1 to 9 and three master numbers, 11, 22 and 33. Each page describes one number as a theme, with its shadow side and a question to take away.
      </p>
      <ol className="mt-12 border-t-2 border-ink-strong">
        {ALL_VALUES.map((n) => (
          <li key={n} className="border-b border-line">
            <Link href={`/numbers/${n}`} className="group grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 py-4 hover:bg-mark sm:grid-cols-[7rem_1fr_auto] sm:px-2">
              <span className="numeral text-5xl">
                {n}
                {n > 9 ? <span className="text-2xl text-muted">/{rootOf(n)}</span> : null}
              </span>
              <span className="font-serif text-xl text-ink-strong">{themes[String(n)]?.activity}</span>
              <span className="hidden text-sm text-ink underline-offset-4 group-hover:underline sm:inline">Read</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
