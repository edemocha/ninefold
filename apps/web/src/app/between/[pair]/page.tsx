import type { Metadata } from 'next';
import Link from '@/components/link';
import { notFound } from 'next/navigation';
import { numberWithArticle, PAIR_SECTION_TITLES } from '@numerology/composer';
import { PAIR_SECTIONS } from '@numerology/content';
import { DatesOnlyForm } from '@/components/dates-only-form';
import { Disclaimer } from '@/components/disclaimer';
import { Icon } from '@/components/icon';
import { PairGrid } from '@/components/pair-grid';
import { PairSafetyLines } from '@/components/pair-safety';
import { readLife, readPair } from '@/lib/content-fs';
import { PAIR_SLUGS, pairSlug } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return PAIR_SLUGS.map((pair) => ({ pair }));
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** "3-7" to [3, 7]. */
function parse(slug: string): [number, number] | null {
  const m = slug.match(/^([1-9])-([1-9])$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a <= b ? [a, b] : null;
}

/** The master numbers that reduce to each root. */
const MASTER_OF: Record<number, '11' | '22' | '33'> = { 2: '11', 4: '22', 6: '33' };

const title = (a: number, b: number): string => cap(`${numberWithArticle(String(a))} and ${numberWithArticle(String(b))}`);

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const nums = parse(pair);
  if (!nums) return {};
  const [a, b] = nums;
  return {
    title: `${title(a, b)}: what the two numbers tend to bring`,
    description: `${title(a, b)} side by side, as life paths, expression numbers or soul urges: where the two meet, where each may stretch, and questions to talk about. A symbolic reading with no score and no verdict.`,
    alternates: { canonical: `/between/${pairSlug(a, b)}` },
  };
}

export default async function PairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const nums = parse(pair);
  if (!nums) notFound();
  const [a, b] = nums;
  const entry = readPair().core[pair];
  const life = readLife();
  if (!entry) notFound();

  const same = a === b;
  const masters = [...new Set([a, b])].map((n) => MASTER_OF[n]).filter((m): m is '11' | '22' | '33' => m !== undefined);
  const twoMasterSlots = MASTER_OF[a] !== undefined && MASTER_OF[b] !== undefined;
  const overlays = [...masters, ...(twoMasterSlots ? (['both'] as const) : [])];
  const bank = readPair();

  return (
    <article className="mx-auto max-w-4xl px-5 py-14">
      <Link href="/between" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold text-ink-strong hover:bg-mark">
        <Icon name="left" size={14} /> All the pairs
      </Link>

      <header className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
        <div className="flex items-center gap-3" aria-hidden="true">
          {[a, b].map((n, i) => (
            <span key={i} className={`bright-${n} flex min-w-28 items-center justify-center rounded-3xl px-6 py-7`}>
              <span className="numeral text-8xl">{n}</span>
            </span>
          ))}
        </div>
        <div>
          <h1 className="text-[clamp(2.4rem,6vw,4.25rem)]">{title(a, b)}</h1>
          <p className="mt-4 text-lg text-ink">
            The same text reads for two life paths, two expression numbers or two soul urges, and in either order. It describes what the numbers tend to bring, not the people who have them.
          </p>
        </div>
      </header>

      <section className="reading mt-12 space-y-4" aria-labelledby="relate-title" data-bank="true" data-testid="pair-page-relate">
        <h2 id="relate-title" className="section-title">
          How {same ? `a ${a}` : `each number`} tends to relate
        </h2>
        <div className={same ? '' : 'grid gap-4 md:grid-cols-2'}>
          {(same ? [a] : [a, b]).map((n) => (
            <div key={n} className={`hue-${n} rounded-3xl bg-hue-n p-6`}>
              <h3 className="font-display text-xl font-bold tracking-tight text-ink-strong">{numberWithArticle(String(n)).replace(/^an? /, 'The ')}</h3>
              <p className="mt-2 leading-relaxed">{life.core.lifePath[String(n)]?.relationships}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="reading mt-4 grid gap-3 md:grid-cols-2">
        {PAIR_SECTIONS.map((id) => (
          <section key={id} aria-labelledby={`p-${id}`} className="rounded-3xl bg-surface-2 p-6 sm:p-7">
            <h2 id={`p-${id}`} className="section-title mb-2">
              {PAIR_SECTION_TITLES[id]}
            </h2>
            <p className="text-[1.02rem] leading-relaxed">{entry[id]}</p>
          </section>
        ))}
      </div>

      {overlays.length > 0 ? (
        <section className="mt-12 space-y-3" aria-labelledby="master-title">
          <h2 id="master-title" className="section-title">
            If one of you is a master number
          </h2>
          <p className="max-w-[60ch] text-sm text-muted">A master number uses the text above for its root and adds one short note. It is a theme, not a status.</p>
          <ul className="reading space-y-3">
            {overlays.map((key) => (
              <li key={key} className="rounded-2xl bg-surface-2 px-5 py-4 leading-relaxed">
                {bank.master[key]}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-16 space-y-3" aria-labelledby="cycles-title">
        <h2 id="cycles-title" className="text-3xl sm:text-4xl">
          Where your cycles meet
        </h2>
        <p className="reading max-w-[62ch] leading-relaxed">
          How far apart two people&apos;s year, month and day numbers sit depends on their birth months and days, not on these two numbers. The gap between two cycles never changes, and there are only nine it can be, from the same number to four
          steps apart the shorter way round. Enter two dates to see yours, with the arithmetic.
        </p>
      </section>

      <section className="mt-12 space-y-3" aria-labelledby="limits-title">
        <h2 id="limits-title" className="text-3xl sm:text-4xl">
          What this does not tell you
        </h2>
        <p className="reading max-w-[62ch] leading-relaxed">
          Numbers from names or birth dates do not say whether two people will get on. In a large 2020 analysis of couples, how people saw the relationship itself predicted far more than personality traits did. Treat the questions above as a place
          to start a conversation.{' '}
          <Link href="/method#between" className="font-semibold text-ink-strong underline underline-offset-4 hover:text-accent">
            The research, and how this is worked out
          </Link>
          .
        </p>
      </section>

      <DatesOnlyForm className="mt-12" />

      <section className="mt-16 space-y-4" aria-labelledby="others-title">
        <h2 id="others-title" className="section-title">
          Another pair
        </h2>
        <PairGrid current={pair} />
      </section>

      <PairSafetyLines className="mt-12" />
      <Disclaimer className="mt-10" />
    </article>
  );
}
