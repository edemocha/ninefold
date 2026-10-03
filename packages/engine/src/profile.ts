import { ageOn } from './calendar';
import { challenges, lifePath, birthDay, periodAt, pinnacles } from './dates';
import { chainText, compoundStep, finish, nameMasters, reduceChain } from './reduce';
import { nameNumbers } from './names';
import type { CoreProfile, Conventions, NameProfile, Period, Result, YMD } from './types';

/** Maturity: life path + expression, reduced. Masters are kept, except in the Chaldean tradition, which has none. */
export function maturity(lifePathResult: Result, expression: Result, c?: Pick<Conventions, 'system'>): Result {
  const chaldean = c?.system === 'chaldean';
  const masters = nameMasters(c?.system ?? 'pythagorean');
  const total = lifePathResult.value + expression.value;
  const chain = reduceChain(total, masters);
  const steps = [
    {
      label: 'Add',
      text: `life path ${lifePathResult.value} + expression ${expression.value} = ${total}`,
    },
    { label: 'Reduce', text: chainText(chain, masters) },
  ];
  if (!chaldean) return finish(chain, steps, { debt: true });
  const step = compoundStep(chain);
  if (step) steps.push(step);
  return finish(chain, steps, { compound: true });
}

export function coreProfile(birth: YMD, name: string | NameProfile, c: Conventions): CoreProfile {
  const lp = lifePath(birth, c);
  const profile: CoreProfile = { lifePath: lp, birthDay: birthDay(birth, c) };
  const names = typeof name === 'string' ? nameNumbers(name, c) : name;
  if (names.ok) {
    profile.expression = names.expression;
    profile.soulUrge = names.soulUrge;
    profile.personality = names.personality;
    profile.maturity = maturity(lp, names.expression, c);
  }
  return profile;
}

export type LifeStage = {
  age: number;
  pinnacle: Period;
  challenge: Period;
};

/** Where `date` falls among the four pinnacles and challenges. */
export function lifeStage(birth: YMD, date: YMD, c: Conventions): LifeStage {
  const age = Math.max(0, ageOn(birth, date, c));
  return {
    age,
    pinnacle: periodAt(pinnacles(birth, c), age),
    challenge: periodAt(challenges(birth, c), age),
  };
}
