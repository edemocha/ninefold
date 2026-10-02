import type { Metadata } from 'next';
import Link from '@/components/link';
import { DatesOnlyForm } from '@/components/dates-only-form';
import { Disclaimer } from '@/components/disclaimer';
import { PairGrid } from '@/components/pair-grid';
import { t } from '@/lib/t';

export const metadata: Metadata = {
  title: 'Two numbers side by side',
  description:
    'Pick a number for each of two people and see what the two tend to bring, where each may stretch, and questions to talk about. No score and no verdict, and no personal data.',
};

export default function BetweenIndex() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-6 pt-6 sm:pt-10">
      <h1 className="max-w-[18ch] text-[clamp(2.6rem,6.5vw,5rem)]">Two numbers, side by side</h1>
      <p className="mt-5 max-w-[60ch] text-lg text-muted">
        Numerology reads a number on its own. These pages read two together: a pair of life paths, of expression numbers or of soul urges. Each one says what the two numbers tend to bring, where each may stretch, and questions the
        two of you can answer.
      </p>
      <p className="mt-4 max-w-[60ch] text-muted">{t('between.stance')}</p>

      <section className="mt-12 space-y-5 rounded-3xl bg-surface-2 p-4 sm:p-9" aria-labelledby="grid-title">
        <h2 id="grid-title" className="text-3xl sm:text-4xl">
          Pick a number for each of you
        </h2>
        <p className="max-w-[60ch] text-sm text-muted">
          Rows and columns are the numbers 1 to 9. A master number (11, 22 or 33) uses its root, 2, 4 or 6, and its page adds a short note. The pair reads the same in either order, so the cell for 3 and 7 and the cell for 7 and 3 open the
          same page. Every cell looks alike on purpose: no pair is better than another.
        </p>
        <PairGrid />
      </section>

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl">What these pages are not</h2>
          <p className="reading leading-relaxed">
            They do not rate a pair, say whether two people are right for each other, or predict anything. In a large 2020 analysis of couples, what predicted how happy people were was how they saw the relationship itself, such as how
            committed and appreciative they felt, and not their personality traits. So each page gives you something to talk about instead.
          </p>
          <p>
            <Link href="/method#between" className="font-semibold text-ink-strong underline underline-offset-4 hover:text-accent">
              How it is worked out, and the research
            </Link>
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl">Your own two dates</h2>
          <p className="reading leading-relaxed">
            The gap between two people&apos;s cycles depends on their birth dates, and it never changes. To see yours, with the arithmetic, enter two dates below. No name is asked for, and nothing you type leaves your browser.
          </p>
        </div>
      </section>

      <DatesOnlyForm className="mt-8" />

      <Disclaimer className="mt-14" />
    </div>
  );
}
