import type { Metadata } from 'next';
import Link from '@/components/link';
import { notFound } from 'next/navigation';
import { cap, composePlanet, composeShadow, COMPOUND_TITLES, numberWithArticle, type Bank } from '@numerology/composer';
import { COMPOUNDS } from '@numerology/content';
import { Disclaimer } from '@/components/disclaimer';
import { Icon } from '@/components/icon';
import { ShadowDetail } from '@/components/shadow-detail';
import { readCore, readLife } from '@/lib/content-fs';
import { ALL_VALUES, digitalRootOf, pairSlug, rootOf } from '@/lib/site';

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
  const bank: Bank = { core: readCore(), life };
  const shadow = composeShadow(bank, { value, root: rootOf(value) });
  const planet = value <= 9 ? composePlanet(bank, value) : undefined;
  const compounds = COMPOUNDS.filter((c) => digitalRootOf(c) === rootOf(value));

  return (
    <article className="mx-auto max-w-4xl px-5 py-14">
      <Link href="/numbers" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold text-ink-strong hover:bg-mark">
        <Icon name="left" size={14} /> All the numbers
      </Link>
      <header className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
        <div className={`bright-${rootOf(value)} flex min-w-48 items-center justify-center rounded-3xl px-10 py-9`}>
          <span className="numeral text-9xl">
            {value}
            {value > 9 ? <span className="text-5xl">/{rootOf(value)}</span> : null}
          </span>
        </div>
        <div>
          <h1 className="text-[clamp(2.6rem,6vw,4.5rem)]">The number {value}</h1>
          <p className="mt-4 max-w-[52ch] text-lg text-ink">
            A theme of {theme.activity}.{value > 9 ? ` A master number: it reduces to ${rootOf(value)}, and the tradition treats it as a heightened version of that theme, not a rank.` : ''}
          </p>
        </div>
      </header>

      <div className={`reading hue-${rootOf(value)} mt-12 grid gap-3 md:grid-cols-2`}>
        {SECTIONS.map(([id, title], i) => (
          <section key={id} aria-labelledby={`m-${id}`} className={`rounded-3xl p-6 sm:p-7 ${i === 0 ? 'bg-hue-n md:col-span-2' : 'bg-surface-2'}`}>
            <h2 id={`m-${id}`} className="section-title mb-2">
              {title}
            </h2>
            <p className={i === 0 ? 'max-w-[62ch] text-[1.15rem] leading-relaxed' : 'text-[1.02rem] leading-relaxed'}>{road[id]}</p>
          </section>
        ))}
      </div>

      {shadow ? (
        <div className="mt-14">
          <ShadowDetail shadow={shadow} root={rootOf(value)} headingLevel={2} />
        </div>
      ) : null}

      <section className="mt-14" aria-labelledby="chaldean-title" data-testid="number-chaldean">
        <h2 id="chaldean-title" className="text-3xl sm:text-4xl">
          In the Chaldean tradition
        </h2>
        {planet ? <p className="reading mt-3 max-w-[62ch] text-[1.02rem] leading-relaxed">{planet.text}</p> : null}
        {value > 9 ? (
          <p className="reading mt-3 max-w-[62ch] text-[1.02rem] leading-relaxed">
            The Chaldean tradition has no master numbers. It reads {value} as a compound number that reduces to {rootOf(value)}, with a traditional image of its own.
          </p>
        ) : null}
        <p className="mt-4 max-w-[62ch] text-sm text-muted">The compound numbers that reduce to {rootOf(value)}:</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {compounds.map((c) => (
            <li key={c}>
              <Link href={`/chaldean/${c}`} aria-label={`${c}, ${COMPOUND_TITLES[c]}`} className={`bright-${digitalRootOf(c)} tile inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold`}>
                <span className="font-display text-lg font-extrabold">{c}</span>
                <span className="font-medium">{COMPOUND_TITLES[c]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20" aria-labelledby="lenses-title">
        <h2 id="lenses-title" className="text-3xl sm:text-4xl">
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
                className={`bright-${other} tile inline-flex min-h-11 min-w-16 items-center justify-center rounded-full px-4 font-mono text-sm font-medium`}
              >
                {rootOf(value)}·{other}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-flat mt-16 flex flex-wrap items-center justify-between gap-5 p-7 sm:p-9">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-strong">Where does a {value} turn up for you?</h2>
          <p className="mt-1 text-sm text-muted">Work out your own numbers, with the arithmetic shown. Nothing you type leaves your browser.</p>
        </div>
        <Link href="/" className="btn">
          Work out my numbers
        </Link>
      </section>

      <nav aria-label="Other numbers" className="mt-10 flex items-center justify-between gap-3 text-sm">
        <Link href={`/numbers/${prev}`} className={`bright-${rootOf(prev)} tile inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold`}>
          <Icon name="left" size={14} /> Number {prev}
        </Link>
        <Link href={`/numbers/${next}`} className={`bright-${rootOf(next)} tile inline-flex min-h-11 items-center gap-2 rounded-full px-5 font-semibold`}>
          Number {next} <Icon name="right" size={14} />
        </Link>
      </nav>
      <Disclaimer className="mt-10" />
    </article>
  );
}
