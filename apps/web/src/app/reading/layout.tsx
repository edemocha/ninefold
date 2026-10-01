'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppLink } from '@/components/app-link';
import { Icon } from '@/components/icon';
import { useProfile } from '@/lib/profile-context';
import { t, type MessageKey } from '@/lib/t';

const TABS: { href: string; label: MessageKey }[] = [
  { href: '/reading', label: 'nav.snapshot' },
  { href: '/reading/grid', label: 'nav.grid' },
  { href: '/reading/timeline', label: 'nav.timeline' },
  { href: '/reading/year', label: 'nav.year' },
  { href: '/reading/month', label: 'nav.month' },
  { href: '/reading/day', label: 'nav.day' },
];

export default function ReadingLayout({ children }: { children: ReactNode }) {
  const { profile, who, setWho, forget } = useProfile();
  const router = useRouter();
  const path = usePathname().replace(/\/$/, '') || '/';

  // Nothing is stored, so a reload (or a link opened cold) starts again at the form.
  useEffect(() => {
    if (!profile) router.replace('/#notice=reload');
  }, [profile, router]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16" aria-busy="true">
        <p className="text-muted">{t('form.redirect')}</p>
      </div>
    );
  }

  const hasUsedName = profile.usedName.trim().length > 0;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-6">
      <div className="no-print sticky top-0 z-20 -mx-5 border-b border-line bg-white/60 px-5 backdrop-blur-sm">
        <nav aria-label="Your reading" className="flex items-center gap-1 overflow-x-auto py-2 text-sm">
          {TABS.map((tab) => (
            <AppLink
              key={tab.href}
              to={tab.href}
              aria-current={path === tab.href || (tab.href !== '/reading' && path.startsWith(tab.href)) ? 'page' : undefined}
              className="whitespace-nowrap rounded-md px-3 py-2.5 text-muted hover:text-primary aria-[current=page]:bg-[var(--primary-soft)] aria-[current=page]:text-[var(--info-ink)]"
            >
              {t(tab.label)}
            </AppLink>
          ))}
        </nav>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-3 py-4">
        {hasUsedName ? (
          <div role="group" aria-label="Which name" className="flex gap-1.5">
            <button type="button" className="btn-quiet !min-h-9 !px-3 !text-sm" aria-pressed={who === 'birth'} onClick={() => setWho('birth')}>
              {t('reading.whoBirth')}
            </button>
            <button type="button" className="btn-quiet !min-h-9 !px-3 !text-sm" aria-pressed={who === 'current'} onClick={() => setWho('current')}>
              {t('reading.whoCurrent')}
            </button>
          </div>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="btn-quiet !min-h-9 !px-3 !text-sm"
          onClick={() => {
            forget();
            router.push('/');
          }}
        >
          <Icon name="close" size={14} />
          {t('nav.forget')}
        </button>
      </div>

      <div className="py-4">{children}</div>

    </div>
  );
}
