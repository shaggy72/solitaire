// Kaartontwerpen. `vars` worden als CSS-variabelen op het bord gezet; `style` kiest de tekening voor heer/dame/boer
// (zie CardArt.jsx); `pips` = tonen 2 t/m 10 met het echte aantal tekens (anders één groot teken).
// De ontwerpen zijn eigen tekeningen in de stijl van bekende kaartspellen, geen kopieën van bestaande kunstwerken.
export const DEFAULT_THEME = 'standaard';

const lattice = (line, base, size = 14) =>
  `repeating-linear-gradient(45deg, ${line} 0 2px, transparent 2px ${size}px), repeating-linear-gradient(-45deg, ${line} 0 2px, transparent 2px ${size}px), ${base}`;

export const THEMES = [
  {
    id: 'standaard', name: 'Standaard', style: 'plain', pips: false,
    vars: {
      '--paper': '#fffdf7', '--edge': '#b9b2a0', '--ink': '#1b1b1b', '--red': '#c62828',
      '--back': 'repeating-linear-gradient(45deg, #2b5aa8 0 7px, #254b8c 7px 14px)', '--back-edge': '#fffdf7',
      '--corner-font': 'inherit',
    },
  },
  {
    id: 'tuin', name: 'Tuin', style: 'deco', pips: false,
    pal: { green: '#3f7d34', dark: '#1f2a1f', salmon: '#e8836b', peach: '#f6c9a8', cream: '#f4eddc', sage: '#b9c48a' },
    vars: {
      '--paper': '#f4eddc', '--edge': '#c9bd9e', '--ink': '#1f2a1f', '--red': '#d4573a',
      '--back': `radial-gradient(circle, #e8836b 0 20%, transparent 21%) 0 0 / 30px 30px, radial-gradient(circle, #f4eddc 0 9%, transparent 10%) 15px 15px / 30px 30px, #3f7d34`,
      '--back-edge': '#f4eddc', '--corner-font': 'Georgia, serif',
    },
  },
  {
    id: 'modern', name: 'Modern', style: 'geo', pips: false,
    pal: { black: '#141414', gray: '#7a7a7a', light: '#c9c9c9', orange: '#e2571f', skin: '#f0a98a', white: '#ffffff' },
    vars: {
      '--paper': '#ffffff', '--edge': '#c8c8c8', '--ink': '#141414', '--red': '#e2571f',
      '--back': lattice('#e2571f', '#141414', 16), '--back-edge': '#ffffff', '--corner-font': '"Trebuchet MS", sans-serif',
    },
  },
  {
    id: 'mythe', name: 'Goden', style: 'myth', pips: false,
    pal: { navy: '#26365f', coral: '#e0645c', gold: '#d9a82b', skin: '#e9b58f', teal: '#2a8d8d', purple: '#6c4a9c', brown: '#8a5a3a', white: '#f8f3ea', grey: '#cfd2d8', dark: '#3b2a22' },
    vars: {
      '--paper': '#faf6ee', '--edge': '#cfc6b4', '--ink': '#26365f', '--red': '#d2534f',
      '--back': lattice('#d9a82b', '#26365f', 18), '--back-edge': '#faf6ee', '--corner-font': 'Georgia, serif',
    },
  },
  {
    id: 'antiek', name: 'Antiek', style: 'court', pips: true,
    pal: { red: '#b8312f', yellow: '#d9a62e', blue: '#2f4f8f', black: '#1b1b1b', skin: '#f0cfae', beard: '#8b8478' },
    vars: {
      '--paper': '#efe4cb', '--edge': '#b3a483', '--ink': '#1b1b1b', '--red': '#b8312f',
      '--paper-texture': 'repeating-linear-gradient(90deg, rgba(90, 70, 30, 0.07) 0 1px, transparent 1px 4px)',
      '--back': lattice('#f0d9c4', '#b8312f', 12), '--back-edge': '#efe4cb', '--corner-font': 'Georgia, serif',
    },
  },
  {
    id: 'klassiek', name: 'Klassiek', style: 'court', pips: true,
    pal: { red: '#d22f2a', yellow: '#eab72a', blue: '#27509a', black: '#161616', skin: '#f6d6b8', beard: '#9a9a9a' },
    vars: {
      '--paper': '#fbfbf8', '--edge': '#bdbdb4', '--ink': '#161616', '--red': '#c62828',
      '--back': lattice('#ffffff', '#27509a', 12), '--back-edge': '#fbfbf8', '--corner-font': 'inherit',
    },
  },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) ?? THEMES[0];
