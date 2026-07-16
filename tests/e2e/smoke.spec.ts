import { test, expect, type Page } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import * as path from 'node:path';

const distFile = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '../../dist/index.html',
);
const fileUrl = pathToFileURL(distFile).href;

async function open(page: Page) {
  await page.goto(fileUrl);
  await expect(page.getByTestId('tab-explore')).toBeVisible();
}

/** Dismiss the full-screen "New badge!" celebration if it's showing. */
async function dismissBadgeParty(page: Page) {
  const party = page.getByTestId('badge-party');
  if (await party.isVisible().catch(() => false)) {
    await party.getByRole('button', { name: 'Yay!' }).click();
    await expect(party).toBeHidden();
  }
}

test('boots from file:// with zero network requests', async ({ page }) => {
  const networkRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!url.startsWith('file://') && !url.startsWith('data:')) networkRequests.push(url);
  });
  await open(page);
  expect(networkRequests).toEqual([]);
  // the map renders a lot of country paths
  expect(await page.locator('path.country').count()).toBeGreaterThan(190);
});

test('explore: clicking a country opens its card and collects a sticker', async ({ page }) => {
  await open(page);
  await page.locator('path[data-iso2="BR"]').click();
  const card = page.getByTestId('country-card');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Brazil' })).toBeVisible();
  await expect(card.getByText('Brasília')).toBeVisible();
  await expect(page.getByTestId('sticker-pop')).toBeVisible();

  // first-ever sticker also earns the "First Sticker" badge — dismiss it
  await dismissBadgeParty(page);

  // the "Long ago" dinosaur teaser opens on tap
  await page.getByTestId('long-ago-btn').click();
  await expect(page.getByTestId('long-ago')).toContainText('Dinosaur');
});

test('tiny countries are reachable via search', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Search' }).click();
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeVisible();
  await overlay.getByRole('searchbox').fill('Monaco');
  await overlay.getByRole('button', { name: /Monaco/ }).click();
  await expect(page.getByTestId('country-card').getByRole('heading', { name: 'Monaco' })).toBeVisible();
  await dismissBadgeParty(page);
});

test('progress persists across reload (file:// localStorage)', async ({ page }) => {
  await open(page);
  await page.locator('path[data-iso2="BR"]').click();
  await dismissBadgeParty(page);
  await page.getByTestId('country-card').getByLabel('Close').click();
  await page.reload();
  await open(page);
  await page.getByTestId('tab-passport').click();
  await expect(page.getByTestId('passport')).toContainText('1 of 197');
});

test('flag game: a full round awards at least one star', async ({ page }) => {
  await open(page);
  await page.getByTestId('tab-games').click();
  await page.getByTestId('play-flag-1').click();
  await expect(page.getByTestId('game-flag')).toBeVisible();

  // Answer 5 questions. We can read the target from the prompt and pick the
  // matching flag by reading each option — but options are flags (no text),
  // so just click through: correct or not, the round always completes.
  for (let i = 0; i < 5; i++) {
    await expect(page.getByTestId('game-prompt')).toBeVisible();
    // click options until the question advances (feedback 'correct' or reveal)
    const options = page.locator('[data-testid^="option-"]');
    const first = await options.first().getAttribute('data-testid');
    await options.first().click();
    // wait for either advancement or a reveal that auto-advances
    await page.waitForTimeout(2200);
    // if still same question (wrong-retry doesn't apply to flag game), it moved on
    void first;
  }
  await expect(page.getByTestId('round-end')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.round-stars .star.on')).toHaveCount(1, { timeout: 5000 }).catch(() => {});
  expect(await page.locator('.round-stars .star.on').count()).toBeGreaterThanOrEqual(1);
});

test('find-the-country game: correct map tap advances the round', async ({ page }) => {
  await open(page);
  await page.getByTestId('tab-games').click();
  await page.getByTestId('play-find-1').click();
  const prompt = page.getByTestId('game-prompt');
  await expect(prompt).toBeVisible();

  // The game exposes the target iso2 so we can tap the right country on the map.
  const target = await prompt.getAttribute('data-target');
  expect(target).toBeTruthy();
  // Dispatch the click straight to the target path — clicking by geometry is
  // unreliable for concave country shapes whose bbox centre sits on a neighbour.
  await page.locator(`path[data-iso2="${target}"]`).first().dispatchEvent('click');
  await expect(page.getByTestId('feedback')).toContainText(/found it|Yes|got it|Super|first try/i);

  // after the correct answer the round advances to question 2
  await expect(page.locator('.progress-dots .dot.done')).toHaveCount(1, { timeout: 4000 });
});
