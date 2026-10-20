import test from 'node:test';
import assert from 'node:assert/strict';
import { measure, place, dropTarget } from './layout.js';

const c = (s, r, up = true) => ({ s, r, up });
const empty = () => ({ stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []], score: 0, moves: 0 });
const L = measure(1180, 740);
const midOf = (col) => L.colX(col) + L.cw / 2;

test('loslaten op een fundering of kolom geeft de juiste bestemming', () => {
  const g = empty();
  g.tableau[0] = [c(0, 1)];
  g.tableau[1] = [c(1, 2)];
  const from = { type: 'tableau', col: 0, index: 0 };
  assert.deepEqual(dropTarget(g, L, from, midOf(5), L.pad + L.ch / 2), { type: 'foundation', i: 2 });
  assert.deepEqual(dropTarget(g, L, from, midOf(1), L.tableauY + L.ch / 2), { type: 'tableau', col: 1 });
});

test('loslaten op een plek waar de kaart niet past geeft null', () => {
  const g = empty();
  g.tableau[0] = [c(0, 5)];
  g.tableau[1] = [c(1, 9)];
  const from = { type: 'tableau', col: 0, index: 0 };
  assert.equal(dropTarget(g, L, from, midOf(1), L.tableauY + L.ch / 2), null);
  assert.equal(dropTarget(g, L, from, midOf(4), L.pad + L.ch / 2), null);
});

test('een aas boven de tafel links van de funderingen vindt toch een fundering', () => {
  const g = empty();
  g.tableau[0] = [c(2, 1)];
  assert.deepEqual(dropTarget(g, L, { type: 'tableau', col: 0, index: 0 }, midOf(1), L.pad + L.ch / 2), { type: 'foundation', i: 0 });
});

test('de kaarten blijven binnen het bord, ook bij een heel lange kolom', () => {
  const g = empty();
  g.tableau[6] = Array.from({ length: 13 }, (_, i) => c(i % 4, 13 - i));
  for (const p of place(g, L)) assert.ok(p.y + L.ch <= L.H + 1, `kaart op y=${p.y} valt buiten het bord`);
});
