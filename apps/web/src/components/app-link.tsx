'use client';

import Link from '@/components/link';
import type { ComponentProps } from 'react';
import { hrefWith } from '@/lib/hash';
import { useProfile, type ViewPatch } from '@/lib/profile-context';

type Update = Record<string, string | number | null | undefined>;

/** A link that carries the current conventions (the URL fragment) to the next page. */
export function useAppHref(): (path: string, update?: Update) => string {
  const { hash } = useProfile();
  return (path, update = {}) => hrefWith(path, hash, update);
}

/**
 * `update` changes fragment settings (conventions). `view` changes what is
 * being looked at, in memory only, just before the link is followed.
 */
export function AppLink({
  to,
  update,
  view,
  onClick,
  ...props
}: { to: string; update?: Update; view?: ViewPatch } & Omit<ComponentProps<typeof Link>, 'href'>) {
  const href = useAppHref();
  const { setView } = useProfile();
  return (
    <Link
      {...props}
      href={href(to, update)}
      onClick={(event) => {
        if (view) setView(view);
        onClick?.(event);
      }}
    />
  );
}
