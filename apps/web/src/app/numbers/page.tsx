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
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_VALUES.map((n, i) => (
          <li key={n} className="rise" style={{ ['--i' as string]: i }}>
            <Link href={`/numbers/${n}`} className={`tint-${rootOf(n)} flex h-full min-h-40 flex-col justify-between rounded-xl border border-line p-6 hover:border-[var(--ink-strong)]`}>
              <span className="numeral text-6xl">
                {n}
                {n > 9 ? <span className="text-3xl text-muted">/{rootOf(n)}</span> : null}
              </span>
              <span className="text-[0.95rem] text-ink-strong">{themes[String(n)]?.activity}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
