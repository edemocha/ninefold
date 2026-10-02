'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { DEFAULT_OTHER } from '@numerology/composer';
import { AppLink } from '@/components/app-link';
import { Disclaimer } from '@/components/disclaimer';
import { Icon } from '@/components/icon';
import { PairForm } from '@/components/pair-form';
import { PairSafetyLines } from '@/components/pair-safety';
import { useProfile } from '@/lib/profile-context';
import { t, type MessageKey } from '@/lib/t';

const SECTIONS: { href: string; label: MessageKey }[] = [
  { href: '/reading/between', label: 'between.nav.overview' },
  { href: '/reading/between/days', label: 'between.nav.days' },
  { href: '/reading/between/month', label: 'between.nav.month' },
  { href: '/reading/between/life', label: 'between.nav.life' },
];

/**
 * Everything under Between us: the heading, the form for the second person
 * (shown until someone is added, and whenever their details are being
 * changed), and the sections that read the pair. The second person lives in
 * memory next to the first, so these screens keep them as you move between.
 */
export default function BetweenLayout({ children }: { children: ReactNode }) {
  const { profile, partner, partnerUnder16, clearPartner } = useProfile();
  const path = usePathname().replace(/\/$/, '') || '/';
  const [editing, setEditing] = useState(false);
  if (!profile) return null;

  const showForm = !partner || editing;
  const otherName = partner?.label.trim() || DEFAULT_OTHER;

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

      {showForm ? <PairForm initial={partner} onDone={() => setEditing(false)} onCancel={partner ? () => setEditing(false) : undefined} /> : null}

      {partner && !showForm ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl sm:text-4xl" data-testid="pair-heading">
              You and {otherName}
            </h2>
            <div className="no-print flex flex-wrap gap-2">
              <button type="button" className="btn-quiet !min-h-9 !px-3 !text-sm" onClick={() => setEditing(true)}>
                {t('between.change')}
              </button>
              <button type="button" className="btn-quiet !min-h-9 !px-3 !text-sm" onClick={clearPartner}>
                <Icon name="close" size={14} />
                {t('between.remove')}
              </button>
            </div>
          </div>

          <nav aria-label={t('between.nav.label')} className="no-print -mt-4 flex flex-wrap gap-1 border-b border-line pb-2 text-sm">
            {SECTIONS.map((s) => (
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
