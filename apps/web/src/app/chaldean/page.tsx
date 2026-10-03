import type { Metadata } from 'next';
import Link from '@/components/link';
import { COMPOUND_TITLES, PLANET_NAMES } from '@numerology/composer';
import { COMPOUNDS } from '@numerology/content';
import { Disclaimer } from '@/components/disclaimer';
import { digitalRootOf } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Chaldean numerology: the letter table, the planets and the 43 compound numbers',
  description:
    'The older tradition: eight groups of letters with the 9 held back, a planet for each digit, and the compound numbers from 10 to 52 with their traditional images and their shadow side. A symbolic reading, not a prediction.',
};

const TABLE: [number, string][] = [
  [1, 'A I J Q Y'],
  [2, 'B K R'],
  [3, 'C G L S'],
  [4, 'D M T'],
  [5, 'E H N X'],
  [6, 'U V W'],
  [7, 'O Z'],
  [8, 'F P'],
];

const NAME_ROWS = [
  { word: 'AMELIA', letters: 'A1 M4 E5 L3 I1 A1', sum: 15 },
  { word: 'ROSE', letters: 'R2 O7 S3 E5', sum: 17 },
  { word: 'CARTER', letters: 'C3 A1 R2 T4 E5 R2', sum: 17 },
];

export default function ChaldeanIndex() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-6 pt-6 sm:pt-10">
      <h1 className="max-w-[16ch] text-[clamp(2.6rem,6.5vw,5rem)]">Chaldean numerology</h1>
      <p className="mt-5 max-w-[60ch] text-lg text-muted">
        The older of the two traditions this site reads in, and the one it starts with. It has a different letter table, no master numbers, and a set of compound numbers from 10 to 52, each with a traditional image and a
        shadow side.
      </p>
      <p className="mt-4 max-w-[60ch] text-muted">
        The name points to Babylon, but no ancient text sets the system out. The version used today was written down in the early 1900s, by authors such as Cheiro and Sepharial. Treat it as a symbolic tradition for reflection, not as a
        record of anything old or true.
      </p>

      <section className="mt-14" aria-labelledby="table-title">
        <h2 id="table-title" className="text-3xl sm:text-4xl">
          The letter table
        </h2>
        <p className="mt-3 max-w-[60ch] text-muted">
          Eight groups of letters, and no letter for 9. The tradition holds the 9 back as a sacred number, so it only turns up when a total is reduced.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="letter-table">
          {TABLE.map(([n, letters]) => (
            <li key={n} className={`bright-${n} rounded-3xl p-5`}>
              <span className="numeral text-5xl">{n}</span>
              <p className="mt-2 font-mono text-lg font-medium tracking-widest">{letters}</p>
            </li>
          ))}
          <li className="rounded-3xl border-[3px] border-dashed border-line-strong p-5">
            <span className="numeral numeral-hue hue-9 text-5xl">9</span>
            <p className="mt-2 text-[0.95rem] font-medium text-ink-strong">Held back, no letter</p>
          </li>
        </ul>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-2" aria-labelledby="working-title">
        <div>
          <h2 id="working-title" className="text-3xl sm:text-4xl">
            How a name is worked out
          </h2>
          <p className="mt-3 text-muted">
            Every letter of the whole name is added once. The total is the compound number, and the compound is then reduced to a single digit. The tradition reads the name you are known by.
          </p>
          <table className="mt-5 w-full border-collapse text-left" data-testid="name-example">
            <caption className="mb-2 text-left text-sm font-semibold text-muted">Amelia Rose Carter</caption>
            <tbody>
              {NAME_ROWS.map((row) => (
                <tr key={row.word} className="border-t border-line align-baseline">
                  <th scope="row" className="py-2 pr-3 font-mono text-sm font-medium text-ink-strong">
                    {row.word}
                  </th>
                  <td className="py-2 pr-3 font-mono text-sm text-ink">{row.letters}</td>
                  <td className="py-2 text-right font-mono text-sm font-medium text-ink-strong">{row.sum}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-ink-strong">
                <th scope="row" className="py-2 pr-3 text-sm font-semibold text-ink-strong">
                  Whole name
                </th>
                <td className="py-2 pr-3 font-mono text-sm text-ink">15 + 17 + 17</td>
                <td className="py-2 text-right font-mono text-sm font-medium text-ink-strong">49</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-[0.95rem] text-ink">
            49 is the compound number. It reduces to 13, then to <strong>4</strong>. In the tradition 49 carries the reading of{' '}
            <Link href="/chaldean/31" className="font-semibold text-ink-strong underline underline-offset-4 hover:text-accent">
              31, the recluse
            </Link>
            .
          </p>
        </div>
        <div>
          <h2 className="text-3xl sm:text-4xl">How a date is worked out</h2>
          <p className="mt-3 text-muted">
            Every digit of the whole date is added in one flat sum, with no master numbers. The sum is the compound number again, and the day of the month on its own gives a second compound.
          </p>
          <div className="mt-5 rounded-3xl bg-surface-2 p-5 sm:p-6">
            <p className="text-sm font-semibold text-muted">17 June 1985</p>
            <p className="mt-2 font-mono text-[0.95rem] text-ink-strong">1 + 7 + 6 + 1 + 9 + 8 + 5 = 37</p>
            <p className="mt-1 font-mono text-[0.95rem] text-ink-strong">37, then 3 + 7 = 10, then 1 + 0 = 1</p>
            <p className="mt-3 text-[0.95rem] text-ink">
              The compound is{' '}
              <Link href="/chaldean/37" className="font-semibold text-ink-strong underline underline-offset-4 hover:text-accent">
                37, the good friend
              </Link>
              , and it reduces to <strong>1</strong>. The birth day, 17, is a compound of its own and reduces to 8.
            </p>
          </div>
          <p className="mt-4 text-sm text-muted">A total above 52 is read at the next total down, so a 64 reads as 10. Where a total is a single digit, there is no compound to read.</p>
        </div>
      </section>

      <section className="mt-16" aria-labelledby="planets-title">
        <h2 id="planets-title" className="text-3xl sm:text-4xl">
          The planets
        </h2>
        <p className="mt-3 max-w-[60ch] text-muted">In Cheiro&apos;s table each digit belongs to a planet. Some later writers swap 4 and 7 for the nodes of the Moon.</p>
        <ul className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9" data-testid="planets">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <li key={n} className={`bright-${n} rounded-3xl p-4`}>
              <span className="numeral text-4xl">{n}</span>
              <p className="mt-1 text-sm font-semibold capitalize">{PLANET_NAMES[n]}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="compounds-title">
        <h2 id="compounds-title" className="text-3xl sm:text-4xl">
          The 43 compound numbers
        </h2>
        <p className="mt-3 max-w-[62ch] text-muted">
          Each total from 10 to 52 has its own image and reading, and the number it reduces to sets its colour. Where the tradition gives a number no image of its own, the title says which reading it carries. Every page gives the shadow side
          in detail.
        </p>
        <ol className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="compound-index">
          {COMPOUNDS.map((n) => (
            <li key={n} className="flex">
              <Link
                href={`/chaldean/${n}`}
                aria-label={`${n}, ${COMPOUND_TITLES[n]}`}
                className={`bright-${digitalRootOf(n)} tile flex min-h-28 w-full flex-col justify-between p-4`}
              >
                <span className="numeral text-4xl">{n}</span>
                <span className="text-[0.82rem] font-medium leading-snug">{COMPOUND_TITLES[n]}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="card-flat mt-16 flex flex-wrap items-center justify-between gap-5 p-7 sm:p-9">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink-strong">Find your own compounds</h2>
          <p className="mt-1 text-sm text-muted">Chaldean is the default here. Your birth name and date give a compound for each of your numbers, with the arithmetic and the shadow shown.</p>
        </div>
        <Link href="/" className="btn">
          Work out my numbers
        </Link>
      </section>
      <Disclaimer className="mt-10" />
    </div>
  );
}
