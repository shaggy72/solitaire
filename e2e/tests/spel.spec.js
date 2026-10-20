// Browsertests: het spel start, trekken en ongedaan maken werken, de stand blijft bewaard, nieuw spel vraagt bevestiging.
import { test, expect } from '@playwright/test';
import { startServer } from '../../server/test/helpers.js';

let srv;
test.beforeAll(async () => { srv = await startServer(); });
test.afterAll(async () => { await srv?.stop(); });

test.use({ viewport: { width: 1180, height: 820 }, hasTouch: true });

const cards = (page) => page.locator('.card');

test('een nieuw spel heeft 52 kaarten en 28 liggen op de tafel', async ({ page }) => {
  await page.goto(srv.base);
  await expect(cards(page)).toHaveCount(52);
  await expect(page.locator('.card.up')).toHaveCount(7);
  await expect(page.getByText('Tik op een kaart')).toBeVisible();
});

test('trekken, ongedaan maken en de stand blijft na herladen', async ({ page }) => {
  await page.goto(srv.base);
  const undo = page.getByRole('button', { name: /Ongedaan maken/ });
  await expect(undo).toBeDisabled();
  await page.locator('.card[data-pile="stock"]').last().click();
  await expect(page.locator('.card.up')).toHaveCount(8);
  await expect(undo).toBeEnabled();
  await page.reload();
  await expect(page.locator('.card.up')).toHaveCount(8); // bewaard in het toestel
  await page.getByRole('button', { name: /Ongedaan maken/ }).click();
  await expect(page.locator('.card.up')).toHaveCount(7);
});

test('de tip zegt wat te doen', async ({ page }) => {
  await page.goto(srv.base);
  await page.getByRole('button', { name: /Tip/ }).click();
  await expect(page.locator('.message')).toContainText(/Leg |Trek |geen zetten/);
});

test('nieuw spel vraagt eerst of je het zeker weet', async ({ page }) => {
  await page.goto(srv.base);
  await page.locator('.card[data-pile="stock"]').last().click();
  await page.getByRole('button', { name: 'Nieuw spel' }).click();
  await expect(page.getByRole('dialog')).toContainText('Nieuw spel beginnen?');
  await page.getByRole('button', { name: 'Nee, doorspelen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.card.up')).toHaveCount(8);
  await page.getByRole('button', { name: 'Nieuw spel' }).click();
  await page.getByRole('button', { name: 'Ja, nieuw spel' }).click();
  await expect(page.locator('.card.up')).toHaveCount(7);
});

for (const [w, h] of [[1180, 820], [820, 1180], [1366, 1024]]) {
  test(`alle kaarten blijven binnen het scherm (${w}x${h})`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(srv.base);
    await expect(cards(page)).toHaveCount(52);
    const board = await page.locator('.board').boundingBox();
    for (const box of await cards(page).evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }))) {
      expect(box.x).toBeGreaterThanOrEqual(board.x - 1);
      expect(box.x + box.w).toBeLessThanOrEqual(board.x + board.width + 1);
      expect(box.y + box.h).toBeLessThanOrEqual(board.y + board.height + 1);
    }
  });
}
