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
    <div className="mx-auto max-w-6xl px-5 pb-6 pt-6 sm:pt-10">
      <h1 className="max-w-[14ch] text-[clamp(2.6rem,6.5vw,5rem)]">The twelve numbers</h1>
      <p className="mt-5 max-w-[56ch] text-lg text-muted">
        Numerology works with the digits 1 to 9 and three master numbers, 11, 22 and 33. Each page describes one number as a theme, with its shadow side and a question to take away.
      </p>
      <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ALL_VALUES.map((n) => (
          <li key={n} className="flex">
            <Link href={`/numbers/${n}`} className={`bright-${rootOf(n)} tile flex min-h-52 w-full flex-col justify-between p-5`} aria-label={`Number ${n}: ${themes[String(n)]?.activity ?? ''}`}>
              <span className="numeral text-7xl">
                {n}
                {n > 9 ? <span className="text-3xl">/{rootOf(n)}</span> : null}
              </span>
              <span className="text-[0.95rem] font-medium leading-snug">{themes[String(n)]?.activity}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
