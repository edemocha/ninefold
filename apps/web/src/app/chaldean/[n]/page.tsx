import type { Metadata } from 'next';
import Link from '@/components/link';
import { notFound } from 'next/navigation';
import { COMPOUND_ECHOES, COMPOUND_TITLES, composeCompound, type Bank } from '@numerology/composer';
import { COMPOUNDS } from '@numerology/content';
import { CompoundCard } from '@/components/compound-card';
import { Disclaimer } from '@/components/disclaimer';
import { Icon } from '@/components/icon';
import { readCore, readLife } from '@/lib/content-fs';

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPOUNDS.map((n) => ({ n: String(n) }));
}

function parse(n: string): number | null {
  const value = Number(n);
  return Number.isInteger(value) && COMPOUNDS.includes(value) ? value : null;
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const value = parse(n);
  if (value === null) return {};
  const title = COMPOUND_TITLES[value] ?? `Compound ${value}`;
  return {
    title: `${value}: ${title}, a Chaldean compound number`,
    description: `The Chaldean tradition reads the total ${value} as ${title.toLowerCase().startsWith('the echo') ? 'an echo of an earlier compound' : `"${title}"`}. What it says, its shadow side in detail, and a question to take away. A symbolic reading, not a prediction.`,
    alternates: { canonical: `/chaldean/${value}` },
  };
}

export default async function CompoundPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const value = parse(n);
  if (value === null) notFound();

  const bank: Bank = { core: readCore(), life: readLife() };
  const reading = composeCompound(bank, value);
  if (!reading) notFound();

  const index = COMPOUNDS.indexOf(value);
  const prev = COMPOUNDS[(index + COMPOUNDS.length - 1) % COMPOUNDS.length] as number;
  const next = COMPOUNDS[(index + 1) % COMPOUNDS.length] as number;
  const echoes = Object.entries(COMPOUND_ECHOES)
    .filter(([, from]) => from === value)
    .map(([k]) => Number(k));

  return (
    <div className="mx-auto max-w-4xl px-5 pb-6 pt-6 sm:pt-10">
      <Link href="/chaldean" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold text-ink-strong hover:bg-mark">
        <Icon name="left" size={14} /> The Chaldean compounds
      </Link>

      <div className="mt-5">
        <CompoundCard reading={reading} headingLevel={1} />
      </div>

      <section className="mt-12 grid gap-3 sm:grid-cols-2" aria-label="Related numbers">
        <Link href={`/numbers/${reading.root}`} className={`bright-${reading.root} tile flex min-h-28 flex-col justify-between p-5`}>
          <span className="text-sm font-semibold">Reduces to {reading.root}</span>
          <span className="font-display text-xl font-bold tracking-tight">Read the number {reading.root}, with its shadow in detail</span>
        </Link>
        <div className="rounded-3xl bg-surface-2 p-5">
          <p className="text-sm font-semibold text-ink-strong">{echoes.length > 0 ? 'Other totals that carry this reading' : reading.echoOf !== undefined ? 'The reading it carries' : 'About the reading'}</p>
          {echoes.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {echoes.map((e) => (
                <li key={e}>
                  <Link href={`/chaldean/${e}`} className="chip">
                    {e}
                  </Link>
                </li>
              ))}
            </ul>
          ) : reading.echoOf !== undefined ? (
            <p className="mt-2 text-[0.95rem]">
              <Link href={`/chaldean/${reading.echoOf}`} className="font-semibold text-ink-strong underline underline-offset-4 hover:text-accent">
                Read {reading.echoOf}, {COMPOUND_TITLES[reading.echoOf]}
              </Link>
            </p>
          ) : (
            <p className="mt-2 text-[0.95rem] text-ink">A symbolic reading from a tradition that is about a century old in its present form. It describes a theme and does not predict anything.</p>
          )}
        </div>
      </section>

      <section className="card-flat mt-12 flex flex-wrap items-center justify-between gap-5 p-7 sm:p-9">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-strong">Does a {value} turn up for you?</h2>
          <p className="mt-1 text-sm text-muted">Work out your own numbers in the Chaldean tradition, with the arithmetic shown. Nothing you type leaves your browser.</p>
        </div>
        <Link href="/" className="btn">
          Work out my numbers
        </Link>
      </section>

      <nav aria-label="Other compound numbers" className="mt-10 flex items-center justify-between gap-3 text-sm">
        <Link href={`/chaldean/${prev}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-5 font-semibold text-ink-strong hover:bg-mark">
          <Icon name="left" size={14} /> {prev}
        </Link>
        <Link href={`/chaldean/${next}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-5 font-semibold text-ink-strong hover:bg-mark">
          {next} <Icon name="right" size={14} />
        </Link>
      </nav>
      <Disclaimer className="mt-10" />
    </div>
  );
}
