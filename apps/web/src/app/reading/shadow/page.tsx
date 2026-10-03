'use client';

import { useState } from 'react';
import { composeCompound, composeShadows, CORE_LABELS } from '@numerology/composer';
import type { CoreKey, Result } from '@numerology/engine';
import { CORE_KEYS } from '@numerology/content';
import { AppLink } from '@/components/app-link';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { ShadowDetail } from '@/components/shadow-detail';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';

export default function ShadowPage() {
  const { core, conventions } = useProfile();
  const [picked, setPicked] = useState<number | null>(null);
  if (!core) return null;

  const results: Partial<Record<CoreKey, Result>> = {};
  for (const key of CORE_KEYS) {
    const result = core[key];
    if (result) results[key] = result;
  }
  const chaldean = conventions.system === 'chaldean';

  return (
    <div className="space-y-10">
      <header className="rise space-y-3">
        <p className="eyebrow">{chaldean ? 'Chaldean tradition' : 'Pythagorean tradition'}</p>
        <h1 className="text-4xl sm:text-5xl">{t('shadow.title')}</h1>
        <p className="max-w-[62ch] text-muted">{t('shadow.intro')}</p>
        <p className="max-w-[62ch] text-sm text-muted">{t('shadow.note')}</p>
      </header>

      <LayerGate layers={['life']}>
        {(bank) => {
          const groups = composeShadows(bank, results);
          const active = groups.find((g) => g.value === picked) ?? groups[0];
          const compounds = CORE_KEYS.flatMap((key) => {
            const compound = results[key]?.compound;
            const reading = compound === undefined ? undefined : composeCompound(bank, compound);
            return reading ? [{ key, reading }] : [];
          });
          return (
            <>
              <div role="group" aria-label="Choose one of your numbers" className="flex flex-wrap gap-2" data-testid="shadow-picker">
                {groups.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    className="btn-quiet"
                    aria-pressed={g.value === active?.value}
                    onClick={() => setPicked(g.value)}
                  >
                    <span className="font-display text-lg font-extrabold">{g.display}</span>
                    <span className="text-sm">{g.keys.map((k) => CORE_LABELS[k].title).join(', ')}</span>
                  </button>
                ))}
              </div>

              {active ? (
                <ShadowDetail
                  shadow={active.shadow}
                  root={active.root}
                  lenses={active.lenses.map((l) => ({ key: l.key, title: CORE_LABELS[l.key].title, text: l.text }))}
                  headingLevel={2}
                  idPrefix="mine-"
                />
              ) : null}

              {chaldean && compounds.length > 0 ? (
                <section aria-labelledby="compound-shadows" className="space-y-4" data-testid="compound-shadows">
                  <h2 id="compound-shadows" className="text-3xl">
                    The shadows of your compound numbers
                  </h2>
                  <p className="max-w-[62ch] text-sm text-muted">
                    The Chaldean tradition reads the total before it is reduced. Each compound has its own image, and its own shadow.
                  </p>
                  <ul className="grid gap-4 md:grid-cols-2">
                    {compounds.map(({ key, reading }) => (
                      <li key={key} className={`hue-${reading.root} rounded-3xl bg-hue-n p-6`} data-testid={`compound-shadow-${key}`}>
                        <p className="text-sm font-semibold text-ink-strong">
                          {CORE_LABELS[key].title}: compound {reading.number}, reduces to {reading.root}
                        </p>
                        <h3 className="mt-1 text-2xl">{reading.title}</h3>
                        <p className="reading mt-3 text-[1rem] leading-relaxed">{reading.sections.find((s) => s.id === 'shadow')?.text}</p>
                        <p className="reading mt-3 text-[1rem] leading-relaxed text-ink-strong">{reading.sections.find((s) => s.id === 'working')?.text}</p>
                        <AppLink to={`/reading/number/${key}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-strong underline-offset-4 hover:underline">
                          The whole {CORE_LABELS[key].title.toLowerCase()} reading
                          <Icon name="right" size={15} />
                        </AppLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          );
        }}
      </LayerGate>
    </div>
  );
}
