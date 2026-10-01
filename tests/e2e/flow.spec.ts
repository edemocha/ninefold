import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { AMELIA, enter, fillProfile, go } from './helpers';

test.describe('the input screen', () => {
  test('states the privacy promise under the button and shows the disclaimer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('privacy-line')).toHaveText('Calculated in your browser. Nothing is sent or saved.');
    await expect(page.getByTestId('disclaimer').first()).toContainText('There is no scientific evidence that it predicts events');
    await expect(page.getByText('Advanced: the conventions behind the numbers')).toBeVisible();
  });

  test('rejects a missing name, an impossible date and a non-Latin name', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-01T12:00:00') });
    await page.goto('/');
    await fillProfile(page, { name: '', day: 30, month: 2, year: 1990 });
    await expect(page.getByText('That date does not exist.')).toBeVisible();
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByText('Enter your birth name.')).toBeVisible();

    await page.getByLabel('Birth name', { exact: true }).fill('李小龍');
    await page.getByLabel('Day', { exact: true }).selectOption('15');
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByText(/Please type your name with Latin letters/)).toBeVisible();
  });

  test('refuses a birth date in the future', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-01T12:00:00') });
    await page.goto('/');
    await fillProfile(page, { name: 'Test Person', day: 2, month: 10, year: 2026 });
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByText('A birth date cannot be in the future.')).toBeVisible();
  });
});

test.describe('the core numbers (the plan\'s Amelia Rose Carter, born 17 Jun 1985)', () => {
  test.beforeEach(async ({ page }) => enter(page));

  test('shows all six numbers with convention chips and karmic debt flags', async ({ page }) => {
    await expect(page.getByLabel('Life path 1')).toBeVisible();
    await expect(page.getByLabel('Expression 1')).toBeVisible();
    await expect(page.getByLabel('Soul urge 6')).toBeVisible();
    await expect(page.getByLabel('Personality 4')).toBeVisible();
    await expect(page.getByLabel('Birth day 8')).toBeVisible();
    await expect(page.getByLabel('Maturity 2')).toBeVisible();
    await expect(page.getByTestId('core-lifePath').getByText('Karmic debt 19/1')).toBeVisible();
    await expect(page.getByTestId('core-lifePath').getByRole('link', { name: 'Date rule A2' })).toBeVisible();
    await expect(page.getByTestId('core-soulUrge').getByRole('link', { name: 'Name: per part' })).toBeVisible();
  });

  test('shows today\'s personal day, month and year', async ({ page }) => {
    await expect(page.getByText('Personal day 8')).toBeVisible();
    await expect(page.getByText('· month 7 · year 6')).toBeVisible();
  });

  test('one click shows why a number is what it is', async ({ page }) => {
    const card = page.getByTestId('core-lifePath');
    await card.getByText('Why this number').click();
    await expect(card.getByText('8 + 6 + 5 = 19')).toBeVisible();
    await expect(card.getByText(/19 → 1 \+ 9 = 10 → 1 \+ 0 = 1/)).toBeVisible();
  });

  test('opens a number reading that ends on a reflection prompt', async ({ page }) => {
    await page.getByTestId('core-soulUrge').getByRole('link', { name: /Read the soul urge reading/ }).click();
    await expect(page.getByRole('heading', { name: 'Soul urge', level: 1 })).toBeVisible();
    const sections = page.locator('section[aria-labelledby^="sec-"]');
    await expect(sections).toHaveCount(5);
    await expect(sections.last().locator('p')).toContainText('?');
  });

  test('the name grid lists missing numbers, the repeated numbers and the subconscious self', async ({ page }) => {
    await go(page, 'Name grid');
    await expect(page.getByRole('heading', { name: 'Name grid' })).toBeVisible();
    await expect(page.getByLabel(/^7: 0 times, missing/)).toBeVisible();
    await expect(page.getByLabel(/^8: 0 times, missing/)).toBeVisible();
    await expect(page.getByLabel(/^9: 4 times.*appears most often/)).toBeVisible();
    await expect(page.getByLabel(/^1: 4 times.*appears most often/)).toBeVisible();
    await expect(page.getByText('9 minus 2 missing')).toBeVisible();
  });
});

test.describe('the day card', () => {
  test.beforeEach(async ({ page }) => enter(page));

  test('reproduces the sample card from the plan', async ({ page }) => {
    await go(page, 'Day');
    const card = page.getByTestId('day-card');
    await expect(card.getByText('Thursday 1 Oct 2026')).toBeVisible();
    await expect(page.getByTestId('day-paragraph')).toHaveText(
      'Day 8 is about effort and follow-through. Inside a reflective month 7 of a care-and-responsibility year 6, it favors quiet, careful work over big moves.',
    );
    await expect(page.getByTestId('life-path-line')).toContainText('For your life path 1:');
    await expect(page.getByTestId('life-path-line')).toContainText('second pinnacle (4, ages 36 to 44), steady building');
    await expect(page.getByTestId('personal-day')).toHaveText('8');
    await expect(page.getByTestId('personal-month')).toHaveText('7');
    await expect(page.getByTestId('personal-year')).toHaveText('6');
  });

  test('has a headline, six facets and ends on a reflection prompt', async ({ page }) => {
    await go(page, 'Day');
    await expect(page.getByTestId('day-headline')).not.toBeEmpty();
    for (const id of ['work', 'relationships', 'mind', 'action', 'watch', 'reflect']) {
      await expect(page.getByTestId(`facet-${id}`)).toBeVisible();
    }
    await expect(page.getByTestId('facet-reflect')).toContainText('?');
  });

  test('"Show the math" shows the three sums', async ({ page }) => {
    await go(page, 'Day');
    await page.getByTestId('math-panel').getByText('Show the math').click();
    await expect(page.getByText('6 (June) + 8 (17) + 1 (2026) = 15, reduced to 6')).toBeVisible();
    await expect(page.getByText('6 + 10 (October) = 16, reduced to 7')).toBeVisible();
    await expect(page.getByText('7 + 1 = 8', { exact: true }).first()).toBeVisible();
  });

  test('the date explorer reaches any date', async ({ page }) => {
    await go(page, 'Day');
    await page.getByTestId('date-picker').fill('2026-10-02');
    await expect(page.getByTestId('personal-day')).toHaveText('9');
    await page.getByRole('link', { name: 'Next day' }).click();
    await expect(page.getByTestId('personal-day')).toHaveText('1');
    await page.getByTestId('date-picker').fill('2030-02-28');
    await expect(page.getByTestId('day-card').getByText('Thursday 28 Feb 2030')).toBeVisible();
    await page.getByRole('link', { name: 'Today' }).click();
    await expect(page.getByTestId('personal-day')).toHaveText('8');
  });

  test('a special date is named on the card', async ({ page }) => {
    await go(page, 'Day');
    await page.getByTestId('date-picker').fill('2026-06-17');
    await expect(page.getByTestId('special-date')).toContainText('birthday');
  });
});

test.describe('month, year and timeline', () => {
  test.beforeEach(async ({ page }) => enter(page));

  test('the month grid shows the personal day in every cell, in order', async ({ page }) => {
    await go(page, 'Month');
    await expect(page.getByTestId('month-title')).toHaveText('October 2026');
    await expect(page.getByTestId('personal-month')).toHaveText('7');
    const grid = page.getByTestId('month-grid');
    const labels = await grid.getByRole('button').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
    expect(labels).toHaveLength(31);
    const firstSeven = labels.slice(0, 7).map((l) => Number(l.match(/personal day (\d)/)?.[1]));
    expect(firstSeven).toEqual([8, 9, 1, 2, 3, 4, 5]);
    expect(labels[2]).toContain('starts a new nine-day loop');
    expect(labels[0]).toContain('today');
  });

  test('a calendar cell opens its day card, and arrow keys move between days', async ({ page }) => {
    await go(page, 'Month');
    const grid = page.getByTestId('month-grid');
    await grid.getByRole('button', { name: /Thursday 1 October 2026/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(grid.getByRole('button', { name: /Friday 2 October 2026/ })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(grid.getByRole('button', { name: /Friday 9 October 2026/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('day-card').getByText('Friday 9 Oct 2026')).toBeVisible();
    // 9 Oct is the eighth day after 1 Oct (8): (8 + 8 - 1) % 9 + 1 = 7
    await expect(page.getByTestId('personal-day')).toHaveText('7');
  });

  test('the month view moves between months', async ({ page }) => {
    await go(page, 'Month');
    await page.getByRole('link', { name: 'Next month' }).click();
    await expect(page.getByTestId('month-title')).toHaveText('November 2026');
    await expect(page.getByTestId('personal-month')).toHaveText('8');
  });

  test('the year view has twelve month tiles and a personal year card', async ({ page }) => {
    await go(page, 'Year');
    await expect(page.getByTestId('year-title')).toHaveText('2026');
    await expect(page.getByTestId('personal-year')).toHaveText('6');
    const tiles = page.getByRole('list').filter({ has: page.getByRole('link', { name: /Oct/ }) }).getByRole('listitem');
    await expect(tiles).toHaveCount(12);
    await expect(page.getByRole('link', { name: /Oct.*7.*Reflect/ })).toBeVisible();
    await page.getByRole('link', { name: 'Previous year' }).click();
    await expect(page.getByTestId('year-title')).toHaveText('2025');
    await expect(page.getByTestId('personal-year')).toHaveText('5');
  });

  test('the life timeline marker can be moved with the keyboard', async ({ page }) => {
    await go(page, 'Life timeline');
    const marker = page.getByTestId('timeline-marker');
    await expect(marker).toHaveAttribute('aria-valuenow', '41');
    await expect(page.getByTestId('you-are-here')).toBeAttached();
    await marker.focus();
    await page.keyboard.press('ArrowRight');
    await expect(marker).toHaveAttribute('aria-valuenow', '42');
    await page.keyboard.press('PageDown');
    await expect(marker).toHaveAttribute('aria-valuenow', '32');
    await expect(page.getByTestId('timeline-readout')).toContainText('Age 32');
    await expect(page.getByTestId('timeline-readout')).toContainText('2017');
    await page.keyboard.press('Home');
    await expect(marker).toHaveAttribute('aria-valuenow', '0');
    await page.keyboard.press('End');
    await expect(marker).toHaveAttribute('aria-valuenow', '100');
  });

  test('the life timeline marker can be dragged', async ({ page }) => {
    await go(page, 'Life timeline');
    const svg = page.getByTestId('timeline-svg');
    const box = (await svg.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.5, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.75, box.y + 30, { steps: 5 });
    await page.mouse.up();
    const age = Number(await page.getByTestId('timeline-marker').getAttribute('aria-valuenow'));
    expect(age).toBeGreaterThan(65);
    expect(age).toBeLessThan(80);
  });

  test('pinnacles and challenges match the published example', async ({ page }) => {
    await go(page, 'Life timeline');
    await expect(page.getByRole('heading', { name: 'The four pinnacles' })).toBeVisible();
    const cards = page.getByRole('listitem').filter({ hasText: /pinnacle/i });
    await expect(cards.nth(0)).toContainText('ages 0 to 35');
    await expect(cards.nth(1)).toContainText('ages 36 to 44');
    await expect(cards.nth(2)).toContainText('ages 45 to 53');
    await expect(cards.nth(3)).toContainText('from age 54');
  });
});

test.describe('conventions and names', () => {
  test('changing the date rule changes the number, and the chip names it', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-01T12:00:00') });
    await page.goto('/');
    await fillProfile(page, { name: 'Test Person', day: 7, month: 1, year: 1940 });
    await page.getByTestId('advanced').getByText('Advanced: the conventions behind the numbers').click();
    await page.getByRole('radio', { name: /^B\b/ }).check();
    await page.getByRole('button', { name: 'Show my numbers' }).click();
    await expect(page.getByLabel('Life path 22')).toBeVisible();
    await expect(page.getByTestId('core-lifePath').getByRole('link', { name: 'Date rule B' })).toBeVisible();
    expect(page.url()).toContain('dr=B');
    expect(page.url()).not.toContain('1940');
  });

  test('the default rule gives 4 with karmic debt 13/4 for the same person', async ({ page }) => {
    await enter(page, { name: 'Test Person', day: 7, month: 1, year: 1940 });
    await expect(page.getByLabel('Life path 4')).toBeVisible();
    await expect(page.getByTestId('core-lifePath').getByText('Karmic debt 13/4')).toBeVisible();
  });

  test('the name you use now gets its own set of numbers', async ({ page }) => {
    await enter(page, { ...AMELIA, usedName: 'Mel Carter' });
    await expect(page.getByLabel('Soul urge 6')).toBeVisible();
    await page.getByRole('button', { name: 'Name you use now' }).click();
    await expect(page.getByText('Name you use now', { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel('Soul urge 6')).toHaveCount(0);
    await page.getByRole('button', { name: 'Birth name' }).click();
    await expect(page.getByLabel('Soul urge 6')).toBeVisible();
  });
});

test.describe('under 16', () => {
  test('says analytics are off for a child, and still stores nothing', async ({ page }) => {
    await enter(page, { name: 'Young Person', day: 3, month: 3, year: 2015 });
    await expect(page.getByTestId('under16-notice')).toContainText('under 16');
    const storage = await page.evaluate(() => window.localStorage.length + window.sessionStorage.length + document.cookie.length);
    expect(storage).toBe(0);
  });

  test('does not show the notice to an adult', async ({ page }) => {
    await enter(page);
    await expect(page.getByTestId('under16-notice')).toHaveCount(0);
  });
});

test.describe('memory and exits', () => {
  test('"Forget my details" returns to the form and clears the profile', async ({ page }) => {
    await enter(page);
    await page.getByRole('button', { name: 'Forget my details' }).click();
    await expect(page.getByRole('heading', { name: /Your numbers, worked out/ })).toBeVisible();
    await expect(page.getByLabel('Birth name', { exact: true })).toHaveValue('');
  });

  test('a reload starts again, because nothing is stored', async ({ page }) => {
    await enter(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Your numbers, worked out/ })).toBeVisible();
    await expect(page.getByText('Your details are never stored, so a reload clears them.')).toBeVisible();
  });
});

test.describe('exports', () => {
  test.beforeEach(async ({ page }) => enter(page));

  test('the calendar file has one all-day event per day and no personal data', async ({ page }) => {
    await go(page, 'Year');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Calendar file: every day' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('personal-days-2026.ics');
    const text = await readFile((await file.path())!, 'utf8');
    expect(text.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(365);
    expect(text).toContain('DTSTART;VALUE=DATE:20261001');
    expect(text).toMatch(/SUMMARY:Day 8: /);
    expect(text.toLowerCase()).not.toContain('amelia');
    expect(text).not.toContain('1985');
    for (const line of text.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });

  test('the month themes file has twelve events', async ({ page }) => {
    await go(page, 'Year');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Calendar file: month themes' }).click();
    const text = await readFile((await (await download).path())!, 'utf8');
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(12);
    expect(text).toContain('SUMMARY:Personal month 7: Reflect');
  });

  test('the share image is a PNG with no personal data to draw', async ({ page }) => {
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Share image (numbers only)' }).click();
    const download = await pending;
    const bytes = await readFile((await download.path())!);
    expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  test('the year report prints with the disclaimer and no name', async ({ page }) => {
    await go(page, 'Year');
    await page.getByRole('link', { name: /Year report/ }).click();
    const report = page.getByTestId('report');
    await expect(report).toBeVisible();
    await expect(page.getByTestId('report-disclaimer')).toHaveText(/Numerology is a symbolic tradition\. There is no scientific evidence/);
    await expect(report.getByRole('heading', { level: 2 })).toHaveCount(6 + 12 + 1);
    const text = (await report.innerText()).toLowerCase();
    expect(text).not.toContain('amelia');
    expect(text).not.toContain('carter');
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('navigation', { name: 'Your reading' })).toBeHidden();
  });
});

test.describe('cautions', () => {
  const SAFETY = ['Never drive tired, upset or impaired, on any day.', 'For health, money or legal decisions, talk to a qualified person, not a number.'];

  test.beforeEach(async ({ page }) => enter(page));

  test('the day card has one caution, where it comes from, and both fixed safety lines', async ({ page }) => {
    await go(page, 'Day');
    const panel = page.getByTestId('caution-panel');
    await expect(panel.getByRole('heading', { name: 'A caution for this day' })).toBeVisible();
    await expect(panel.getByTestId('caution-card')).toHaveCount(1);
    await expect(panel.getByTestId('caution-label')).toHaveText(/^(WATCH OUT|GO EASY ON|AVOID)$/);
    await expect(panel.getByText('Comes from', { exact: true })).toBeVisible();
    await expect(panel.getByText(/the 8's/)).toBeVisible();
    for (const line of SAFETY) await expect(panel.getByTestId('caution-safety').getByText(line)).toBeVisible();
    // The reading still ends on its reflection prompt: the caution is a separate card below it.
    await expect(page.getByTestId('facet-reflect')).toContainText('?');
  });

  test('the caution is not a forecast: no certainty words appear on the card', async ({ page }) => {
    await go(page, 'Day');
    const text = (await page.getByTestId('caution-card').innerText()).toLowerCase();
    expect(text).not.toMatch(/\b(will|always|never|guaranteed|destined|fate|doomed|cursed)\b/);
  });

  test('the year and month views have five cautions, one per facet', async ({ page }) => {
    await go(page, 'Year');
    const year = page.getByTestId('caution-panel');
    await expect(year.getByRole('heading', { name: 'Cautions for the year' })).toBeVisible();
    await expect(year.getByTestId('caution-card')).toHaveCount(5);
    for (const facet of ['Money', 'Work', 'Relationships', 'Energy', 'Mind']) await expect(year.getByText(facet, { exact: true })).toBeVisible();

    await go(page, 'Month');
    const month = page.getByTestId('caution-panel');
    await expect(month.getByRole('heading', { name: 'Cautions for the month' })).toBeVisible();
    await expect(month.getByTestId('caution-card')).toHaveCount(5);
  });

  test('the safety lines are identical whatever the number, and never tied to one', async ({ page }) => {
    await go(page, 'Day');
    const texts: string[] = [];
    const heads: string[] = [];
    for (const date of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) {
      await page.getByTestId('date-picker').fill(date);
      await expect(page.getByTestId('day-card')).toBeVisible();
      texts.push(await page.getByTestId('caution-safety').innerText());
      heads.push(await page.getByTestId('personal-day').innerText());
    }
    expect(new Set(heads).size).toBe(4); // four different personal day numbers
    expect(new Set(texts).size).toBe(1); // one set of safety lines
    for (const line of SAFETY) expect(texts[0]).toContain(line);
    // No number appears inside the safety lines.
    expect(texts[0]?.replace(/True on every day, whatever your numbers say/, '')).not.toMatch(/\d/);
  });

  test('a different date gives a different caution', async ({ page }) => {
    await go(page, 'Day');
    const seen = new Set<string>();
    for (const date of ['2026-10-01', '2026-10-10', '2026-10-19', '2026-10-28']) {
      // These four dates are all personal day 8, nine days apart.
      await page.getByTestId('date-picker').fill(date);
      await expect(page.getByTestId('personal-day')).toHaveText('8');
      seen.add(await page.getByTestId('caution-card').innerText());
    }
    expect(seen.size).toBe(4);
  });

  test('the printed year report carries the year cautions and the safety lines', async ({ page }) => {
    await go(page, 'Year');
    await page.getByRole('link', { name: /Year report/ }).click();
    const report = page.getByTestId('report');
    await expect(report.getByTestId('caution-card')).toHaveCount(5);
    for (const line of SAFETY) await expect(report.getByText(line)).toBeVisible();
  });
});

test.describe('the maker\'s credit', () => {
  test('shows in the footer of every kind of page', async ({ page }) => {
    for (const path of ['/', '/numbers/8', '/method', '/privacy']) {
      await page.goto(path);
      await expect(page.getByTestId('credit')).toHaveText('Built by Danial Adam');
    }
    expect(await page.locator('meta[name="author"]').getAttribute('content')).toBe('Danial Adam');
  });

  test('shows in the footer of the reading screens and on the printed report', async ({ page }) => {
    await enter(page);
    await expect(page.getByTestId('credit')).toHaveText('Built by Danial Adam');
    await go(page, 'Year');
    await page.getByRole('link', { name: /Year report/ }).click();
    await expect(page.getByTestId('report-credit')).toHaveText('Built by Danial Adam');
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByTestId('report-credit')).toBeVisible();
  });

  test('is drawn on the share image, next to numbers and nothing personal', async ({ page }) => {
    // Record every string the share image paints on its canvas.
    await page.addInitScript(() => {
      const original = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (text: string, ...rest: [number, number, number?]) {
        ((window as unknown as { __drawn: string[] }).__drawn ??= []).push(String(text));
        return original.call(this, text, ...rest);
      };
    });
    await enter(page);
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Share image (numbers only)' }).click();
    await pending;
    const drawn = await page.evaluate(() => (window as unknown as { __drawn?: string[] }).__drawn ?? []);
    expect(drawn).toContain('Built by Danial Adam');
    expect(drawn.join(' ').toLowerCase()).not.toContain('amelia');
  });
});

test.describe('static pages', () => {
  test('the meaning pages, method, privacy and terms render without personal data', async ({ page }) => {
    for (const path of ['/numbers', '/numbers/8', '/numbers/11', '/numbers/33', '/method', '/privacy', '/terms']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
    await page.goto('/numbers/8');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The number 8');
    await expect(page.getByTestId('disclaimer').first()).toBeVisible();
    await page.goto('/numbers/22');
    await expect(page.getByText('22/4').first()).toBeVisible();
  });
});

test.describe('small screens', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('nothing scrolls sideways at phone width', async ({ page }) => {
    await enter(page);
    for (const tab of ['Snapshot', 'Name grid', 'Year', 'Month', 'Day'] as const) {
      await go(page, tab);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, tab).toBeLessThanOrEqual(1);
    }
  });
});
