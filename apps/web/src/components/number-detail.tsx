'use client';

import { composeNumber, CORE_LABELS } from '@numerology/composer';
import type { ChipKind, CoreKey, Result } from '@numerology/engine';
import { CORE_KEYS } from '@numerology/content';
import { AppLink } from './app-link';
import { CompoundCard } from './compound-card';
import { Icon } from './icon';
import { LayerGate } from './layer-gate';
import { BigNumber, ConventionChips, KarmicFlag, WhyThisNumber } from './number';
import { Sections } from './sections';
import { ShadowDetail } from './shadow-detail';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';

export function NumberDetail({ coreKey }: { coreKey: CoreKey }) {
  const { core, conventions } = useProfile();
  if (!core) return null;
  const result: Result | undefined = core[coreKey];
  const label = CORE_LABELS[coreKey];
  const index = CORE_KEYS.indexOf(coreKey);
  const prev = CORE_KEYS[(index + CORE_KEYS.length - 1) % CORE_KEYS.length] as CoreKey;
  const next = CORE_KEYS[(index + 1) % CORE_KEYS.length] as CoreKey;

  return (
    <article className="space-y-10">
      <header className="rise grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
        <div className="flex min-w-40 items-center justify-center">
          {result ? <BigNumber tile result={result} className="text-9xl" /> : <span className="numeral rounded-3xl bg-surface-2 px-10 py-8 text-7xl text-muted">?</span>}
        </div>
        <div className="space-y-3">
          <AppLink to="/reading" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold text-ink-strong hover:bg-mark">
            <Icon name="left" size={14} /> All core numbers
          </AppLink>
          <h1 className="text-4xl sm:text-5xl">{label.title}</h1>
          <p className="max-w-[56ch] text-muted">{label.lens}</p>
          <div className="flex flex-wrap items-center gap-2">
            <ConventionChips kind={coreKey as ChipKind} conventions={conventions} />
            {result?.karmicDebt ? <KarmicFlag debt={result.karmicDebt} /> : null}
          </div>
        </div>
      </header>

      {result ? (
        <LayerGate layers={['life']}>
          {(bank) => {
            const reading = composeNumber(bank, coreKey, result);
            return (
              <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
                <div className="space-y-10">
                  <Sections sections={reading.sections} />
                  {reading.compound ? <CompoundCard reading={reading.compound} headingLevel={2} idPrefix="nd-" /> : null}
                  {reading.planet && conventions.system === 'chaldean' ? (
                    <p className="reading rounded-3xl bg-surface-2 p-6 text-[1.02rem] leading-relaxed" data-testid="planet-line">
                      {reading.planet.text}
                    </p>
                  ) : null}
                  {reading.shadow ? (
                    <ShadowDetail
                      shadow={reading.shadow}
                      root={reading.root}
                      headingLevel={2}
                      idPrefix="nd-"
                      lenses={reading.shadow.lens ? [{ key: coreKey, title: label.title, text: reading.shadow.lens.text }] : []}
                    />
                  ) : null}
                  {reading.karmicDebt ? (
                    <section className="card-flat p-6" aria-labelledby="karmic-title">
                      <h2 id="karmic-title" className="section-title mb-3">
                        {t('reading.karmic', { debt: reading.karmicDebt.display })}
                      </h2>
                      <p className="reading text-[1.02rem]">{reading.karmicDebt.overview}</p>
                      <p className="reading mt-3 text-[1.02rem]">{reading.karmicDebt.working}</p>
                      <p className="mt-4 text-sm text-muted">{t('reading.karmicNote')}</p>
                    </section>
                  ) : null}
                </div>
                <aside className="space-y-6">
                  <div className="card p-5">
                    <h2 className="section-title">The arithmetic</h2>
                    <p className="mt-3 text-sm text-muted">
                      {reading.display === String(reading.value) ? 'A single digit.' : `A master number. The root is ${reading.root}.`}
                    </p>
                    <WhyThisNumber steps={reading.steps} chain={reading.chain} />
                  </div>
                  <AppLink to={`/numbers/${reading.value}`} className="card-flat flex min-h-11 items-center justify-between gap-3 px-5 py-4 text-sm hover:text-ink-strong">
                    The general meaning of {reading.value}
                    <Icon name="right" size={15} />
                  </AppLink>
                </aside>
              </div>
            );
          }}
        </LayerGate>
      ) : (
        <p className="card-flat p-6 text-sm text-muted">This number needs a valid birth name.</p>
      )}

      <nav aria-label="Other numbers" className="no-print flex items-center justify-between gap-3 text-sm">
        <AppLink to={`/reading/number/${prev}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-5 font-semibold text-ink-strong hover:bg-mark">
          <Icon name="left" size={14} /> {CORE_LABELS[prev].title}
        </AppLink>
        <AppLink to={`/reading/number/${next}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-2 px-5 font-semibold text-ink-strong hover:bg-mark">
          {CORE_LABELS[next].title} <Icon name="right" size={14} />
        </AppLink>
      </nav>
    </article>
  );
}
