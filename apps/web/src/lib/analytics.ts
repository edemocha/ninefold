/*
 * Cookieless analytics with an event allowlist. Off unless
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set at build time. Events carry no
 * properties, so there is nowhere for a name or a birth date to go, and the
 * page address is sent without its fragment. Once the visitor's birth date
 * shows they are under 16, nothing more is sent.
 */

export const ALLOWED_EVENTS = ['pageview', 'calculate', 'between', 'export_pdf', 'export_ics', 'export_image'] as const;
export type AnalyticsEvent = (typeof ALLOWED_EVENTS)[number];

type PlausibleFn = (name: string, options?: { u?: string }) => void;

let blocked = false;

export const analyticsDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? '';

export function blockAnalytics(): void {
  blocked = true;
}

export function analyticsBlocked(): boolean {
  return blocked;
}

export function track(name: AnalyticsEvent): void {
  if (blocked || !analyticsDomain || typeof window === 'undefined') return;
  if (!(ALLOWED_EVENTS as readonly string[]).includes(name)) return;
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  plausible?.(name, { u: `${window.location.origin}${window.location.pathname}` });
}
