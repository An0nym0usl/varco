// Runs on a phone-sized viewport (Pixel 7 project).
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/verifica/', '/report/', '/obbligo/', '/checklist/', '/dichiarazione/', '/prezzi/', '/guida/european-accessibility-act/', '/guida/eaa-microimprese/', '/regole/image-alt/'];

for (const path of PAGES) {
  test(`${path} fits a phone screen without horizontal scrolling`, async ({ page }) => {
    await page.goto(`/varco${path}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('mobile navigation opens and closes', async ({ page }) => {
  await page.goto('/varco/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  const menu = page.locator('#menu-principale');
  await expect(menu).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Principale' }).getByRole('link', { name: 'Prezzi' })).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();
});

test('demo scan works on a phone', async ({ page }) => {
  await page.goto('/varco/verifica/');
  await page.getByRole('button', { name: 'Analizza il negozio di prova' }).click();
  await page.waitForURL('**/varco/report/');
  await expect(page.locator('.issue').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
