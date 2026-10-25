// Rekent uit waar elke kaart staat, zodat het bord altijd past op het scherm (iPad liggend of staand).
//   staand:  bovenaan stapel + aflegstapel links en de 4 funderingen rechts; daaronder de 7 kolommen.
//   liggend: links stapel + aflegstapel onder elkaar, in het midden de 7 kolommen, rechts de 4 funderingen
//            onder elkaar. Zo wordt de breedte beter benut en worden de kaarten groter.
import { grab, canMove } from './game.js';
export const cardKey = (c) => `${c.s}-${c.r}`;

const DOWN_FAN = 0.12; // gesloten kaarten liggen dicht op elkaar (deel van de kaarthoogte)
const UP_MIN = 0.18; // kleinste overlap bij heel lange kolommen
const UP_TYPICAL = 0.22; // waar het bord op gedimensioneerd wordt
const UP_MAX = 0.32;
const COLUMN = 1 + 6 * DOWN_FAN + 9 * UP_TYPICAL; // een lange kolom, in kaarthoogtes (langere worden samengedrukt)
const LANDSCAPE_FROM = 1.2; // breedte/hoogte vanaf waar we de liggende indeling gebruiken

export function measure(W, H) {
  const pad = Math.max(8, Math.round(W * 0.012));
  const rowGap = Math.max(12, Math.round(H * 0.03));

  if (W / H >= LANDSCAPE_FROM) {
    const colGap = 0.1;
    const byWidth = (W - 2 * pad) / (9 + 8 * colGap);
    const byHeight = ((H - 2 * pad) / COLUMN) / 1.4;
    const cw = Math.max(40, Math.floor(Math.min(byWidth, byHeight)));
    const ch = Math.round(cw * 1.4);
    const gap = (W - 2 * pad - 9 * cw) / 8;
    const x = (c) => pad + c * (cw + gap);
    // De funderingen mogen een beetje over elkaar liggen als de hoogte krap is: de rang en soort blijven zichtbaar.
    const pitch = Math.min(ch + rowGap, (H - 2 * pad - ch) / 3);
    return {
      mode: 'landscape', W, H, pad, rowGap, cw, ch, gap,
      stockXY: { x: x(0), y: pad },
      wasteXY: { x: x(0), y: pad + ch + rowGap },
      foundXY: (i) => ({ x: x(8), y: pad + i * pitch }),
      colX: (c) => x(1 + c),
      tableauY: pad,
    };
  }

  const byWidth = (W - 2 * pad) / (7 + 6 * 0.12);
  const byHeight = ((H - 2 * pad - rowGap) / (1 + COLUMN)) / 1.4;
  const cw = Math.max(40, Math.floor(Math.min(byWidth, byHeight)));
  const ch = Math.round(cw * 1.4);
  const gap = Math.max(6, (W - 2 * pad - 7 * cw) / 6);
  const x = (c) => pad + c * (cw + gap);
  return {
    mode: 'portrait', W, H, pad, rowGap, cw, ch, gap,
    stockXY: { x: x(0), y: pad },
    wasteXY: { x: x(1), y: pad },
    foundXY: (i) => ({ x: x(3 + i), y: pad }),
    colX: x,
    tableauY: pad + ch + rowGap,
  };
}

// Geeft voor elke kaart { card, loc, x, y, z }.
export function place(state, L) {
  const out = [];
  state.stock.forEach((card, i) => out.push({ card, loc: { type: 'stock' }, ...L.stockXY, z: i }));
  state.waste.forEach((card, i) => out.push({ card, loc: { type: 'waste' }, ...L.wasteXY, z: i }));
  // Elke fundering krijgt een eigen laag, zodat de bovenste kaart van een volle fundering niet over de volgende ligt.
  state.foundations.forEach((f, fi) => f.forEach((card, i) => out.push({ card, loc: { type: 'foundation', i: fi }, ...L.foundXY(fi), z: fi * 20 + i })));
  state.tableau.forEach((pile, col) => {
    const downs = pile.filter((c) => !c.up).length;
    const ups = pile.length - downs;
    const space = L.H - L.pad - L.tableauY - L.ch;
    const upFan = ups > 1
      ? Math.min(UP_MAX * L.ch, Math.max(UP_MIN * L.ch, (space - downs * DOWN_FAN * L.ch) / (ups - 1)))
      : UP_MAX * L.ch;
    let y = L.tableauY;
    pile.forEach((card, index) => {
      out.push({ card, loc: { type: 'tableau', col, index }, x: L.colX(col), y, z: index });
      y += card.up ? upFan : DOWN_FAN * L.ch;
    });
  });
  return out;
}

// Waar komt een losgelaten kaart terecht? (cx, cy) = midden van de gesleepte kaart.
// We kijken welke bestemmingen kunnen (regels van het spel) en nemen de dichtstbijzijnde; te ver weg = null.
export function dropTarget(state, L, from, cx, cy) {
  if (!grab(state, from)) return null;
  const options = [];
  for (let i = 0; i < 4; i++) {
    const to = { type: 'foundation', i };
    if (!canMove(state, from, to)) continue;
    const p = L.foundXY(i);
    const d = Math.hypot(cx - (p.x + L.cw / 2), cy - (p.y + L.ch / 2));
    if (d < L.ch * 0.8) options.push({ to, d });
  }
  for (let col = 0; col < 7; col++) {
    const to = { type: 'tableau', col };
    if (!canMove(state, from, to)) continue;
    const dx = Math.abs(cx - (L.colX(col) + L.cw / 2));
    // Onder de bovenkant van de kolom telt alleen de zijwaartse afstand; erboven ook de hoogte.
    const d = Math.hypot(dx, Math.max(0, L.tableauY + L.ch / 2 - cy));
    if (dx < L.cw * 0.75 && d < L.ch * 0.9) options.push({ to, d });
  }
  options.sort((a, b) => a.d - b.d);
  return options[0]?.to ?? null;
}
