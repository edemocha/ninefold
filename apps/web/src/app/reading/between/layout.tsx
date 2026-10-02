'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { nameNumbers } from '@numerology/engine';
import { AppLink } from '@/components/app-link';
import { Disclaimer } from '@/components/disclaimer';
import { Icon } from '@/components/icon';
import { PairForm } from '@/components/pair-form';
import { PairSafetyLines } from '@/components/pair-safety';
import { MAX_OTHERS, useProfile } from '@/lib/profile-context';
import { t, type MessageKey } from '@/lib/t';

type Mode = 'none' | 'edit' | 'add';

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Everything under Between us: the heading, the form for the other person
 * (shown until someone is added, and while their details are being changed or
 * another person is being added), a switch between the people added, and the
 * sections that read the pair. Everyone lives in memory next to the first
 * person, so these screens keep them as you move between.
 */
export default function BetweenLayout({ children }: { children: ReactNode }) {
  const { profile, partners, partner, partnerLabels, partnerLabel, selected, selectPartner, partnerUnder16, clearPartner, conventions } = useProfile();
  const path = usePathname().replace(/\/$/, '') || '/';
  const [mode, setMode] = useState<Mode>('none');
  if (!profile) return null;

  const showForm = partners.length === 0 || mode !== 'none';
  const hasName = Boolean(partner?.name?.trim()) && nameNumbers(partner?.name ?? '', conventions).ok;

  const sections: { href: string; label: MessageKey }[] = [
    { href: '/reading/between', label: 'between.nav.overview' },
    { href: '/reading/between/days', label: 'between.nav.days' },
    { href: '/reading/between/month', label: 'between.nav.month' },
    { href: '/reading/between/life', label: 'between.nav.life' },
    ...(hasName ? [{ href: '/reading/between/names', label: 'between.nav.names' as const }] : []),
    ...(partners.length >= 2 ? [{ href: '/reading/between/circle', label: 'between.nav.circle' as const }] : []),
  ];

  return (
    <div className="space-y-10">
      <header className="rise space-y-3">
        <p className="eyebrow">{t('between.title')}</p>
        <h1 className="text-4xl sm:text-5xl">Two sets of numbers, side by side</h1>
        <p className="max-w-[62ch] text-muted">{t('between.intro')}</p>
        <p className="max-w-[62ch] text-sm text-muted" data-testid="between-stance">
          {t('between.stance')}
        </p>
      </header>

      {partnerUnder16 ? (
        <p role="status" className="rounded-lg bg-info-bg px-4 py-3 text-sm text-[color:var(--info-ink)]" data-testid="between-under16-notice">
          {t('between.under16')}
        </p>
      ) : null}

      {showForm ? (
        <PairForm
          key={mode === 'add' ? 'add' : `edit-${selected}`}
          initial={mode === 'add' ? null : partner}
          adding={mode === 'add'}
          onDone={() => setMode('none')}
          onCancel={partners.length > 0 ? () => setMode('none') : undefined}
        />
      ) : null}

      {partner && !showForm ? (
        <>
          {partners.length > 1 ? (
            <div role="group" aria-label={t('between.people.label')} className="no-print flex flex-wrap gap-2" data-testid="pair-people">
              {partners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className="btn-quiet !min-h-9 !px-3 !text-sm"
                  aria-pressed={i === selected}
                  onClick={() => selectPartner(i)}
                >
                  {cap(partnerLabels[i] ?? '')}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl sm:text-4xl" data-testid="pair-heading">
              You and {partnerLabel}
            </h2>
            <div className="no-print flex flex-wrap gap-2">
              {partners.length < MAX_OTHERS ? (
                <button type="button" className="btn-quiet !min-h-9 !px-3 !text-sm" onClick={() => setMode('add')}>
                  <Icon name="plus" size={14} />
                  {t('between.add')}
                </button>
              ) : null}
              <button type="button" className="btn-quiet !min-h-9 !px-3 !text-sm" onClick={() => setMode('edit')}>
                {t('between.change')}
              </button>
              <button type="button" className="btn-quiet !min-h-9 !px-3 !text-sm" onClick={clearPartner}>
                <Icon name="close" size={14} />
                {t('between.remove')}
              </button>
            </div>
          </div>

          <nav aria-label={t('between.nav.label')} className="no-print -mt-4 flex flex-wrap gap-1 border-b border-line pb-2 text-sm">
            {sections.map((s) => (
              <AppLink
                key={s.href}
                to={s.href}
                aria-current={path === s.href ? 'page' : undefined}
                className="rounded-md px-3 py-2.5 text-muted hover:text-primary aria-[current=page]:bg-[var(--primary-soft)] aria-[current=page]:text-[var(--info-ink)]"
              >
                {t(s.label)}
              </AppLink>
            ))}
          </nav>

          {children}

          <PairSafetyLines />
        </>
      ) : null}

      <Disclaimer className="border-t border-line pt-5" />
    </div>
  );
}
