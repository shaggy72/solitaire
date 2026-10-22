import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, themeById, DEFAULT_THEME } from './themes.js';
import { PIPS } from './pips.js';

const VARS = ['--paper', '--edge', '--ink', '--red', '--back', '--back-edge', '--corner-font'];
const PAL = { deco: ['green', 'dark', 'salmon', 'peach', 'cream', 'sage'], geo: ['black', 'gray', 'light', 'orange', 'skin', 'white'],
  myth: ['navy', 'coral', 'gold', 'skin', 'teal', 'purple', 'brown', 'white', 'grey', 'dark'], court: ['red', 'yellow', 'blue', 'black', 'skin', 'beard'] };

test('elk ontwerp heeft een unieke id, een naam en alle kleuren en variabelen', () => {
  assert.equal(new Set(THEMES.map((t) => t.id)).size, THEMES.length);
  for (const t of THEMES) {
    assert.ok(t.name, t.id);
    for (const v of VARS) assert.ok(t.vars[v], `${t.id} mist ${v}`);
    for (const k of PAL[t.style] ?? []) assert.ok(t.pal?.[k], `${t.id} mist kleur ${k}`);
  }
});

test('het eerste ontwerp is het standaardontwerp en een onbekende id valt daarop terug', () => {
  assert.equal(THEMES[0].id, DEFAULT_THEME);
  assert.equal(themeById('bestaat-niet').id, DEFAULT_THEME);
  assert.equal(themeById(null).id, DEFAULT_THEME);
  assert.equal(themeById('tuin').id, 'tuin');
});

test('de tekens van 2 t/m 10 staan op het juiste aantal plaatsen, binnen de kaart en zonder dubbele plek', () => {
  for (let r = 2; r <= 10; r++) {
    assert.equal(PIPS[r].length, r, `kaart ${r}`);
    assert.equal(new Set(PIPS[r].map((p) => p.join())).size, r, `kaart ${r} heeft een dubbele plek`);
    for (const [x, y] of PIPS[r]) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1);
  }
});
