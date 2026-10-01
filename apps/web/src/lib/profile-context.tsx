'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  ageOn,
  coreProfile,
  DEFAULT_CONVENTIONS,
  nameNumbers,
  parseConventions,
  serializeConventions,
  type Conventions,
  type CoreProfile,
  type NameProfile,
  type YMD,
} from '@numerology/engine';
import { blockAnalytics } from './analytics';
import { parseHash, setHash, useHash } from './hash';
import { localYMD } from './today';

/**
 * What the visitor typed. It lives in React state, in this tab, and nowhere
 * else: not in storage, not in the URL, not on a server. A reload clears it.
 */
export type Profile = { birthName: string; usedName: string; birth: YMD };

type Who = 'birth' | 'current';

/**
 * Which date, year and month the visitor is looking at. This is kept in memory
 * and never in the address: a date they explore could be their own birthday,
 * and a shared link must not carry that.
 */
export type View = {
  /** The day card. */
  dt?: YMD;
  /** The year view's cycle year. */
  yr?: number;
  /** The month view's calendar year and month. */
  my?: number;
  mo?: number;
};
export type ViewPatch = { [K in keyof View]?: View[K] | null };

type ProfileContextValue = {
  profile: Profile | null;
  conventions: Conventions;
  who: Who;
  /** The name currently driving the name numbers. */
  activeName: string;
  names: NameProfile | null;
  core: CoreProfile | null;
  /** Whole years old today, or null before a profile exists. */
  age: number | null;
  under16: boolean;
  submit: (profile: Profile, conventions: Conventions) => void;
  setConventions: (next: Conventions) => void;
  setWho: (who: Who) => void;
  forget: () => void;
  view: View;
  setView: (patch: ViewPatch) => void;
  /** The current URL fragment, for links that keep the conventions. */
  hash: string;
};

const Ctx = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setViewState] = useState<View>({});
  const hash = useHash();

  const setView = useCallback((patch: ViewPatch) => {
    setViewState((prev) => {
      const next: View = { ...prev };
      for (const key of Object.keys(patch) as (keyof View)[]) {
        const value = patch[key];
        if (value === null || value === undefined) delete next[key];
        else (next as Record<string, unknown>)[key] = value;
      }
      return next;
    });
  }, []);

  const conventions = useMemo(() => parseConventions(parseHash(hash)), [hash]);
  const who: Who = parseHash(hash).get('who') === 'current' ? 'current' : 'birth';

  const setConventions = useCallback((next: Conventions) => {
    const params = serializeConventions(next);
    const update: Record<string, string | null> = {};
    for (const key of ['sys', 'dr', 'nr', 'cy', 'cm', 'y', 'pt', 'lb']) update[key] = params.get(key);
    setHash(update);
  }, []);

  const setWho = useCallback((next: Who) => setHash({ who: next === 'current' ? 'current' : null }), []);

  const submit = useCallback(
    (p: Profile, c: Conventions) => {
      setProfile(p);
      setConventions(c);
      if (ageOn(p.birth, localYMD(), c) < 16) blockAnalytics();
    },
    [setConventions],
  );

  const forget = useCallback(() => {
    setProfile(null);
    setViewState({});
    setHash({ who: null });
  }, []);

  const value = useMemo<ProfileContextValue>(() => {
    const activeName = profile ? (who === 'current' && profile.usedName.trim() ? profile.usedName : profile.birthName) : '';
    const names = profile ? nameNumbers(activeName, conventions) : null;
    const core = profile ? coreProfile(profile.birth, names ?? { ok: false, issues: [], parts: [] }, conventions) : null;
    const age = profile ? ageOn(profile.birth, localYMD(), conventions) : null;
    return {
      profile,
      conventions,
      who,
      activeName,
      names,
      core,
      age,
      under16: age !== null && age < 16,
      submit,
      setConventions,
      setWho,
      forget,
      view,
      setView,
      hash,
    };
  }, [profile, conventions, who, submit, setConventions, setWho, forget, view, setView, hash]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}

export { DEFAULT_CONVENTIONS };
