import { expect, test, type Page } from '@playwright/test';
import { addPartner, enter, go, SAM } from './helpers';

/*
 * Between us over time: day by day, month, and life stages. Every text on
 * these screens is the main bank's own text for each person's own number, so
 * the tests check the numbers, the navigation, the tables and the privacy.
 */

async function openSection(page: Page, name: 'Overview' | 'Day by day' | 'Month' | 'Life stages'): Promise<void> {
  await page.getByRole('navigation', { name: 'Between us sections' }).getByRole('link', { name, exact: true }).click();
}

async function ready(page: Page): Promise<void> {
  await enter(page);
  await go(page, 'Between us');
  await addPartner(page, SAM);
  await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
}

test.describe('Between us: sections', () => {
  test('moving between sections keeps the person, marks the current one, and keeps the safety lines', async ({ page }) => {
    await ready(page);
    const nav = page.getByRole('navigation', { name: 'Between us sections' });
    await expect(nav.getByRole('link')).toHaveText(['Overview', 'Day by day', 'Month', 'Life stages']);
    await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');

    for (const name of ['Day by day', 'Month', 'Life stages', 'Overview'] as const) {
      await openSection(page, name);
      await expect(nav.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
      await expect(page.getByTestId('pair-safety')).toContainText("Numbers can't tell you whether to begin, stay or leave.");
      await expect(page.getByTestId('disclaimer').last()).toContainText('Numerology is a symbolic tradition.');
    }
    await expect(page.getByTestId('pair-safety')).toHaveCount(1);
  });

  test('removing the person on any section goes back to the form and hides the sections', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Month');
    await page.getByRole('button', { name: 'Remove them' }).click();
    await expect(page.getByTestId('pair-form')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Between us sections' })).toHaveCount(0);
    await expect(page.getByTestId('pair-safety')).toHaveCount(0);
    await expect(page.locator('main').getByTestId('disclaimer')).toBeVisible();
  });

  test('changing the details recalculates every section', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Day by day');
    await expect(page.getByTestId('pair-day-other')).toContainText('7');
    await page.getByRole('button', { name: 'Change their details' }).click();
    const form = page.getByTestId('pair-form');
    // 4 November: 11 + 4 + 2026 reduces to a year 7, then month 7 + 10 = 17 -> 8, then day 8 + 1 = 9.
    await form.getByLabel('Day', { exact: true }).selectOption('4');
    await form.getByRole('button', { name: 'Show us side by side' }).click();
    await openSection(page, 'Day by day');
    await expect(page.getByTestId('pair-day-other').getByLabel('Personal day 9')).toBeVisible();
  });
});

test.describe('Between us: day by day', () => {
  test('shows each person their own day, with a headline and a question, and the gap', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Day by day');

    await expect(page.getByTestId('pair-day-label')).toHaveText('Thursday 1 Oct 2026');
    const you = page.getByTestId('pair-day-you');
    const other = page.getByTestId('pair-day-other');
    await expect(you.getByLabel('Personal day 8')).toBeVisible();
    await expect(other.getByLabel('Personal day 7')).toBeVisible();
    await expect(you).toContainText('Personal day · month 7 · year 6');
    await expect(other).toContainText('Personal day · month 6 · year 5');
    await expect(you).toContainText('Day 8 is about effort and follow-through.');
    await expect(other).toContainText('Day 7 is about reflection, study and quiet.');
    await expect(page.getByText('A question for the day')).toHaveCount(2);
    await expect(page.getByTestId('pair-day-gap')).toHaveText('Your numbers are 1 step apart.');
    await expect(page.getByTestId('rhythm-duo').getByRole('img')).toHaveAttribute('aria-label', 'Nine-number cycle. You are on 8. Sam is on 7.');
  });

  test('steps a day at a time, jumps to a date, and comes back to today', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Day by day');

    await page.getByRole('link', { name: 'Previous day' }).click();
    // The month changes on 1 October, so the personal month changes too: 30 September is day 6 + 30 = 36 -> 9 and 5 + 30 -> 8.
    await expect(page.getByTestId('pair-day-label')).toHaveText('Wednesday 30 Sep 2026');
    await expect(page.getByTestId('pair-day-you').getByLabel('Personal day 9')).toBeVisible();
    await expect(page.getByTestId('pair-day-other').getByLabel('Personal day 8')).toBeVisible();
    await expect(page.getByTestId('pair-day-gap')).toHaveText('Your numbers are 1 step apart.');

    await page.getByTestId('pair-date-picker').fill('2026-12-25');
    await expect(page.getByTestId('pair-day-label')).toHaveText('Friday 25 Dec 2026');
    await expect(page.getByTestId('pair-day-you').getByLabel('Personal day 7')).toBeVisible();
    await expect(page.getByTestId('pair-day-other').getByLabel('Personal day 6')).toBeVisible();
    await expect(page.getByTestId('pair-day-gap')).toHaveText('Your numbers are 1 step apart.');

    await page.getByRole('link', { name: 'Today', exact: true }).click();
    await expect(page.getByTestId('pair-day-label')).toHaveText('Thursday 1 Oct 2026');
  });

  test('the gap between the two day numbers is the same on any date', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Day by day');
    for (const date of ['2027-03-09', '2030-07-04', '2026-02-28']) {
      await page.getByTestId('pair-date-picker').fill(date);
      await expect(page.getByTestId('pair-day-gap')).toHaveText('Your numbers are 1 step apart.');
    }
  });
});

test.describe('Between us: month', () => {
  test('shows both personal months, a calendar with both days on every date, and the year at a glance', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Month');

    await expect(page.getByTestId('pair-month-title')).toHaveText('October 2026');
    await expect(page.getByTestId('pair-month-you').getByLabel('Personal month 7')).toBeVisible();
    await expect(page.getByTestId('pair-month-other').getByLabel('Personal month 6')).toBeVisible();
    await expect(page.getByTestId('pair-month-you')).toContainText('A reflective month 7 of a care-and-responsibility year 6.');

    const table = page.getByTestId('pair-month-table');
    await expect(table.getByRole('link')).toHaveCount(31);
    await expect(table.getByRole('link', { name: /^Thursday 1 October 2026: you are on day 8, Sam is on day 7, today\. Open both days\.$/ })).toBeVisible();
    await expect(table.getByRole('link', { name: /^Thursday 1 October 2026/ })).toHaveAttribute('aria-current', 'date');

    const year = page.getByTestId('pair-year-table');
    await expect(year.locator('tbody tr')).toHaveCount(12);
    const october = year.locator('tbody tr').nth(9);
    await expect(october).toHaveAttribute('aria-current', 'true');
    await expect(october).toContainText('October');
    await expect(october).toContainText('now');
    await expect(year.locator('tbody tr').first()).toContainText('January');
    await expect(page.getByText('2026 at a glance')).toBeVisible();
  });

  test('a date opens both days, and the day screen links back to the month', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Month');
    await page.getByTestId('pair-month-table').getByRole('link', { name: /^Thursday 15 October 2026/ }).click();
    await expect(page.getByTestId('pair-day-label')).toHaveText('Thursday 15 Oct 2026');
    await page.getByRole('link', { name: 'See the whole month' }).click();
    await expect(page.getByTestId('pair-month-title')).toHaveText('October 2026');
  });

  test('moves between months and back to this month', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Month');
    await page.getByRole('link', { name: 'Next month' }).click();
    await expect(page.getByTestId('pair-month-title')).toHaveText('November 2026');
    await expect(page.getByTestId('pair-month-table').getByRole('link')).toHaveCount(30);
    await expect(page.getByTestId('pair-year-table').locator('tbody tr').nth(9)).toHaveAttribute('aria-current', 'true');
    await page.getByRole('link', { name: 'Previous month' }).click();
    await page.getByRole('link', { name: 'Previous month' }).click();
    await expect(page.getByTestId('pair-month-title')).toHaveText('September 2026');
    await page.getByRole('link', { name: 'This month' }).click();
    await expect(page.getByTestId('pair-month-title')).toHaveText('October 2026');
  });

  test('every date carries the same gap between the two numbers', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Month');
    await expect(page.getByTestId('pair-month-table').getByRole('link')).toHaveCount(31);
    const labels = await page.getByTestId('pair-month-table').getByRole('link').evaluateAll((links) => links.map((a) => a.getAttribute('aria-label') ?? ''));
    expect(labels).toHaveLength(31);
    for (const label of labels) {
      const m = label.match(/you are on day (\d), .* is on day (\d)/);
      expect(m, label).not.toBeNull();
      expect((((Number(m![1]) - Number(m![2])) % 9) + 9) % 9, label).toBe(1);
    }
  });
});

test.describe('Between us: life stages', () => {
  test('puts both timelines on one axis, says where each person is now, and lists every period', async ({ page }) => {
    await ready(page);
    await openSection(page, 'Life stages');

    await expect(page.getByTestId('pair-life-chart')).toBeVisible();
    await expect(page.getByTestId('pair-life-chart').getByRole('img')).toHaveAttribute('aria-label', /one calendar-year axis/);
    await expect(page.getByTestId('pair-life-now')).toBeAttached();

    await expect(page.getByTestId('pair-life-you')).toContainText('Age 41 · born 1985');
    await expect(page.getByTestId('pair-life-other')).toContainText('Age 37 · born 1988');
    await expect(page.getByTestId('pair-life-you-now')).toHaveText('Second pinnacle: steady building, ages 36 to 44 (2021 to 2029)');
    await expect(page.getByTestId('pair-life-other-now')).toHaveText('Second pinnacle: independent starts, ages 34 to 42 (2022 to 2030)');

    await page.getByTestId('pair-life-you').getByText(/Every period for/).click();
    const table = page.getByTestId('pair-life-you-table');
    await expect(table.locator('tbody tr')).toHaveCount(8);
    await expect(table.locator('tbody tr').nth(1)).toContainText('Second pinnacle');
    await expect(table.locator('tbody tr').nth(1)).toContainText('36 to 44');
    await expect(table.locator('tbody tr').nth(1)).toContainText('2021 to 2029');
    // The third pinnacle runs ages 45 to 53, so the open fourth one starts at 54, in 2039.
    await expect(table.locator('tbody tr').nth(3)).toContainText('from 2039');
  });

  test('works for a parent and a child, and the child gets the first pinnacle', async ({ page }) => {
    await enter(page);
    await go(page, 'Between us');
    await addPartner(page, { label: 'Kit', day: 10, month: 3, year: 2014 });
    await openSection(page, 'Life stages');
    await expect(page.getByTestId('pair-life-other')).toContainText('Age 12 · born 2014');
    await expect(page.getByTestId('pair-life-other-now')).toContainText('First pinnacle');
    await expect(page.getByTestId('between-under16-notice')).toBeVisible();
  });
});

test.describe('Between us: small screens', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('nothing scrolls sideways at phone width on any section, in any state', async ({ page }) => {
    await ready(page);
    for (const name of ['Overview', 'Day by day', 'Month', 'Life stages'] as const) {
      await openSection(page, name);
      await expect(page.getByTestId('pair-safety')).toBeVisible();
      await page.getByTestId('pair-safety').scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${name} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
    }
    // The month calendar fits seven columns of two numbers in the width.
    await openSection(page, 'Month');
    const cell = await page.getByTestId('pair-month-table').getByRole('link').first().boundingBox();
    expect(cell!.width).toBeGreaterThan(36);
  });
});

test.describe('Between us: language on every section', () => {
  const BANNED = /\b(compatib\w*|incompatib\w*|match(?:es|ed|ing)?|mismatch\w*|soul ?mates?|twin flames?|meant to be|destiny|perfect(?:ly)?|ideal|toxic|red flags?|scores?|rating|rank(?:s|ed|ing)?|per ?cent|partners?|husbands?|wife|boyfriends?|girlfriends?|spouses?|lovers?|romantic)\b/i;

  /** The visible text apart from the main bank's own number readings, which have their own checks. */
  async function ownText(page: Page): Promise<string> {
    return page.evaluate(() => {
      const main = document.querySelector('main')?.cloneNode(true) as HTMLElement;
      main.querySelectorAll('[data-bank]').forEach((el) => el.remove());
      return `${document.querySelector('header')?.textContent ?? ''}\n${main.innerText}`;
    });
  }

  test('no score, verdict or relationship type on any section', async ({ page }) => {
    await ready(page);
    for (const name of ['Overview', 'Day by day', 'Month', 'Life stages'] as const) {
      await openSection(page, name);
      await expect(page.getByTestId('pair-safety')).toBeVisible();
      expect(await ownText(page), name).not.toMatch(BANNED);
    }
  });
});

test.describe('Between us: privacy across the sections', () => {
  test('visiting every section sends nothing personal and only fixed content files', async ({ page, baseURL }) => {
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    await enter(page);
    await go(page, 'Between us');
    await addPartner(page, { label: 'Wilhelmina Starling', day: 9, month: 8, year: 1991 });
    for (const name of ['Day by day', 'Month', 'Life stages', 'Overview'] as const) {
      await openSection(page, name);
      await page.waitForLoadState('networkidle');
    }
    await page.getByRole('navigation', { name: 'Between us sections' }).getByRole('link', { name: 'Day by day' }).click();
    await page.getByTestId('pair-date-picker').fill('1991-08-09'); // exploring the other person's birth date
    await page.waitForLoadState('networkidle');

    const origin = new URL(baseURL!).origin;
    for (const u of urls) {
      expect(new URL(u).origin, u).toBe(origin);
      const { pathname, search } = new URL(u);
      // The build's own files have hashed names, so only the content and page requests are searched.
      if (pathname.startsWith('/_next/')) continue;
      const lower = decodeURIComponent(`${pathname}${search}`).toLowerCase();
      for (const bad of ['wilhelmina', 'starling', '1991-08', '19910809', '1985-06', '19850617', 'amelia', 'carter']) {
        expect(lower.includes(bad), `${bad} in ${u}`).toBe(false);
      }
    }
    const content = urls.filter((u) => u.includes('/content/')).map((u) => new URL(u).pathname);
    for (const p of content) expect(p).toMatch(/^\/content\/(current\.json|v[\w.-]+\/(core|life|year|month|day|pair)\.json)$/);
    expect(content.some((p) => p.endsWith('/pair.json'))).toBe(true);
    expect(decodeURIComponent(page.url()).toLowerCase()).not.toMatch(/wilhelmina|starling|1991-|1985-|19910809|19850617/);
  });
});
