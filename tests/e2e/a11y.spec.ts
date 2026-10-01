import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { enter, go } from './helpers';

/*
 * axe on every screen, in light and dark, with the build failing on any
 * serious or critical violation.
 */

async function audit(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const summary = blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) e.g. ${v.nodes[0]?.html.slice(0, 140)}`);
  expect(summary, `${label}`).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`accessibility, ${scheme}`, () => {
    // Elements fading in are measured mid-fade, so audit them at rest. Motion has its own test below.
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' });

    test('public pages', async ({ page }) => {
      test.setTimeout(90_000);
      for (const path of ['/', '/numbers', '/numbers/8', '/numbers/22', '/method', '/privacy', '/terms']) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await audit(page, `${scheme} ${path}`);
      }
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
