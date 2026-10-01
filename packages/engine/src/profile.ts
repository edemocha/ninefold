import { ageOn } from './calendar';
import { challenges, lifePath, birthDay, periodAt, pinnacles } from './dates';
import { chainText, finish, NAME_MASTERS, reduceChain } from './reduce';
import { nameNumbers } from './names';
import type { CoreProfile, Conventions, NameProfile, Period, Result, YMD } from './types';

/** Maturity: life path + expression, reduced, masters kept. */
export function maturity(lifePathResult: Result, expression: Result): Result {
  const total = lifePathResult.value + expression.value;
  const chain = reduceChain(total, NAME_MASTERS);
  return finish(
    chain,
    [
      {
        label: 'Add',
        text: `life path ${lifePathResult.value} + expression ${expression.value} = ${total}`,
      },
      { label: 'Reduce', text: chainText(chain, NAME_MASTERS) },
    ],
    { debt: true },
  );
}

export function coreProfile(birth: YMD, name: string | NameProfile, c: Conventions): CoreProfile {
  const lp = lifePath(birth, c);
  const profile: CoreProfile = { lifePath: lp, birthDay: birthDay(birth) };
  const names = typeof name === 'string' ? nameNumbers(name, c) : name;
  if (names.ok) {
    profile.expression = names.expression;
    profile.soulUrge = names.soulUrge;
    profile.personality = names.personality;
    profile.maturity = maturity(lp, names.expression);
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
