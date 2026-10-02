import Link from '@/components/link';
import { ProfileForm } from '@/components/profile-form';
import { t } from '@/lib/t';

/** What it works out, in the order the reading tabs come. */
const CONTENTS = [
  { n: '1', title: 'Core profile', text: 'Life path, expression, soul urge, personality, birth day and maturity, with karmic debt flags.' },
  { n: '2', title: 'Name grid', text: 'Your letters, vowels against consonants, the numbers your name lacks and the one it repeats.' },
  { n: '3', title: 'Life timeline', text: 'Four pinnacles and four challenges on an age axis. Drag the marker to any age from 0 to 100.' },
  { n: '4', title: 'Year, month and day', text: 'A personal year with twelve month tiles, a calendar of personal days and a short card for any date.' },
  { n: '5', title: 'Between us', text: 'Add someone to see two life paths side by side, and the fixed gap between your cycles, with the arithmetic. No score, only things to talk about.' },
];

/**
 * A real calculation, for the person the build plan uses as its example, so the
 * first thing a visitor sees is the product's one idea: the working is shown.
 * It matches what the app produces for 17 June 1985 under the default rule.
 */
const WORKING = [
  { label: 'Day', given: '17', working: '1 + 7 = 8' },
  { label: 'Month', given: 'June', working: '6' },
  { label: 'Year', given: '1985', working: '1 + 9 + 8 + 5 = 23 → 5' },
  { label: 'Add', given: '', working: '8 + 6 + 5 = 19 → 10 → 1' },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <section className="grid gap-14 pb-16 pt-12 lg:grid-cols-[1fr_27rem] lg:items-start lg:pt-16">
        <div>
          <p className="eyebrow mb-6">Numerology, with the working shown</p>
          <h1 className="max-w-[13ch] text-5xl sm:text-6xl lg:text-[4.5rem]">{t('form.title')}</h1>
          <p className="mt-6 max-w-[46ch] font-serif text-[1.2rem] leading-relaxed text-ink">{t('form.intro')}</p>

          <figure className="mt-12 max-w-[34rem]" aria-labelledby="example-caption">
            <figcaption id="example-caption" className="mb-2 flex items-baseline justify-between border-b-2 border-ink-strong pb-1.5 font-mono text-sm text-ink-strong">
              <span>Life path, worked out</span>
              <span className="text-muted">17 June 1985</span>
            </figcaption>
            <table className="w-full border-collapse text-left font-mono text-[0.95rem]">
              <tbody>
                {WORKING.map((row) => (
                  <tr key={row.label} className="border-b border-line align-baseline">
                    <th scope="row" className="w-28 py-2 pr-3 font-normal text-muted">
                      {row.label}
                    </th>
                    <td className="w-20 py-2 pr-3 text-ink-strong">{row.given}</td>
                    <td className="py-2 text-ink-strong">{row.working}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="py-3 pr-3 align-baseline font-normal text-muted">
                    Life path
                  </th>
                  <td colSpan={2} className="py-3">
                    <span className="numeral bg-mark px-2 text-6xl">1</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-sm text-muted">Yours is worked out the same way, and every convention behind it can be changed.</p>
          </figure>
        </div>

        <div>
          <ProfileForm />
        </div>
      </section>

      <section className="border-t-2 border-ink-strong py-14" aria-labelledby="contents-title">
        <h2 id="contents-title" className="text-3xl sm:text-4xl">
          What it works out
        </h2>
        <ol className="mt-8 border-t border-ink-strong">
          {CONTENTS.map((row) => (
            <li key={row.n} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-line py-4 sm:grid-cols-[3rem_14rem_1fr]">
              <span className="numeral text-3xl text-muted" aria-hidden="true">
                {row.n}
              </span>
              <h3 className="font-serif text-xl">{row.title}</h3>
              <p className="col-start-2 mt-1 max-w-[52ch] text-[0.98rem] text-ink sm:col-start-3 sm:mt-0">{row.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t-2 border-ink-strong py-14" aria-labelledby="honest-title">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <h2 id="honest-title" className="text-3xl sm:text-4xl">
            What this is, and is not
          </h2>
          <div className="reading space-y-4">
            <p>
              Numerology is a symbolic tradition. The numbers carry very little information: on any given day, every birthday lands on one of nine personal-day numbers. People rate general statements about themselves as accurate
              whether or not they were written for them, so the readings here ask questions instead of making claims.
            </p>
            <p>
              There is no credible controlled evidence that numerology predicts anything. Use it to reflect, or for fun, and not to decide anything about health, money, legal matters or relationships.
            </p>
            <p>
              <Link href="/method" className="underline underline-offset-4 hover:text-accent">
                See exactly how each number is worked out
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
