import React from 'react';
import { SUITS, RANKS, isRed } from './lib/game.js';
import { PIPS } from './lib/pips.js';

// De kaartkunst. Heer, dame en boer worden per ontwerp als eigen tekening (SVG, 100 x 100) opgebouwd uit
// vormen; de tekens van de andere kaarten zijn gewoon tekst in de kleur van de soort.
// Een kaartnummer (1-13): 11 = boer, 12 = dame, 13 = heer.

const crown = (x, y, w, h, fill, stroke) => {
  const p = [[0, 1], [0.1, 0.15], [0.3, 0.6], [0.5, 0], [0.7, 0.6], [0.9, 0.15], [1, 1]];
  return <polygon points={p.map(([a, b]) => `${x + a * w},${y + b * h}`).join(' ')} fill={fill} stroke={stroke} strokeWidth="0.8" />;
};

// ---- Tuin: groene en zalmkleurige art-decovlakken met waterlelie-cirkels
function Deco({ rank, red, pal }) {
  const main = red ? pal.salmon : pal.green;
  const alt = red ? pal.green : pal.salmon;
  const ring = (cx, cy, r) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={pal.cream} stroke={pal.dark} strokeWidth="1.4" />
      <circle cx={cx} cy={cy} r={r * 0.68} fill={alt} stroke={pal.dark} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.34} fill={pal.cream} stroke={pal.dark} strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.12} fill={pal.dark} />
    </g>
  );
  return (
    <g>
      <rect x="3" y="3" width="94" height="94" rx="7" fill={pal.peach} stroke={pal.dark} strokeWidth="1.6" />
      <path d="M3 62 L62 3 L97 3 L97 38 L38 97 L3 97 Z" fill={main} />
      <path d="M3 40 L40 3 L52 3 L3 52 Z" fill={pal.sage} />
      <path d="M97 60 L60 97 L48 97 L97 48 Z" fill={pal.sage} />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={20 + i * 14} y1="97" x2="97" y2={20 + i * 14} stroke={pal.dark} strokeWidth="0.7" opacity="0.5" />)}
      {rank === 11 && ring(50, 50, 27)}
      {rank === 12 && <>{ring(32, 33, 19)}{ring(68, 67, 19)}<path d="M40 97 Q50 78 60 97 Z" fill={pal.dark} /><path d="M40 3 Q50 22 60 3 Z" fill={pal.dark} /></>}
      {rank === 13 && <>{ring(30, 34, 18)}{ring(70, 34, 18)}{ring(50, 74, 14)}{crown(36, 4, 28, 14, pal.cream, pal.dark)}</>}
    </g>
  );
}

// ---- Modern: zwart-grijze veelhoeken, dubbele figuur met een oranje (rood) of grijs (zwart) accent
function Geo({ rank, red, pal }) {
  const accent = red ? pal.orange : pal.gray;
  const half = (
    <g>
      <rect x="0" y="0" width="100" height="50" fill="none" />
      <polygon points="30,50 37,27 63,27 70,50" fill={pal.black} />
      <polygon points="50,27 63,50 37,50" fill={pal.gray} />
      <polygon points="41,50 50,38 59,50" fill={accent} />
      <rect x="45" y="22" width="10" height="7" fill={pal.skin} />
      <circle cx="50" cy="15" r="9.5" fill={pal.skin} />
      <circle cx="46.5" cy="14" r="1" fill={pal.black} /><circle cx="53.5" cy="14" r="1" fill={pal.black} />
      {rank === 13 && <><polygon points="40,18 60,18 50,34" fill={pal.black} /><polygon points="39,8 40,0 45,5 50,-1 55,5 60,0 61,8" fill={pal.black} /></>}
      {rank === 12 && <><path d="M39 14 Q39 3 50 3 Q61 3 61 14 L64 34 L56 20 L44 20 L36 34 Z" fill={pal.black} opacity="0.92" /><circle cx="50" cy="15" r="8" fill={pal.skin} /><polygon points="41,6 43,-1 47,3 50,-2 53,3 57,-1 59,6" fill={pal.black} /></>}
      {rank === 11 && <><path d="M39 11 Q50 -3 61 11 Z" fill={pal.black} /><line x1="61" y1="8" x2="72" y2="-2" stroke={accent} strokeWidth="2" /></>}
      <line x1="22" y1="6" x2="22" y2="50" stroke={pal.gray} strokeWidth="1.4" />
      <line x1="78" y1="6" x2="78" y2="50" stroke={pal.gray} strokeWidth="1.4" />
      <polygon points="22,2 19,9 25,9" fill={accent} /><polygon points="78,2 75,9 81,9" fill={accent} />
    </g>
  );
  return (
    <g>
      <rect x="2" y="2" width="96" height="96" rx="5" fill={pal.white} stroke={pal.light} strokeWidth="1" />
      {half}
      <g transform="rotate(180 50 50)">{half}</g>
    </g>
  );
}

// ---- Goden: gekleurd vlak met een witte hoek, borstbeeld met kroon, helm of baard
function Myth({ rank, red, pal }) {
  const bg = red ? pal.coral : pal.navy;
  const drape = rank === 13 ? (red ? pal.teal : pal.purple) : rank === 12 ? (red ? pal.purple : pal.teal) : pal.brown;
  return (
    <g>
      <rect x="2" y="2" width="96" height="96" rx="6" fill={bg} />
      {rank === 12 && <path d="M30 44 Q28 14 50 14 Q72 14 70 44 L76 80 L58 60 L42 60 L24 80 Z" fill={red ? pal.dark : '#1c2a22'} />}
      <path d="M10 98 Q12 66 50 62 Q88 66 90 98 Z" fill={drape} />
      <path d="M36 98 Q50 74 64 98 Z" fill={pal.gold} opacity="0.85" />
      <rect x="44" y="50" width="12" height="14" fill={pal.skin} />
      <ellipse cx="50" cy="40" rx="14" ry="17" fill={pal.skin} />
      <circle cx="44.5" cy="38" r="1.3" fill={pal.dark} /><circle cx="55.5" cy="38" r="1.3" fill={pal.dark} />
      <path d="M45 48 Q50 51 55 48" stroke={pal.dark} strokeWidth="1.2" fill="none" />
      {rank === 13 && <><path d="M36 38 Q36 20 50 18 Q64 20 64 38 Q58 28 50 28 Q42 28 36 38 Z" fill={pal.grey} /><path d="M36 42 Q40 72 50 74 Q60 72 64 42 Q58 54 50 54 Q42 54 36 42 Z" fill={pal.grey} />{crown(37, 10, 26, 12, pal.gold, pal.dark)}</>}
      {rank === 12 && crown(39, 12, 22, 10, pal.gold, pal.dark)}
      {rank === 11 && <><path d="M35 38 Q35 16 50 14 Q65 16 65 38 L59 32 L41 32 Z" fill={pal.gold} stroke={pal.dark} strokeWidth="0.8" /><path d="M46 14 Q50 2 54 14 Z" fill={pal.coral} /></>}
      <path d="M62 2 L98 2 L98 40 Q80 34 62 2 Z" fill="none" />
      <path d="M98 98 L98 66 Q76 74 64 98 Z" fill={pal.white} />
      <path d="M2 2 L34 2 Q20 22 2 36 Z" fill={pal.white} />
    </g>
  );
}

// ---- Antiek en klassiek: de traditionele dubbele figuur in rood, geel, blauw en zwart
function Court({ rank, pal }) {
  const half = (
    <g>
      <path d="M22 50 L22 29 L78 29 L78 50 Z" fill={pal.red} />
      <path d="M22 50 L50 29 L78 50 Z" fill={pal.blue} />
      <rect x="22" y="29" width="56" height="4" fill={pal.yellow} />
      <path d="M22 40 L50 40" stroke={pal.yellow} strokeWidth="2" />
      <path d="M50 40 L78 40" stroke={pal.yellow} strokeWidth="2" />
      <path d="M22 29 L22 50 M78 29 L78 50" stroke={pal.black} strokeWidth="1" />
      <rect x="45" y="22" width="10" height="8" fill={pal.skin} stroke={pal.black} strokeWidth="0.7" />
      <circle cx="50" cy="16" r="8.5" fill={pal.skin} stroke={pal.black} strokeWidth="0.9" />
      <circle cx="46.5" cy="15" r="1" fill={pal.black} /><circle cx="53.5" cy="15" r="1" fill={pal.black} />
      <path d="M46 20 Q50 22 54 20" stroke={pal.black} strokeWidth="0.9" fill="none" />
      {rank === 13 && <><path d="M41 18 Q50 38 59 18 Q50 26 41 18 Z" fill={pal.beard} stroke={pal.black} strokeWidth="0.7" /><path d="M40 10 L42 1 L46 6 L50 0 L54 6 L58 1 L60 10 Z" fill={pal.yellow} stroke={pal.black} strokeWidth="0.8" /><rect x="81" y="6" width="3" height="40" fill={pal.black} /><rect x="77" y="14" width="11" height="3" fill={pal.yellow} stroke={pal.black} strokeWidth="0.6" /></>}
      {rank === 12 && <><path d="M41 12 Q41 4 50 4 Q59 4 59 12 L62 26 L54 14 L46 14 L38 26 Z" fill={pal.yellow} stroke={pal.black} strokeWidth="0.8" /><circle cx="50" cy="16" r="7.5" fill={pal.skin} stroke={pal.black} strokeWidth="0.9" /><path d="M41 8 L43 0 L47 5 L50 -1 L53 5 L57 0 L59 8 Z" fill={pal.yellow} stroke={pal.black} strokeWidth="0.8" /><circle cx="84" cy="22" r="5" fill={pal.red} stroke={pal.black} strokeWidth="0.8" /><line x1="84" y1="27" x2="84" y2="48" stroke={pal.black} strokeWidth="1.2" /></>}
      {rank === 11 && <><path d="M40 11 Q50 -2 60 11 Z" fill={pal.red} stroke={pal.black} strokeWidth="0.8" /><path d="M58 8 Q72 -4 78 4" stroke={pal.yellow} strokeWidth="2.4" fill="none" /><line x1="82" y1="4" x2="82" y2="48" stroke={pal.black} strokeWidth="1.3" /><polygon points="82,0 78,10 86,10" fill={pal.yellow} stroke={pal.black} strokeWidth="0.6" /></>}
    </g>
  );
  return (
    <g>
      <rect x="2" y="2" width="96" height="96" fill="none" stroke={pal.black} strokeWidth="1.4" />
      {half}
      <g transform="rotate(180 50 50)">{half}</g>
    </g>
  );
}

const COURTS = { deco: Deco, geo: Geo, myth: Myth, court: Court };

// Het tekengebied van een kaart: heer/dame/boer = tekening, 2-10 = tekens op de juiste plaats of één groot teken.
export default function CardFace({ card, theme }) {
  const sym = SUITS[card.s];
  const Court = COURTS[theme.style];
  return (
    <>
      <span className="corner">{RANKS[card.r]}<i>{sym}</i></span>
      {card.r >= 11 && Court ? (
        <svg className="art" viewBox="0 0 100 100" aria-hidden="true"><Court rank={card.r} red={isRed(card)} pal={theme.pal} /></svg>
      ) : card.r >= 2 && theme.pips ? (
        <span className="pips" aria-hidden="true">
          {PIPS[card.r].map(([x, y], i) => (
            <b key={i} style={{ left: `${x * 100}%`, top: `${y * 100}%`, transform: `translate(-50%, -50%)${y > 0.5 ? ' rotate(180deg)' : ''}` }}>{sym}</b>
          ))}
        </span>
      ) : (
        <span className={`pip${card.r === 1 ? ' ace' : ''}`}>{sym}</span>
      )}
    </>
  );
}
