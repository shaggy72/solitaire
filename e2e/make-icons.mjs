// Maakt de app-iconen (PNG) met Chromium uit Playwright: `cd e2e && node make-icons.mjs`.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '..', 'client', 'public');
// `inset` = vrije rand rond de kaart; maskable-iconen worden door iOS/Android bijgesneden en hebben meer rand nodig.
const html = (inset) => `<body style="margin:0;width:512px;height:512px;background:radial-gradient(circle at 50% 35%,#2a8a5a,#1f6b45 75%);display:grid;place-items:center">
<div style="width:${512 - 2 * inset}px;height:${(512 - 2 * inset) * 1.1}px;max-height:${512 - 2 * inset}px;background:#fffdf7;border-radius:36px;box-shadow:0 10px 24px rgba(0,0,0,.4);display:grid;place-items:center;
font:700 ${(512 - 2 * inset) * 0.62}px/1 -apple-system,'Segoe UI Symbol','Segoe UI',sans-serif;color:#c62828">♥</div></body>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
const shot = async (inset, size, file) => {
  await page.setContent(html(inset));
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 512, height: 512 } });
  const small = await browser.newPage({ viewport: { width: size, height: size } });
  await small.setContent(`<body style="margin:0"><img src="data:image/png;base64,${buf.toString('base64')}" width="${size}" height="${size}"></body>`);
  writeFileSync(join(OUT, file), await small.screenshot({ clip: { x: 0, y: 0, width: size, height: size } }));
  await small.close();
};
await shot(60, 512, 'icon-512.png');
await shot(60, 192, 'icon-192.png');
await shot(120, 512, 'icon-512-maskable.png');
await shot(120, 192, 'icon-192-maskable.png');
await shot(60, 180, 'apple-touch-icon.png');
await browser.close();
console.log('iconen gemaakt in', OUT);
