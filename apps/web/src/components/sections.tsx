import type { ReadingSection } from '@numerology/composer';

/** Titled paragraphs, one per section. Sections are plain text from the content bank. */
export function Sections({ sections, headingLevel = 3 }: { sections: ReadingSection[]; headingLevel?: 2 | 3 | 4 }) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  return (
    <div className="reading space-y-7">
      {sections.map((s) => (
        <section key={s.id} aria-labelledby={`sec-${s.id}`}>
          <Heading id={`sec-${s.id}`} className="section-title mb-2">
            {s.title}
          </Heading>
          <p className="text-[1.05rem] leading-relaxed text-ink">{s.text}</p>
        </section>
      ))}
    </div>
  );
}
