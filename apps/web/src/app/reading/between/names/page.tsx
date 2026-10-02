'use client';

import { useMemo } from 'react';
import { composeNamePair, type Bank, type NamePairReading } from '@numerology/composer';
import { nameNumbers, type NameProfile } from '@numerology/engine';
import { LayerGate } from '@/components/layer-gate';
import { BigNumber, ConventionChips, KarmicFlag, WhyThisNumber } from '@/components/number';
import { Sections } from '@/components/sections';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';

/**
 * Expression and soul urge for the two of you. They come from names, so this
 * section only exists once the other person's full name has been given and can
 * be read. It uses the same pair text as the life paths, under a line that says
 * what each name number is about.
 */
export default function PairNamesPage() {
  const { profile, partner, names, conventions, partnerLabel } = useProfile();
  const theirs = useMemo<NameProfile>(() => nameNumbers(partner?.name ?? '', conventions), [partner?.name, conventions]);
  if (!profile || !partner) return null;

  const hasTheirs = Boolean(partner.name?.trim()) && theirs.ok;
  const hasYours = Boolean(names?.ok);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="eyebrow">Expression and soul urge</p>
        <h3 className="text-3xl">Two names, side by side</h3>
        <p className="max-w-[62ch] text-sm text-muted">{t('between.names.intro')}</p>
      </div>

      {!hasTheirs ? (
        <p className="card-flat p-5 text-sm text-muted" data-testid="pair-names-none">
          {t('between.names.none')}
        </p>
      ) : !hasYours || !names ? (
        <p className="card-flat p-5 text-sm text-muted" data-testid="pair-names-none">
          {t('between.names.noneYours')}
        </p>
      ) : (
        <LayerGate layers={['pair']}>{(bank) => <NamePairs bank={bank} you={names} other={theirs} label={partnerLabel} />}</LayerGate>
      )}
    </div>
  );
}

function NamePairs({ bank, you, other, label }: { bank: Bank; you: NameProfile; other: NameProfile; label: string }) {
  const { conventions } = useProfile();
  const readings = useMemo(() => composeNamePair(bank, you, other, label), [bank, you, other, label]);

  return (
    <div className="space-y-10" data-testid="pair-names">
      {readings.map((r) => (
        <Lens key={r.lens} reading={r} conventions={conventions} />
      ))}
    </div>
  );
}

function Lens({ reading, conventions }: { reading: NamePairReading; conventions: ReturnType<typeof useProfile>['conventions'] }) {
  return (
    <section aria-labelledby={`lens-${reading.lens}`} className="space-y-5" data-testid={`pair-names-${reading.lens}`}>
      <div className="space-y-2">
        <h3 id={`lens-${reading.lens}`} className="section-title">
          {reading.title}
        </h3>
        <p className="reading max-w-[62ch] leading-relaxed" data-testid={`pair-names-${reading.lens}-frame`}>
          {reading.frame.text}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reading.sides.map((side) => (
          <article key={side.who} className={`card card-hue hue-${side.result.root} p-6`} data-testid={`pair-names-${reading.lens}-${side.who}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="eyebrow">{side.label}</p>
              {side.result.karmicDebt ? <KarmicFlag debt={side.result.karmicDebt} /> : null}
            </div>
            <p className="mt-3" aria-label={`${reading.title} ${side.display}`}>
              <BigNumber result={side.result} className="text-7xl" />
            </p>
            <div className="mt-3">
              <ConventionChips kind={reading.lens} conventions={conventions} />
            </div>
            <WhyThisNumber steps={side.result.steps} chain={side.result.chain} />
          </article>
        ))}
      </div>

      <div className="card-flat space-y-6 p-6">
        <h4 className="font-serif text-2xl text-ink-strong" data-testid={`pair-names-${reading.lens}-numbers`}>
          {reading.numbers.charAt(0).toUpperCase() + reading.numbers.slice(1)}
        </h4>
        <Sections sections={reading.sections} headingLevel={4} idPrefix={`${reading.lens}-`} />
        {reading.overlayNote ? (
          <p className="reading rounded-lg bg-surface-2 px-4 py-3 text-[0.98rem] leading-relaxed" data-testid={`pair-names-${reading.lens}-overlay`}>
            {reading.overlayNote.text}
          </p>
        ) : null}
      </div>
    </section>
  );
}
