'use client';

import { useId, useState, type FormEvent } from 'react';
import { validateBirth } from '@numerology/engine';
import { DateFields, EMPTY_DATE, toYMD, type DateValue } from './date-fields';
import { Icon } from './icon';
import { track } from '@/lib/analytics';
import { useProfile, type Partner } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

export const MAX_NICKNAME = 30;

/**
 * Adds or changes the second person: a birth date and an optional nickname.
 * Nothing here is sent anywhere or saved; it goes into the same in-memory
 * state as the first person.
 */
export function PairForm({ initial, onDone, onCancel }: { initial: Partner | null; onDone: () => void; onCancel?: () => void }) {
  const uid = useId();
  const today = useToday();
  const { setPartner } = useProfile();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [date, setDate] = useState<DateValue>(
    initial ? { day: String(initial.birth.day), month: String(initial.birth.month), year: String(initial.birth.year) } : EMPTY_DATE,
  );
  const [error, setError] = useState<string | undefined>();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!today) return;
    const birth = toYMD(date);
    if (!birth) return setError(t('between.error.date'));
    const issue = validateBirth(birth, today);
    if (issue) return setError(issue.message);
    setError(undefined);
    setPartner({ label: label.trim().slice(0, MAX_NICKNAME), birth });
    track('between');
    onDone();
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-title`} aria-describedby={`${uid}-consent`} className="card space-y-6 p-6 sm:p-8" data-testid="pair-form">
      <h2 id={`${uid}-title`} className="section-title">
        {t('between.formTitle')}
      </h2>

      <div className="space-y-2">
        <label htmlFor={`${uid}-nick`} className="block font-medium text-ink-strong">
          {t('between.nickname')} <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`${uid}-nick`}
          name="nickname"
          className="field"
          autoComplete="off"
          spellCheck={false}
          maxLength={MAX_NICKNAME}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          aria-describedby={`${uid}-nick-help`}
        />
        <p id={`${uid}-nick-help`} className="text-sm text-muted">
          {t('between.nickname.help')}
        </p>
      </div>

      <DateFields id={uid} legend={t('between.birthDate')} value={date} onChange={setDate} today={today} error={error} />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn" disabled={!today}>
            {t('between.submit')}
            <Icon name="right" size={16} />
          </button>
          {onCancel ? (
            <button type="button" className="btn-quiet" onClick={onCancel}>
              {t('between.cancel')}
            </button>
          ) : null}
        </div>
        <p id={`${uid}-consent`} className="flex items-center gap-2 text-sm text-ink-strong" data-testid="between-consent">
          <Icon name="lock" size={15} />
          {t('between.consent')}
        </p>
      </div>
    </form>
  );
}
