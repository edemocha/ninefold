'use client';

import { composeNameGrid } from '@numerology/composer';
import { AppLink } from '@/components/app-link';
import { LayerGate } from '@/components/layer-gate';
import { BigNumber, ConventionChips, WhyThisNumber } from '@/components/number';
import { useProfile } from '@/lib/profile-context';

/** Classic grid layout: 3 6 9 over 2 5 8 over 1 4 7. */
const GRID_ORDER = [3, 6, 9, 2, 5, 8, 1, 4, 7];

export default function GridPage() {
  const { names, conventions } = useProfile();
  if (!names) return null;

  if (!names.ok) {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl">Name grid</h1>
        <p className="card-flat p-6 text-sm">{names.issues[0]?.message ?? 'The grid needs a valid birth name.'}</p>
      </div>
    );
  }
  const name = names;

  return (
    <div className="space-y-12">
      <header className="rise space-y-3">
        <p className="eyebrow">Birth name, letter by letter</p>
        <h1 className="text-4xl sm:text-5xl">Name grid</h1>
        <p className="max-w-[62ch] text-muted">
          Every letter has a value from 1 to 9, repeating after I. Vowels and consonants are shaded differently, and the grid below counts how often each value appears.
        </p>
        <ConventionChips kind="soulUrge" conventions={conventions} />
      </header>

      <section aria-labelledby="letters-title" className="space-y-5">
        <h2 id="letters-title" className="section-title">
          Letters and values
        </h2>
        <div className="space-y-4">
          {name.parts.map((word, part) => (
            <div key={`${word}-${part}`}>
              <p className="mb-1.5 font-mono text-xs text-muted">{word}</p>
              <ul className="flex flex-wrap gap-1.5" aria-label={`Letters of ${word}`}>
                {name.grid.letters
                  .filter((l) => l.part === part)
                  .map((l, i) => (
                    <li
                      key={`${l.letter}-${i}`}
                      aria-label={`${l.letter}, value ${l.value}, ${l.kind}`}
                      className={`flex size-12 flex-col items-center justify-center rounded-md border border-line ${l.kind === 'vowel' ? 'tint-3' : 'tint-5'}`}
                    >
                      <span className="font-serif text-lg leading-none text-ink-strong">{l.letter}</span>
                      <span className="mt-0.5 font-mono text-[0.7rem] text-muted">{l.value}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="tint-3 inline-block size-4 rounded-sm border border-line" /> vowel
          </span>
          <span className="flex items-center gap-2">
            <span className="tint-5 inline-block size-4 rounded-sm border border-line" /> consonant
          </span>
          {conventions.yRule === 'vowel-if-alone' ? <span>Y counts as a vowel when it is the only vowel in its word.</span> : <span>Y counts as a consonant.</span>}
        </p>
      </section>

      <section aria-labelledby="grid-title" className="space-y-5">
        <h2 id="grid-title" className="section-title">
          How often each number appears
        </h2>
        <div className="grid max-w-md grid-cols-3 gap-3" role="list" aria-label="Counts for each number from 1 to 9">
          {GRID_ORDER.map((n) => {
            const count = name.grid.counts[n] as number;
            const missing = count === 0;
            const passion = name.passion.includes(n);
            return (
              <div
                key={n}
                role="listitem"
                aria-label={`${n}: ${count} ${count === 1 ? 'time' : 'times'}${missing ? ', missing' : ''}${passion ? ', appears most often' : ''}`}
                className={`rounded-lg border p-3 hue-${n} ${missing ? 'border-dashed border-line-strong bg-transparent' : passion ? `tint-${n} border-[var(--hue)] border-2` : `tint-${n} border-line`}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="numeral numeral-hue text-3xl">{n}</span>
                  <span className="font-mono text-xs text-muted">{count}×</span>
                </div>
                <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wider text-muted">
                  {missing ? 'missing' : passion ? 'most often' : `${name.grid.vowelCounts[n]}v · ${name.grid.consonantCounts[n]}c`}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <LayerGate layers={['life']}>
        {(bank) => {
          const grid = composeNameGrid(bank, name);
          return (
            <>
              <section aria-labelledby="lessons-title" className="space-y-5">
                <h2 id="lessons-title" className="text-2xl sm:text-3xl">
                  Karmic lessons: the numbers your name lacks
                </h2>
                {grid.lessons.length === 0 ? (
                  <p className="card-flat p-5 text-sm text-muted">Every number from 1 to 9 appears in your birth name, so there are no missing numbers.</p>
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {grid.lessons.map((l) => (
                      <li key={l.n} className="card p-5">
                        <p className="numeral text-4xl">{l.n}</p>
                        <p className="reading mt-3 text-[1rem] leading-relaxed">{l.text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="passion-title" className="space-y-5">
                <h2 id="passion-title" className="text-2xl sm:text-3xl">
                  Hidden passion: the number it repeats
                </h2>
                <ul className="grid gap-4 md:grid-cols-2">
                  {grid.passion.map((p) => (
                    <li key={p.n} className="card p-5">
                      <p className="flex items-baseline gap-3">
                        <span className="numeral text-4xl">{p.n}</span>
                        <span className="font-mono text-xs text-muted">{grid.passionCount} times</span>
                      </p>
                      <p className="reading mt-3 text-[1rem] leading-relaxed">{p.text}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section aria-labelledby="sub-title" className="space-y-5">
                <h2 id="sub-title" className="text-2xl sm:text-3xl">
                  Subconscious self
                </h2>
                <div className="card p-5">
                  <p className="flex items-baseline gap-3">
                    <span className="numeral text-5xl">{grid.subconscious.value}</span>
                    <span className="font-mono text-xs text-muted">9 minus {grid.subconscious.missing} missing</span>
                  </p>
                  <p className="reading mt-3 text-[1rem] leading-relaxed">{grid.subconscious.text}</p>
                  <WhyThisNumber steps={grid.subconscious.steps} />
                </div>
              </section>
            </>
          );
        }}
      </LayerGate>

      <section aria-labelledby="name-numbers-title" className="space-y-5">
        <h2 id="name-numbers-title" className="section-title">
          The three name numbers
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              ['expression', 'Expression', name.expression],
              ['soulUrge', 'Soul urge', name.soulUrge],
              ['personality', 'Personality', name.personality],
            ] as const
          ).map(([key, label, result]) => (
            <article key={key} className="card p-5">
              <h3 className="section-title">{label}</h3>
              <p className="mt-3">
                <BigNumber result={result} className="text-6xl" />
              </p>
              <WhyThisNumber steps={result.steps} chain={result.chain} label="reading.showMath" />
              <AppLink to={`/reading/number/${key}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-ink-strong underline-offset-4 hover:underline">
                Read it
              </AppLink>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
