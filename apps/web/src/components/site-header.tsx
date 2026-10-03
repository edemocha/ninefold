'use client';

import Link from '@/components/link';
import { usePathname } from 'next/navigation';
import { Mark } from '@/components/icon';
import { t } from '@/lib/t';

const LINKS = [
  { href: '/numbers', label: 'nav.numbers' as const },
  { href: '/chaldean', label: 'nav.chaldean' as const },
  { href: '/between', label: 'nav.pairs' as const },
  { href: '/method', label: 'nav.methods' as const },
];

/** The name with its nine-colour mark, and three plain links. The page you are on is a solid pill. */
export function SiteHeader() {
  const path = usePathname();
  return (
    <header role="banner">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link href="/" className="inline-flex items-center gap-2.5 self-start rounded-full" aria-label={`${t('site.name')}, home`}>
          <Mark size={32} />
          <span className="font-display text-[1.65rem] font-extrabold tracking-tight text-ink-strong">{t('site.name')}</span>
        </Link>
        <nav aria-label="Site" className="-mx-1 flex flex-wrap items-center gap-1 text-[0.95rem] sm:mx-0 sm:justify-end">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path.startsWith(l.href) ? 'page' : undefined}
              className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold text-ink-strong hover:bg-surface-2 aria-[current=page]:bg-ink-strong aria-[current=page]:text-white"
            >
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
