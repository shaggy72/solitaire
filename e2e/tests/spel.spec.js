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

// Vast spel zonder schudden: kolom 1 = ♠A, kolom 2 = ♠2 (gesloten) ♠3 enz. Zo weten we precies wat waar past.
const vastSpel = () => {
  const deck = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ s, r, up: false });
  let k = 0;
  const tableau = [];
  for (let col = 0; col < 7; col++) {
    const pile = [];
    for (let i = 0; i <= col; i++) pile.push({ ...deck[k++], up: i === col });
    tableau.push(pile);
  }
  return { stock: deck.slice(k), waste: [], foundations: [[], [], [], []], tableau, score: 0, moves: 0 };
};

async function sleep(page, kaart, naarX, naarY) {
  const b = await kaart.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + 20);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 20, b.y + 40, { steps: 3 });
  await page.mouse.move(naarX, naarY, { steps: 8 });
  await page.mouse.up();
}

test('een aas naar de fundering slepen werkt; naar een verkeerde plek springt hij terug', async ({ page }) => {
  await page.addInitScript((game) => localStorage.setItem('solitaire-v1', JSON.stringify({ game, history: [] })), vastSpel());
  await page.goto(srv.base);
  const aas = page.locator('.card[data-pile="tableau"].up').first(); // ♠A, enige kaart in kolom 1
  const kol4 = await page.locator('.slot.empty').nth(3).boundingBox();
  await sleep(page, aas, kol4.x + kol4.width / 2, kol4.y + 60); // ♠A op een gesloten kolom: past niet
  await expect(page.locator('.card[data-pile="foundation"]')).toHaveCount(0);
  await expect(page.locator('.message')).toContainText('Daar past die kaart niet');

  await page.waitForTimeout(400); // de kaart springt terug (animatie van 0,2 s)
  const fund = await page.locator('.slot.found').first().boundingBox();
  await sleep(page, aas, fund.x + fund.width / 2, fund.y + fund.height / 2);
  await expect(page.locator('.card[data-pile="foundation"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Ongedaan maken/ })).toBeEnabled();
  await expect(page.locator('.stats')).toContainText('10'); // +10 punten
});

// Een spel waarin één zet meteen een gesloten kaart openlegt (♠3 op ♥4).
const animatieSpel = () => {
  const deck = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ s, r, up: false });
  const pak = (s, r) => {
    const i = deck.findIndex((c) => c.s === s && c.r === r);
    return { ...deck.splice(i, 1)[0], up: true };
  };
  const tableau = [[{ ...pak(0, 2), up: false }, pak(0, 3)], [pak(1, 4)], [], [], [], [], []];
  return { stock: deck, waste: [], foundations: [[], [], [], []], tableau, score: 0, moves: 1 };
};

test('een verhuisde kaart landt met een effect, een opengelegde kaart draait om', async ({ page }) => {
  await page.addInitScript((game) => localStorage.setItem('solitaire-v1', JSON.stringify({ game, history: [] })), animatieSpel());
  await page.goto(srv.base);
  await page.getByRole('button', { name: 'schoppen 3' }).click();
  await page.getByRole('button', { name: 'harten 4' }).click();
  await expect(page.locator('.card.landed')).toHaveCount(1);
  await expect(page.locator('.card.flip')).toHaveCount(1);
  await expect(page.locator('.card.landed')).toHaveCount(0, { timeout: 3000 }); // daarna is de kaart weer gewoon
});

test('drie kaarten per keer: de keuze blijft bewaard en de bovenste drie waaieren', async ({ page }) => {
  await page.goto(srv.base);
  await page.getByRole('button', { name: /per keer/ }).click();
  await expect(page.locator('.message')).toContainText('3 kaarten per keer');
  await page.locator('.card[data-pile="stock"]').last().click();
  await expect(page.locator('.card.up')).toHaveCount(10); // 7 open op de tafel + 3 getrokken
  const plekken = await page.locator('.card[data-pile="waste"]').evaluateAll((els) => els.map((e) => {
    const r = e.getBoundingClientRect();
    return `${Math.round(r.x)},${Math.round(r.y)}`;
  }));
  expect(new Set(plekken).size).toBe(3); // de drie liggen niet op elkaar
  await page.reload();
  await expect(page.locator('.card.up')).toHaveCount(10); // de keuze en het spel blijven bewaard
  await page.getByRole('button', { name: /per keer/ }).click();
  await expect(page.locator('.message')).toContainText('1 kaart per keer');
});

test('een korte tik na slepen blijft een gewone tik (kaart kiezen)', async ({ page }) => {
  await page.addInitScript((game) => localStorage.setItem('solitaire-v1', JSON.stringify({ game, history: [] })), vastSpel());
  await page.goto(srv.base);
  await page.locator('.card[data-pile="tableau"].up').first().click();
  await expect(page.locator('.card.sel')).toHaveCount(1);
});

test('een kaartontwerp kiezen blijft bewaard', async ({ page }) => {
  await page.goto(srv.base);
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'standaard');
  await page.getByRole('button', { name: /Kaarten/ }).click();
  await expect(page.getByRole('dialog')).toContainText('Kies je kaarten');
  await expect(page.locator('.themeopt')).toHaveCount(6);
  await page.getByRole('button', { name: 'Tuin' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'tuin');
  await expect(cards(page)).toHaveCount(52);
  await page.reload();
  await expect(page.locator('.app')).toHaveAttribute('data-theme', 'tuin');
});

test('liggend iPad: de kaarten zijn groter dan 110 px en de 7 kolommen staan naast elkaar', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto(srv.base);
  const widths = await cards(page).evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
  expect(Math.min(...widths)).toBeGreaterThanOrEqual(110);
  const xs = await page.locator('.card[data-pile="tableau"].up').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
  expect(new Set(xs).size).toBe(7);
});
