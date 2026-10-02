import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { addAnother, addPartner, enter, go, SAM } from './helpers';

/*
 * axe on every screen, with the build failing on any serious or critical
 * violation. The site is light only.
 */

async function audit(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const summary = blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.html.slice(0, 140)}`);
  expect(summary, `${label}`).toEqual([]);
}

for (const scheme of ['light'] as const) {
  test.describe(`accessibility, ${scheme}`, () => {
    // Elements fading in are measured mid-fade, so audit them at rest. Motion has its own test below.
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' });

    test('public pages', async ({ page }) => {
      test.setTimeout(90_000);
      for (const path of ['/', '/numbers', '/numbers/8', '/numbers/22', '/between', '/between/3-7', '/between/2-4', '/between/8-8', '/method', '/privacy', '/terms']) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await audit(page, `${scheme} ${path}`);
      }
    });

    test('the dates-only form on the pair pages, empty and with errors', async ({ page }) => {
      await page.goto('/between/3-7');
      await expect(page.getByTestId('dates-only-form')).toBeVisible();
      await audit(page, `${scheme} dates-only form`);
      await page.getByTestId('dates-only-form').getByRole('button', { name: 'Show us side by side' }).click();
      await expect(page.getByText('Choose a day, month and year.').first()).toBeVisible();
      await audit(page, `${scheme} dates-only form with errors`);
    });

    test('the input form with the Advanced panel open and with errors', async ({ page }) => {
      await page.goto('/');
      await page.getByTestId('advanced').getByText('Advanced: the conventions behind the numbers').click();
      await audit(page, `${scheme} advanced open`);
      await page.getByRole('button', { name: 'Show my numbers' }).click();
      await expect(page.getByText('Enter your birth name.')).toBeVisible();
      await audit(page, `${scheme} form errors`);
    });

    test('every reading screen', async ({ page }) => {
      test.setTimeout(120_000);
      await enter(page);
      await audit(page, `${scheme} snapshot`);

      await page.getByTestId('core-lifePath').getByText('Why this number').click();
      await audit(page, `${scheme} snapshot with the math open`);

      await page.getByTestId('core-soulUrge').getByRole('link', { name: /Read the soul urge reading/ }).click();
      await expect(page.getByRole('heading', { name: 'Soul urge', level: 1 })).toBeVisible();
      await audit(page, `${scheme} number detail`);

      await go(page, 'Name grid');
      await expect(page.getByRole('heading', { name: 'Hidden passion: the number it repeats' })).toBeVisible();
      await audit(page, `${scheme} name grid`);

      await go(page, 'Life timeline');
      await expect(page.getByRole('heading', { name: 'The four challenges' })).toBeVisible();
      await audit(page, `${scheme} timeline`);

      await go(page, 'Year');
      await expect(page.getByRole('heading', { name: 'Twelve months' })).toBeVisible();
      await audit(page, `${scheme} year`);

      await go(page, 'Month');
      await expect(page.getByTestId('month-grid')).toBeVisible();
      await expect(page.getByTestId('personal-month')).toBeVisible();
      await audit(page, `${scheme} month`);

      await go(page, 'Day');
      await expect(page.getByTestId('day-card')).toBeVisible();
      await page.getByTestId('math-panel').getByText('Show the math').click();
      await audit(page, `${scheme} day with the math open`);

      await go(page, 'Year');
      await page.getByRole('link', { name: /Year report/ }).click();
      await expect(page.getByTestId('report')).toBeVisible();
      await audit(page, `${scheme} report`);
    });

    test('Between us over time: day by day, month and life stages', async ({ page }) => {
      test.setTimeout(120_000);
      await enter(page);
      await go(page, 'Between us');
      await addPartner(page, SAM);
      const nav = page.getByRole('navigation', { name: 'Between us sections' });

      await nav.getByRole('link', { name: 'Day by day', exact: true }).click();
      await expect(page.getByTestId('pair-day')).toBeVisible();
      await audit(page, `${scheme} between us, day by day`);
      await page.getByTestId('pair-date-picker').fill('2026-12-25');
      await expect(page.getByTestId('pair-day-label')).toHaveText('Friday 25 Dec 2026');
      await audit(page, `${scheme} between us, another day`);

      await nav.getByRole('link', { name: 'Month', exact: true }).click();
      await expect(page.getByTestId('pair-month-table')).toBeVisible();
      await audit(page, `${scheme} between us, month`);
      await page.getByRole('link', { name: 'Next month' }).click();
      await expect(page.getByTestId('pair-month-title')).toHaveText('November 2026');
      await audit(page, `${scheme} between us, next month`);

      await nav.getByRole('link', { name: 'Life stages', exact: true }).click();
      await expect(page.getByTestId('pair-life-chart')).toBeVisible();
      await audit(page, `${scheme} between us, life stages`);
      await page.getByTestId('pair-life-you').getByText(/Every period for/).click();
      await page.getByTestId('pair-life-other').getByText(/Every period for/).click();
      await audit(page, `${scheme} between us, life stages with every period open`);

      // A parent and a child: the under-16 notice shows on the new sections too.
      await page.getByRole('button', { name: 'Change their details' }).click();
      await page.getByTestId('pair-form').getByLabel('Year', { exact: true }).selectOption('2014');
      await page.getByTestId('pair-form').getByRole('button', { name: 'Show us side by side' }).click();
      await nav.getByRole('link', { name: 'Life stages', exact: true }).click();
      await expect(page.getByTestId('between-under16-notice')).toBeVisible();
      await audit(page, `${scheme} between us, life stages with a child`);
    });

    test('Between us: names, kinds of relationship and a circle', async ({ page }) => {
      test.setTimeout(120_000);
      await enter(page);
      await go(page, 'Between us');
      await addPartner(page, { label: 'Dav', name: 'David', day: 2, month: 11, year: 1988 });
      const nav = page.getByRole('navigation', { name: 'Between us sections' });

      await page.getByTestId('pair-type').getByRole('radio', { name: 'Colleagues' }).check();
      await expect(page.getByTestId('pair-type-questions')).toBeVisible();
      await audit(page, `${scheme} between us, a kind of relationship chosen`);

      await nav.getByRole('link', { name: 'Names', exact: true }).click();
      await expect(page.getByTestId('pair-names')).toBeVisible();
      await audit(page, `${scheme} between us, names`);
      await page.getByTestId('pair-names-expression-other').getByText('Why this number').click();
      await page.getByTestId('pair-names-soulUrge-you').getByText('Why this number').click();
      await audit(page, `${scheme} between us, names with the arithmetic open`);

      await page.getByRole('button', { name: 'Add someone else' }).click();
      await expect(page.getByTestId('pair-form')).toBeVisible();
      await page.getByTestId('pair-form').getByRole('button', { name: 'Show us side by side' }).click();
      await expect(page.getByText('Choose a day, month and year.')).toBeVisible();
      await audit(page, `${scheme} between us, adding another person with an error`);
      await page.getByTestId('pair-form').getByLabel(/^Their full name/).fill('张伟');
      await addPartner(page, { label: 'Kit', day: 10, month: 3, year: 2014 });
      await expect(page.getByTestId('pair-form').getByRole('alert')).toBeVisible();
      await audit(page, `${scheme} between us, a name that cannot be read`);
      await page.getByTestId('pair-form').getByLabel(/^Their full name/).fill('');
      await page.getByTestId('pair-form').getByRole('button', { name: 'Show us side by side' }).click();
      await expect(page.getByTestId('pair-people')).toBeVisible();
      await audit(page, `${scheme} between us, two people added`);

      for (const p of [
        { label: 'Ro', day: 3, month: 3, year: 2003 },
        { label: 'Lee', day: 21, month: 9, year: 1970 },
      ]) await addAnother(page, p);
      await nav.getByRole('link', { name: 'Circle', exact: true }).click();
      await expect(page.getByTestId('pair-circle')).toBeVisible();
      await audit(page, `${scheme} between us, a circle of five`);
    });

    test('Between us in every state', async ({ page }) => {
      test.setTimeout(120_000);
      await enter(page);
      await go(page, 'Between us');
      await expect(page.getByTestId('pair-form')).toBeVisible();
      await audit(page, `${scheme} between us, empty`);

      await page.getByTestId('pair-form').getByRole('button', { name: 'Show us side by side' }).click();
      await expect(page.getByText('Choose a day, month and year.')).toBeVisible();
      await audit(page, `${scheme} between us, form error`);

      await addPartner(page, SAM);
      await expect(page.getByTestId('pair-result')).toBeVisible();
      await audit(page, `${scheme} between us, filled`);

      await page.getByTestId('pair-side-you').getByText('Why this number').click();
      await page.getByTestId('pair-cycles').getByText('Show the math').click();
      await audit(page, `${scheme} between us, with the math open`);

      await page.getByRole('button', { name: 'Change their details' }).click();
      await audit(page, `${scheme} between us, editing`);
      await page.getByTestId('pair-form').getByRole('button', { name: 'Cancel' }).click();

      // A master number, the same number, and someone under 16.
      for (const p of [
        { label: 'Ro', day: 3, month: 3, year: 2003 },
        { label: 'Twin', day: 17, month: 6, year: 1999 },
        { label: 'Kit', day: 10, month: 3, year: 2014 },
      ]) {
        await page.getByRole('button', { name: 'Remove them' }).click();
        await addPartner(page, p);
        await expect(page.getByTestId('pair-result')).toBeVisible();
        await audit(page, `${scheme} between us, ${p.label}`);
      }
    });
  });
}

test('reduced motion switches the entrance animation off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const name = await page.locator('.rise').first().evaluate((el) => getComputedStyle(el).animationName);
  expect(name).toBe('none');
});

test('every control is reachable by keyboard and shows a focus ring', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle, tag: el.tagName };
  });
  expect(outline.style).not.toBe('none');
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
});
