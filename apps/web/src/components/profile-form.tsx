'use client';

import { useRouter } from 'next/navigation';
import { useId, useMemo, useState, type FormEvent } from 'react';
import {
  CONVENTION_SPEC,
  DEFAULT_CONVENTIONS,
  daysInMonth,
  isDefaultConventions,
  MONTH_NAMES,
  nameNumbers,
  validateBirth,
  type Conventions,
} from '@numerology/engine';
import { Disclaimer } from './disclaimer';
import { Icon } from './icon';
import { track } from '@/lib/analytics';
import { hrefWith, parseHash, setHash } from '@/lib/hash';
import { useProfile } from '@/lib/profile-context';
import { t } from '@/lib/t';
import { useToday } from '@/lib/use-today';

type ConventionField = keyof typeof CONVENTION_SPEC;
const FIELDS = Object.keys(CONVENTION_SPEC) as ConventionField[];

export function ProfileForm() {
  const router = useRouter();
  const today = useToday();
  const { conventions, setConventions, submit, hash, profile, under16 } = useProfile();
  const uid = useId();

  const [birthName, setBirthName] = useState(profile?.birthName ?? '');
  const [usedName, setUsedName] = useState(profile?.usedName ?? '');
  const [day, setDay] = useState(profile ? String(profile.birth.day) : '');
  const [month, setMonth] = useState(profile ? String(profile.birth.month) : '');
  const [year, setYear] = useState(profile ? String(profile.birth.year) : '');
  const [errors, setErrors] = useState<{ name?: string; used?: string; date?: string }>({});

  const notice = parseHash(hash).get('notice') === 'reload';

  const years = useMemo(() => {
    if (!today) return [];
    return Array.from({ length: today.year - 1900 + 1 }, (_, i) => today.year - i);
  }, [today]);

  const impossible = useMemo(() => {
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    return d && m && y ? d > daysInMonth(y, m) : false;
  }, [day, month, year]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!today) return;
    const next: typeof errors = {};

    const nameCheck = nameNumbers(birthName, conventions);
    if (!birthName.trim()) next.name = t('form.error.name');
    else if (!nameCheck.ok) next.name = nameCheck.issues.find((i) => i.blocking)?.message ?? t('form.error.name');

    if (usedName.trim()) {
      const used = nameNumbers(usedName, conventions);
      if (!used.ok) next.used = used.issues.find((i) => i.blocking)?.message;
    }

    const birth = { year: Number(year), month: Number(month), day: Number(day) };
    if (!day || !month || !year) next.date = t('form.error.date');
    else {
      const issue = validateBirth(birth, today);
      if (issue) next.date = issue.message;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    submit({ birthName: birthName.trim(), usedName: usedName.trim(), birth }, conventions);
    track('calculate');
    router.push(hrefWith('/reading', hash, { notice: null }));
  }

  function choose<K extends ConventionField>(field: K, value: Conventions[K]) {
    setConventions({ ...conventions, [field]: value });
  }

  const dayMax = Number(year) && Number(month) ? daysInMonth(Number(year), Number(month)) : 31;

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-7 p-6 sm:p-8" aria-describedby={`${uid}-privacy`}>
      {notice ? (
        <p role="status" className="rounded-md bg-info-bg px-4 py-3 text-sm text-[color:var(--info-ink)]">
          {t('form.redirect')}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={`${uid}-name`} className="block font-medium text-ink-strong">
          {t('form.birthName')}
        </label>
        <input
          id={`${uid}-name`}
          name="birth-name"
          className="field"
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          value={birthName}
          onChange={(e) => setBirthName(e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={`${uid}-name-help${errors.name ? ` ${uid}-name-err` : ''}`}
          required
        />
        <p id={`${uid}-name-help`} className="text-sm text-muted">
          {t('form.birthName.help')}
        </p>
        {errors.name ? (
          <p id={`${uid}-name-err`} role="alert" className="text-sm text-[color:var(--bad-ink)]">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor={`${uid}-used`} className="block font-medium text-ink-strong">
          {t('form.usedName')} <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`${uid}-used`}
          name="used-name"
          className="field"
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          value={usedName}
          onChange={(e) => setUsedName(e.target.value)}
          aria-invalid={errors.used ? true : undefined}
          aria-describedby={`${uid}-used-help`}
        />
        <p id={`${uid}-used-help`} className="text-sm text-muted">
          {t('form.usedName.help')}
        </p>
        {errors.used ? (
          <p role="alert" className="text-sm text-[color:var(--bad-ink)]">
            {errors.used}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium text-ink-strong">{t('form.birthDate')}</legend>
        <div className="grid grid-cols-[5.5rem_1fr_6.5rem] gap-3">
          <div>
            <label htmlFor={`${uid}-day`} className="sr-only">
              {t('form.day')}
            </label>
            <select id={`${uid}-day`} className="field" value={day} onChange={(e) => setDay(e.target.value)} aria-invalid={errors.date || impossible ? true : undefined}>
              <option value="">{t('form.day')}</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d} disabled={d > dayMax}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-month`} className="sr-only">
              {t('form.month')}
            </label>
            <select id={`${uid}-month`} className="field" value={month} onChange={(e) => setMonth(e.target.value)} aria-invalid={errors.date || impossible ? true : undefined}>
              <option value="">{t('form.month')}</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-year`} className="sr-only">
              {t('form.year')}
            </label>
            <select id={`${uid}-year`} className="field" value={year} onChange={(e) => setYear(e.target.value)} aria-invalid={errors.date || impossible ? true : undefined}>
              <option value="">{t('form.year')}</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
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
        {errors.date ? (
          <p role="alert" className="text-sm text-[color:var(--bad-ink)]">
            {errors.date}
          </p>
        ) : null}
      </fieldset>

      <details className="group rounded-lg border border-line bg-surface-2 px-4 py-1" data-testid="advanced">
        <summary className="flex min-h-12 items-center gap-2 text-sm font-medium text-ink-strong">
          <Icon name="plus" size={16} className="group-open:hidden" />
          <Icon name="minus" size={16} className="hidden group-open:block" />
          {t('form.advanced')}
          {!isDefaultConventions(conventions) ? <span className="chip chip-info ml-1">Changed</span> : null}
        </summary>
        <div className="space-y-6 pb-4 pt-2">
          <p className="text-sm text-muted">{t('form.advanced.help')}</p>
          {FIELDS.map((field) => {
            const spec = CONVENTION_SPEC[field];
            return (
              <fieldset key={field} className="space-y-2">
                <legend className="font-medium text-ink-strong">{spec.label}</legend>
                <p className="text-sm text-muted">{spec.help}</p>
                <div className="space-y-1">
                  {(spec.options as readonly { value: string; label: string; help: string }[]).map((opt) => {
                    const id = `${uid}-${field}-${opt.value}`;
                    return (
                      <label key={opt.value} htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-surface">
                        <input
                          id={id}
                          type="radio"
                          name={`${uid}-${field}`}
                          className="mt-1 size-4 accent-[var(--ink-strong)]"
                          checked={conventions[field] === opt.value}
                          onChange={() => choose(field, opt.value as Conventions[typeof field])}
                        />
                        <span>
                          <span className="block text-sm text-ink-strong">{opt.label}</span>
                          <span className="block text-sm text-muted">{opt.help}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              setConventions(DEFAULT_CONVENTIONS);
              setHash({ who: null });
            }}
          >
            {t('form.reset')}
          </button>
        </div>
      </details>

      <div className="space-y-3">
        <button type="submit" className="btn" disabled={!today}>
          {t('form.submit')}
          <Icon name="right" size={16} />
        </button>
        <p id={`${uid}-privacy`} className="flex items-center gap-2 text-sm text-ink-strong" data-testid="privacy-line">
          <Icon name="lock" size={15} />
          {t('privacy.line')}
        </p>
        {under16 ? <p className="text-sm text-muted">{t('form.under16')}</p> : null}
      </div>

      <Disclaimer className="border-t border-line pt-5" />
    </form>
  );
}
