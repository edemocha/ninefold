import { readFile } from 'node:fs/promises';
import { expect, test, type Page, type Request } from '@playwright/test';
import { addPartner, AMELIA, enter, fillProfile, go, OCT_1_2026, SAM } from './helpers';

/*
 * Between us: a second person next to the first, with no score and no verdict,
 * the same privacy as the first person, and wording that cannot be read as a
 * ruling on whether two people are right for each other.
 */

async function openBetween(page: Page): Promise<void> {
  await go(page, 'Between us');
  await expect(page.getByRole('heading', { name: 'Two sets of numbers, side by side', level: 1 })).toBeVisible();
}

test.describe('Between us', () => {
  test('adds a second person and reads two life paths side by side', async ({ page }) => {
    await enter(page);
    await openBetween(page);

    // Before anyone is added: the form, the consent line, the stance.
    await expect(page.getByTestId('pair-form')).toBeVisible();
    await expect(page.getByTestId('between-consent')).toContainText('Their details stay in this tab, like yours.');
    await expect(page.getByTestId('between-stance')).toContainText('does not judge a pair');
    await expect(page.getByTestId('pair-result')).toHaveCount(0);

    await addPartner(page, SAM);
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
    await expect(page.getByTestId('pair-numbers')).toHaveText('A 1 and a 3.');
    await expect(page.getByTestId('pair-side-you')).toContainText('Life path');
    await expect(page.getByTestId('pair-side-other')).toContainText('Sam');

    // How each number tends to relate, from the main bank, then the three pair sections.
    await expect(page.getByTestId('pair-relate-you')).toContainText('In close relationships a 1 tends to be direct');
    await expect(page.getByTestId('pair-relate-other')).toContainText('A 3 tends to bring fun and conversation');
    const sections = page.getByTestId('pair-sections');
    for (const heading of ['Where you meet', 'Where each may stretch', 'Talk about this']) {
      await expect(sections.getByRole('heading', { name: heading })).toBeVisible();
    }
    await expect(sections).toContainText('A 1 brings direction and a 3 brings words and play.');

    // The cycle gap: 6 and 5 in 2026, so one step apart, with the arithmetic and the table.
    const cycles = page.getByTestId('pair-cycles');
    await expect(page.getByTestId('gap-headline')).toHaveText('Your numbers are 1 step apart.');
    await expect(page.getByTestId('gap-line').nth(0)).toHaveText('In 1 year, Sam has the year number you have now.');
    await expect(page.getByTestId('gap-line').nth(1)).toHaveText('In 8 years, you have the year number Sam has now.');
    await expect(page.getByTestId('gap-holds')).toContainText('every year, month and day');
    await cycles.getByText('Show the math').click();
    await expect(cycles).toContainText('6 + 17 = 23 → 2 + 3 = 5');
    await expect(cycles).toContainText('11 + 2 = 13 → 1 + 3 = 4');
    await expect(cycles).toContainText('5 − 4 = 1');
    await expect(cycles).toContainText('The year');
    const rows = page.getByTestId('cycle-strip').locator('tbody tr');
    await expect(rows).toHaveCount(9);
    await expect(rows.first()).toHaveAttribute('aria-current', 'true');
    await expect(rows.first()).toContainText('2026');
    await expect(rows.first()).toContainText('now');
    await expect(page.getByTestId('rhythm-duo').getByRole('img')).toHaveAttribute('aria-label', 'Nine-number cycle. You are on 6. Sam is on 5.');

    // The two fixed safety lines and the disclaimer.
    const safety = page.getByTestId('pair-safety');
    await expect(safety).toContainText("Numbers can't tell you whether to begin, stay or leave. That is for you to decide.");
    await expect(safety).toContainText('If you ever feel unsafe with someone, talk to a person you trust or a local support service.');
    await expect(page.getByTestId('disclaimer').last()).toContainText('Numerology is a symbolic tradition.');
  });

  test('works without a nickname', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    await addPartner(page, { day: 2, month: 11, year: 1988 });
    await expect(page.getByTestId('pair-heading')).toHaveText('You and the other person');
    await expect(page.getByTestId('gap-line').nth(0)).toHaveText('In 1 year, the other person has the year number you have now.');
  });

  test('says the same when two birthdays share a month and day', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    await addPartner(page, { label: 'Twin', day: AMELIA.day, month: AMELIA.month, year: 2001 });
    await expect(page.getByTestId('gap-headline')).toHaveText('Your numbers are the same.');
    await expect(page.getByTestId('gap-line')).toHaveText('You and Twin have the same year number now.');
  });

  test('adds one short note when a master number is in the pair', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    await addPartner(page, { label: 'Ro', day: 3, month: 3, year: 2003 });
    await expect(page.getByTestId('pair-numbers')).toHaveText('A 1 and an 11/2.');
    await expect(page.getByTestId('pair-overlay')).toContainText('An 11 is a 2 with a stronger signal');
    await expect(page.getByTestId('pair-overlay')).toContainText('Treat it as a theme, not a status.');
  });

  test('changes and removes the second person, and forgetting clears both', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    await addPartner(page, SAM);
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');

    // Change: the form comes back filled in, and Cancel keeps the pair.
    await page.getByRole('button', { name: 'Change their details' }).click();
    const form = page.getByTestId('pair-form');
    await expect(form.getByLabel(/^Nickname/)).toHaveValue('Sam');
    await expect(form.getByLabel('Year', { exact: true })).toHaveValue('1988');
    await form.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');

    await page.getByRole('button', { name: 'Change their details' }).click();
    await form.getByLabel(/^Nickname/).fill('Sammy');
    // 4 November: 11 + 4 = 15, cut to 6, against Amelia's 5, so still one step apart (the other way round).
    await form.getByLabel('Day', { exact: true }).selectOption('4');
    await form.getByRole('button', { name: 'Show us side by side' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sammy');
    await expect(page.getByTestId('gap-headline')).toHaveText('Your numbers are 1 step apart.');
    await expect(page.getByTestId('gap-line').nth(0)).toHaveText('In 8 years, Sammy has the year number you have now.');
    await expect(page.getByTestId('gap-line').nth(1)).toHaveText('In 1 year, you have the year number Sammy has now.');

    // Remove.
    await page.getByRole('button', { name: 'Remove them' }).click();
    await expect(page.getByTestId('pair-form')).toBeVisible();
    await expect(page.getByTestId('pair-result')).toHaveCount(0);

    // Forgetting my details clears the second person too: nobody is there when I come back.
    await addPartner(page, SAM);
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
    await page.getByRole('button', { name: 'Forget my details' }).click();
    await expect(page).toHaveURL(/\/(#.*)?$/);
    await fillProfile(page, AMELIA);
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByRole('heading', { name: 'Your core numbers' })).toBeVisible();
    await openBetween(page);
    await expect(page.getByTestId('pair-form')).toBeVisible();
    await expect(page.getByTestId('pair-result')).toHaveCount(0);
  });

  test('rejects a date that does not exist or is in the future', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    const form = page.getByTestId('pair-form');
    await form.getByRole('button', { name: 'Show us side by side' }).click();
    await expect(form.getByText('Choose a day, month and year.')).toBeVisible();

    await expect(form.locator('select').nth(2).locator('option')).not.toHaveCount(1);
    await form.getByLabel('Year', { exact: true }).selectOption('2026');
    await form.getByLabel('Month', { exact: true }).selectOption('12');
    await form.getByLabel('Day', { exact: true }).selectOption('25');
    await form.getByRole('button', { name: 'Show us side by side' }).click();
    await expect(form.getByText('A birth date cannot be in the future.')).toBeVisible();
    await expect(page.getByTestId('pair-result')).toHaveCount(0);
  });

  test('shows the under-16 notice when the other person is under 16', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    await expect(page.getByTestId('between-under16-notice')).toHaveCount(0);
    await addPartner(page, { label: 'Kit', day: 10, month: 3, year: 2014 });
    await expect(page.getByTestId('between-under16-notice')).toContainText('under 16');
  });

  test('under birthday cycles it says "about" and explains that the gap moves between birthdays', async ({ page }) => {
    await page.clock.install({ time: OCT_1_2026 });
    await page.goto('/#cy=birthday');
    await fillProfile(page, AMELIA);
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByRole('heading', { name: 'Your core numbers' })).toBeVisible();
    await openBetween(page);
    await addPartner(page, SAM);

    // Amelia's cycle began on 17 June, Sam's has not yet begun for 2026 (2 November).
    await expect(page.getByTestId('gap-headline')).toHaveText('Your numbers are 2 steps apart.');
    await expect(page.getByTestId('gap-line').nth(0)).toHaveText('In about 2 years, Sam has the year number you have now.');
    await expect(page.getByTestId('gap-holds')).toContainText('between your two birthdays');
    await expect(page.getByTestId('gap-holds')).toContainText('usual size of 1');
    await expect(page.getByTestId('cycle-strip')).toContainText('The cycle that starts in');
  });

  test('works from the keyboard alone', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    const form = page.getByTestId('pair-form');
    await form.getByLabel(/^Nickname/).focus();
    await page.keyboard.type('Kai');
    await expect(form.locator('select').nth(2).locator('option')).not.toHaveCount(1);
    await page.keyboard.press('Tab');
    await page.keyboard.type('2');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Nov');
    await page.keyboard.press('Tab');
    await page.keyboard.type('1988');
    await page.keyboard.press('Tab');
    await expect(form.getByLabel(/^Their full name/)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(form.getByRole('button', { name: 'Show us side by side' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Kai');
  });

  test('the nickname is shown as plain text, never as markup', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    await addPartner(page, { label: '<b>Sam</b>', day: 2, month: 11, year: 1988 });
    await expect(page.getByTestId('pair-heading')).toHaveText('You and <b>Sam</b>');
    await expect(page.getByTestId('pair-heading').locator('b')).toHaveCount(0);
  });
});

test.describe('Between us: language', () => {
  const BANNED = /\b(compatib\w*|incompatib\w*|match(?:es|ed|ing)?|mismatch\w*|soul ?mates?|twin flames?|meant to be|destiny|perfect(?:ly)?|ideal|toxic|red flags?|scores?|rating|rank(?:s|ed|ing)?|per ?cent|partners?|husbands?|wife|boyfriends?|girlfriends?|spouses?|lovers?|romantic)\b/i;

  /** The visible text of the page, apart from the main bank's life path text, which has its own checks. */
  async function ownText(page: Page): Promise<string> {
    return page.evaluate(() => {
      const main = document.querySelector('main')?.cloneNode(true) as HTMLElement;
      main.querySelectorAll('[data-bank]').forEach((el) => el.remove());
      const header = document.querySelector('header')?.textContent ?? '';
      return `${header}\n${main.innerText}`;
    });
  }

  test('no score, verdict or relationship type anywhere on the page, in any state', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    expect(await ownText(page)).not.toMatch(BANNED);

    for (const p of [SAM, { label: 'Ro', day: 3, month: 3, year: 2003 }, { label: 'Twin', day: 17, month: 6, year: 1999 }, { day: 9, month: 9, year: 2002 }]) {
      if (await page.getByRole('button', { name: 'Remove them' }).count()) await page.getByRole('button', { name: 'Remove them' }).click();
      await addPartner(page, p);
      await expect(page.getByTestId('pair-result')).toBeVisible();
      await page.getByTestId('pair-cycles').getByText('Show the math').click();
      expect(await ownText(page), `with ${JSON.stringify(p)}`).not.toMatch(BANNED);
    }
  });

  test('the tab is called Between us, not compatibility', async ({ page }) => {
    await enter(page);
    await expect(page.getByRole('navigation', { name: 'Your reading' }).getByRole('link', { name: 'Between us', exact: true })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Your reading' })).not.toContainText(/compatib/i);
  });
});

test.describe('Between us: privacy', () => {
  const PARTNER = { label: 'Wilhelmina Starling', day: 9, month: 8, year: 1991 };

  const FORBIDDEN = [
    // The other person.
    'wilhelmina',
    'starling',
    '1991-08-09',
    '09-08-1991',
    '9-8-1991',
    '9/8/1991',
    '09/08/1991',
    '19910809',
    '09%2f08%2f1991',
    '9 aug',
    'aug 9',
    'august 9',
    '9 august',
    '1991-08',
    // The first person.
    'amelia',
    'carter',
    '1985-06-17',
    '17-06-1985',
    '17/06/1985',
    '19850617',
    '17 jun',
    'june 17',
    '17 june',
  ];

  type Seen = { url: string; headers: Record<string, string>; body: string };

  test("the other person's name and birth date appear in no request, address, file name or storage", async ({ page, baseURL }) => {
    const pending: Promise<Seen>[] = [];
    page.on('request', (request: Request) => {
      pending.push(request.allHeaders().then((headers) => ({ url: request.url(), headers, body: request.postData() ?? '' })));
    });

    await enter(page);
    await openBetween(page);
    await addPartner(page, PARTNER);
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Wilhelmina Starling');
    await page.getByTestId('pair-cycles').getByText('Show the math').click();

    // Change it, switch tabs and come back, then use every export.
    await page.getByRole('button', { name: 'Change their details' }).click();
    await page.getByTestId('pair-form').getByRole('button', { name: 'Cancel' }).click();
    await go(page, 'Day');
    await expect(page.getByTestId('day-card')).toBeVisible();
    await go(page, 'Between us');
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Wilhelmina Starling');

    const png = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Share image (numbers only)' }).click();
    const download = await png;
    expect(download.suggestedFilename()).toBe('between-us-numbers.png');
    const bytes = await readFile((await download.path())!);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    const asText = bytes.toString('latin1').toLowerCase();
    for (const bad of ['wilhelmina', 'starling']) expect(asText.includes(bad), `"${bad}" in the share image`).toBe(false);

    await page.waitForLoadState('networkidle');
    const seen = await Promise.all(pending);

    const origin = new URL(baseURL!).origin;
    expect(seen.filter((s) => new URL(s.url).origin !== origin).map((s) => s.url)).toEqual([]);
    for (const s of seen) {
      const haystack = `${s.url}\n${JSON.stringify(s.headers)}\n${s.body}`.toLowerCase();
      for (const bad of FORBIDDEN) expect(haystack.includes(bad), `"${bad}" found in a request to ${s.url}`).toBe(false);
      expect(s.body, `request body for ${s.url}`).toBe('');
    }
    // The Between us text arrives as one fixed file, the same for everyone.
    expect(seen.some((s) => /\/content\/v[\w.-]+\/pair\.json$/.test(new URL(s.url).pathname))).toBe(true);

    const href = decodeURIComponent(page.url()).toLowerCase();
    for (const bad of FORBIDDEN) expect(href.includes(bad), `"${bad}" in the address`).toBe(false);

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

  test('a reload forgets both people', async ({ page }) => {
    await enter(page);
    await openBetween(page);
    await addPartner(page, SAM);
    await expect(page.getByTestId('pair-result')).toBeVisible();
    await page.reload();
    // The reading needs a profile, and nothing is stored, so it sends you back to the start.
    await expect(page.getByRole('button', { name: 'Show my numbers' })).toBeVisible();
    await expect(page.getByText('Sam', { exact: true })).toHaveCount(0);
  });
});
