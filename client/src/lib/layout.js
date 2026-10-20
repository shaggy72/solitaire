// Rekent uit waar elke kaart staat, zodat het bord altijd past op het scherm (iPad liggend of staand).
// Kolommen: 0 stapel, 1 aflegstapel, 2 leeg, 3-6 funderingen; daaronder de 7 tableau-kolommen.
export const cardKey = (c) => `${c.s}-${c.r}`;

const DOWN_FAN = 0.12; // gesloten kaarten liggen dicht op elkaar (deel van de kaarthoogte)
const UP_MIN = 0.18; // kleinste overlap bij heel lange kolommen
const UP_TYPICAL = 0.22; // waar het bord op gedimensioneerd wordt
const UP_MAX = 0.32;
const WORST_CASE = 1 + 6 * DOWN_FAN + 9 * UP_TYPICAL; // een lange kolom, in kaarthoogtes (langere worden samengedrukt)

export function measure(W, H) {
  const pad = Math.max(8, Math.round(W * 0.012));
  const rowGap = Math.max(12, Math.round(H * 0.03));
  const byWidth = (W - 2 * pad) / (7 + 6 * 0.12);
  const byHeight = ((H - 2 * pad - rowGap) / (1 + WORST_CASE)) / 1.4;
  const cw = Math.max(40, Math.floor(Math.min(byWidth, byHeight)));
  const ch = Math.round(cw * 1.4);
  const gap = Math.max(6, (W - 2 * pad - 7 * cw) / 6);
  return { W, H, pad, rowGap, cw, ch, gap, colX: (i) => pad + i * (cw + gap), tableauY: pad + ch + rowGap };
}

// Geeft voor elke kaart { card, loc, x, y, z } en de plaats van de lege plekken.
export function place(state, L) {
  const out = [];
  state.stock.forEach((card, i) => out.push({ card, loc: { type: 'stock' }, x: L.colX(0), y: L.pad, z: i }));
  state.waste.forEach((card, i) => out.push({ card, loc: { type: 'waste' }, x: L.colX(1), y: L.pad, z: i }));
  state.foundations.forEach((f, fi) => f.forEach((card, i) => out.push({ card, loc: { type: 'foundation', i: fi }, x: L.colX(3 + fi), y: L.pad, z: i })));
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
