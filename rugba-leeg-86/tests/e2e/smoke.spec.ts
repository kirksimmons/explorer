import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const BUILT = fileURLToPath(new URL('../../dist/index.html', import.meta.url));

declare global {
  interface Window {
    __RL86__: {
      phase: () => string;
      frame: () => number;
      pressStart: () => void;
      pressPass: () => void;
    };
  }
}

test('boots offline with zero network requests and zero console errors', async ({ page }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('file://') && !u.startsWith('data:')) requests.push(u);
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`file://${BUILT}`);
  await page.waitForFunction(() => window.__RL86__ !== undefined);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test('title screen starts a match and the sim runs', async ({ page }) => {
  await page.goto(`file://${BUILT}`);
  await page.waitForFunction(() => window.__RL86__ !== undefined);
  expect(await page.evaluate(() => window.__RL86__.phase())).toBe('title');

  await page.evaluate(() => window.__RL86__.pressStart());
  await page.waitForFunction(() => window.__RL86__.phase() === 'openPlay');

  const f1 = await page.evaluate(() => window.__RL86__.frame());
  await page.waitForTimeout(500);
  const f2 = await page.evaluate(() => window.__RL86__.frame());
  expect(f2).toBeGreaterThan(f1);
});

test('rotate overlay shows in portrait, hides in landscape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`file://${BUILT}`);
  await expect(page.locator('#rotate')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotate')).toBeHidden();
});
