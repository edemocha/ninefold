'use client';

import { useMemo } from 'react';
import { composePair, DEFAULT_OTHER, type Bank, type PairReading } from '@numerology/composer';
import type { YMD } from '@numerology/engine';
import { CycleStrip } from '@/components/cycle-strip';
import { ShareImageButton } from '@/components/export-buttons';
import { Icon } from '@/components/icon';
import { LayerGate } from '@/components/layer-gate';
import { BigNumber, ConventionChips, WhyThisNumber } from '@/components/number';
import { RhythmDuo } from '@/components/rhythm-duo';
import { Sections } from '@/components/sections';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** The overview: two life paths side by side, then the gap between the two cycles. */
export default function BetweenPage() {
  const { profile, partner } = useProfile();
  const today = useToday();
  if (!profile || !partner || !today) return null;

  return (
    <LayerGate layers={['life', 'pair']}>
      {(bank) => <Overview bank={bank} today={today} />}
    </LayerGate>
  );
}

function Overview({ bank, today }: { bank: Bank; today: YMD }) {
  const { profile, partner, conventions } = useProfile();
  const you = profile!.birth;
  const other = partner!;
  const reading = useMemo(
    () => composePair(bank, you, other.birth, today, conventions, other.label),
    [bank, you, other.birth, other.label, today, conventions],
  );
  const otherName = other.label.trim() || DEFAULT_OTHER;
  const r = reading.rhythm;

  return (
    <div className="space-y-10" data-testid="pair-result">
      <p className="text-lg text-muted" data-testid="pair-numbers">
        {cap(reading.numbers)}.
      </p>

      <section aria-label="Life paths" className="grid gap-4 md:grid-cols-2">
        {reading.sides.map((side) => (
          <article key={side.who} className={`card card-hue hue-${side.lifePath.root} p-6`} data-testid={`pair-side-${side.who}`}>
            <p className="eyebrow">{side.label}</p>
            <p className="mt-3" aria-label={`Life path ${side.display}`}>
              <BigNumber result={side.lifePath} className="text-7xl" />
            </p>
            <p className="mt-2 text-sm text-muted">Life path</p>
            <div className="mt-3">
              <ConventionChips kind="lifePath" conventions={conventions} />
            </div>
            <WhyThisNumber steps={side.lifePath.steps} chain={side.lifePath.chain} />
          </article>
        ))}
      </section>

      <section aria-labelledby="relate-heading" className="space-y-4">
        <h3 id="relate-heading" className="section-title">
          {t('between.relateHeading')}
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {reading.sides.map((side) => (
            <article key={side.who} className="card-flat p-5" data-testid={`pair-relate-${side.who}`} data-bank="true">
              <h4 className="font-serif text-xl text-ink-strong">
                {side.label}: {side.display}
              </h4>
              <p className="reading mt-2 leading-relaxed">{side.relationships}</p>
            </article>
          ))}
        </div>
      </section>

      <PairSections reading={reading} />

      <section aria-labelledby="cycles-heading" className="card space-y-7 p-6 sm:p-8" data-testid="pair-cycles">
        <div>
          <h3 id="cycles-heading" className="section-title">
            {t('between.cyclesHeading')}
          </h3>
          <p className="mt-1 max-w-[62ch] text-sm text-muted">{t('between.cyclesIntro')}</p>
        </div>
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <RhythmDuo you={r.you} other={r.other} otherLabel={otherName} />
          <div className="space-y-3">
            <p className="font-serif text-3xl leading-tight text-ink-strong" data-testid="gap-headline">
              {r.headline}
            </p>
            {r.lines.map((line) => (
              <p key={line} className="reading leading-relaxed" data-testid="gap-line">
                {line}
              </p>
            ))}
            <p className="text-sm text-muted" data-testid="gap-holds">
              {r.holds}
            </p>
            <WhyThisNumber steps={r.steps} label="reading.showMath" />
          </div>
        </div>
        <CycleStrip rows={r.strip} heading={r.stripHeading} otherLabel={otherName} />
        <Sections sections={r.sections} headingLevel={4} idPrefix="rhythm-" />
      </section>

      <section className="card-flat no-print flex flex-wrap items-center justify-between gap-4 p-5" aria-label="Share and print">
        <p className="max-w-[48ch] text-sm text-muted">{t('between.exportNote')}</p>
        <div className="flex flex-wrap gap-3">
          <ShareImageButton
            filename="between-us-numbers.png"
            spec={{
              title: 'Between us',
              subtitle: cap(reading.numbers),
              rows: [
                { label: 'Life path', value: reading.sides[0].display },
                { label: 'Life path', value: reading.sides[1].display },
                { label: 'Steps apart', value: String(r.distance) },
                { label: 'Year numbers', value: `${r.you} & ${r.other}` },
              ],
              footer: 'Ninefold',
            }}
          />
          <button type="button" className="btn-quiet" onClick={() => window.print()}>
            <Icon name="print" size={16} />
            {t('between.print')}
          </button>
        </div>
      </section>
    </div>
  );
}

function PairSections({ reading }: { reading: PairReading }) {
  return (
    <section aria-labelledby="pair-sections-heading" className="card-flat space-y-6 p-6" data-testid="pair-sections">
      <h3 id="pair-sections-heading" className="section-title">
        {cap(reading.numbers)}
      </h3>
      <Sections sections={reading.sections} headingLevel={4} idPrefix="pair-" />
      {reading.overlayNote ? (
        <p className="reading rounded-lg bg-surface-2 px-4 py-3 text-[0.98rem] leading-relaxed" data-testid="pair-overlay">
          {reading.overlayNote.text}
        </p>
      ) : null}
    </section>
  );
}
