'use client';

import Link from '@/components/link';
import { usePathname } from 'next/navigation';
import { t } from '@/lib/t';

const LINKS = [
  { href: '/numbers', label: 'nav.numbers' as const },
  { href: '/between', label: 'nav.pairs' as const },
  { href: '/method', label: 'nav.methods' as const },
];

/** A masthead: the name set in type, a heavy rule under it, and plain links. */
export function SiteHeader() {
  const path = usePathname();
  return (
    <header role="banner" className="border-b-2 border-ink-strong">
      <div className="mx-auto flex max-w-5xl flex-col gap-0.5 px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-ink-strong" aria-label={`${t('site.name')}, home`}>
          {t('site.name')}
        </Link>
        <nav aria-label="Site" className="-mx-2 flex flex-wrap items-center gap-x-0.5 text-sm sm:mx-0 sm:justify-end sm:gap-x-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={path.startsWith(l.href) ? 'page' : undefined}
              className="px-2 py-2 text-ink underline-offset-4 hover:underline sm:px-3 aria-[current=page]:bg-mark aria-[current=page]:text-ink-strong"
            >
              {t(l.label)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
