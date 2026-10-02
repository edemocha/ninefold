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
import { DEFAULT_OTHER, MAX_PEOPLE } from '@numerology/composer';
import type { PairType } from '@numerology/content';
import { blockAnalytics } from './analytics';
import { parseHash, setHash, useHash } from './hash';
import { localYMD } from './today';

/**
 * What the visitor typed. It lives in React state, in this tab, and nowhere
 * else: not in storage, not in the URL, not on a server. A reload clears it.
 */
export type Profile = { birthName: string; usedName: string; birth: YMD };

/**
 * A second person for Between us: a birth date and an optional nickname, held
 * exactly like the first profile (React state, this tab only). The nickname is
 * only ever shown on screen. It is never in an image, a link or a request.
 */
export type Partner = {
  label: string;
  birth: YMD;
  /**
   * Their full name, only if the visitor gave it, only for the Names section. It is held like everything
   * else here and never leaves the tab.
   */
  name?: string;
  /** An optional kind of relationship. It only changes the questions on the Overview. */
  type?: PairType;
};

/** You and up to four others. */
export const MAX_OTHERS = MAX_PEOPLE - 1;

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
  /** Everyone added on the Between us tab (at most four), in the order they were added. */
  partners: Partner[];
  /** Which of them the pair screens are showing. */
  selected: number;
  /** The selected person, or null. */
  partner: Partner | null;
  /** How each person is named on screen: their nickname, or "the other person", or "person 3" when there are several. */
  partnerLabels: string[];
  /** The selected person's name on screen. */
  partnerLabel: string;
  /** True when anyone added is under 16. */
  partnerUnder16: boolean;
  /** Changes the selected person, or adds the first one. */
  setPartner: (partner: Partner) => void;
  /** Adds another person and selects them. False when there are already four. */
  addPartner: (partner: Partner) => boolean;
  selectPartner: (index: number) => void;
  /** Removes the selected person. */
  clearPartner: () => void;
  /** Sets or clears the kind of relationship for the selected person. */
  setPartnerType: (type: PairType | undefined) => void;
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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selected, setSelected] = useState(0);
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

  // Analytics stay off for the rest of the visit once anyone added is under 16.
  const guardAge = useCallback(
    (p: Partner) => {
      if (ageOn(p.birth, localYMD(), conventions) < 16) blockAnalytics();
    },
    [conventions],
  );
  const setPartner = useCallback(
    (p: Partner) => {
      guardAge(p);
      setPartners((list) => (list.length === 0 ? [p] : list.map((x, i) => (i === selected ? p : x))));
    },
    [guardAge, selected],
  );
  const addPartner = useCallback(
    (p: Partner): boolean => {
      if (partners.length >= MAX_OTHERS) return false;
      guardAge(p);
      setPartners((list) => (list.length >= MAX_OTHERS ? list : [...list, p]));
      setSelected(partners.length);
      return true;
    },
    [guardAge, partners.length],
  );
  const selectPartner = useCallback((index: number) => setSelected(index), []);
  const clearPartner = useCallback(() => {
    setPartners((list) => list.filter((_, i) => i !== selected));
    setSelected((i) => Math.max(0, i - 1));
  }, [selected]);
  const setPartnerType = useCallback(
    (type: PairType | undefined) => {
      setPartners((list) =>
        list.map((x, i) => {
          if (i !== selected) return x;
          const { type: _old, ...rest } = x;
          return type ? { ...rest, type } : rest;
        }),
      );
    },
    [selected],
  );

  // Forgetting clears both people.
  const forget = useCallback(() => {
    setProfile(null);
    setPartners([]);
    setSelected(0);
    setViewState({});
    setHash({ who: null });
  }, []);

  const current = Math.min(selected, Math.max(0, partners.length - 1));
  const partnerLabels = partners.map((p, i) => p.label.trim() || (partners.length > 1 ? `person ${i + 2}` : DEFAULT_OTHER));

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
      partners,
      selected: current,
      partner: partners[current] ?? null,
      partnerLabels,
      partnerLabel: partnerLabels[current] ?? DEFAULT_OTHER,
      partnerUnder16: partners.some((p) => ageOn(p.birth, localYMD(), conventions) < 16),
      setPartner,
      addPartner,
      selectPartner,
      clearPartner,
      setPartnerType,
      submit,
      setConventions,
      setWho,
      forget,
      view,
      setView,
      hash,
    };
  }, [profile, partners, current, conventions, who, submit, setConventions, setWho, setPartner, addPartner, selectPartner, clearPartner, setPartnerType, forget, view, setView, hash]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileContextValue {
  const value = useContext(Ctx);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}

export { DEFAULT_CONVENTIONS };
