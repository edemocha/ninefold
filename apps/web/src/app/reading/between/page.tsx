'use client';

import { useId, useMemo } from 'react';
import { composePair, composeTypeTalk, PAIR_TYPE_TITLES, type Bank, type PairReading } from '@numerology/composer';
import { PAIR_TYPES, type PairType } from '@numerology/content';
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
  const { profile, partner, partnerLabel: otherName, conventions } = useProfile();
  const you = profile!.birth;
  const other = partner!;
  const reading = useMemo(
    () => composePair(bank, you, other.birth, today, conventions, otherName),
    [bank, you, other.birth, otherName, today, conventions],
  );
  const r = reading.rhythm;

  return (
    <div className="space-y-10" data-testid="pair-result">
      <p className="text-lg text-muted" data-testid="pair-numbers">
        {cap(reading.numbers)}.
      </p>

      <section aria-label="Life paths" className="grid gap-4 md:grid-cols-2">
        {reading.sides.map((side) => (
          <article key={side.who} className={`card card-hue hue-${side.lifePath.root} p-6`} data-testid={`pair-side-${side.who}`}>
            <p className={`eyebrow ${side.who === 'other' ? '!text-accent' : ''}`}>{side.label}</p>
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

      <TypeQuestions bank={bank} />

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

/**
 * An optional kind of relationship. It only changes the questions: nothing said
 * about the numbers depends on it, and "no choice" is the default.
 */
function TypeQuestions({ bank }: { bank: Bank }) {
  const { partner, setPartnerType } = useProfile();
  const uid = useId();
  const type = partner?.type;
  const talk = type ? composeTypeTalk(bank, type) : undefined;
  const options: { value: PairType | ''; label: string }[] = [
    { value: '', label: t('between.type.none') },
    ...PAIR_TYPES.map((value) => ({ value, label: PAIR_TYPE_TITLES[value] })),
  ];

  return (
    <section aria-labelledby={`${uid}-legend`} className="card-flat space-y-4 p-6" data-testid="pair-type">
      <fieldset className="space-y-3">
        <legend id={`${uid}-legend`} className="section-title mb-1">
          {t('between.type.legend')}
        </legend>
        <p className="max-w-[62ch] text-sm text-muted">{t('between.type.help')}</p>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const id = `${uid}-${o.value || 'none'}`;
            const checked = (type ?? '') === o.value;
            return (
              <label
                key={id}
                htmlFor={id}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${checked ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[color:var(--info-ink)]' : 'border-line text-ink'}`}
              >
                <input
                  id={id}
                  type="radio"
                  name={`${uid}-type`}
                  className="size-4 accent-[var(--primary)]"
                  checked={checked}
                  onChange={() => setPartnerType(o.value === '' ? undefined : o.value)}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {talk ? (
        <div className="space-y-3 border-t border-line pt-4" data-testid="pair-type-questions">
          <h4 className="font-serif text-xl text-ink-strong">{t('between.type.heading', { kind: talk.title.toLowerCase() })}</h4>
          <ul className="reading space-y-2 leading-relaxed">
            {talk.questions.map((q) => (
              <li key={q.id}>
                {q.text}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
