'use client';

import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import {
  CONVENTION_SPEC,
  DEFAULT_CONVENTIONS,
  isDefaultConventions,
  nameNumbers,
  TRADITIONS,
  validateBirth,
  withTradition,
  type Conventions,
} from '@numerology/engine';
import { DateFields, EMPTY_DATE, toYMD, type DateValue } from './date-fields';
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
  const [date, setDate] = useState<DateValue>(
    profile ? { day: String(profile.birth.day), month: String(profile.birth.month), year: String(profile.birth.year) } : EMPTY_DATE,
  );
  const [errors, setErrors] = useState<{ name?: string; used?: string; date?: string }>({});

  const notice = parseHash(hash).get('notice') === 'reload';

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

    const birth = toYMD(date);
    if (!birth) next.date = t('form.error.date');
    else {
      const issue = validateBirth(birth, today);
      if (issue) next.date = issue.message;
    }

    setErrors(next);
    if (Object.keys(next).length > 0 || !birth) return;

    submit({ birthName: birthName.trim(), usedName: usedName.trim(), birth }, conventions);
    track('calculate');
    // The Chaldean tradition reads the name a person is known by, so start there when they gave one.
    const known = conventions.system === 'chaldean' && usedName.trim() ? 'current' : null;
    router.push(hrefWith('/reading', hash, { notice: null, who: known }));
  }

  function choose<K extends ConventionField>(field: K, value: Conventions[K]) {
    setConventions({ ...conventions, [field]: value });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-7 p-6 sm:p-8" aria-describedby={`${uid}-privacy`}>
      {notice ? (
        <p role="status" className="rounded-md bg-info-bg px-4 py-3 text-sm text-[color:var(--info-ink)]">
          {t('form.redirect')}
        </p>
      ) : null}

      <fieldset className="space-y-3" data-testid="tradition">
        <legend className="mb-1 font-medium text-ink-strong">{t('form.tradition')}</legend>
        <div className="grid grid-cols-2 gap-2">
          {TRADITIONS.map((option) => {
            const id = `${uid}-tradition-${option.value}`;
            const checked = conventions.system === option.value;
            return (
              <label
                key={option.value}
                htmlFor={id}
                className={`flex min-h-12 cursor-pointer items-center gap-2.5 rounded-full border-2 px-4 text-[0.95rem] font-semibold ${checked ? 'border-ink-strong bg-mark text-ink-strong' : 'border-line-strong text-ink-strong hover:border-ink-strong'}`}
              >
                <input
                  id={id}
                  type="radio"
                  name={`${uid}-tradition`}
                  className="size-4 accent-[var(--primary)]"
                  checked={checked}
                  onChange={() => setConventions(withTradition(conventions, option.value))}
                />
                {option.label}
              </label>
            );
          })}
        </div>
        <p className="text-sm text-muted" data-testid="tradition-help">
          {TRADITIONS.find((o) => o.value === conventions.system)?.help}
        </p>
      </fieldset>

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
          {conventions.system === 'chaldean' ? ` ${t('form.usedName.chaldean')}` : ''}
        </p>
        {errors.used ? (
          <p role="alert" className="text-sm text-[color:var(--bad-ink)]">
            {errors.used}
          </p>
        ) : null}
      </div>

      <DateFields id={uid} legend={t('form.birthDate')} value={date} onChange={setDate} today={today} error={errors.date} />

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
                          className="mt-1 size-4 accent-[var(--primary)]"
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
