import { readFile } from 'node:fs/promises';
import { expect, test, type Page, type Request } from '@playwright/test';
import { addAnother, addPartner, AMELIA, enter, go, SAM } from './helpers';

/*
 * Between us, phase 3: the name pair, the kind-of-relationship picker, and a
 * circle of up to five people. The picker only changes questions, names are
 * optional, and everyone is held in memory like the first person.
 */

const nav = (page: Page) => page.getByRole('navigation', { name: 'Between us sections' });
const section = (page: Page, name: string) => nav(page).getByRole('link', { name, exact: true });

async function ready(page: Page, partner = SAM): Promise<void> {
  await enter(page);
  await go(page, 'Between us');
  await addPartner(page, partner);
  await expect(page.getByTestId('pair-result')).toBeVisible();
}

test.describe('Between us: names', () => {
  const DAVID = { label: 'Dav', name: 'David', day: 2, month: 11, year: 1988 };

  test('has no Names section until a name is given', async ({ page }) => {
    await ready(page);
    await expect(nav(page).getByRole('link')).toHaveText(['Overview', 'Day by day', 'Month', 'Life stages']);
  });

  test('reads expression and soul urge for the two of you, with the arithmetic', async ({ page }) => {
    await ready(page, DAVID);
    await expect(section(page, 'Names')).toBeVisible();
    await section(page, 'Names').click();
    await expect(page.getByRole('heading', { name: 'Two names, side by side' })).toBeVisible();

    // Amelia Rose Carter: expression 1 (karmic debt 19/1), soul urge 6. DAVID: expression 22/4, soul urge 1.
    const expression = page.getByTestId('pair-names-expression');
    await expect(page.getByTestId('pair-names-expression-frame')).toContainText('Expression is what each of you brings to the world');
    await expect(expression.getByLabel('Expression 1', { exact: true })).toBeVisible();
    await expect(expression.getByLabel('Expression 22')).toBeVisible();
    await expect(page.getByTestId('pair-names-expression-you')).toContainText('Karmic debt 19/1');
    await expect(page.getByTestId('pair-names-expression-numbers')).toHaveText('A 1 and a 22/4');
    await expect(page.getByTestId('pair-names-expression-overlay')).toContainText('A 22 is a 4 with a larger horizon');
    // Same pair text as a life path pair of 1 and 4 would show.
    await expect(expression).toContainText('A 1 starts and a 4 builds.');

    const soul = page.getByTestId('pair-names-soulUrge');
    await expect(page.getByTestId('pair-names-soulUrge-frame')).toContainText('Soul urge is what each of you wants underneath');
    await expect(page.getByTestId('pair-names-soulUrge-numbers')).toHaveText('A 6 and a 1');
    await expect(soul.getByRole('heading', { name: 'Where you meet' })).toBeVisible();
    await expect(soul.getByRole('heading', { name: 'Talk about this' })).toBeVisible();

    // The arithmetic is there, with the letters, as it is for the first person.
    await page.getByTestId('pair-names-expression-other').getByText('Why this number').click();
    await expect(page.getByTestId('pair-names-expression-other')).toContainText(/D4 \+ A1 \+ V4 \+ I9 \+ D4 = 22/);

    await expect(page.getByTestId('pair-safety')).toBeVisible();
  });

  test('says what a name needs when it cannot be read, and does not add the person', async ({ page }) => {
    await enter(page);
    await go(page, 'Between us');
    await addPartner(page, { label: 'Wei', name: '张伟', day: 2, month: 11, year: 1988 });
    await expect(page.getByTestId('pair-form').getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('pair-result')).toHaveCount(0);
    // Clearing the name lets the date through.
    await page.getByTestId('pair-form').getByLabel(/^Their full name/).fill('');
    await page.getByTestId('pair-form').getByRole('button', { name: 'Show us side by side' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Wei');
  });

  test('removing the name from their details removes the Names section', async ({ page }) => {
    await ready(page, DAVID);
    await expect(section(page, 'Names')).toBeVisible();
    await page.getByRole('button', { name: 'Change their details' }).click();
    await page.getByTestId('pair-form').getByLabel(/^Their full name/).fill('');
    await page.getByTestId('pair-form').getByRole('button', { name: 'Show us side by side' }).click();
    await expect(section(page, 'Names')).toHaveCount(0);
  });

  test('the full name is held in memory only', async ({ page }) => {
    await ready(page, DAVID);
    await page.getByRole('button', { name: 'Change their details' }).click();
    await expect(page.getByTestId('pair-form').getByLabel(/^Their full name/)).toHaveValue('David');
    await page.getByTestId('pair-form').getByRole('button', { name: 'Cancel' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Show my numbers' })).toBeVisible();
  });
});

test.describe('Between us: kind of relationship', () => {
  test('is optional, and only changes the questions', async ({ page }) => {
    await ready(page);
    const picker = page.getByTestId('pair-type');
    await expect(picker.getByRole('radio', { name: 'No choice' })).toBeChecked();
    await expect(page.getByTestId('pair-type-questions')).toHaveCount(0);
    const before = await page.getByTestId('pair-sections').innerText();
    const numbers = await page.getByTestId('pair-numbers').innerText();

    await picker.getByRole('radio', { name: 'Friends' }).check();
    const questions = page.getByTestId('pair-type-questions');
    await expect(questions.getByRole('heading', { name: 'Questions for friends' })).toBeVisible();
    await expect(questions.getByRole('listitem')).toHaveCount(4);
    await expect(questions).toContainText('What do you each count on the other for');
    for (const q of await questions.getByRole('listitem').allInnerTexts()) expect(q.trim().endsWith('?')).toBe(true);
    expect(await page.getByTestId('pair-sections').innerText()).toBe(before);
    expect(await page.getByTestId('pair-numbers').innerText()).toBe(numbers);

    await picker.getByRole('radio', { name: 'A couple' }).check();
    await expect(questions.getByRole('heading', { name: 'Questions for a couple' })).toBeVisible();
    await expect(questions).toContainText('What does a good week together look like');
    await picker.getByRole('radio', { name: 'Family' }).check();
    await expect(questions).toContainText('family disagree');
    await picker.getByRole('radio', { name: 'Colleagues' }).check();
    await expect(questions).toContainText('handover');
    expect(await page.getByTestId('pair-sections').innerText()).toBe(before);

    await picker.getByRole('radio', { name: 'No choice' }).check();
    await expect(page.getByTestId('pair-type-questions')).toHaveCount(0);
  });

  test('is kept for each person while you move around, and is cleared when they are removed', async ({ page }) => {
    await ready(page);
    await page.getByTestId('pair-type').getByRole('radio', { name: 'Colleagues' }).check();
    await section(page, 'Month').click();
    await section(page, 'Overview').click();
    await expect(page.getByTestId('pair-type').getByRole('radio', { name: 'Colleagues' })).toBeChecked();

    await addAnother(page, { label: 'Kit', day: 10, month: 3, year: 2014 });
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Kit');
    await expect(page.getByTestId('pair-type').getByRole('radio', { name: 'No choice' })).toBeChecked();
    await page.getByTestId('pair-type').getByRole('radio', { name: 'Family' }).check();
    await page.getByTestId('pair-people').getByRole('button', { name: 'Sam' }).click();
    await expect(page.getByTestId('pair-type').getByRole('radio', { name: 'Colleagues' })).toBeChecked();
    await page.getByTestId('pair-people').getByRole('button', { name: 'Kit' }).click();
    await expect(page.getByTestId('pair-type').getByRole('radio', { name: 'Family' })).toBeChecked();
  });

  test('keeps the type when the details change', async ({ page }) => {
    await ready(page);
    await page.getByTestId('pair-type').getByRole('radio', { name: 'Friends' }).check();
    await page.getByRole('button', { name: 'Change their details' }).click();
    await page.getByTestId('pair-form').getByLabel('Day', { exact: true }).selectOption('4');
    await page.getByTestId('pair-form').getByRole('button', { name: 'Show us side by side' }).click();
    await expect(page.getByTestId('pair-type').getByRole('radio', { name: 'Friends' })).toBeChecked();
  });
});

test.describe('Between us: a circle', () => {
  const KIT = { label: 'Kit', day: 10, month: 3, year: 2014 };

  test('adds more people, switches between them, and shows everyone on one ring', async ({ page }) => {
    await ready(page);
    await expect(section(page, 'Circle')).toHaveCount(0);
    await expect(page.getByTestId('pair-people')).toHaveCount(0);

    await addAnother(page, KIT);
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Kit');
    const people = page.getByTestId('pair-people');
    await expect(people.getByRole('button')).toHaveText(['Sam', 'Kit']);
    await expect(people.getByRole('button', { name: 'Kit' })).toHaveAttribute('aria-pressed', 'true');
    await expect(nav(page).getByRole('link')).toHaveText(['Overview', 'Day by day', 'Month', 'Life stages', 'Circle']);

    await people.getByRole('button', { name: 'Sam' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
    await expect(page.getByTestId('pair-numbers')).toHaveText('A 1 and a 3.');

    await section(page, 'Circle').click();
    await expect(page.getByTestId('pair-circle')).toBeVisible();
    // Amelia is in a year 6; Sam and Kit are both in a year 5.
    const legend = page.getByTestId('pair-circle-legend').getByRole('listitem');
    await expect(legend).toHaveText([/You: year number 6/, /Sam: year number 5/, /Kit: year number 5/]);
    await expect(page.getByTestId('rhythm-circle').getByRole('img')).toHaveAttribute(
      'aria-label',
      'Nine-number cycle. You are on 6. Sam is on 5. Kit is on 5.',
    );
    const members = page.getByTestId('pair-circle-members').locator('tbody tr');
    await expect(members).toHaveCount(3);
    await expect(members.nth(0)).toContainText('A · You');
    await expect(members.nth(1)).toContainText('B · Sam');

    // Steps apart: You to Sam 1, You to Kit 1, Sam to Kit 0 (the same number).
    const rows = page.getByTestId('pair-circle-gaps').locator('tbody tr');
    await expect(rows).toHaveCount(3);
    const cell = (r: number, c: number) => rows.nth(r).locator('td').nth(c);
    await expect(cell(0, 1)).toHaveText('1');
    await expect(cell(0, 2)).toHaveText('1');
    await expect(cell(1, 0)).toHaveText('1');
    await expect(cell(1, 2)).toHaveText('0');
    await expect(cell(2, 1)).toHaveText('0');
    await expect(cell(0, 0)).toHaveText('·');
  });

  test('opens the pair for anyone from the circle', async ({ page }) => {
    await ready(page);
    await addAnother(page, KIT);
    await section(page, 'Circle').click();
    await page.getByRole('link', { name: /^Open the pair: Sam/ }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
    await expect(page.getByTestId('pair-result')).toBeVisible();
  });

  test('allows four others and no more', async ({ page }) => {
    await ready(page);
    await addAnother(page, KIT);
    await addAnother(page, { label: 'Ro', day: 3, month: 3, year: 2003 });
    await expect(page.getByRole('button', { name: 'Add someone else' })).toBeVisible();
    await addAnother(page, { label: 'Lee', day: 21, month: 9, year: 1970 });
    await expect(page.getByTestId('pair-people').getByRole('button')).toHaveText(['Sam', 'Kit', 'Ro', 'Lee']);
    await expect(page.getByRole('button', { name: 'Add someone else' })).toHaveCount(0);

    await section(page, 'Circle').click();
    await expect(page.getByTestId('pair-circle-legend').getByRole('listitem')).toHaveCount(5);
    await expect(page.getByTestId('pair-circle-gaps').locator('tbody tr')).toHaveCount(5);
    await expect(page.getByTestId('rhythm-circle').getByRole('img')).toHaveAttribute('aria-label', /^Nine-number cycle\. You are on 6\./);
  });

  test('names people who have no nickname by their place, and removes the selected one', async ({ page }) => {
    await ready(page, { day: 2, month: 11, year: 1988 });
    await addAnother(page, { day: 10, month: 3, year: 2014 });
    await expect(page.getByTestId('pair-people').getByRole('button')).toHaveText(['Person 2', 'Person 3']);
    await expect(page.getByTestId('pair-heading')).toHaveText('You and person 3');
    await expect(page.getByTestId('gap-line').first()).toContainText('person 3 has the year number you have now');

    await page.getByRole('button', { name: 'Remove them' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and the other person');
    await expect(page.getByTestId('pair-people')).toHaveCount(0);
    await expect(section(page, 'Circle')).toHaveCount(0);

    await page.getByRole('button', { name: 'Remove them' }).click();
    await expect(page.getByTestId('pair-form')).toBeVisible();
  });

  test('keeps a second person across sections, shows the under-16 notice for anyone, and forgetting clears everyone', async ({ page }) => {
    await ready(page);
    await expect(page.getByTestId('between-under16-notice')).toHaveCount(0);
    await addAnother(page, KIT);
    await expect(page.getByTestId('between-under16-notice')).toBeVisible();
    await page.getByTestId('pair-people').getByRole('button', { name: 'Sam' }).click();
    await expect(page.getByTestId('between-under16-notice')).toBeVisible();
    await section(page, 'Life stages').click();
    await expect(page.getByTestId('pair-life-other')).toContainText('born 1988');

    await page.getByRole('button', { name: 'Forget my details' }).click();
    await expect(page.getByRole('button', { name: 'Show my numbers' })).toBeVisible();
  });

  test('cancelling "add someone else" keeps the person you were looking at', async ({ page }) => {
    await ready(page);
    await page.getByRole('button', { name: 'Add someone else' }).click();
    await expect(page.getByTestId('pair-form').getByLabel(/^Nickname/)).toHaveValue('');
    await page.getByTestId('pair-form').getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByTestId('pair-heading')).toHaveText('You and Sam');
  });

  test('says what is missing when there is only one other person', async ({ page }) => {
    await ready(page);
    await expect(page.getByRole('button', { name: 'Add someone else' })).toBeVisible();
  });
});

test.describe('Between us: language, small screens and privacy', () => {
  const BANNED = /\b(compatib\w*|incompatib\w*|match(?:es|ed|ing)?|mismatch\w*|soul ?mates?|twin flames?|meant to be|destiny|perfect(?:ly)?|ideal|toxic|red flags?|scores?|rating|rank(?:s|ed|ing)?|per ?cent|partners?|husbands?|wife|boyfriends?|girlfriends?|spouses?|lovers?|romantic)\b/i;

  async function ownText(page: Page): Promise<string> {
    return page.evaluate(() => {
      const main = document.querySelector('main')?.cloneNode(true) as HTMLElement;
      main.querySelectorAll('[data-bank]').forEach((el) => el.remove());
      return `${document.querySelector('header')?.textContent ?? ''}\n${main.innerText}`;
    });
  }

  test('no score, verdict or relationship type on the Names, Circle or question screens', async ({ page }) => {
    await ready(page, { label: 'Dav', name: 'David', day: 2, month: 11, year: 1988 });
    await addAnother(page, { label: 'Kit', day: 10, month: 3, year: 2014 });
    for (const type of ['Friends', 'Family', 'Colleagues', 'A couple']) {
      await page.getByTestId('pair-type').getByRole('radio', { name: type }).check();
      expect(await ownText(page), type).not.toMatch(BANNED);
    }
    await section(page, 'Circle').click();
    expect(await ownText(page)).not.toMatch(BANNED);
    await page.getByTestId('pair-people').getByRole('button', { name: 'Dav' }).click();
    await section(page, 'Names').click();
    await expect(page.getByTestId('pair-names')).toBeVisible();
    expect(await ownText(page)).not.toMatch(BANNED);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('nothing scrolls sideways on Names or Circle, with five people', async ({ page }) => {
      await ready(page, { label: 'Dav', name: 'David', day: 2, month: 11, year: 1988 });
      for (const p of [
        { label: 'Kit', day: 10, month: 3, year: 2014 },
        { label: 'Ro', day: 3, month: 3, year: 2003 },
        { label: 'Lee', day: 21, month: 9, year: 1970 },
      ]) await addAnother(page, p);
      await page.getByTestId('pair-people').getByRole('button', { name: 'Dav' }).click();
      for (const name of ['Names', 'Circle', 'Overview']) {
        await section(page, name).click();
        await expect(page.getByTestId('pair-safety')).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${name} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
      }
    });
  });

  const PEOPLE = [
    { label: 'Wilhelmina Starling', name: 'Zephyrine Quillfeather', day: 9, month: 8, year: 1991 },
    { label: 'Hortense Blackwood', name: 'Ignatius Pemberton', day: 14, month: 12, year: 1979 },
  ];
  const FORBIDDEN = [
    'wilhelmina',
    'starling',
    'zephyrine',
    'quillfeather',
    'hortense',
    'blackwood',
    'ignatius',
    'pemberton',
    '1991-08',
    '19910809',
    '09-08-1991',
    '9/8/1991',
    '1979-12',
    '19791214',
    '14-12-1979',
    '14/12/1979',
    'amelia',
    'carter',
    '1985-06-17',
    '19850617',
  ];

  test("nothing about the people added or their names reaches a request, the address, storage or the share image", async ({ page, baseURL }) => {
    const pending: Promise<{ url: string; headers: Record<string, string>; body: string }>[] = [];
    page.on('request', (request: Request) => {
      pending.push(request.allHeaders().then((headers) => ({ url: request.url(), headers, body: request.postData() ?? '' })));
    });

    await enter(page);
    await go(page, 'Between us');
    await addPartner(page, PEOPLE[0]!);
    await addAnother(page, PEOPLE[1]!);
    for (const name of ['Names', 'Day by day', 'Month', 'Life stages', 'Circle', 'Overview']) {
      await section(page, name).click();
      await page.waitForLoadState('networkidle');
    }
    await page.getByTestId('pair-type').getByRole('radio', { name: 'A couple' }).check();

    const png = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Share image (numbers only)' }).click();
    const download = await png;
    expect(download.suggestedFilename()).toBe('between-us-numbers.png');
    const bytes = await readFile((await download.path())!);
    const asText = bytes.toString('latin1').toLowerCase();
    for (const bad of ['wilhelmina', 'starling', 'zephyrine', 'hortense', 'ignatius']) expect(asText.includes(bad), `"${bad}" in the share image`).toBe(false);

    await page.waitForLoadState('networkidle');
    const seen = await Promise.all(pending);
    const origin = new URL(baseURL!).origin;
    expect(seen.filter((s) => new URL(s.url).origin !== origin).map((s) => s.url)).toEqual([]);
    for (const s of seen) {
      const haystack = `${s.url}\n${JSON.stringify(s.headers)}\n${s.body}`.toLowerCase();
      for (const bad of FORBIDDEN) expect(haystack.includes(bad), `"${bad}" found in a request to ${s.url}`).toBe(false);
      expect(s.body, `request body for ${s.url}`).toBe('');
    }
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
});
