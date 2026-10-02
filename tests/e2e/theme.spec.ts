import { expect, test, type Page } from '@playwright/test';
import { addPartner, enter, go, SAM } from './helpers';

/*
 * The look is a printed worksheet: paper, ink, ruled lines, one signal red and
 * one highlighter yellow. These tests hold it to that, so it cannot drift back
 * to soft gradients, floating shadowed cards, rounded pills and entrance
 * animation, and so a number is never told apart by colour alone.
 */

test.use({ colorScheme: 'dark' });

const channels = (rgb: string) => rgb.match(/\d+/g)!.map(Number);

test('is light only, whatever the system prefers: paper and ink', async ({ page }) => {
  await page.goto('/');
  const look = await page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    background: getComputedStyle(document.body).backgroundColor,
    text: getComputedStyle(document.body).color,
  }));
  expect(look.scheme).toBe('light');
  const [br, bg, bb] = channels(look.background);
  expect(Math.min(br, bg, bb)).toBeGreaterThan(200);
  // The paper is a warm-neutral grey, not a tinted wash: its channels sit close together.
  expect(Math.max(br, bg, bb) - Math.min(br, bg, bb)).toBeLessThan(12);
  const [tr, tg, tb] = channels(look.text);
  expect(Math.max(tr, tg, tb)).toBeLessThan(60);
});

/** Everything on the page that breaks the worksheet's rules, by element. */
async function offenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      // A loading placeholder pulses while content arrives; that is progress feedback, not decoration.
      if (el.closest('[aria-busy="true"]')) continue;
      const s = getComputedStyle(el);
      const id = `${el.tagName.toLowerCase()}.${String((el as HTMLElement).getAttribute('class') ?? '').slice(0, 50)}`;
      if (s.backgroundImage !== 'none') out.push(`gradient or image: ${id}`);
      if (s.boxShadow !== 'none') out.push(`shadow: ${id}`);
      if (s.animationName !== 'none') out.push(`animation: ${id}`);
      for (const corner of [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius]) {
        const px = parseFloat(corner);
        // A true circle (a legend swatch) is allowed; a rounded rectangle or a pill is not.
        if (px > 0 && px < 1000) out.push(`rounded corner ${corner}: ${id}`);
      }
    }
    return out;
  });
}

test('keeps to the worksheet on every kind of page: no gradients, shadows, rounded boxes or entrance animation', async ({ page }) => {
  test.setTimeout(90_000);
  for (const path of ['/', '/numbers', '/numbers/8', '/between', '/between/3-7', '/method']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await offenders(page), path).toEqual([]);
  }

  await enter(page);
  await expect(page.getByRole('heading', { name: 'Your core numbers' })).toBeVisible();
  expect(await offenders(page), 'snapshot').toEqual([]);
  for (const tab of ['Name grid', 'Life timeline', 'Year', 'Month', 'Day'] as const) {
    await go(page, tab);
    await page.waitForLoadState('networkidle');
    expect(await offenders(page), tab).toEqual([]);
  }
  await go(page, 'Between us');
  await addPartner(page, SAM);
  for (const name of ['Overview', 'Day by day', 'Month', 'Life stages']) {
    await page.getByRole('navigation', { name: 'Between us sections' }).getByRole('link', { name, exact: true }).click();
    await page.waitForLoadState('networkidle');
    expect(await offenders(page), `Between us, ${name}`).toEqual([]);
  }
});

test('headings are set in the serif, working in the mono, and controls in the sans', async ({ page }) => {
  await page.goto('/');
  const family = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(await family('h1')).toMatch(/IBM Plex Serif/);
  expect(await family('.eyebrow')).toMatch(/IBM Plex Mono/);
  expect(await family('figure table')).toMatch(/IBM Plex Mono/);
  expect(await family('button.btn')).toMatch(/IBM Plex Sans/);
});

test('a number is its digit, in ink, with no colour of its own; the digit is always printed', async ({ page }) => {
  await enter(page);
  const life = page.getByTestId('core-lifePath').locator('.numeral').first();
  await expect(page.getByLabel('Life path 1')).toBeVisible();
  const ink = channels(await life.evaluate((el) => getComputedStyle(el).color));
  expect(Math.max(...ink)).toBeLessThan(40);
  // Every number from the core cards is the same ink, so none is told apart by hue.
  const colours = await page.locator('[data-testid^="core-"] .numeral').evaluateAll((els) => [...new Set(els.map((e) => getComputedStyle(e).color))]);
  expect(colours).toHaveLength(1);
});

test('the highlighter marks what is current: the tab you are on, and today', async ({ page }) => {
  await enter(page);
  const mark = 'rgb(255, 232, 61)';
  const tab = page.getByRole('navigation', { name: 'Your reading' }).getByRole('link', { name: 'Snapshot', exact: true });
  expect(await tab.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(mark);
  await go(page, 'Month');
  const today = page.getByTestId('month-grid').locator('[aria-current="date"]');
  await expect(today).toHaveCount(1);
  expect(await today.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(mark);
});

test('the other person is signal red, wherever two people sit side by side', async ({ page }) => {
  await enter(page);
  await go(page, 'Between us');
  await addPartner(page, SAM);
  const red = 'rgb(198, 45, 12)';
  const other = page.getByTestId('cycle-strip').locator('tbody tr').first().locator('td').nth(1).locator('span');
  expect(await other.evaluate((el) => getComputedStyle(el).color)).toBe(red);
  const you = page.getByTestId('cycle-strip').locator('tbody tr').first().locator('td').nth(0).locator('span');
  expect(await you.evaluate((el) => getComputedStyle(el).color)).not.toBe(red);
});
