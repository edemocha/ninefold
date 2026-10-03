import { expect, type Page } from '@playwright/test';

export type Person = {
  name: string;
  usedName?: string;
  day: number;
  month: number;
  year: number;
};

/** The made-up person from the implementation plan. */
export const AMELIA: Person = { name: 'Amelia Rose Carter', day: 17, month: 6, year: 1985 };

/** A fixed moment: 1 October 2026, midday in the browser's own zone. */
export const OCT_1_2026 = new Date('2026-10-01T12:00:00');

export type Tradition = 'chaldean' | 'pythagorean';

/** Picks the tradition at the top of the form. The site starts in the Chaldean one. */
export async function chooseTradition(page: Page, tradition: Tradition): Promise<void> {
  await page.getByRole('radio', { name: tradition === 'chaldean' ? 'Chaldean' : 'Pythagorean', exact: true }).check();
}

/**
 * Fills the form. Most of the suite was written against the Pythagorean numbers
 * (life path 1 with karmic debt 19, expression 1, soul urge 6), so it picks that
 * tradition unless a test asks for the Chaldean default.
 */
export async function fillProfile(page: Page, p: Person, tradition: Tradition = 'pythagorean'): Promise<void> {
  await chooseTradition(page, tradition);
  await page.getByLabel('Birth name', { exact: true }).fill(p.name);
  if (p.usedName) await page.getByLabel(/Name you use now/).fill(p.usedName);
  // The year list is built from the visitor's clock on the client.
  await expect(page.locator('select').nth(2).locator('option')).not.toHaveCount(1);
  await page.getByLabel('Day', { exact: true }).selectOption(String(p.day));
  await page.getByLabel('Month', { exact: true }).selectOption(String(p.month));
  await page.getByLabel('Year', { exact: true }).selectOption(String(p.year));
}

/** Opens the home page with a fixed clock, fills the form and lands on the snapshot. */
export async function enter(page: Page, p: Person = AMELIA, now: Date = OCT_1_2026, tradition: Tradition = 'pythagorean'): Promise<void> {
  await page.clock.install({ time: now });
  await page.goto('/');
  await fillProfile(page, p, tradition);
  await page.getByRole('button', { name: 'Show my numbers' }).click();
  await expect(page.getByRole('heading', { name: 'Your core numbers' })).toBeVisible();
}

/** Client-side navigation: the profile lives in memory, so never reload between screens. */
export async function go(page: Page, tab: 'Snapshot' | 'Name grid' | 'Shadow' | 'Life timeline' | 'Year' | 'Month' | 'Day' | 'Between us'): Promise<void> {
  await page.getByRole('navigation', { name: 'Your reading' }).getByRole('link', { name: tab, exact: true }).click();
}

export type Partner = { label?: string; name?: string; day: number; month: number; year: number };

/** A second made-up person for Between us: life path 3, a personal year 5 in 2026. */
export const SAM: Partner = { label: 'Sam', day: 2, month: 11, year: 1988 };

/** Fills the Between us form and submits it. The profile must already be entered. */
export async function addPartner(page: Page, p: Partner): Promise<void> {
  const form = page.getByTestId('pair-form');
  if (p.label) await form.getByLabel(/^Nickname/).fill(p.label);
  if (p.name) await form.getByLabel(/^Their full name/).fill(p.name);
  await expect(form.locator('select').nth(2).locator('option')).not.toHaveCount(1);
  await form.getByLabel('Day', { exact: true }).selectOption(String(p.day));
  await form.getByLabel('Month', { exact: true }).selectOption(String(p.month));
  await form.getByLabel('Year', { exact: true }).selectOption(String(p.year));
  await form.getByRole('button', { name: 'Show us side by side' }).click();
}

/** Adds another person from the "Add someone else" button, after the first has been added. */
export async function addAnother(page: Page, p: Partner): Promise<void> {
  await page.getByRole('button', { name: 'Add someone else' }).click();
  await addPartner(page, p);
}
