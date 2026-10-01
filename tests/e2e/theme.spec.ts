import { expect, test } from '@playwright/test';
import { enter } from './helpers';

/* The site is light only, whatever the visitor's system prefers. */

test.use({ colorScheme: 'dark' });

test('stays light when the system prefers dark', async ({ page }) => {
  await page.goto('/');
  const look = await page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    background: getComputedStyle(document.body).backgroundColor,
    text: getComputedStyle(document.body).color,
  }));
  expect(look.scheme).toBe('light');
  // The paper is a light lavender and the ink is a deep indigo.
  const channels = (rgb: string) => rgb.match(/\d+/g)!.map(Number);
  const [br, bg, bb] = channels(look.background);
  expect(Math.min(br, bg, bb)).toBeGreaterThan(200);
  const [tr, tg, tb] = channels(look.text);
  expect(Math.max(tr, tg, tb)).toBeLessThan(110);
});

test('every number has its own hue, and the digit is always printed', async ({ page }) => {
  await enter(page);
  const colors = await page.getByTestId('core-lifePath').locator('.numeral').first().evaluate((el) => getComputedStyle(el).color);
  // Life path 1 is the rose hue, not the default ink.
  expect(colors).toBe('rgb(190, 18, 60)');
  await expect(page.getByLabel('Life path 1')).toBeVisible();
});
