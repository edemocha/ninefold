import { numberWithArticle, type ShadowReading } from '@numerology/composer';

type Lens = { key: string; title: string; text: string };

/**
 * The shadow of one number in eleven parts. Where it comes from, how it sounds
 * and how it shows are set in two columns; the gift and the practice are set
 * apart, because they are what to take away. Plain markup, so a page can render
 * it at build time or in the browser.
 */
export function ShadowDetail({
  shadow,
  root,
  lenses = [],
  headingLevel = 3,
  idPrefix = '',
}: {
  shadow: ShadowReading;
  root: number;
  lenses?: Lens[];
  headingLevel?: 2 | 3;
  idPrefix?: string;
}) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3';
  const Sub = `h${headingLevel + 1}` as 'h3' | 'h4';
  const body = shadow.sections.filter((s) => s.id !== 'gift' && s.id !== 'practice');
  const gift = shadow.sections.find((s) => s.id === 'gift');
  const practice = shadow.sections.find((s) => s.id === 'practice');

  return (
    <article className={`hue-${root} rounded-3xl bg-hue-n p-5 sm:p-8`} data-testid={`shadow-${shadow.value}`} aria-labelledby={`${idPrefix}shadow-title-${shadow.value}`}>
      <header className="flex flex-wrap items-center gap-4">
        <span className="numeral inline-block rounded-3xl bg-hue-b px-5 py-3 text-6xl" aria-hidden="true">
          {shadow.display}
        </span>
        <div>
          <Heading id={`${idPrefix}shadow-title-${shadow.value}`} className="text-3xl sm:text-4xl">
            The shadow of {numberWithArticle(String(shadow.value))}
          </Heading>
        </div>
      </header>

      {lenses.length > 0 ? (
        <ul className="mt-5 space-y-1.5 text-[0.98rem] text-ink-strong" aria-label="Where this number turns up for you">
          {lenses.map((lens) => (
            <li key={lens.key} data-lens={lens.title}>
              {lens.text}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="reading mt-7 grid gap-x-8 gap-y-6 md:grid-cols-2">
        {body.map((s) => (
          <section key={s.id} data-testid={`shadow-part-${s.id}`}>
            <Sub className="section-title mb-1.5">{s.title}</Sub>
            <p className="text-[1.02rem] leading-relaxed text-ink">{s.text}</p>
          </section>
        ))}
      </div>

      {gift ? (
        <div className="mt-8 rounded-2xl bg-hue-b p-5 sm:p-6" data-testid="shadow-part-gift">
          <Sub className="section-title mb-1.5">{gift.title}</Sub>
          <p className="reading text-[1.05rem] leading-relaxed text-ink-strong">{gift.text}</p>
        </div>
      ) : null}

      {practice ? (
        <div className="mt-4 rounded-2xl border-2 border-ink-strong bg-white p-5 sm:p-6" data-testid="shadow-part-practice">
          <Sub className="section-title mb-1.5">{practice.title}</Sub>
          <p className="reading text-[1.05rem] leading-relaxed text-ink-strong">{practice.text}</p>
        </div>
      ) : null}
    </article>
  );
}
