import { readFile } from 'node:fs/promises';
import { expect, test, type Request } from '@playwright/test';
import { enter, go, type Person } from './helpers';

/*
 * The privacy claim, made testable: a distinctive name and birth date are typed
 * in, every screen and export is visited, and the build fails if either shows
 * up in any request (URL, headers or body) or in any browser storage.
 */

const PERSON: Person = { name: 'Zephyrine Quillfeather', usedName: 'Zeph Quillfeather', day: 23, month: 11, year: 1987 };

const FORBIDDEN = [
  'zephyrine',
  'quillfeather',
  'zeph%20',
  'zeph+',
  encodeURIComponent(PERSON.name).toLowerCase(),
  '1987-11-23',
  '23-11-1987',
  '23/11/1987',
  '23.11.1987',
  '19871123',
  '23%2f11%2f1987',
  '1987%2f11%2f23',
  '23 nov',
  'nov 23',
  'november 23',
  '23 november',
  '1987-11',
];

type Seen = { url: string; headers: Record<string, string>; body: string };

test('no name or birth date appears in any request, URL or storage', async ({ page, baseURL }) => {
  const pending: Promise<Seen>[] = [];
  page.on('request', (request: Request) => {
    pending.push(
      request.allHeaders().then((headers) => ({
        url: request.url(),
        headers,
        body: request.postData() ?? '',
      })),
    );
  });

  await enter(page, PERSON);

  // Every screen.
  for (const tab of ['Name grid', 'Life timeline', 'Year', 'Month', 'Day'] as const) {
    await go(page, tab);
    await page.waitForLoadState('networkidle');
  }

  // A number reading, the date explorer, a month change.
  await go(page, 'Snapshot');
  await page.getByTestId('core-soulUrge').getByRole('link', { name: /Read the soul urge reading/ }).click();
  await expect(page.getByRole('heading', { name: 'Soul urge', level: 1 })).toBeVisible();
  await go(page, 'Day');
  await page.getByTestId('date-picker').fill('2026-11-23');
  await page.getByTestId('date-picker').fill('1987-11-23'); // exploring their own birth date
  await go(page, 'Month');
  await page.getByRole('link', { name: 'Next month' }).click();

  // The used-name toggle and the conventions.
  await page.getByRole('button', { name: 'Name you use now' }).click();
  await go(page, 'Snapshot');

  // Exports.
  await go(page, 'Year');
  const ics = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Calendar file: every day' }).click();
  const icsText = await readFile((await (await ics).path())!, 'utf8');
  await page.getByRole('link', { name: /Year report/ }).click();
  await expect(page.getByTestId('report')).toBeVisible();
  await go(page, 'Snapshot');
  const png = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share image (numbers only)' }).click();
  await png;

  await page.waitForLoadState('networkidle');
  const seen = await Promise.all(pending);

  // Every request goes to this site and nowhere else.
  const origin = new URL(baseURL!).origin;
  const foreign = seen.filter((s) => new URL(s.url).origin !== origin);
  expect(foreign.map((s) => s.url), 'requests to other origins').toEqual([]);

  // No request carries personal data in its URL, headers or body.
  for (const s of seen) {
    const haystack = `${s.url}\n${JSON.stringify(s.headers)}\n${s.body}`.toLowerCase();
    for (const bad of FORBIDDEN) {
      expect(haystack.includes(bad), `"${bad}" found in a request to ${s.url}`).toBe(false);
    }
    expect(s.body, `request body for ${s.url}`).toBe('');
  }
  expect(seen.length).toBeGreaterThan(5);

  // The address bar holds the view and the conventions, never the person.
  const href = decodeURIComponent(page.url()).toLowerCase();
  for (const bad of FORBIDDEN) expect(href.includes(bad), `"${bad}" in the address`).toBe(false);

  // Exports carry numbers only.
  expect(icsText.toLowerCase()).not.toContain('zephyrine');
  expect(icsText).not.toContain('1987');

  // Nothing is kept in the browser.
  const storage = await page.evaluate(async () => ({
    local: window.localStorage.length,
    session: window.sessionStorage.length,
    cookie: document.cookie,
    databases: 'databases' in indexedDB ? (await indexedDB.databases()).length : 0,
    caches: 'caches' in window ? (await caches.keys()).length : 0,
  }));
  expect(storage).toEqual({ local: 0, session: 0, cookie: '', databases: 0, caches: 0 });
  expect(await page.context().cookies()).toEqual([]);
});

test('the content requests are fixed URLs: the same for everyone', async ({ page }) => {
  const urls: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/content/')) urls.push(new URL(r.url()).pathname);
  });
  await enter(page, PERSON);
  await go(page, 'Day');
  await expect(page.getByTestId('day-card')).toBeVisible();
  expect(urls.length).toBeGreaterThan(2);
  for (const u of urls) expect(u).toMatch(/^\/content\/(current\.json|v[\w.-]+\/(core|life|year|month|day)\.json)$/);
});

test('the page makes no analytics or third-party requests by default', async ({ page, baseURL }) => {
  const origins = new Set<string>();
  page.on('request', (r) => origins.add(new URL(r.url()).origin));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect([...origins]).toEqual([new URL(baseURL!).origin]);
});
