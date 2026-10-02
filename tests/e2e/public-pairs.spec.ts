import { expect, test, type Page, type Request } from '@playwright/test';
import { addPartner, AMELIA, enter, fillProfile, go, OCT_1_2026, SAM } from './helpers';

/*
 * The public pair pages: a grid of nine by nine and one static page for each of
 * the 45 pairs. They carry no personal data, never read as a score, and lead
 * into Between us through a form that asks for two birth dates and no name.
 */

const SLUGS: string[] = [];
for (let a = 1; a <= 9; a += 1) for (let b = a; b <= 9; b += 1) SLUGS.push(`${a}-${b}`);

const BANNED = /\b(compatib\w*|incompatib\w*|match(?:es|ed|ing)?|mismatch\w*|soul ?mates?|twin flames?|meant to be|destiny|perfect(?:ly)?|ideal|toxic|red flags?|scores?|rating|rank(?:s|ed|ing)?|per ?cent|partners?|husbands?|wife|boyfriends?|girlfriends?|spouses?|lovers?|romantic)\b/i;

async function ownText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const main = document.querySelector('main')?.cloneNode(true) as HTMLElement;
    main.querySelectorAll('[data-bank]').forEach((el) => el.remove());
    return `${document.querySelector('header')?.textContent ?? ''}\n${main.innerText}`;
  });
}

test.describe('the index', () => {
  test('is a grid of nine by nine where every cell opens one of 45 pages and none looks better than another', async ({ page }) => {
    await page.goto('/between');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Two numbers, side by side');
    const grid = page.getByTestId('pair-grid');
    const cells = grid.locator('tbody a');
    await expect(cells).toHaveCount(81);

    const hrefs = await cells.evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    expect(new Set(hrefs).size).toBe(45);
    expect(new Set(hrefs)).toEqual(new Set(SLUGS.map((s) => `/between/${s}`)));
    // The pair reads the same in either order: the cell for 3 and 7 and the cell for 7 and 3 are the same page.
    const at = (row: number, col: number) => cells.nth((row - 1) * 9 + (col - 1));
    await expect(at(3, 7)).toHaveAttribute('href', '/between/3-7');
    await expect(at(7, 3)).toHaveAttribute('href', '/between/3-7');
    await expect(at(3, 7)).toHaveAccessibleName('A 3 and a 7');
    await expect(at(8, 2)).toHaveAccessibleName('An 8 and a 2');

    // Every cell has the same look, and the headings are plain: no number is better than another.
    const classes = await cells.evaluateAll((els) => [...new Set(els.map((a) => a.className))]);
    expect(classes).toHaveLength(1);
    expect(await grid.locator('tbody td').evaluateAll((els) => els.filter((td) => /\btint-/.test(td.className)).length)).toBe(0);
    await expect(grid.locator('thead th')).toHaveCount(9);
    await expect(grid.locator('tbody th')).toHaveCount(9);

    expect(await ownText(page)).not.toMatch(BANNED);
  });

  test('is reached from the header, which marks it as the current page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Two numbers' }).click();
    await expect(page).toHaveURL(/\/between$/);
    await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Two numbers' })).toHaveAttribute('aria-current', 'page');
    await page.goto('/between/3-7');
    await expect(page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Two numbers' })).toHaveAttribute('aria-current', 'page');
  });

  test('is in the sitemap with all 45 pages, and robots does not block it', async ({ page, baseURL }) => {
    const sitemap = await (await page.request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/between</loc>');
    for (const slug of SLUGS) expect(sitemap, slug).toContain(`/between/${slug}</loc>`);
    expect(sitemap.match(/\/between\/\d-\d<\/loc>/g)).toHaveLength(45);
    const robots = await (await page.request.get('/robots.txt')).text();
    expect(robots).not.toMatch(/Disallow: \/between/);
    expect(robots).toContain('Disallow: /reading/');
    expect(baseURL).toBeTruthy();
  });
});

test.describe('a pair page', () => {
  test('says what the two numbers tend to bring, with the research and a way in', async ({ page }) => {
    await page.goto('/between/3-7');
    await expect(page).toHaveTitle('A 3 and a 7: what the two numbers tend to bring · Ninefold');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A 3 and a 7');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/between\/3-7$/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /no score and no verdict/);

    // Each number's relationships text, then the three pair sections from the bank.
    const relate = page.getByTestId('pair-page-relate');
    await expect(relate).toContainText('A 3 tends to bring fun and conversation');
    await expect(relate).toContainText('A 7 tends to need solitude');
    for (const heading of ['Where you meet', 'Where each may stretch', 'Talk about this', 'Where your cycles meet', 'What this does not tell you']) {
      await expect(page.getByRole('heading', { name: heading, level: 2 })).toBeVisible();
    }
    await expect(page.getByText('A 3 shares and a 7 studies.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'The research, and how this is worked out' })).toHaveAttribute('href', '/method#between');

    await expect(page.getByTestId('pair-safety')).toContainText("Numbers can't tell you whether to begin, stay or leave.");
    await expect(page.getByTestId('disclaimer').first()).toBeVisible();
    await expect(page.getByTestId('dates-only-form')).toBeVisible();

    // The grid is there to move to another pair, with this one marked.
    await expect(page.getByTestId('pair-grid').locator('a[aria-current="page"]')).toHaveCount(2);
  });

  test('shows a master number note only where a master can reduce to one of the two numbers', async ({ page }) => {
    await page.goto('/between/2-9');
    await expect(page.getByRole('heading', { name: 'If one of you is a master number' })).toBeVisible();
    await expect(page.getByText('An 11 is a 2 with a stronger signal')).toBeVisible();
    await expect(page.getByText('A 22 is a 4')).toHaveCount(0);

    await page.goto('/between/4-6');
    await expect(page.getByText('A 22 is a 4 with a larger horizon')).toBeVisible();
    await expect(page.getByText('A 33 is a 6 stretched')).toBeVisible();
    await expect(page.getByText('When both of you carry a master number')).toBeVisible();

    await page.goto('/between/2-2');
    await expect(page.getByText('An 11 is a 2')).toBeVisible();
    await expect(page.getByText('When both of you carry a master number')).toBeVisible();

    await page.goto('/between/5-5');
    await expect(page.getByRole('heading', { name: 'If one of you is a master number' })).toHaveCount(0);
  });

  test('reads a pair of the same number once', async ({ page }) => {
    await page.goto('/between/8-8');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('An 8 and an 8');
    await expect(page.getByTestId('pair-page-relate').getByRole('heading', { level: 3 })).toHaveCount(1);
  });

  test('exists for every one of the 45 pairs, in no other order or form, and says nothing like a verdict', async ({ page }) => {
    test.setTimeout(120_000);
    for (const slug of SLUGS) {
      const response = await page.goto(`/between/${slug}`);
      expect(response?.status(), slug).toBe(200);
      const [a, b] = slug.split('-').map(Number) as [number, number];
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(new RegExp(`^An? ${a} and an? ${b}$`));
      await expect(page.getByRole('heading', { level: 2, name: 'Talk about this' })).toBeVisible();
      const text = await ownText(page);
      const hit = text.match(BANNED);
      expect(hit ? `${slug}: "${hit[0]}" in ...${text.slice(Math.max(0, (hit.index ?? 0) - 60), (hit.index ?? 0) + 60)}...` : undefined).toBeUndefined();
    }
    // Only the canonical order is a page.
    for (const slug of ['7-3', '9-1', '12-3', '0-5', '3-7-1']) {
      const response = await page.goto(`/between/${slug}`);
      expect(response?.status(), slug).toBe(404);
    }
  });

  test('is linked from each number page, with a master number using its root', async ({ page }) => {
    await page.goto('/numbers/3');
    const links = page.getByTestId('number-pairs').getByRole('link');
    await expect(links).toHaveCount(9);
    await expect(links.nth(6)).toHaveAttribute('href', '/between/3-7');
    await expect(links.nth(6)).toHaveAccessibleName('A 3 and a 7');
    await expect(links.nth(0)).toHaveAttribute('href', '/between/1-3');

    await page.goto('/numbers/22');
    await expect(page.getByTestId('number-pairs')).toContainText('A master number uses its root, 4, for pairs.');
    await expect(page.getByTestId('number-pairs').getByRole('link').nth(2)).toHaveAttribute('href', '/between/3-4');
  });
});

test.describe('the dates-only way in', () => {
  async function fillDates(page: Page, mine: { day: number; month: number; year: number }, theirs: { day: number; month: number; year: number }, nickname?: string) {
    const form = page.getByTestId('dates-only-form');
    await expect(form.locator('select').nth(2).locator('option')).not.toHaveCount(1);
    const yours = form.getByRole('group', { name: 'Your birth date' });
    const other = form.getByRole('group', { name: 'Their birth date' });
    await yours.getByLabel('Day', { exact: true }).selectOption(String(mine.day));
    await yours.getByLabel('Month', { exact: true }).selectOption(String(mine.month));
    await yours.getByLabel('Year', { exact: true }).selectOption(String(mine.year));
    await other.getByLabel('Day', { exact: true }).selectOption(String(theirs.day));
    await other.getByLabel('Month', { exact: true }).selectOption(String(theirs.month));
    await other.getByLabel('Year', { exact: true }).selectOption(String(theirs.year));
    if (nickname) await form.getByLabel(/^Nickname/).fill(nickname);
  }

  test('takes two dates and no name, and opens Between us', async ({ page }) => {
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/between/3-7');
    await fillDates(page, AMELIA, SAM, 'Sam');
    await page.getByTestId('dates-only-form').getByRole('button', { name: 'Show us side by side' }).click();

    await expect(page).toHaveURL(/\/reading\/between$/);
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
    await expect(page.getByTestId('pair-numbers')).toHaveText('A 1 and a 3.');
    await expect(page.getByTestId('gap-headline')).toHaveText('Your numbers are 1 step apart.');
    await expect(page.getByTestId('pair-safety')).toBeVisible();
    // No name was given, so there are no name numbers, and no Names section.
    await expect(page.getByRole('navigation', { name: 'Between us sections' }).getByRole('link', { name: 'Names' })).toHaveCount(0);

    // The rest of the reading copes with having no name.
    await go(page, 'Snapshot');
    await expect(page.getByRole('heading', { name: 'Your core numbers' })).toBeVisible();
    await expect(page.getByTestId('core-lifePath').getByLabel('Life path 1')).toBeVisible();
    await expect(page.getByTestId('core-expression')).toContainText('needs a valid birth name');
    await go(page, 'Name grid');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await go(page, 'Day');
    await expect(page.getByTestId('day-card')).toBeVisible();
    await go(page, 'Between us');
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');

    // Forgetting clears both and goes home.
    await page.getByRole('button', { name: 'Forget my details' }).click();
    await expect(page.getByRole('button', { name: 'Show my numbers' })).toBeVisible();
  });

  test('works from the index too, and without a nickname', async ({ page }) => {
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/between');
    await fillDates(page, AMELIA, SAM);
    await page.getByTestId('dates-only-form').getByRole('button', { name: 'Show us side by side' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and the other person');
  });

  test('asks for both dates, and refuses one in the future', async ({ page }) => {
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/between');
    const form = page.getByTestId('dates-only-form');
    await form.getByRole('button', { name: 'Show us side by side' }).click();
    await expect(form.getByText('Choose a day, month and year.')).toHaveCount(2);

    await expect(form.locator('select').nth(2).locator('option')).not.toHaveCount(1);
    const yours = form.getByRole('group', { name: 'Your birth date' });
    await yours.getByLabel('Day', { exact: true }).selectOption('1');
    await yours.getByLabel('Month', { exact: true }).selectOption('1');
    await yours.getByLabel('Year', { exact: true }).selectOption('1990');
    const other = form.getByRole('group', { name: 'Their birth date' });
    await other.getByLabel('Day', { exact: true }).selectOption('25');
    await other.getByLabel('Month', { exact: true }).selectOption('12');
    await other.getByLabel('Year', { exact: true }).selectOption('2026');
    await form.getByRole('button', { name: 'Show us side by side' }).click();
    await expect(form.getByText('A birth date cannot be in the future.')).toBeVisible();
    await expect(page).toHaveURL(/\/between$/);
  });

  test('starts afresh when someone was already entered in this tab', async ({ page }) => {
    await enter(page);
    await go(page, 'Between us');
    await addPartner(page, SAM);
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Two numbers' }).click();
    await fillDates(page, { day: 3, month: 3, year: 2003 }, { day: 21, month: 9, year: 1970 }, 'Lee');
    await page.getByTestId('dates-only-form').getByRole('button', { name: 'Show us side by side' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Lee');
    await expect(page.getByTestId('pair-people')).toHaveCount(0);
    // 3 March 2003 is a life path 11/2; 21 September 1970 is 3 + 9 + 8 = 20, a 2.
    await expect(page.getByTestId('pair-numbers')).toHaveText('An 11/2 and a 2.');
  });

  test('shows the under-16 notice when either date is under 16', async ({ page }) => {
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/between');
    await fillDates(page, AMELIA, { day: 10, month: 3, year: 2014 }, 'Kit');
    await page.getByTestId('dates-only-form').getByRole('button', { name: 'Show us side by side' }).click();
    await expect(page.getByTestId('between-under16-notice')).toBeVisible();
  });
});

test.describe('privacy and the policy', () => {
  test('visiting the pages and using the form sends no date or nickname anywhere, and only fixed content files load', async ({ page, baseURL }) => {
    const pending: Promise<{ url: string; headers: Record<string, string>; body: string }>[] = [];
    page.on('request', (request: Request) => {
      pending.push(request.allHeaders().then((headers) => ({ url: request.url(), headers, body: request.postData() ?? '' })));
    });
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/between');
    await page.getByTestId('pair-grid').locator('a[aria-label="A 3 and a 7"]').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A 3 and a 7');

    const form = page.getByTestId('dates-only-form');
    await expect(form.locator('select').nth(2).locator('option')).not.toHaveCount(1);
    const yours = form.getByRole('group', { name: 'Your birth date' });
    const other = form.getByRole('group', { name: 'Their birth date' });
    await yours.getByLabel('Day', { exact: true }).selectOption('9');
    await yours.getByLabel('Month', { exact: true }).selectOption('8');
    await yours.getByLabel('Year', { exact: true }).selectOption('1991');
    await other.getByLabel('Day', { exact: true }).selectOption('14');
    await other.getByLabel('Month', { exact: true }).selectOption('12');
    await other.getByLabel('Year', { exact: true }).selectOption('1979');
    await form.getByLabel(/^Nickname/).fill('Wilhelmina Starling');
    await form.getByRole('button', { name: 'Show us side by side' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Wilhelmina Starling');
    for (const name of ['Day by day', 'Month', 'Life stages', 'Overview']) {
      await page.getByRole('navigation', { name: 'Between us sections' }).getByRole('link', { name, exact: true }).click();
      await page.waitForLoadState('networkidle');
    }

    await page.waitForLoadState('networkidle');
    const seen = await Promise.all(pending);
    const origin = new URL(baseURL!).origin;
    expect(seen.filter((s) => new URL(s.url).origin !== origin).map((s) => s.url)).toEqual([]);
    const forbidden = ['wilhelmina', 'starling', '1991-08', '19910809', '09-08-1991', '9/8/1991', '1979-12', '19791214', '14-12-1979', '14/12/1979'];
    for (const s of seen) {
      const haystack = `${s.url}\n${JSON.stringify(s.headers)}\n${s.body}`.toLowerCase();
      for (const bad of forbidden) expect(haystack.includes(bad), `"${bad}" found in a request to ${s.url}`).toBe(false);
      expect(s.body, `request body for ${s.url}`).toBe('');
    }
    const href = decodeURIComponent(page.url()).toLowerCase();
    for (const bad of forbidden) expect(href.includes(bad), `"${bad}" in the address`).toBe(false);

    const storage = await page.evaluate(async () => ({
      local: window.localStorage.length,
      session: window.sessionStorage.length,
      cookie: document.cookie,
      databases: 'databases' in indexedDB ? (await indexedDB.databases()).length : 0,
      caches: 'caches' in window ? (await caches.keys()).length : 0,
    }));
    expect(storage).toEqual({ local: 0, session: 0, cookie: '', databases: 0, caches: 0 });
  });

  test('the pages and the form run under the policy with no violations and no console errors', async ({ page }) => {
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
    await go(page, 'Between us');
    await addPartner(page, { label: 'Dav', name: 'David', day: 2, month: 11, year: 1988 });
    for (const name of ['Names', 'Day by day', 'Month', 'Life stages', 'Overview']) {
      await page.getByRole('navigation', { name: 'Between us sections' }).getByRole('link', { name, exact: true }).click();
      await page.waitForLoadState('networkidle');
    }
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Two numbers' }).click();
    await page.waitForLoadState('networkidle');
    await page.goto('/between/2-4');
    await page.waitForLoadState('networkidle');

    const violations = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
    expect(violations).toEqual([]);
    expect(problems).toEqual([]);
  });
});

test.describe('small screens', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('nothing scrolls sideways on the index or a pair page, and every grid cell can be tapped', async ({ page }) => {
    for (const path of ['/between', '/between/3-7', '/between/2-4', '/numbers/3']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
    }
    await page.goto('/between');
    const boxes = await page.getByTestId('pair-grid').locator('tbody a').evaluateAll((els) => els.map((a) => a.getBoundingClientRect().width));
    expect(Math.min(...boxes)).toBeGreaterThanOrEqual(24);
  });
});
