import { expect, test, type Page } from '@playwright/test';
import { addPartner, enter, go, SAM } from './helpers';

/*
 * The look: a white page, one blue-black ink, and nine colours, one for each
 * number. A number keeps its colour on every screen, so colour always means a
 * number. Things you act on are pills, containers are soft, and nothing is a
 * gradient, a shadow or an entrance animation. These tests hold it to that.
 */

test.use({ colorScheme: 'dark' });

const channels = (rgb: string) => rgb.match(/\d+/g)!.map(Number);
const INK_RGB = 'rgb(11, 11, 30)';

test('is light only, whatever the system prefers: white page, dark ink', async ({ page }) => {
  await page.goto('/');
  const look = await page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    background: getComputedStyle(document.body).backgroundColor,
    text: getComputedStyle(document.body).color,
  }));
  expect(look.scheme).toBe('light');
  expect(channels(look.background)).toEqual([255, 255, 255]);
  const [tr, tg, tb] = channels(look.text);
  expect(Math.max(tr, tg, tb)).toBeLessThan(60);
});

test('the nine colours are nine different colours, and every text pair on them passes AA', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const hex = (name: string) => root.getPropertyValue(name).trim();
    const lum = (h: string) => {
      const n = parseInt(h.slice(1), 16);
      const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return ((hi as number) + 0.05) / ((lo as number) + 0.05);
    };
    const ink = hex('--ink-strong');
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
      n,
      bright: hex(`--b${n}`),
      inkOnBright: ratio(ink, hex(`--b${n}`)),
      whiteOnDeep: ratio('#ffffff', hex(`--d${n}`)),
      deepOnTint: ratio(hex(`--d${n}`), hex(`--n${n}`)),
      deepOnWhite: ratio(hex(`--d${n}`), '#ffffff'),
    }));
    return rows;
  });
  expect(new Set(result.map((r) => r.bright)).size).toBe(9);
  for (const r of result) {
    expect(r.inkOnBright, `ink on bright ${r.n}`).toBeGreaterThanOrEqual(4.5);
    expect(r.whiteOnDeep, `white on deep ${r.n}`).toBeGreaterThanOrEqual(4.5);
    expect(r.deepOnTint, `deep on tint ${r.n}`).toBeGreaterThanOrEqual(4.5);
    expect(r.deepOnWhite, `deep on white ${r.n}`).toBeGreaterThanOrEqual(4.5);
  }
});

/** Everything on the page that breaks the rules, by element. */
async function offenders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      // A loading placeholder pulses while content arrives; that is progress feedback, not decoration.
      if (el.closest('[aria-busy="true"]') || el.closest('[data-skeleton]')) continue;
      const s = getComputedStyle(el);
      const id = `${el.tagName.toLowerCase()}.${String((el as HTMLElement).getAttribute('class') ?? '').slice(0, 50)}`;
      if (s.backgroundImage !== 'none') out.push(`gradient or image: ${id}`);
      if (s.boxShadow !== 'none') out.push(`shadow: ${id}`);
      if (s.animationName !== 'none') out.push(`animation: ${id}`);
    }
    return out;
  });
}

test('keeps to the rules on every kind of page: no gradients, shadows or entrance animation', async ({ page }) => {
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

test('things you act on are pills, and containers and fields are soft, never square', async ({ page }) => {
  await page.goto('/');
  const radius = (selector: string) => page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(await radius('button.btn')).toBeGreaterThan(100);
  expect(await radius('.chip, a.tile')).toBeGreaterThan(8);
  expect(await radius('select.field')).toBeGreaterThanOrEqual(12);
  expect(await radius('form.card')).toBeGreaterThanOrEqual(24);
  expect(await radius('header nav a')).toBeGreaterThan(100);
});

test('headings are set in Bricolage Grotesque, text in Geist and the working in Geist Mono', async ({ page }) => {
  await page.goto('/');
  const family = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).fontFamily);
  expect(await family('h1')).toMatch(/Bricolage/i);
  expect(await family('main p')).toMatch(/Geist/i);
  expect(await family('figure table td')).toMatch(/Geist Mono/i);
});

test('a number keeps its colour on every screen', async ({ page }) => {
  await page.goto('/numbers');
  const index = await page.evaluate(() =>
    Object.fromEntries(
      [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [n, getComputedStyle(document.querySelector(`a[aria-label^="Number ${n}:"]`)!).backgroundColor]),
    ),
  );
  expect(new Set(Object.values(index)).size).toBe(9);

  // The same colour on a number's own page, on the pair page and in the reading.
  await page.goto('/numbers/4');
  const own = await page.locator('header .numeral').first().evaluate((el) => getComputedStyle(el.parentElement as HTMLElement).backgroundColor);
  expect(own).toBe(index[4]);

  await enter(page);
  const lifePath = page.getByTestId('core-lifePath').locator('.numeral').first();
  await expect(page.getByLabel('Life path 1')).toBeVisible();
  expect(await lifePath.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(index[1]);
  // Ink sits on the bright fill, never the number's own colour.
  expect(await lifePath.evaluate((el) => getComputedStyle(el).color)).toBe(INK_RGB);
  // Two core numbers that are different numbers are different colours.
  const fills = await page.locator('[data-testid^="core-"] .numeral').evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor));
  const digits = await page.locator('[data-testid^="core-"] .numeral').evaluateAll((els) => els.map((e) => (e.textContent ?? '').trim().charAt(0)));
  const byDigit = new Map<string, string>();
  digits.forEach((d, i) => {
    const seen = byDigit.get(d);
    if (seen) expect(fills[i]).toBe(seen);
    else byDigit.set(d, fills[i] as string);
  });
  expect(new Set(byDigit.values()).size).toBe(byDigit.size);
});

test('ink marks what is current: the tab you are on, and today', async ({ page }) => {
  await enter(page);
  const tab = page.getByRole('navigation', { name: 'Your reading' }).getByRole('link', { name: 'Snapshot', exact: true });
  expect(await tab.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(INK_RGB);
  await go(page, 'Month');
  const today = page.getByTestId('month-grid').locator('[aria-current="date"]');
  await expect(today).toHaveCount(1);
  expect(await today.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(INK_RGB);
  const others = page.getByTestId('month-grid').locator('button:not([aria-current])').first();
  expect(await others.evaluate((el) => getComputedStyle(el).borderTopColor)).not.toBe(INK_RGB);
});

test('the pair grid does not rank pairs: every cell looks alike', async ({ page }) => {
  await page.goto('/between');
  const looks = await page.getByTestId('pair-grid').locator('tbody a').evaluateAll((els) => [...new Set(els.map((e) => `${getComputedStyle(e).backgroundColor}|${getComputedStyle(e).color}`))]);
  expect(looks).toHaveLength(1);
});
