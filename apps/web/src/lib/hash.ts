'use client';

import { useSyncExternalStore } from 'react';

/*
 * The URL fragment holds the view and the conventions, never a name or a birth
 * date. A fragment is not sent to the server, not logged, and not put in a
 * Referer header, so a shared link cannot leak personal data.
 */

const EVENT = 'ninefold:hash';

/*
 * history.pushState and replaceState change the address without a hashchange
 * event, and that is how the router follows a link whose only difference is the
 * fragment. Wrap them once so the fragment store hears about every change.
 */
let patched = false;
function patchHistory(): void {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = window.history[method];
    window.history[method] = function (this: History, ...args: Parameters<History['pushState']>) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event(EVENT));
      return result;
    };
  }
}

function subscribe(onChange: () => void): () => void {
  patchHistory();
  window.addEventListener('hashchange', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const getSnapshot = (): string => window.location.hash;
const getServerSnapshot = (): string => '';

/** The current fragment, without the leading "#". */
export function useHash(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).replace(/^#/, '');
}

export function parseHash(hash: string): URLSearchParams {
  return new URLSearchParams(hash.replace(/^#/, ''));
}

/** A new fragment with `update` applied. A null or empty value removes the key. */
export function hashWith(hash: string, update: Record<string, string | number | null | undefined>): string {
  const params = parseHash(hash);
  for (const [key, value] of Object.entries(update)) {
    if (value === null || value === undefined || value === '') params.delete(key);
    else params.set(key, String(value));
  }
  return params.toString();
}

export function setHash(update: Record<string, string | number | null | undefined>): void {
  const next = hashWith(window.location.hash, update);
  const url = `${window.location.pathname}${window.location.search}${next ? `#${next}` : ''}`;
  window.history.replaceState(window.history.state, '', url);
  window.dispatchEvent(new Event(EVENT));
}

/** Builds "/path#fragment", carrying the current fragment forward with changes. */
export function hrefWith(path: string, hash: string, update: Record<string, string | number | null | undefined> = {}): string {
  const next = hashWith(hash, update);
  return next ? `${path}#${next}` : path;
}

export function ymdParam(d: { year: number; month: number; day: number }): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

export function parseYmdParam(value: string | null): { year: number; month: number; day: number } | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}
