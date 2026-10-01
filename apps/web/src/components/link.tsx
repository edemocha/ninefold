import NextLink from 'next/link';
import type { ComponentProps } from 'react';

/**
 * next/link with prefetching off. The site is a static export, and some static
 * hosts do not serve Next's per-segment prefetch files, which shows up as a
 * stream of 404s. Navigation still fetches exactly what it needs on click.
 */
export default function Link(props: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={false} {...props} />;
}
