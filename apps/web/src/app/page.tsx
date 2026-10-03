import Link from '@/components/link';
import { ProfileForm } from '@/components/profile-form';
import { readCore } from '@/lib/content-fs';
import { t } from '@/lib/t';

/** What it works out, in the order the reading tabs come. Each card borrows one colour from the palette. */
const CONTENTS = [
  { hue: 7, span: 'lg:col-span-4', title: 'Core profile', text: 'Life path, expression, soul urge, personality, birth day and maturity, each with the arithmetic behind it and, in the Chaldean tradition, its compound number.' },
  { hue: 3, span: 'lg:col-span-2', title: 'Name grid', text: 'Your letters, vowels against consonants, the numbers your name lacks and the one it repeats.' },
  { hue: 8, span: 'lg:col-span-3', title: 'Chaldean compounds', text: 'Every total from 10 to 52 has an image and a reading, from the Wheel of Fortune to the Sceptre. Yours come with the name and date you enter.' },
  { hue: 1, span: 'lg:col-span-3', title: 'Your shadows, in detail', text: 'Eleven parts for each of your numbers: where the shadow comes from, how it sounds, how it shows at work and at home, and a seven-day practice.' },
  { hue: 5, span: 'lg:col-span-2', title: 'Life timeline', text: 'Four pinnacles and four challenges on an age axis. Drag the marker to any age from 0 to 100.' },
  { hue: 2, span: 'lg:col-span-2', title: 'Year, month and day', text: 'A personal year with twelve month tiles, a calendar of personal days and a short card for any date.' },
  { hue: 9, span: 'lg:col-span-2', title: 'Between us', text: 'Add someone to see two life paths side by side, and the fixed gap between your cycles, with the arithmetic. No score, only things to talk about.' },
];

/**
 * A real calculation, for the person the build plan uses as its example, so the
 * first thing a visitor sees is the product's one idea: the working is shown.
 * It matches what the app produces for 17 June 1985 in the Chaldean tradition,
 * the default: every digit in one flat sum, 37, then 10, then 1.
 */
const WORKING: { label: string; given: string; working: string; result?: number }[] = [
  { label: 'Day', given: '17', working: '1 + 7 =', result: 8 },
  { label: 'Month', given: 'June', working: '', result: 6 },
  { label: 'Year', given: '1985', working: '1 + 9 + 8 + 5 = 23' },
  { label: 'Add', given: '', working: '8 + 6 + 23 = 37 → 3 + 7 = 10 →', result: 1 },
];

/** The headline's own words, with the middle phrase marked like a highlighter stroke. */
function Headline() {
  const title = t('form.title');
  const phrase = 'worked out';
  const at = title.indexOf(phrase);
  if (at < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, at)}
      <span className="rounded-[0.16em] bg-b3 px-[0.12em] [box-decoration-break:clone]">{phrase}</span>
      {title.slice(at + phrase.length)}
    </>
  );
}

export default function HomePage() {
  const themes = readCore().themes;
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-4 sm:pt-8">
        <h1 className="max-w-[18ch] text-[clamp(2.6rem,7vw,5.6rem)] leading-[1] sm:max-w-[24ch]">
          <Headline />
        </h1>

        <div className="mt-10 grid gap-x-10 gap-y-10 lg:grid-cols-[1fr_28rem] lg:grid-rows-[auto_1fr] lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="max-w-[40ch] text-xl font-medium leading-snug text-ink-strong sm:text-2xl">{t('site.tagline')}</p>
            <p className="mt-3 max-w-[44ch] text-[1.02rem] text-muted">Starts in the Chaldean tradition, with Pythagorean one click away.</p>
          </div>

          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <p className="mb-3 max-w-[44ch] text-[0.95rem] text-muted">{t('form.intro')}</p>
            <ProfileForm />
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <figure className="rounded-3xl bg-surface-2 p-5 sm:p-7" aria-labelledby="example-caption">
              <figcaption id="example-caption" className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-display text-xl font-bold tracking-tight text-ink-strong">Life path, worked out</span>
                <span className="font-mono text-sm text-muted">17 June 1985</span>
              </figcaption>
              <table className="mt-4 w-full border-collapse text-left">
                <tbody>
                  {WORKING.map((row) => (
                    <tr key={row.label} className="border-t border-line align-middle">
                      <th scope="row" className="w-[4.5rem] py-3 pr-2 text-sm font-semibold text-muted sm:w-24">
                        {row.label}
                      </th>
                      <td className="w-14 py-3 pr-2 font-mono text-[0.95rem] text-ink-strong sm:w-20">{row.given}</td>
                      <td className="py-3 font-mono text-[0.95rem] text-ink-strong">
                        <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                          {row.working}
                          {row.result !== undefined ? (
                            <span className={`bright-${row.result} inline-flex size-9 items-center justify-center rounded-xl font-display text-xl font-extrabold`}>{row.result}</span>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bright-1 mt-2 flex items-center gap-5 rounded-2xl px-5 py-4">
                <span className="numeral text-7xl">1</span>
                <div>
                  <p className="font-display text-xl font-bold tracking-tight">Life path 1</p>
                  <p className="text-sm">Compound 37, the good friend. Yours is worked out the same way, and every convention behind it can be changed.</p>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="nine-title">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2 id="nine-title" className="max-w-[16ch] text-4xl sm:text-5xl">
            Nine numbers, nine colours
          </h2>
          <p className="max-w-[40ch] text-muted">Each number keeps its colour on every screen. Tap one to read what it is about.</p>
        </div>
        <ul className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <li key={n} className="flex">
              <Link
                href={`/numbers/${n}`}
                aria-label={`Number ${n}: ${themes[String(n)]?.activity ?? ''}`}
                className={`bright-${n} tile flex min-h-40 w-full flex-col justify-between p-4 lg:min-h-52`}
              >
                <span className="numeral text-6xl lg:text-7xl">{n}</span>
                <span className="text-[0.82rem] font-medium leading-snug">{themes[String(n)]?.activity}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted">
          Master numbers 11, 22 and 33 are covered too.{' '}
          <Link href="/numbers" className="font-semibold text-ink-strong underline underline-offset-4 hover:text-accent">
            See all twelve
          </Link>
        </p>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="contents-title">
        <h2 id="contents-title" className="text-4xl sm:text-5xl">
          What it works out
        </h2>
        <ol className="mt-8 grid gap-3 lg:grid-cols-6">
          {CONTENTS.map((row) => (
            <li key={row.title} className={`hue-${row.hue} relative flex min-h-64 flex-col justify-end overflow-hidden rounded-3xl bg-hue-n p-6 pt-28 sm:p-7 sm:pt-28 ${row.span}`}>
              <span className="absolute -right-8 -top-8 size-32 rounded-full bg-hue-b" aria-hidden="true" />
              <h3 className="relative text-2xl">{row.title}</h3>
              <p className="relative mt-2 max-w-[46ch] text-[0.98rem] text-ink">{row.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5" aria-labelledby="honest-title">
        <div className="grid gap-8 rounded-3xl bg-surface-2 p-7 sm:p-10 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <h2 id="honest-title" className="text-4xl sm:text-5xl">
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
              <Link href="/method" className="font-semibold text-ink-strong underline underline-offset-4 hover:text-accent">
                See exactly how each number is worked out
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
