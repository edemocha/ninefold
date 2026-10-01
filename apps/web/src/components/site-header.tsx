'use client';

import Link from '@/components/link';
import { usePathname } from 'next/navigation';
import { Mark } from './icon';
import { t } from '@/lib/t';

const LINKS = [
  { href: '/numbers', label: 'nav.numbers' as const },
  { href: '/method', label: 'nav.methods' as const },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header role="banner" className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5 text-ink-strong" aria-label={`${t('site.name')}, home`}>
          <Mark />
          <span className="font-serif text-xl tracking-tight">{t('site.name')}</span>
        </Link>
        <nav aria-label="Site" className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path.startsWith(l.href) ? 'page' : undefined}
              className="rounded-md px-3 py-2 text-muted hover:text-ink-strong aria-[current=page]:text-ink-strong"
            >
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
