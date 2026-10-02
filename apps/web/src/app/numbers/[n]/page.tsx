import type { Metadata } from 'next';
import Link from '@/components/link';
import { notFound } from 'next/navigation';
import { cap, numberWithArticle } from '@numerology/composer';
import { Disclaimer } from '@/components/disclaimer';
import { readCore, readLife } from '@/lib/content-fs';
import { ALL_VALUES, pairSlug, rootOf } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_VALUES.map((n) => ({ n: String(n) }));
}

const SECTIONS = [
  ['overview', 'Overview'],
  ['strengths', 'Strengths'],
  ['shadow', 'Shadow side'],
  ['relationships', 'Relationships'],
  ['growth', 'Growth practice'],
] as const;

const LENSES = [
  ['lifePath', 'As a life path'],
  ['expression', 'As an expression number'],
  ['soulUrge', 'As a soul urge'],
  ['personality', 'As a personality number'],
  ['birthDay', 'As a birth day'],
  ['maturity', 'As a maturity number'],
] as const;

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const themes = readCore().themes;
  return {
    title: `The number ${n} in numerology`,
    description: `Number ${n} is about ${themes[n]?.activity ?? 'a theme'}. Strengths, shadow side and a question to take away. A symbolic reading, not a prediction.`,
  };
}

export default async function NumberMeaning({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const value = Number(n);
  if (!(ALL_VALUES as readonly number[]).includes(value)) notFound();
  const life = readLife();
  const themes = readCore().themes;
  const theme = themes[n];
  const road = life.core.lifePath[n];
  if (!road || !theme) notFound();

  const index = ALL_VALUES.indexOf(value as (typeof ALL_VALUES)[number]);
  const prev = ALL_VALUES[(index + ALL_VALUES.length - 1) % ALL_VALUES.length] as number;
  const next = ALL_VALUES[(index + 1) % ALL_VALUES.length] as number;
  const pinnacle = life.pinnacles[n];

  return (
    <article className="mx-auto max-w-4xl px-5 py-14">
      <Link href="/numbers" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink-strong">
        All the numbers
      </Link>
      <header className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
        <div className={`tint-${rootOf(value)} hue-${rootOf(value)} flex min-w-44 items-center justify-center rounded-xl border border-line border-t-[3px] border-t-[var(--hue)] px-8 py-8`}>
          <span className="numeral numeral-hue text-9xl">
            {value}
            {value > 9 ? <span className="text-5xl text-muted">/{rootOf(value)}</span> : null}
          </span>
        </div>
        <div>
          <p className="eyebrow mb-3">Numerology</p>
          <h1 className="text-5xl">The number {value}</h1>
          <p className="mt-4 text-lg text-muted">
            A theme of {theme.activity}.{value > 9 ? ` A master number: it reduces to ${rootOf(value)}, and the tradition treats it as a heightened version of that theme, not a rank.` : ''}
          </p>
        </div>
      </header>

      <div className="reading mt-14 space-y-9">
        {SECTIONS.map(([id, title]) => (
          <section key={id} aria-labelledby={`m-${id}`}>
            <h2 id={`m-${id}`} className="section-title mb-2">
              {title}
            </h2>
            <p className="text-[1.08rem] leading-relaxed">{road[id]}</p>
          </section>
        ))}
      </div>

      <section className="mt-16 border-t border-line pt-10" aria-labelledby="lenses-title">
        <h2 id="lenses-title" className="text-3xl">
          The same number in different places
        </h2>
        <p className="mt-3 max-w-[56ch] text-muted">A {value} reads differently depending on where it turns up in a profile.</p>
        <dl className="mt-8 space-y-6">
          {LENSES.slice(1).map(([key, title]) => {
            const entry = life.core[key]?.[n];
            if (!entry) return null;
            return (
              <div key={key} className="reading border-b border-line pb-6">
                <dt className="section-title mb-2">{title}</dt>
                <dd className="text-[1.02rem] leading-relaxed">{entry.overview}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      {pinnacle ? (
        <section className="mt-12" aria-labelledby="pin-title">
          <h2 id="pin-title" className="section-title mb-2">
            As a pinnacle
          </h2>
          <p className="reading text-[1.02rem] leading-relaxed">{pinnacle.theme}</p>
        </section>
      ) : null}

      <section className="mt-12" aria-labelledby="pairs-title" data-testid="number-pairs">
        <h2 id="pairs-title" className="section-title mb-2">
          Side by side with another number
        </h2>
        <p className="max-w-[60ch] text-sm text-muted">
          What a {value} tends to bring next to each of the other numbers, and where each may stretch.{value > 9 ? ` A master number uses its root, ${rootOf(value)}, for pairs.` : ''}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((other) => (
            <li key={other}>
              <Link
                href={`/between/${pairSlug(value, other)}`}
                aria-label={cap(`${numberWithArticle(String(rootOf(value)))} and ${numberWithArticle(String(other))}`)}
                className={`tint-${other} inline-flex min-h-11 min-w-16 items-center justify-center rounded-md border border-line px-3 font-mono text-sm text-ink-strong hover:border-[var(--primary)]`}
              >
                {rootOf(value)}·{other}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-flat mt-16 flex flex-wrap items-center justify-between gap-5 p-7">
        <div>
          <h2 className="font-serif text-2xl text-ink-strong">Where does a {value} turn up for you?</h2>
          <p className="mt-1 text-sm text-muted">Work out your own numbers, with the arithmetic shown. Nothing you type leaves your browser.</p>
        </div>
        <Link href="/" className="btn">
          Work out my numbers
        </Link>
      </section>

      <nav aria-label="Other numbers" className="mt-10 flex items-center justify-between border-t border-line pt-6 text-sm">
        <Link href={`/numbers/${prev}`} className="flex min-h-11 items-center text-muted hover:text-ink-strong">
          Number {prev}
        </Link>
        <Link href={`/numbers/${next}`} className="flex min-h-11 items-center text-muted hover:text-ink-strong">
          Number {next}
        </Link>
      </nav>
      <Disclaimer className="mt-10" />
    </article>
  );
}
