import { expect, test } from '@playwright/test';
import { AMELIA, chooseTradition, enter, fillProfile, go, OCT_1_2026 } from './helpers';

/*
 * The site starts in the Chaldean tradition: eight groups of letters with the 9
 * held back, no master numbers, and a compound number from 10 to 52 for every
 * total. Amelia Rose Carter, born 17 June 1985, works out by hand to:
 *   life path     1 + 7 + 6 + 1 + 9 + 8 + 5 = 37, then 10, then 1
 *   expression    15 + 17 + 17 = 49, then 13, then 4
 *   soul urge     8 + 12 + 6 = 26, then 8
 *   personality   49 - 26 = 23, then 5
 *   birth day     17, then 8
 *   maturity      1 + 4 = 5
 */

test.describe('the Chaldean default', () => {
  test('the form starts in the Chaldean tradition, and the other one is a click away', async ({ page }) => {
    await page.goto('/');
    const chaldean = page.getByRole('radio', { name: 'Chaldean', exact: true });
    const pythagorean = page.getByRole('radio', { name: 'Pythagorean', exact: true });
    await expect(chaldean).toBeChecked();
    await expect(pythagorean).not.toBeChecked();
    await expect(page.getByTestId('tradition-help')).toContainText('No letter is worth 9');

    await pythagorean.check();
    await expect(page.getByTestId('tradition-help')).toContainText('master numbers');
    await expect(chaldean).not.toBeChecked();

    // The tradition sets the switches that belong to it, and Advanced shows them.
    await page.getByTestId('advanced').getByText('Advanced: the conventions behind the numbers').click();
    await expect(page.getByRole('radio', { name: /A2 \(Pythagorean default\)/ })).toBeChecked();
    await chaldean.check();
    await expect(page.getByRole('radio', { name: /D \(Chaldean default\)/ })).toBeChecked();
    await expect(page.getByRole('radio', { name: /Whole name \(Chaldean default\)/ })).toBeChecked();
  });

  test('every core number carries its compound, and no karmic debt is flagged', async ({ page }) => {
    await enter(page, AMELIA, OCT_1_2026, 'chaldean');
    const compound = (key: string) => page.getByTestId(`core-${key}`).getByTestId(`compound-${key}`);
    await expect(compound('lifePath')).toHaveText('Compound 37, The Good Friend');
    await expect(compound('expression')).toHaveText('Compound 49, The Echo of 31');
    await expect(compound('soulUrge')).toHaveText('Compound 26, Partnerships Tested');
    await expect(compound('personality')).toHaveText('Compound 23, The Royal Star of the Lion');
    await expect(compound('birthDay')).toHaveText('Compound 17, The Star of the Magi');
    // 1 + 4 = 5 is a single digit, so maturity has no compound.
    await expect(page.getByTestId('core-maturity').getByTestId('compound-maturity')).toHaveCount(0);

    await expect(page.getByLabel('Life path 1')).toBeVisible();
    await expect(page.getByLabel('Expression 4')).toBeVisible();
    await expect(page.getByLabel('Soul urge 8')).toBeVisible();
    await expect(page.getByLabel('Personality 5')).toBeVisible();
    await expect(page.getByLabel('Birth day 8')).toBeVisible();
    await expect(page.getByLabel('Maturity 5')).toBeVisible();
    await expect(page.getByText(/Karmic debt/)).toHaveCount(0);

    await expect(page.getByTestId('core-lifePath').getByRole('link', { name: 'Date rule D' })).toBeVisible();
    await expect(page.getByTestId('core-expression').getByRole('link', { name: 'Chaldean letters' })).toBeVisible();
    await expect(page.getByTestId('core-lifePath')).toContainText('Chaldean books call this the destiny number');
  });

  test('the working shows the flat digit sum and the compound', async ({ page }) => {
    await enter(page, AMELIA, OCT_1_2026, 'chaldean');
    await page.getByTestId('core-lifePath').getByText('Why this number').click();
    const card = page.getByTestId('core-lifePath');
    await expect(card).toContainText('1 + 7 + 6 + 1 + 9 + 8 + 5 = 37');
    await expect(card).toContainText('37 is the compound number the tradition reads. It reduces to 1.');
    await page.getByTestId('core-expression').getByText('Why this number').click();
    await expect(page.getByTestId('core-expression')).toContainText('49 is the compound number the tradition reads. It reduces to 4.');
  });

  test('the number page reads the compound, the planet and the shadow in detail', async ({ page }) => {
    await enter(page, AMELIA, OCT_1_2026, 'chaldean');
    await page.getByTestId('core-lifePath').getByRole('link', { name: /Read the life path reading/ }).click();
    await expect(page.getByRole('heading', { name: 'Life path', level: 1 })).toBeVisible();

    const card = page.getByTestId('compound-37');
    await expect(card.getByRole('heading', { name: 'The Good Friend' })).toBeVisible();
    for (const title of ['What the tradition says', 'The shadow side', 'Working with it']) await expect(card.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByTestId('planet-line')).toContainText('belongs to the Sun');

    const shadow = page.getByTestId('shadow-1');
    await expect(shadow.getByRole('heading', { name: 'The shadow of a 1' })).toBeVisible();
    await expect(shadow.locator('[data-testid^="shadow-part-"]')).toHaveCount(11);
    await expect(shadow.getByTestId('shadow-part-practice')).toContainText('For seven days');
    await expect(shadow.getByTestId('shadow-part-practice')).toContainText('?');
    await expect(shadow).toContainText('As a life path');
  });

  test('the name grid has eight numbers, holds the 9 back and has no subconscious self', async ({ page }) => {
    await enter(page, AMELIA, OCT_1_2026, 'chaldean');
    await go(page, 'Name grid');
    await expect(page.getByRole('heading', { name: 'Name grid', level: 1 })).toBeVisible();
    await expect(page.getByText('The Chaldean table gives no letter the 9')).toBeVisible();
    await expect(page.getByLabel('9: not given to any letter in the Chaldean table')).toBeVisible();
    await expect(page.getByText('held back', { exact: true })).toBeVisible();
    await expect(page.getByLabel('M, value 4, consonant')).toHaveCount(1);
    await expect(page.getByLabel('O, value 7, vowel')).toHaveCount(1);
    const labels = await page.locator('[aria-label^="Letters of"] li').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
    expect(labels.length).toBe(16);
    expect(labels.filter((l) => l.includes('value 9'))).toEqual([]);
    await expect(page.getByRole('heading', { name: 'Subconscious self' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Hidden passion: the number it repeats' })).toBeVisible();
  });

  test('the Shadow tab reads each number in eleven parts, one reading for each different number', async ({ page }) => {
    await enter(page, AMELIA, OCT_1_2026, 'chaldean');
    await go(page, 'Shadow');
    await expect(page.getByRole('heading', { name: 'Your shadows, in detail', level: 1 })).toBeVisible();

    // 1, 4, 8 and 5: the soul urge and the birth day are both 8, and the personality and the maturity are both 5.
    const picker = page.getByTestId('shadow-picker');
    await expect(picker.getByRole('button')).toHaveCount(4);
    await expect(picker.getByRole('button', { name: /Soul urge, Birth day/ })).toBeVisible();
    await expect(picker.getByRole('button', { name: /Personality, Maturity/ })).toBeVisible();

    await expect(page.getByTestId('shadow-1').locator('[data-testid^="shadow-part-"]')).toHaveCount(11);
    await picker.getByRole('button', { name: /Soul urge, Birth day/ }).click();
    const eight = page.getByTestId('shadow-8');
    await expect(eight.getByRole('heading', { name: 'The shadow of an 8' })).toBeVisible();
    await expect(eight).toContainText('As a soul urge');
    await expect(eight).toContainText('As a birth day');
    await expect(page.getByTestId('shadow-1')).toHaveCount(0);

    // The shadow of each compound is read as well.
    const compounds = page.getByTestId('compound-shadows');
    await expect(compounds.getByRole('heading', { name: 'The Good Friend' })).toBeVisible();
    await expect(compounds.getByRole('heading', { name: 'The Echo of 31' })).toBeVisible();
    await expect(compounds.locator('li')).toHaveCount(5);
  });

  test('starts from the name a person is known by, when they gave one', async ({ page }) => {
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/');
    await fillProfile(page, { ...AMELIA, usedName: 'Amy Carter' }, 'chaldean');
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByRole('heading', { name: 'Your core numbers' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Name you use now' })).toHaveAttribute('aria-pressed', 'true');
    // AMY CARTER: A1 M4 Y1 + C3 A1 R2 T4 E5 R2 = 23, the royal star, then 5.
    await expect(page.getByTestId('core-expression').getByTestId('compound-expression')).toHaveText('Compound 23, The Royal Star of the Lion');
  });

  test('carries the tradition in the address, and never a name or a date', async ({ page }) => {
    await enter(page, AMELIA, OCT_1_2026, 'pythagorean');
    const url = page.url();
    expect(url).toContain('sys=pythagorean');
    expect(url).not.toMatch(/Amelia|Carter|1985|17/i);
    await expect(page.getByTestId('core-lifePath').getByTestId('compound-lifePath')).toHaveCount(0);
    await expect(page.getByTestId('core-lifePath').getByText('Karmic debt 19/1')).toBeVisible();
  });
});

test.describe('the Pythagorean tradition, one click away', () => {
  test('keeps its masters and karmic debt, and the detailed shadows are the same', async ({ page }) => {
    await enter(page, AMELIA, OCT_1_2026, 'pythagorean');
    await expect(page.getByLabel('Life path 1')).toBeVisible();
    await expect(page.getByLabel('Expression 1')).toBeVisible();
    await expect(page.getByLabel('Soul urge 6')).toBeVisible();
    await go(page, 'Shadow');
    await expect(page.getByRole('heading', { name: 'Your shadows, in detail', level: 1 })).toBeVisible();
    await expect(page.getByTestId('shadow-1').locator('[data-testid^="shadow-part-"]')).toHaveCount(11);
    // The compound shadows belong to the Chaldean tradition only.
    await expect(page.getByTestId('compound-shadows')).toHaveCount(0);
  });

  test('switching the tradition changes the letters, and the numbers follow', async ({ page }) => {
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/');
    await chooseTradition(page, 'pythagorean');
    await fillProfile(page, AMELIA, 'pythagorean');
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByLabel('Soul urge 6')).toBeVisible();
    await page.getByRole('link', { name: 'Forget my details' }).or(page.getByRole('button', { name: 'Forget my details' })).first().click();
    await chooseTradition(page, 'chaldean');
    await fillProfile(page, AMELIA, 'chaldean');
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByLabel('Soul urge 8')).toBeVisible();
  });
});

test.describe('the public Chaldean pages', () => {
  test('the overview shows the letter table, the planets and all 43 compounds', async ({ page }) => {
    await page.goto('/chaldean');
    await expect(page.getByRole('heading', { name: 'Chaldean numerology', level: 1 })).toBeVisible();
    const table = page.getByTestId('letter-table');
    await expect(table.locator('li')).toHaveCount(9);
    await expect(table).toContainText('F P');
    await expect(table).toContainText('Held back, no letter');
    await expect(page.getByTestId('planets').locator('li')).toHaveCount(9);
    await expect(page.getByTestId('planets')).toContainText('the Sun');
    await expect(page.getByTestId('planets')).toContainText('Saturn');
    const index = page.getByTestId('compound-index');
    await expect(index.locator('li')).toHaveCount(43);
    await expect(index.getByRole('link', { name: '16, The Tower Struck by Lightning' })).toHaveAttribute('href', /\/chaldean\/16/);
    await expect(page.getByTestId('name-example')).toContainText('49');
  });

  test('a compound page has the image, the shadow and a question, and links the number it reduces to', async ({ page }) => {
    await page.goto('/chaldean/16');
    await expect(page.getByRole('heading', { name: 'The Tower Struck by Lightning', level: 1 })).toBeVisible();
    const card = page.getByTestId('compound-16');
    await expect(card).toContainText('Compound 16, reduces to 7');
    for (const title of ['What the tradition says', 'The shadow side', 'Working with it']) await expect(card.getByRole('heading', { name: title })).toBeVisible();
    await expect(card).toContainText('?');
    await expect(page.getByRole('link', { name: /Read the number 7/ })).toHaveAttribute('href', /\/numbers\/7/);
    await expect(page.getByRole('navigation', { name: 'Other compound numbers' })).toBeVisible();
  });

  test('a compound with no image of its own says which reading it carries, and the original links back', async ({ page }) => {
    await page.goto('/chaldean/33');
    await expect(page.getByRole('heading', { name: 'The Echo of 24', level: 1 })).toBeVisible();
    await expect(page.getByText('The tradition gives 33 no image of its own')).toBeVisible();
    await page.getByRole('link', { name: /Read 24, The Promise of Help/ }).click();
    await expect(page.getByRole('heading', { name: 'The Promise of Help', level: 1 })).toBeVisible();
    // 24 lists the totals that carry its reading.
    await expect(page.getByRole('link', { name: '33', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: '42', exact: true })).toBeVisible();
  });

  test('a number page has the shadow in detail, the planet and the compounds that reduce to it', async ({ page }) => {
    await page.goto('/numbers/1');
    const shadow = page.getByTestId('shadow-1');
    await expect(shadow.getByRole('heading', { name: 'The shadow of a 1' })).toBeVisible();
    await expect(shadow.locator('[data-testid^="shadow-part-"]')).toHaveCount(11);
    const chaldean = page.getByTestId('number-chaldean');
    await expect(chaldean).toContainText('belongs to the Sun');
    for (const compound of [10, 19, 28, 37, 46]) await expect(chaldean.getByRole('link', { name: new RegExp(`^${compound},`) })).toBeVisible();
    await page.goto('/numbers/22');
    await expect(page.getByTestId('shadow-22').getByRole('heading', { name: 'The shadow of a 22' })).toBeVisible();
    await expect(page.getByTestId('number-chaldean')).toContainText('no master numbers');
  });

  test('every compound page exists', async ({ page }) => {
    test.setTimeout(120_000);
    for (const n of [10, 11, 13, 22, 33, 37, 43, 51, 52]) {
      await page.goto(`/chaldean/${n}`);
      await expect(page.getByTestId(`compound-${n}`)).toBeVisible();
    }
    const response = await page.goto('/chaldean/9');
    expect(response?.status()).toBe(404);
    const high = await page.goto('/chaldean/53');
    expect(high?.status()).toBe(404);
  });
});
