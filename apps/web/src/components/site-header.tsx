'use client';

import Link from '@/components/link';
import { usePathname } from 'next/navigation';
import { Mark } from './icon';
import { t } from '@/lib/t';

const LINKS = [
  { href: '/numbers', label: 'nav.numbers' as const },
  { href: '/between', label: 'nav.pairs' as const },
  { href: '/method', label: 'nav.methods' as const },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header role="banner" className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-5 py-4 sm:gap-4">
        <Link href="/" className="flex items-center gap-2.5 text-primary" aria-label={`${t('site.name')}, home`}>
          <Mark />
          <span className="font-serif text-xl tracking-tight text-ink-strong">{t('site.name')}</span>
        </Link>
        <nav aria-label="Site" className="flex flex-wrap items-center justify-end gap-x-0.5 text-sm sm:gap-x-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path.startsWith(l.href) ? 'page' : undefined}
              className="rounded-md px-2 py-2 text-muted hover:text-primary sm:px-3 aria-[current=page]:bg-[var(--primary-soft)] aria-[current=page]:text-[var(--info-ink)]"
            >
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
