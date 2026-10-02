'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import { validateBirth } from '@numerology/engine';
import { DateFields, EMPTY_DATE, toYMD, type DateValue } from './date-fields';
import { Icon } from './icon';
import { MAX_NICKNAME } from './pair-form';
import { track } from '@/lib/analytics';
import { hrefWith } from '@/lib/hash';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

/**
 * A way into Between us from the public pair pages that asks for two birth
 * dates and nothing else: no name, no account. It builds the same in-memory
 * profile and second person the full form does, and goes to the same screens.
 * Nothing typed here is sent, saved or put in the address.
 */
export function DatesOnlyForm({ className = '' }: { className?: string }) {
  const uid = useId();
  const router = useRouter();
  const today = useToday();
  const { conventions, submit, setPartner, forget, hash } = useProfile();
  const [mine, setMine] = useState<DateValue>(EMPTY_DATE);
  const [theirs, setTheirs] = useState<DateValue>(EMPTY_DATE);
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState<{ mine?: string; theirs?: string }>({});

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!today) return;
    const next: typeof errors = {};
    const a = toYMD(mine);
    const b = toYMD(theirs);
    if (!a) next.mine = t('between.error.date');
    else next.mine = validateBirth(a, today)?.message;
    if (!b) next.theirs = t('between.error.date');
    else next.theirs = validateBirth(b, today)?.message;
    setErrors(next);
    if (next.mine || next.theirs || !a || !b) return;

    // A fresh start: anyone entered earlier in this tab is cleared, then both people go in.
    forget();
    submit({ birthName: '', usedName: '', birth: a }, conventions);
    setPartner({ label: nickname.trim().slice(0, MAX_NICKNAME), birth: b });
    track('calculate');
    track('between');
    router.push(hrefWith('/reading/between', hash, { notice: null }));
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-title`} className={`card space-y-6 p-6 sm:p-8 ${className}`} data-testid="dates-only-form">
      <div className="space-y-1">
        <h2 id={`${uid}-title`} className="font-display text-2xl text-ink-strong">
          {t('pairs.form.title')}
        </h2>
        <p className="max-w-[56ch] text-sm text-muted">{t('pairs.form.help')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DateFields id={`${uid}-a`} legend={t('pairs.form.you')} value={mine} onChange={setMine} today={today} error={errors.mine} />
        <DateFields id={`${uid}-b`} legend={t('pairs.form.them')} value={theirs} onChange={setTheirs} today={today} error={errors.theirs} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${uid}-nick`} className="block font-medium text-ink-strong">
          {t('between.nickname')} <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`${uid}-nick`}
          name="nickname"
          className="field md:max-w-sm"
          autoComplete="off"
          spellCheck={false}
          maxLength={MAX_NICKNAME}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          aria-describedby={`${uid}-nick-help`}
        />
        <p id={`${uid}-nick-help`} className="text-sm text-muted">
          {t('between.nickname.help')}
        </p>
      </div>

      <div className="space-y-3">
        <button type="submit" className="btn" disabled={!today}>
          {t('pairs.form.submit')}
          <Icon name="right" size={16} />
        </button>
        <p className="flex items-center gap-2 text-sm text-ink-strong">
          <Icon name="lock" size={15} />
          {t('between.consent')}
        </p>
      </div>
    </form>
  );
}
