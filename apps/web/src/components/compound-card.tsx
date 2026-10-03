import type { CompoundReading } from '@numerology/composer';

/**
 * One compound number: its tile, its traditional image and its three readings.
 * The tile takes the colour of the number it reduces to, so a 37 sits with the
 * 1s. Plain markup, so a page can render it at build time or in the browser.
 */
export function CompoundCard({
  reading,
  headingLevel = 3,
  idPrefix = '',
  showTile = true,
}: {
  reading: CompoundReading;
  headingLevel?: 1 | 2 | 3;
  idPrefix?: string;
  showTile?: boolean;
}) {
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3';
  const Sub = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4';
  return (
    <article className={`hue-${reading.root} rounded-3xl bg-hue-n p-5 sm:p-8`} data-testid={`compound-${reading.number}`} aria-labelledby={`${idPrefix}compound-title-${reading.number}`}>
      <header className="flex flex-wrap items-center gap-4">
        {showTile ? (
          <span className="numeral inline-block rounded-3xl bg-hue-b px-5 py-3 text-6xl" aria-hidden="true">
            {reading.number}
          </span>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-ink-strong">
            Compound {reading.number}, reduces to {reading.root}
          </p>
          <Heading id={`${idPrefix}compound-title-${reading.number}`} className={headingLevel === 1 ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}>
            {reading.title}
          </Heading>
        </div>
      </header>
      {reading.echoOf !== undefined ? (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-[0.95rem] text-ink-strong">
          The tradition gives {reading.number} no image of its own. It carries the reading of {reading.echoOf}, with the shade its own digits add.
        </p>
      ) : null}
      <div className="reading mt-6 space-y-5">
        {reading.sections.map((s) => (
          <section key={s.id} aria-labelledby={`${idPrefix}compound-${reading.number}-${s.id}`}>
            <Sub id={`${idPrefix}compound-${reading.number}-${s.id}`} className="section-title mb-1.5">
              {s.title}
            </Sub>
            <p className="text-[1.03rem] leading-relaxed text-ink">{s.text}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
