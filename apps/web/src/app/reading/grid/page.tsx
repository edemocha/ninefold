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
  const chaldean = conventions.system === 'chaldean';

  return (
    <div className="space-y-12">
      <header className="rise space-y-3">
        <p className="eyebrow">Birth name, letter by letter</p>
        <h1 className="text-4xl sm:text-5xl">Name grid</h1>
        <p className="max-w-[62ch] text-muted">
          {chaldean
            ? 'Every letter has a value from 1 to 8. The Chaldean table gives no letter the 9, which is held back as a sacred number and only turns up when a total is reduced. Vowels are round and consonants are square, and the grid below counts how often each value appears.'
            : 'Every letter has a value from 1 to 9, repeating after I. Vowels are round and consonants are square, and the grid below counts how often each value appears.'}
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
                      className={`bright-${l.value} flex size-14 flex-col items-center justify-center ${l.kind === 'vowel' ? 'rounded-full' : 'rounded-xl'}`}
                    >
                      <span className="font-display text-xl font-extrabold leading-none text-ink-strong">{l.letter}</span>
                      <span className="mt-0.5 font-mono text-[0.7rem] text-ink-strong">{l.value}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block size-4 rounded-full bg-ink-strong" aria-hidden="true" /> vowel
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block size-4 rounded-md bg-ink-strong" aria-hidden="true" /> consonant
          </span>
          {conventions.yRule === 'vowel-if-alone' ? <span>Y counts as a vowel when it is the only vowel in its word.</span> : <span>Y counts as a consonant.</span>}
        </p>
      </section>

      <section aria-labelledby="grid-title" className="space-y-5">
        <h2 id="grid-title" className="section-title">
          How often each number appears
        </h2>
        <div className="grid max-w-md grid-cols-3 gap-3" role="list" aria-label={chaldean ? 'Counts for each number from 1 to 8, with the 9 held back' : 'Counts for each number from 1 to 9'}>
          {GRID_ORDER.map((n) => {
            if (chaldean && n === 9) {
              return (
                <div key={n} role="listitem" aria-label="9: not given to any letter in the Chaldean table" className="hue-9 rounded-2xl border-[3px] border-dashed border-line-strong p-3">
                  <span className="numeral numeral-hue text-3xl">9</span>
                  <p className="mt-2 text-xs font-semibold text-muted">held back</p>
                </div>
              );
            }
            const count = name.grid.counts[n] as number;
            const missing = count === 0;
            const passion = name.passion.includes(n);
            return (
              <div
                key={n}
                role="listitem"
                aria-label={`${n}: ${count} ${count === 1 ? 'time' : 'times'}${missing ? ', missing' : ''}${passion ? ', appears most often' : ''}`}
                className={`rounded-2xl border-[3px] p-3 hue-${n} ${missing ? 'border-dashed border-line-strong bg-transparent' : passion ? 'border-ink-strong bg-hue-n' : 'border-transparent bg-hue-n'}`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="numeral numeral-hue text-3xl">{n}</span>
                  <span className="font-mono text-xs text-muted">{count}×</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-muted">
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
                      <li key={l.n} className={`card card-hue hue-${l.n} p-5`}>
                        <p><span className="numeral inline-block rounded-2xl bg-hue-b px-4 py-2 text-4xl">{l.n}</span></p>
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
                    <li key={p.n} className={`card card-hue hue-${p.n} p-5`}>
                      <p className="flex items-center gap-3">
                        <span className="numeral inline-block rounded-2xl bg-hue-b px-4 py-2 text-4xl">{p.n}</span>
                        <span className="text-xs font-medium text-muted">{grid.passionCount} times</span>
                      </p>
                      <p className="reading mt-3 text-[1rem] leading-relaxed">{p.text}</p>
                    </li>
                  ))}
                </ul>
              </section>

              {chaldean ? null : (
              <section aria-labelledby="sub-title" className="space-y-5">
                <h2 id="sub-title" className="text-2xl sm:text-3xl">
                  Subconscious self
                </h2>
                <div className={`card card-hue hue-${grid.subconscious.value} p-5`}>
                  <p className="flex items-center gap-3">
                    <span className="numeral inline-block rounded-2xl bg-hue-b px-5 py-2 text-5xl">{grid.subconscious.value}</span>
                    <span className="text-xs font-medium text-muted">9 minus {grid.subconscious.missing} missing</span>
                  </p>
                  <p className="reading mt-3 text-[1rem] leading-relaxed">{grid.subconscious.text}</p>
                  <WhyThisNumber steps={grid.subconscious.steps} />
                </div>
              </section>
              )}
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
            <article key={key} className={`card card-hue hue-${result.root} p-5`}>
              <h3 className="section-title">{label}</h3>
              <p className="mt-3">
                <BigNumber result={result} tile className="text-6xl" />
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
