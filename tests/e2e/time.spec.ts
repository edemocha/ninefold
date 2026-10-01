import { expect, test } from '@playwright/test';
import { DEFAULT_CONVENTIONS, personalDay } from '@numerology/engine';
import { AMELIA, fillProfile, go } from './helpers';

/*
 * "Today" is the visitor's local calendar date. The personal day flips at local
 * midnight, not UTC midnight, from UTC+14 (Kiritimati) to UTC-12 (Baker Island).
 */

const ZONES = [
  { id: 'Pacific/Kiritimati', offset: '+14:00', label: 'UTC+14' },
  { id: 'Asia/Kuala_Lumpur', offset: '+08:00', label: 'UTC+8' },
  { id: 'America/Los_Angeles', offset: '-07:00', label: 'UTC-7 (daylight time)' },
  { id: 'Etc/GMT+12', offset: '-12:00', label: 'UTC-12' },
] as const;

const BIRTH = { year: AMELIA.year, month: AMELIA.month, day: AMELIA.day };

for (const zone of ZONES) {
  test.describe(zone.label, () => {
    test.use({ timezoneId: zone.id });

    test('before local midnight it is still the old day', async ({ page }) => {
      // 23:59:50 on Saturday 31 October 2026, local time. (Daylight time has ended in the US by 1 Nov.)
      await page.clock.install({ time: new Date(`2026-10-31T23:59:50${zone.offset}`) });
      await page.goto('/');
      await fillProfile(page, AMELIA);
      await page.getByRole('button', { name: 'Show my numbers' }).click();
      await go(page, 'Day');

      await expect(page.getByTestId('day-card').getByText('Saturday 31 Oct 2026')).toBeVisible();
      const before = personalDay(BIRTH, { year: 2026, month: 10, day: 31 }, DEFAULT_CONVENTIONS).value;
      await expect(page.getByTestId('personal-day')).toHaveText(String(before));
    });

    test('a live page rolls over to the next day without a reload', async ({ page }) => {
      await page.clock.install({ time: new Date(`2026-10-31T23:59:50${zone.offset}`) });
      await page.goto('/');
      await fillProfile(page, AMELIA);
      await page.getByRole('button', { name: 'Show my numbers' }).click();
      await go(page, 'Day');
      await expect(page.getByTestId('day-card').getByText('Saturday 31 Oct 2026')).toBeVisible();

      await page.clock.fastForward(30_000);
      await expect(page.getByTestId('day-card').getByText('Sunday 1 Nov 2026')).toBeVisible();
      const after = personalDay(BIRTH, { year: 2026, month: 11, day: 1 }, DEFAULT_CONVENTIONS).value;
      await expect(page.getByTestId('personal-day')).toHaveText(String(after));
    });
  });
}

test.describe('a clock a minute before midnight in two zones at the same instant', () => {
  // One instant: 23:59:50 on 31 October in UTC+14, and still 30 October (21:59:50) in UTC-12.
  const instant = new Date('2026-10-31T09:59:50Z');

  test.describe('UTC+14 is already a new day when UTC-12 is still the old one', () => {
    test.use({ timezoneId: 'Pacific/Kiritimati' });
    test('Kiritimati', async ({ page }) => {
      await page.clock.install({ time: instant });
      await page.goto('/');
      await fillProfile(page, AMELIA);
      await page.getByRole('button', { name: 'Show my numbers' }).click();
      await go(page, 'Day');
      await expect(page.getByTestId('day-card').getByText('Saturday 31 Oct 2026')).toBeVisible();
    });
  });

  test.describe('UTC-12', () => {
    test.use({ timezoneId: 'Etc/GMT+12' });
    test('Baker Island is on the previous calendar day', async ({ page }) => {
      await page.clock.install({ time: instant });
      await page.goto('/');
      await fillProfile(page, AMELIA);
      await page.getByRole('button', { name: 'Show my numbers' }).click();
      await go(page, 'Day');
      await expect(page.getByTestId('day-card').getByText('Friday 30 Oct 2026')).toBeVisible();
    });
  });
});
