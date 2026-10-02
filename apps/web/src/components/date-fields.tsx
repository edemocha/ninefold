'use client';

import { useMemo } from 'react';
import { daysInMonth, MONTH_NAMES, type YMD } from '@numerology/engine';
import { t } from '@/lib/t';

export type DateValue = { day: string; month: string; year: string };

export const EMPTY_DATE: DateValue = { day: '', month: '', year: '' };

/** A date value as a YMD, or null while any part is still empty. */
export function toYMD(value: DateValue): YMD | null {
  if (!value.day || !value.month || !value.year) return null;
  return { year: Number(value.year), month: Number(value.month), day: Number(value.day) };
}

/**
 * Three selects for a birth date, so nobody has to know a date format. The year
 * list is built from the visitor's own clock (`today`).
 */
export function DateFields({
  id,
  legend,
  value,
  onChange,
  today,
  error,
}: {
  id: string;
  legend: string;
  value: DateValue;
  onChange: (next: DateValue) => void;
  today: YMD | null;
  error?: string;
}) {
  const years = useMemo(() => {
    if (!today) return [];
    return Array.from({ length: today.year - 1900 + 1 }, (_, i) => today.year - i);
  }, [today]);

  const d = Number(value.day);
  const m = Number(value.month);
  const y = Number(value.year);
  const impossible = d && m && y ? d > daysInMonth(y, m) : false;
  const dayMax = y && m ? daysInMonth(y, m) : 31;
  const invalid = error || impossible ? true : undefined;

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 font-medium text-ink-strong">{legend}</legend>
      <div className="grid grid-cols-[5.5rem_1fr_6.5rem] gap-3">
        <div>
          <label htmlFor={`${id}-day`} className="sr-only">
            {t('form.day')}
          </label>
          <select id={`${id}-day`} className="field" value={value.day} onChange={(e) => onChange({ ...value, day: e.target.value })} aria-invalid={invalid}>
            <option value="">{t('form.day')}</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n} disabled={n > dayMax}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-month`} className="sr-only">
            {t('form.month')}
          </label>
          <select id={`${id}-month`} className="field" value={value.month} onChange={(e) => onChange({ ...value, month: e.target.value })} aria-invalid={invalid}>
            <option value="">{t('form.month')}</option>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-year`} className="sr-only">
            {t('form.year')}
          </label>
          <select id={`${id}-year`} className="field" value={value.year} onChange={(e) => onChange({ ...value, year: e.target.value })} aria-invalid={invalid}>
            <option value="">{t('form.year')}</option>
            {years.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      {impossible ? (
        <p role="alert" className="text-sm text-[color:var(--bad-ink)]">
          That date does not exist. Pick a day that fits the month.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-[color:var(--bad-ink)]">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
