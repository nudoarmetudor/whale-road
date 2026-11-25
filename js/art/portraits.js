// Whale Road: painted-bust portraits drawn in code as SVG strings. Original characters.
// Consistent lighting: warm key light from the upper left, cool rim light from the right.
import { f1, mix, lighten, darken, rng } from './paint.js';

let UID = 0;

const SKIN = { fair: '#f2cdb0', light: '#e6b48e', ruddy: '#e4a48a', tan: '#c99068', olive: '#b98a60', brown: '#8e5c3c', dark: '#5f3b28', troll: '#a3ad7e' };
const HAIR = { auburn: '#9a3e1e', red: '#b4501e', blond: '#e0c27a', flax: '#ecdcaa', brown: '#5a3a22', dark: '#2a1e18', black: '#151216', grey: '#9a968e', white: '#e8e4dc', ginger: '#c8662a' };

// spec fields: skin, hair, style, beard, beardCol, face{w,h,jaw,chin}, eyes{col,size}, patch, brow, mouth, age,
// body{w,col,col2,kind}, head, headCol, acc[], bg[a,b], tusks, scar, blush, look (eye offset)
const SPECS = {
  // heroes
  ylva: { skin: SKIN.fair, hair: HAIR.auburn, style: 'braid', beard: 'none', face: { w: 41, h: 54, jaw: 0.66, chin: 1.02 }, eyes: { col: '#4a7a6a' }, brow: 0.02, mouth: 'smile', age: 0.25,
    body: { w: 0.92, col: '#5f6b3a', col2: '#2f5d6e', kind: 'apron' }, acc: ['beads'], bg: ['#d9c08a', '#6a5a3a'], blush: 0.25 },
  bjarki: { skin: SKIN.ruddy, hair: HAIR.brown, style: 'long', beard: 'huge', beardCol: '#6a3e22', face: { w: 49, h: 56, jaw: 0.86, chin: 1.0 }, eyes: { col: '#5a4a3a', size: 0.9 }, brow: -0.3, mouth: 'grin', age: 0.35,
    body: { w: 1.18, col: '#6a4a2e', col2: '#4a3020', kind: 'pelt' }, head: 'bear', bg: ['#b86a3a', '#3a1e14'] },
  saeunn: { skin: SKIN.fair, hair: HAIR.flax, style: 'long', beard: 'none', face: { w: 39, h: 53, jaw: 0.62, chin: 1.0 }, eyes: { col: '#5a8ac0', size: 1.12 }, brow: 0.12, mouth: 'neutral', age: 0,
    body: { w: 0.88, col: '#3a4e8a', col2: '#c9a04a', kind: 'cloak' }, head: 'hood', headCol: '#2e4486', acc: ['staff', 'beads'], bg: ['#9ab4d8', '#22304e'], blush: 0.2 },
  hrafn: { skin: SKIN.light, hair: HAIR.black, style: 'spiky', beard: 'goatee', face: { w: 38, h: 57, jaw: 0.6, chin: 1.08 }, eyes: { col: '#3a3a2a', size: 0.95 }, brow: -0.12, mouth: 'grin', age: 0.2,
    body: { w: 0.84, col: '#2a2a34', col2: '#8e2a22', kind: 'cloak' }, acc: ['feather', 'brooch'], bg: ['#a8a090', '#2a2622'], look: 2 },
  ketill: { skin: SKIN.ruddy, hair: HAIR.white, style: 'long', beard: 'braided', beardCol: HAIR.white, face: { w: 45, h: 56, jaw: 0.76, chin: 1.0 }, eyes: { col: '#5a7a9a', size: 0.9 }, patch: 'right', brow: -0.2, mouth: 'neutral', age: 1,
    body: { w: 1.05, col: '#4a2a2a', col2: '#c9a04a', kind: 'fur' }, head: 'circlet', acc: ['brooch'], bg: ['#5a7a8a', '#1a2830'], scar: true },
  grima: { skin: SKIN.troll, hair: '#3e3a2a', style: 'wild', beard: 'none', face: { w: 51, h: 55, jaw: 0.92, chin: 0.98 }, eyes: { col: '#c89a2a', size: 0.85 }, brow: 0.1, mouth: 'smile', age: 0.3,
    body: { w: 1.22, col: '#7a5a3a', col2: '#5f6b3a', kind: 'tunic' }, head: 'flowers', tusks: true, bg: ['#a8c07a', '#3a4a22'], blush: 0.3, ears: 'big' },
  custom: { skin: SKIN.light, hair: HAIR.brown, style: 'short', beard: 'short', face: { w: 44, h: 55, jaw: 0.74, chin: 1.02 }, eyes: { col: '#4a6a8a' }, brow: 0, mouth: 'smile', age: 0.2,
    body: { w: 1, col: '#5b3a22', col2: '#2f5d6e', kind: 'cloak' }, acc: ['brooch'], bg: ['#c8b080', '#4a3a26'] },
  // NPCs
  jarl: { skin: SKIN.light, hair: HAIR.blond, style: 'long', beard: 'full', face: { w: 45, h: 56, jaw: 0.8, chin: 1.0 }, eyes: { col: '#4a6a9a' }, brow: -0.1, mouth: 'neutral', age: 0.5,
    body: { w: 1.08, col: '#7a1e1e', col2: '#c9a04a', kind: 'cloak' }, head: 'circlet', acc: ['brooch', 'torc'], bg: ['#c99a2e', '#4a2a10'] },
  merchant: { skin: SKIN.ruddy, hair: HAIR.brown, style: 'short', beard: 'short', face: { w: 50, h: 54, jaw: 0.9, chin: 0.98 }, eyes: { col: '#5a4a3a', size: 0.9 }, brow: 0.05, mouth: 'smile', age: 0.45,
    body: { w: 1.16, col: '#2f5d6e', col2: '#c99a2e', kind: 'cloak' }, head: 'cap', headCol: '#8e2a22', acc: ['coin'], bg: ['#d9c59a', '#5a4a2a'], blush: 0.35 },
  shipwright: { skin: SKIN.tan, hair: HAIR.ginger, style: 'short', beard: 'full', face: { w: 46, h: 55, jaw: 0.84, chin: 1.0 }, eyes: { col: '#4a6a5a' }, brow: -0.08, mouth: 'smile', age: 0.4,
    body: { w: 1.12, col: '#8a6a44', col2: '#5a3a22', kind: 'leather' }, head: 'headband', headCol: '#5a3a22', acc: ['axe'], bg: ['#a8b8a0', '#3a4a3a'] },
  priest: { skin: SKIN.fair, hair: HAIR.grey, style: 'long', beard: 'long', face: { w: 42, h: 57, jaw: 0.7, chin: 1.04 }, eyes: { col: '#6a8aaa' }, brow: 0.05, mouth: 'neutral', age: 0.8,
    body: { w: 0.98, col: '#e8e0cc', col2: '#8e2a22', kind: 'robe' }, head: 'hood', headCol: '#d8ccb0', acc: ['armring'], bg: ['#c87a3a', '#3a1a10'] },
  volva: { skin: SKIN.fair, hair: HAIR.white, style: 'long', beard: 'none', face: { w: 40, h: 54, jaw: 0.64, chin: 1.02 }, eyes: { col: '#8ab0c8', size: 1.05 }, brow: 0.2, mouth: 'neutral', age: 0.9,
    body: { w: 0.94, col: '#1e2a44', col2: '#e8e0d0', kind: 'fur' }, head: 'hood', headCol: '#1a2238', acc: ['staff', 'beads'], bg: ['#6a5a9a', '#14102a'] },
  runecarver: { skin: SKIN.tan, hair: HAIR.grey, style: 'bald', beard: 'full', beardCol: HAIR.grey, face: { w: 45, h: 56, jaw: 0.8, chin: 1.0 }, eyes: { col: '#4a4a3a', size: 0.85 }, brow: -0.15, mouth: 'neutral', age: 0.7,
    body: { w: 1.04, col: '#6a6458', col2: '#8e2a22', kind: 'leather' }, head: 'headband', headCol: '#8e2a22', acc: ['chisel'], bg: ['#9a958a', '#2a2824'] },
  guildmaster: { skin: SKIN.light, hair: HAIR.dark, style: 'short', beard: 'short', beardCol: HAIR.grey, face: { w: 46, h: 55, jaw: 0.82, chin: 1.0 }, eyes: { col: '#5a5a4a' }, brow: -0.05, mouth: 'smirk', age: 0.55,
    body: { w: 1.1, col: '#5a2a4a', col2: '#c9a04a', kind: 'fur' }, head: 'cap', headCol: '#2a2a34', acc: ['chain'], bg: ['#b08a5a', '#3a2418'] },
  banker: { skin: SKIN.light, hair: HAIR.brown, style: 'short', beard: 'trim', face: { w: 43, h: 56, jaw: 0.74, chin: 1.02 }, eyes: { col: '#4a5a7a' }, brow: 0, mouth: 'smirk', age: 0.4,
    body: { w: 1.0, col: '#24467a', col2: '#c9a04a', kind: 'cloak' }, acc: ['coin', 'brooch'], bg: ['#c9b070', '#2a2a3a'] },
  moneylender: { skin: SKIN.olive, hair: HAIR.dark, style: 'short', beard: 'goatee', face: { w: 38, h: 58, jaw: 0.58, chin: 1.08 }, eyes: { col: '#3a3020', size: 0.82 }, brow: -0.2, mouth: 'smirk', age: 0.55,
    body: { w: 0.9, col: '#4a2a4a', col2: '#c9a04a', kind: 'robe' }, head: 'hood', headCol: '#3a2238', acc: ['scales'], bg: ['#8a7a5a', '#1e1a14'], look: -2 },
  barkeep: { skin: SKIN.ruddy, hair: HAIR.red, style: 'bald', beard: 'longmust', face: { w: 50, h: 54, jaw: 0.9, chin: 0.98 }, eyes: { col: '#5a6a4a', size: 0.88 }, brow: 0.08, mouth: 'grin', age: 0.5,
    body: { w: 1.2, col: '#d9c59a', col2: '#6a4a2a', kind: 'apron' }, acc: ['tankard'], bg: ['#d0904a', '#3a1e10'], blush: 0.45 },
  skald: { skin: SKIN.fair, hair: HAIR.blond, style: 'long', beard: 'short', face: { w: 42, h: 56, jaw: 0.7, chin: 1.02 }, eyes: { col: '#5a8aa0' }, brow: 0.1, mouth: 'open', age: 0.3,
    body: { w: 0.98, col: '#8e2a22', col2: '#d9c59a', kind: 'cloak' }, acc: ['lyre', 'brooch'], bg: ['#c8a0a0', '#3a2028'] },
  warehouse: { skin: SKIN.tan, hair: HAIR.brown, style: 'short', beard: 'stubble', face: { w: 47, h: 54, jaw: 0.88, chin: 0.98 }, eyes: { col: '#4a4a3a', size: 0.9 }, brow: -0.05, mouth: 'neutral', age: 0.4,
    body: { w: 1.14, col: '#5f6b3a', col2: '#5b3a22', kind: 'leather' }, head: 'cap', headCol: '#5b3a22', acc: ['keys'], bg: ['#a89a7a', '#3a3224'] },
  raider: { skin: SKIN.light, hair: HAIR.dark, style: 'none', beard: 'full', beardCol: HAIR.dark, face: { w: 45, h: 55, jaw: 0.84, chin: 1.0 }, eyes: { col: '#3a3a3a', size: 0.85 }, brow: -0.35, mouth: 'snarl', age: 0.35,
    body: { w: 1.1, col: '#6a6e74', col2: '#5a3a22', kind: 'mail' }, head: 'helm', acc: [], bg: ['#8e2a22', '#1a0a08'], scar: true },
  monk: { skin: SKIN.fair, hair: HAIR.brown, style: 'tonsure', beard: 'none', face: { w: 43, h: 55, jaw: 0.72, chin: 1.02 }, eyes: { col: '#5a6a5a' }, brow: 0.15, mouth: 'smile', age: 0.45,
    body: { w: 1.0, col: '#6a4a30', col2: '#4a3020', kind: 'robe' }, acc: ['cross'], bg: ['#c8b890', '#3a3020'], blush: 0.2 },
  byzantine_official: { skin: SKIN.olive, hair: HAIR.dark, style: 'curly', beard: 'trim', face: { w: 43, h: 57, jaw: 0.74, chin: 1.04 }, eyes: { col: '#3a2a1a' }, brow: -0.05, mouth: 'neutral', age: 0.5,
    body: { w: 1.0, col: '#6a1a5a', col2: '#d4a830', kind: 'byz' }, head: 'byzhat', headCol: '#e8dcc0', acc: [], bg: ['#d4a830', '#3a1a30'] },
  slav_prince: { skin: SKIN.light, hair: HAIR.blond, style: 'short', beard: 'longmust', face: { w: 45, h: 56, jaw: 0.8, chin: 1.02 }, eyes: { col: '#5a8aaa' }, brow: -0.12, mouth: 'neutral', age: 0.35,
    body: { w: 1.08, col: '#c22a22', col2: '#e8c040', kind: 'fur' }, head: 'furhat', headCol: '#c22a22', acc: ['brooch'], bg: ['#e8c87a', '#4a2014'] },
  saxon_reeve: { skin: SKIN.ruddy, hair: HAIR.brown, style: 'short', beard: 'trim', face: { w: 44, h: 55, jaw: 0.78, chin: 1.0 }, eyes: { col: '#5a6a4a' }, brow: 0, mouth: 'neutral', age: 0.45,
    body: { w: 1.04, col: '#3e6a3a', col2: '#c8a030', kind: 'cloak' }, head: 'hood', headCol: '#5a7a3a', acc: ['brooch'], bg: ['#b8c08a', '#2e3a1e'], hoodDown: true },
  frank_count: { skin: SKIN.light, hair: HAIR.brown, style: 'short', beard: 'mustache', face: { w: 43, h: 56, jaw: 0.76, chin: 1.02 }, eyes: { col: '#4a5a6a' }, brow: -0.1, mouth: 'smirk', age: 0.45,
    body: { w: 1.04, col: '#2a4a9a', col2: '#d4b040', kind: 'cloak' }, acc: ['brooch', 'chain'], bg: ['#9ab0d8', '#1a2240'] },
  gael_king: { skin: SKIN.fair, hair: HAIR.red, style: 'long', beard: 'full', beardCol: '#b4501e', face: { w: 45, h: 56, jaw: 0.8, chin: 1.0 }, eyes: { col: '#4a8a5a' }, brow: -0.05, mouth: 'smile', age: 0.45,
    body: { w: 1.06, col: '#2a7a3a', col2: '#d4b040', kind: 'cloak' }, head: 'circlet', acc: ['torc', 'brooch'], bg: ['#8ac08a', '#1a3a1e'] },
  aesti_elder: { skin: SKIN.fair, hair: HAIR.white, style: 'long', beard: 'long', beardCol: HAIR.white, face: { w: 44, h: 56, jaw: 0.74, chin: 1.02 }, eyes: { col: '#7a9aaa', size: 0.85 }, brow: 0.08, mouth: 'smile', age: 0.95,
    body: { w: 1.0, col: '#7c5c3e', col2: '#e0901c', kind: 'fur' }, head: 'furhat', headCol: '#5a4a3a', acc: ['amber'], bg: ['#e0b060', '#4a2a10'] },
  townsman: { skin: SKIN.light, hair: HAIR.blond, style: 'short', beard: 'short', face: { w: 44, h: 55, jaw: 0.78, chin: 1.0 }, eyes: { col: '#5a7a9a' }, brow: 0.05, mouth: 'smile', age: 0.3,
    body: { w: 1.04, col: '#8a6a44', col2: '#5f6b3a', kind: 'tunic' }, head: 'cap', headCol: '#5f6b3a', bg: ['#b8b098', '#3a382c'] },
  townswoman: { skin: SKIN.light, hair: HAIR.brown, style: 'bun', beard: 'none', face: { w: 40, h: 54, jaw: 0.64, chin: 1.0 }, eyes: { col: '#5a6a4a' }, brow: 0.05, mouth: 'smile', age: 0.3,
    body: { w: 0.94, col: '#a8462a', col2: '#d9c59a', kind: 'apron' }, head: 'scarf', headCol: '#e8e0cc', acc: [], bg: ['#c8b8a0', '#3a2e24'], blush: 0.25 },
};
export const PORTRAIT_IDS = Object.keys(SPECS);

const r1 = f1;
function P(d, fill, extra = '') { return `<path d="${d}" fill="${fill}"${extra}/>`; }

function facePath(cx, cy, w, h, jaw, chin) {
  const t = cy - h;
  return `M${r1(cx)} ${r1(t)}C${r1(cx + w * 0.58)} ${r1(t)} ${r1(cx + w)} ${r1(cy - h * 0.62)} ${r1(cx + w)} ${r1(cy - h * 0.18)}`
    + `C${r1(cx + w)} ${r1(cy + h * 0.24)} ${r1(cx + w * jaw)} ${r1(cy + h * 0.56)} ${r1(cx + w * 0.42)} ${r1(cy + h * 0.82)}`
    + `C${r1(cx + w * 0.2)} ${r1(cy + h * chin)} ${r1(cx - w * 0.2)} ${r1(cy + h * chin)} ${r1(cx - w * 0.42)} ${r1(cy + h * 0.82)}`
    + `C${r1(cx - w * jaw)} ${r1(cy + h * 0.56)} ${r1(cx - w)} ${r1(cy + h * 0.24)} ${r1(cx - w)} ${r1(cy - h * 0.18)}`
    + `C${r1(cx - w)} ${r1(cy - h * 0.62)} ${r1(cx - w * 0.58)} ${r1(t)} ${r1(cx)} ${r1(t)}Z`;
}

export function portrait(id, o = {}) {
  let sp = SPECS[id] || SPECS.townsman;
  if (id === 'custom' && o.look) sp = customSpec(o.look);
  const size = o.size || 256;
  const u = 'p' + (++UID).toString(36);
  const ID = n => `${u}-${n}`, URL = n => `url(#${u}-${n})`;
  const R = rng('portrait-' + id);
  const defs = [];
  const cx = 128, cy = 112;
  const F = sp.face, w = F.w, h = F.h;
  const skin = sp.skin, hair = sp.hair, bcol = sp.beardCol || hair;
  const rim = '#cfe4ff', key = '#fff2d8';
  const ink = darken(skin, 0.6);
  const detail = o.detail || 'high';

  // defs
  defs.push(`<radialGradient id="${ID('bg')}" cx=".38" cy=".32" r=".9"><stop offset="0" stop-color="${lighten(sp.bg[0], 0.15)}"/><stop offset=".55" stop-color="${sp.bg[0]}"/><stop offset="1" stop-color="${sp.bg[1]}"/></radialGradient>`);
  defs.push(`<radialGradient id="${ID('sk')}" cx=".36" cy=".34" r=".78"><stop offset="0" stop-color="${lighten(skin, 0.16)}"/><stop offset=".5" stop-color="${skin}"/><stop offset=".85" stop-color="${darken(skin, 0.22)}"/><stop offset="1" stop-color="${darken(skin, 0.34)}"/></radialGradient>`);
  defs.push(`<linearGradient id="${ID('cl')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(sp.body.col, 0.18)}"/><stop offset=".55" stop-color="${sp.body.col}"/><stop offset="1" stop-color="${darken(sp.body.col, 0.45)}"/></linearGradient>`);
  defs.push(`<linearGradient id="${ID('hr')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(hair, 0.22)}"/><stop offset=".5" stop-color="${hair}"/><stop offset="1" stop-color="${darken(hair, 0.4)}"/></linearGradient>`);
  defs.push(`<linearGradient id="${ID('bd')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lighten(bcol, 0.2)}"/><stop offset=".55" stop-color="${bcol}"/><stop offset="1" stop-color="${darken(bcol, 0.4)}"/></linearGradient>`);
  defs.push(`<linearGradient id="${ID('mt')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8ecf0"/><stop offset=".35" stop-color="#9aa2aa"/><stop offset="1" stop-color="#3a4048"/></linearGradient>`);
  defs.push(`<linearGradient id="${ID('gd')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"/><stop offset=".45" stop-color="#d8a838"/><stop offset="1" stop-color="#7a5212"/></linearGradient>`);
  defs.push(`<radialGradient id="${ID('sd')}"><stop offset="0" stop-color="${darken(skin, 0.5)}" stop-opacity=".5"/><stop offset=".6" stop-color="${darken(skin, 0.45)}" stop-opacity=".28"/><stop offset="1" stop-color="${darken(skin, 0.4)}" stop-opacity="0"/></radialGradient>`);
  defs.push(`<radialGradient id="${ID('bl')}"><stop offset="0" stop-color="#e0606a" stop-opacity="1"/><stop offset="1" stop-color="#e0606a" stop-opacity="0"/></radialGradient>`);
  defs.push(`<linearGradient id="${ID('nk')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${darken(skin, 0.05)}"/><stop offset=".6" stop-color="${darken(skin, 0.18)}"/><stop offset="1" stop-color="${darken(skin, 0.4)}"/></linearGradient>`);
  const face = facePath(cx, cy, w, h, F.jaw, F.chin);
  defs.push(`<clipPath id="${ID('fc')}"><path d="${face}"/></clipPath>`);
  defs.push(`<clipPath id="${ID('rm')}"><rect x="${r1(cx + w * 0.3)}" y="0" width="200" height="256"/></clipPath>`);
  if (detail !== 'low') defs.push(`<filter id="${ID('pt')}" x="0" y="0" width="256" height="256" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".9" seed="7" result="n"/><feComposite in="d" in2="n" operator="arithmetic" k1=".1" k2=".95" result="o"/><feComposite in="o" in2="SourceGraphic" operator="in"/></filter>`);

  const bw = sp.body.w;
  const L = []; // layers in order
  // background with brushy light
  L.push(`<rect width="256" height="256" fill="${URL('bg')}"/>`);
  let strokes = '';
  for (let i = 0; i < 14; i++) { const x = R() * 256, y = R() * 256; strokes += `M${r1(x)} ${r1(y)}q${r1(20 + R() * 30)} ${r1(-8 + R() * 16)} ${r1(50 + R() * 50)} ${r1(-4 + R() * 8)}`; }
  L.push(`<path d="${strokes}" stroke="${lighten(sp.bg[0], 0.3)}" stroke-width="10" stroke-linecap="round" opacity=".12" fill="none"/>`);

  const acc = new Set(sp.acc || []);
  // staff behind
  if (acc.has('staff')) {
    const sx = 214;
    L.push(`<path d="M${sx} 256L${sx + 4} 40" stroke="#4a3220" stroke-width="7" stroke-linecap="round"/><path d="M${sx + 1} 256L${sx + 4} 40" stroke="#8a6a44" stroke-width="2"/>`);
    L.push(`<path d="M${sx + 4} 52c-14 -6 -16 -26 0 -34c16 8 14 28 0 34z" fill="none" stroke="#3a3a42" stroke-width="3"/><path d="M${sx - 8} 36h24M${sx + 4} 18v34" stroke="#3a3a42" stroke-width="2.4"/><circle cx="${sx + 4}" cy="35" r="5" fill="#9ad0ff"/><circle cx="${sx + 4}" cy="35" r="12" fill="#9ad0ff" opacity=".25"/>`);
  }

  // back hair / hood back / pelt back
  const hp = URL('hr');
  if (sp.head === 'hood' && !sp.hoodDown) L.push(P(`M${cx - w - 24} 236C${cx - w - 30} 150 ${cx - w - 18} ${cy - h - 26} ${cx} ${cy - h - 28}C${cx + w + 18} ${cy - h - 26} ${cx + w + 30} 150 ${cx + w + 24} 236Z`, darken(sp.headCol, 0.25)));
  if (sp.head === 'scarf') L.push(P(`M${r1(cx - w - 20)} 224C${r1(cx - w - 26)} 150 ${r1(cx - w - 22)} ${cy - h - 30} ${cx} ${cy - h - 30}C${r1(cx + w + 22)} ${cy - h - 30} ${r1(cx + w + 26)} 150 ${r1(cx + w + 20)} 224Q${cx} 236 ${r1(cx - w - 20)} 224Z`, darken(sp.headCol, 0.22)));
  if (sp.head === 'bear') L.push(P(`M${cx - w - 40} 240C${cx - w - 44} 150 ${cx - w - 30} ${cy - h - 30} ${cx} ${cy - h - 34}C${cx + w + 30} ${cy - h - 30} ${cx + w + 44} 150 ${cx + w + 40} 240Z`, '#4a3020'));
  if (sp.style === 'long' || sp.style === 'braid' || sp.style === 'wild') {
    const ext = sp.style === 'wild' ? 16 : sp.style === 'braid' ? 4 : 10;
    const low = sp.style === 'braid' ? cy + h * 0.6 : 214;
    let d = `M${cx - w - ext} ${low}C${cx - w - ext - 6} ${cy} ${cx - w - 8} ${cy - h - 10} ${cx} ${cy - h - 12}C${cx + w + 8} ${cy - h - 10} ${cx + w + ext + 6} ${cy} ${cx + w + ext} ${low}`;
    if (sp.style === 'wild') { d += `l-8 10l-6 -12l-8 12l-6 -14L${cx + w * 0.4} ${cy + h}H${cx - w * 0.4}l-10 ${low - cy - h - 14}l-6 14l-8 -12l-6 12z`; }
    else d += `Q${cx} ${low + 20} ${cx - w - ext} ${low}Z`;
    L.push(P(d, hp));
  }

  // body / clothing
  const shoulders = `M${r1(cx - 120 * bw)} 256C${r1(cx - 112 * bw)} 212 ${r1(cx - 76 * bw)} 194 ${cx - 30} 190L${cx + 30} 190C${r1(cx + 76 * bw)} 194 ${r1(cx + 112 * bw)} 212 ${r1(cx + 120 * bw)} 256Z`;
  // neck
  const nw = Math.min(w * 0.4, 19) * (bw > 1.1 ? 1.15 : 1);
  const neck = `M${r1(cx - nw)} ${r1(cy + h * 0.6)}C${r1(cx - nw)} ${r1(cy + h * 1.1)} ${r1(cx - nw - 4)} 186 ${r1(cx - nw - 16)} 196H${r1(cx + nw + 16)}C${r1(cx + nw + 4)} 186 ${r1(cx + nw)} ${r1(cy + h * 1.1)} ${r1(cx + nw)} ${r1(cy + h * 0.6)}Z`;
  L.push(P(neck, URL('nk')));
  L.push(P(`M${r1(cx - nw - 2)} ${r1(cy + h * 0.8)}Q${cx} ${r1(cy + h * 1.22)} ${r1(cx + nw + 2)} ${r1(cy + h * 0.8)}V${r1(cy + h * 1.32)}Q${cx} ${r1(cy + h * 1.5)} ${r1(cx - nw - 2)} ${r1(cy + h * 1.32)}Z`, darken(skin, 0.45), ' opacity=".45"'));
  L.push(P(shoulders, URL('cl')));
  L.push(clothing(sp, cx, bw, URL, R));
  defs.push(`<clipPath id="${ID('sc')}"><path d="${shoulders}"/></clipPath>`);
  L.push(`<g clip-path="${URL('sc')}"><path d="${shoulders}" fill="none" stroke="${rim}" stroke-width="6" opacity=".22" clip-path="${URL('rm')}"/></g>`);

  // ears
  const earY = cy - h * 0.05;
  const ew = sp.ears === 'big' ? 1.4 : 1;
  for (const s of [-1, 1]) {
    L.push(P(`M${r1(cx + s * w * 0.94)} ${r1(earY - 12 * ew)}C${r1(cx + s * (w + 12 * ew))} ${r1(earY - 18 * ew)} ${r1(cx + s * (w + 14 * ew))} ${r1(earY + 8)} ${r1(cx + s * w * 0.9)} ${r1(earY + 14)}Z`, s > 0 ? darken(skin, 0.22) : skin));
    L.push(`<path d="M${r1(cx + s * (w + 2))} ${r1(earY - 6)}q${r1(s * 6)} 2 ${r1(s * 3)} 12" stroke="${darken(skin, 0.4)}" stroke-width="1.6" fill="none"/>`);
  }

  // face
  L.push(P(face, URL('sk')));
  // shading inside the face
  let sh = `<g clip-path="${URL('fc')}">`;
  sh += `<ellipse cx="${r1(cx + w * 1.05)}" cy="${r1(cy + 4)}" rx="${r1(w * 0.85)}" ry="${r1(h * 1.25)}" fill="${URL('sd')}"/>`;
  sh += `<ellipse cx="${r1(cx)}" cy="${r1(cy + h * 1.08)}" rx="${r1(w * 0.9)}" ry="${r1(h * 0.32)}" fill="${URL('sd')}" opacity=".7"/>`;
  sh += `<path d="${face}" fill="none" stroke="${rim}" stroke-width="5" opacity=".38" clip-path="${URL('rm')}"/>`;
  const eyY = cy - h * 0.06, exo = w * 0.42;
  for (const s of [-1, 1]) sh += `<ellipse cx="${r1(cx + s * exo)}" cy="${r1(eyY - 3)}" rx="${r1(w * 0.34)}" ry="${r1(h * 0.16)}" fill="${URL('sd')}" opacity="${s > 0 ? 0.9 : 0.6}"/>`;
  if (sp.blush) for (const s of [-1, 1]) sh += `<ellipse cx="${r1(cx + s * w * 0.55)}" cy="${r1(cy + h * 0.28)}" rx="${r1(w * 0.28)}" ry="${r1(h * 0.15)}" fill="${URL('bl')}" opacity="${sp.blush * 1.4}"/>`;
  sh += `<path d="M${r1(cx - w * 0.6)} ${r1(cy - h * 0.72)}Q${r1(cx - w * 0.2)} ${r1(cy - h * 0.98)} ${r1(cx + w * 0.1)} ${r1(cy - h * 0.8)}" stroke="${key}" stroke-width="10" opacity=".18" fill="none" stroke-linecap="round"/>`;
  sh += '</g>';
  L.push(sh);

  // wrinkles
  const age = sp.age || 0;
  if (age > 0.35) {
    let wr = `M${r1(cx - w * 0.4)} ${r1(cy - h * 0.5)}q${r1(w * 0.4)} -4 ${r1(w * 0.8)} 0`;
    if (age > 0.6) wr += `M${r1(cx - w * 0.32)} ${r1(cy - h * 0.6)}q${r1(w * 0.32)} -3 ${r1(w * 0.64)} 0`;
    for (const s of [-1, 1]) wr += `M${r1(cx + s * w * 0.72)} ${r1(eyY - 2)}l${r1(s * 7)} -3M${r1(cx + s * w * 0.72)} ${r1(eyY + 3)}l${r1(s * 7)} 2M${r1(cx + s * w * 0.2)} ${r1(cy + h * 0.28)}q${r1(s * w * 0.2)} ${r1(h * 0.16)} ${r1(s * w * 0.18)} ${r1(h * 0.34)}`;
    L.push(`<path d="${wr}" stroke="${darken(skin, 0.42)}" stroke-width="${age > 0.7 ? 1.8 : 1.3}" fill="none" opacity="${0.35 + age * 0.3}" stroke-linecap="round"/>`);
  }

  // eyes
  const es = (sp.eyes.size || 1);
  const eW = w * 0.25 * es, eH = h * 0.075 * es;
  const look = sp.look || 0;
  for (const s of [-1, 1]) {
    const ex = cx + s * exo, ey = eyY;
    if (sp.patch && ((sp.patch === 'right' && s > 0) || (sp.patch === 'left' && s < 0))) {
      L.push(`<path d="M${r1(cx - w * 1.02)} ${r1(cy - h * 0.48)}L${r1(cx + w * 1.02)} ${r1(cy + h * 0.02)}" stroke="#1e1612" stroke-width="3"/>`);
      L.push(`<ellipse cx="${r1(ex)}" cy="${r1(ey)}" rx="${r1(eW * 1.3)}" ry="${r1(eH * 2)}" fill="#1e1612"/><ellipse cx="${r1(ex - 3)}" cy="${r1(ey - 3)}" rx="${r1(eW * 0.5)}" ry="${r1(eH * 0.6)}" fill="#5a4a40" opacity=".5"/>`);
      continue;
    }
    const alm = `M${r1(ex - eW)} ${r1(ey)}Q${r1(ex)} ${r1(ey - eH * 1.9)} ${r1(ex + eW)} ${r1(ey)}Q${r1(ex)} ${r1(ey + eH * 1.25)} ${r1(ex - eW)} ${r1(ey)}Z`;
    defs.push(`<clipPath id="${ID('e' + s)}"><path d="${alm}"/></clipPath>`);
    L.push(P(alm, mix('#f4efe6', skin, 0.18)));
    L.push(`<g clip-path="${URL('e' + s)}"><circle cx="${r1(ex + look)}" cy="${r1(ey - eH * 0.15)}" r="${r1(eH * 1.25)}" fill="${sp.eyes.col}"/><circle cx="${r1(ex + look)}" cy="${r1(ey - eH * 0.15)}" r="${r1(eH * 0.62)}" fill="#120e0c"/><path d="M${r1(ex - eW)} ${r1(ey - eH * 1.2)}h${r1(eW * 2)}v${r1(eH * 0.8)}h${r1(-eW * 2)}z" fill="${darken(skin, 0.5)}" opacity=".35"/></g>`);
    L.push(`<circle cx="${r1(ex + look - eH * 0.45)}" cy="${r1(ey - eH * 0.6)}" r="${r1(eH * 0.32)}" fill="#fff" opacity=".9"/>`);
    L.push(`<path d="M${r1(ex - eW * 1.1)} ${r1(ey + 0.5)}Q${r1(ex)} ${r1(ey - eH * 2)} ${r1(ex + eW * 1.08)} ${r1(ey - 0.5)}" stroke="${ink}" stroke-width="${r1(2.2 * es)}" fill="none" stroke-linecap="round"/>`);
    L.push(`<path d="M${r1(ex - eW * 0.8)} ${r1(ey - eH * 2.2)}Q${r1(ex)} ${r1(ey - eH * 3.1)} ${r1(ex + eW * 0.85)} ${r1(ey - eH * 2.1)}" stroke="${darken(skin, 0.35)}" stroke-width="1.2" fill="none" opacity=".6"/>`);
  }
  if (sp.scar) L.push(`<path d="M${r1(cx - w * 0.62)} ${r1(cy - h * 0.38)}l${r1(w * 0.18)} ${r1(h * 0.62)}" stroke="${mix(skin, '#c05050', 0.5)}" stroke-width="2.4" stroke-linecap="round"/>`);
  // brows
  const browC = darken(sp.style === 'bald' && sp.beardCol ? sp.beardCol : hair, 0.25);
  for (const s of [-1, 1]) {
    const bx = cx + s * exo, by = eyY - eH * 3.2;
    const tilt = (sp.brow || 0) * 12;
    L.push(`<path d="M${r1(bx - s * eW * 1.15)} ${r1(by + tilt)}Q${r1(bx)} ${r1(by - 4)} ${r1(bx + s * eW * 1.2)} ${r1(by + 2 - tilt * 0.4)}" stroke="${browC}" stroke-width="${age > 0.8 ? 4.4 : 3.6}" fill="none" stroke-linecap="round"/>`);
  }
  // nose
  const ny = cy + h * 0.3;
  L.push(`<path d="M${r1(cx + 3)} ${r1(eyY)}C${r1(cx + 7)} ${r1(cy + h * 0.1)} ${r1(cx + 11)} ${r1(ny - 4)} ${r1(cx + 6)} ${r1(ny + 2)}" stroke="${darken(skin, 0.4)}" stroke-width="2.2" fill="none" opacity=".7" stroke-linecap="round"/>`);
  L.push(`<path d="M${r1(cx - 9)} ${r1(ny)}q4 5 9 3q5 2 9 -3" stroke="${darken(skin, 0.45)}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M${r1(cx - 2)} ${r1(eyY + 4)}L${r1(cx - 2)} ${r1(ny - 6)}" stroke="${key}" stroke-width="3" opacity=".35" stroke-linecap="round"/>`);

  // mouth
  const my = cy + h * 0.55, mw = w * 0.36;
  const lip = mix(skin, '#a04040', 0.35);
  const mo = sp.mouth;
  if (mo === 'grin' || mo === 'open' || mo === 'snarl') {
    const top = mo === 'snarl' ? my - 3 : my - 2, bot = mo === 'open' ? my + 12 : my + 8;
    L.push(P(`M${r1(cx - mw)} ${r1(top)}Q${r1(cx)} ${r1(top + (mo === 'snarl' ? -2 : 3))} ${r1(cx + mw)} ${r1(top)}Q${r1(cx)} ${r1(bot + 6)} ${r1(cx - mw)} ${r1(top)}Z`, '#3a1a16'));
    if (mo !== 'open') L.push(P(`M${r1(cx - mw * 0.86)} ${r1(top + 1)}Q${r1(cx)} ${r1(top + 4)} ${r1(cx + mw * 0.86)} ${r1(top + 1)}L${r1(cx + mw * 0.7)} ${r1(top + 6)}Q${r1(cx)} ${r1(top + 8)} ${r1(cx - mw * 0.7)} ${r1(top + 6)}Z`, '#f0e8da'));
    L.push(`<path d="M${r1(cx - mw - 2)} ${r1(top - 1)}Q${r1(cx)} ${r1(top + 3)} ${r1(cx + mw + 2)} ${r1(top - 1)}" stroke="${lip}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);
  } else {
    const curve = mo === 'smile' ? 5 : mo === 'smirk' ? 2 : 0.5;
    const sk = mo === 'smirk' ? 4 : 0;
    L.push(`<path d="M${r1(cx - mw)} ${r1(my - curve * 0.6 + sk * 0.5)}Q${r1(cx)} ${r1(my + curve)} ${r1(cx + mw)} ${r1(my - curve * 0.6 - sk)}" stroke="${darken(lip, 0.3)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
    L.push(`<path d="M${r1(cx - mw * 0.6)} ${r1(my + 5)}Q${r1(cx)} ${r1(my + 9)} ${r1(cx + mw * 0.6)} ${r1(my + 5)}" stroke="${lip}" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`);
  }
  if (sp.tusks) for (const s of [-1, 1]) L.push(P(`M${r1(cx + s * mw * 0.75)} ${r1(my + 2)}l${r1(s * 2)} -11l${r1(s * 4)} 10z`, '#f4eedc', ` stroke="${darken(skin, 0.4)}" stroke-width=".8"`));

  // beard & moustache
  L.push(beard(sp, cx, cy, w, h, my, mw, URL('bd'), bcol, R));

  // front hair
  L.push(frontHair(sp, cx, cy, w, h, hp, hair, R));

  // headgear
  L.push(headgear(sp, cx, cy, w, h, URL, R));

  // accessories in front
  L.push(accessories(sp, acc, cx, cy, w, h, URL, R));

  // frame vignette
  defs.push(`<radialGradient id="${ID('vg')}" cx=".5" cy=".45" r=".72"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>`);
  L.push(`<rect width="256" height="256" fill="${URL('vg')}"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${size}" height="${size}" class="wr-portrait" data-id="${id}"><defs>${defs.join('')}</defs><g${detail !== 'low' ? ` filter="${URL('pt')}"` : ''}>${L.join('')}</g></svg>`;
}

function clothing(sp, cx, bw, URL, R) {
  const B = sp.body, c2 = B.col2;
  let s = '';
  const neckV = `M${cx - 26} 190Q${cx} 222 ${cx + 26} 190`;
  switch (B.kind) {
    case 'apron': // tunic with apron dress, straps and oval brooches
      s += P(`M${cx - 30} 190Q${cx} 210 ${cx + 30} 190`, darken(B.col, 0.3));
      s += P(`M${r1(cx - 70 * bw)} 256L${r1(cx - 60 * bw)} 214Q${cx} 224 ${r1(cx + 60 * bw)} 214L${r1(cx + 70 * bw)} 256Z`, c2);
      s += `<path d="M${r1(cx - 60 * bw)} 214L${r1(cx - 52 * bw)} 194M${r1(cx + 60 * bw)} 214L${r1(cx + 52 * bw)} 194" stroke="${c2}" stroke-width="7"/>`;
      if (sp.style !== 'bald') for (const x of [cx - 52 * bw, cx + 52 * bw]) s += `<ellipse cx="${r1(x)}" cy="210" rx="11" ry="8" fill="${URL('gd')}" stroke="#5a3a10" stroke-width="1"/><path d="M${r1(x - 6)} 210h12M${r1(x)} 204v12" stroke="#7a5212" stroke-width="1.2"/>`;
      if (sp.style !== 'bald') { let b = ''; for (let i = 0; i <= 8; i++) { const t = i / 8, x = cx - 52 * bw + t * 104 * bw, y = 214 + Math.sin(t * Math.PI) * 14; b += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3" fill="${['#2a6aa8', '#e0901c', '#c8302a', '#e8e0c0'][i % 4]}"/>`; } s += b; }
      else s += P(`M${cx - 50} 256V214H${cx + 50}V256Z`, '#efe6d0');
      break;
    case 'pelt': { // bear pelt over the shoulders
      let d = `M${r1(cx - 124 * bw)} 256C${r1(cx - 118 * bw)} 200 ${r1(cx - 80 * bw)} 182 ${cx - 40} 184`;
      for (let i = 0; i <= 8; i++) d += `L${r1(cx - 40 + i * 10)} ${r1(184 + (i % 2 ? 14 : 4))}`;
      d += `C${r1(cx + 80 * bw)} 182 ${r1(cx + 118 * bw)} 200 ${r1(cx + 124 * bw)} 256Z`;
      s += P(d, '#5a3a22');
      let fur = '';
      for (let i = 0; i < 40; i++) { const x = cx - 110 + R() * 220, y = 196 + R() * 60; fur += `M${r1(x)} ${r1(y)}l${r1(-3 + R() * 6)} ${r1(6 + R() * 6)}`; }
      s += `<path d="${fur}" stroke="#8a6040" stroke-width="2" opacity=".7"/>`;
      for (const x of [cx - 50, cx + 50]) s += `<path d="M${x - 8} 236l3 10M${x} 236l1 11M${x + 8} 236l-1 10" stroke="#e8e0cc" stroke-width="2.4" stroke-linecap="round"/>`;
      break;
    }
    case 'fur': // mantle with a deep fur collar
      s += P(`M${r1(cx - 112 * bw)} 256C${r1(cx - 104 * bw)} 214 ${r1(cx - 70 * bw)} 198 ${cx - 30} 194L${cx} 256Z`, darken(B.col, 0.1));
      s += P(`M${r1(cx + 112 * bw)} 256C${r1(cx + 104 * bw)} 214 ${r1(cx + 70 * bw)} 198 ${cx + 30} 194L${cx} 256Z`, darken(B.col, 0.35));
      { let d = `M${r1(cx - 84 * bw)} 206`; for (let i = 0; i <= 14; i++) { const t = i / 14, x = cx - 84 * bw + t * 168 * bw, y = 196 + Math.sin(t * Math.PI) * 24; d += `Q${r1(x - 6)} ${r1(y - 12)} ${r1(x)} ${r1(y + (i % 2 ? 2 : -4))}`; } d += `L${r1(cx + 70 * bw)} 224Q${cx} 246 ${r1(cx - 70 * bw)} 224Z`; const fc = c2 === '#c9a04a' || c2 === '#e8c040' || c2 === '#e0901c' ? '#8a7258' : c2; s += P(d, fc);
        let f = ''; for (let i = 0; i < 34; i++) { const t = R(), x = cx - 80 * bw + t * 160 * bw, y = 198 + Math.sin(t * Math.PI) * 22 + R() * 10; f += `M${r1(x)} ${r1(y)}l${r1(-3 + R() * 6)} ${r1(5 + R() * 5)}`; }
        s += `<path d="${f}" stroke="${lighten(fc, 0.3)}" stroke-width="1.8" opacity=".6" stroke-linecap="round"/><path d="${f}" stroke="${darken(fc, 0.4)}" stroke-width="1.4" opacity=".4" transform="translate(2 2)"/>`; }
      break;
    case 'robe':
      s += P(`M${cx - 44} 188Q${cx} 236 ${cx + 44} 188L${cx + 54} 200Q${cx} 252 ${cx - 54} 200Z`, darken(B.col, 0.25));
      s += `<path d="M${cx} 230V256" stroke="${darken(B.col, 0.4)}" stroke-width="2"/>`;
      break;
    case 'mail': {
      let d = '';
      for (let y = 196; y < 256; y += 6) for (let x = cx - 110; x < cx + 110; x += 6) d += `M${x + ((y / 6) % 2) * 3} ${y}h0`;
      s += `<path d="${d}" stroke="#3a3e44" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
      s += `<path d="M${cx - 90} 256L${cx + 40} 196" stroke="${c2}" stroke-width="10"/><circle cx="${cx + 20}" cy="219" r="4" fill="#9aa2aa"/>`;
      s += P(neckV, '#3a3e44');
      break;
    }
    case 'leather':
      s += P(`M${cx - 52} 256V206Q${cx} 196 ${cx + 52} 206V256Z`, c2);
      s += `<path d="M${cx - 52} 206L${cx - 40} 190M${cx + 52} 206L${cx + 40} 190" stroke="${c2}" stroke-width="6"/>`;
      s += P(neckV, darken(B.col, 0.35));
      break;
    case 'byz': // rich robe with jewelled collar band
      s += P(`M${cx - 62} 196Q${cx} 236 ${cx + 62} 196L${cx + 70} 214Q${cx} 256 ${cx - 70} 214Z`, URL('gd'));
      { let j = ''; for (let i = 0; i < 9; i++) { const t = i / 8, x = cx - 62 + t * 124, y = 205 + Math.sin(t * Math.PI) * 26; j += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.2" fill="${i % 2 ? '#c02a3a' : '#2a6ac0'}"/>`; } s += j; }
      s += `<path d="M${cx - 8} 236v20M${cx + 8} 236v20" stroke="${c2}" stroke-width="5"/>`;
      break;
    case 'cloak':
    default:
      s += P(neckV, darken(B.col, 0.4));
      if (B.kind === 'cloak') {
        s += P(`M${r1(cx - 118 * bw)} 256C${r1(cx - 110 * bw)} 212 ${r1(cx - 76 * bw)} 196 ${cx - 34} 192Q${cx - 50} 226 ${cx - 40} 256Z`, darken(sp.body.col2 === '#c9a04a' || sp.body.col2 === '#d4b040' || sp.body.col2 === '#c99a2e' || sp.body.col2 === '#d4a830' || sp.body.col2 === '#c8a030' ? sp.body.col : sp.body.col2, 0.1));
        s += P(`M${r1(cx + 118 * bw)} 256C${r1(cx + 110 * bw)} 212 ${r1(cx + 76 * bw)} 196 ${cx + 34} 192Q${cx + 50} 226 ${cx + 40} 256Z`, darken(sp.body.col2 === '#c9a04a' || sp.body.col2 === '#d4b040' || sp.body.col2 === '#c99a2e' || sp.body.col2 === '#d4a830' || sp.body.col2 === '#c8a030' ? sp.body.col : sp.body.col2, 0.4));
        s += `<path d="M${cx - 36} 196Q${cx - 50} 226 ${cx - 40} 256M${cx + 36} 196Q${cx + 50} 226 ${cx + 40} 256" stroke="${c2}" stroke-width="3" fill="none" opacity=".8"/>`;
      } else s += `<path d="M${cx - 26} 190Q${cx} 222 ${cx + 26} 190" stroke="${c2}" stroke-width="4" fill="none"/>`;
  }
  return s;
}

function beard(sp, cx, cy, w, h, my, mw, fill, col, R) {
  const b = sp.beard;
  if (!b || b === 'none') return '';
  const dk = darken(col, 0.35);
  let s = '';
  const strands = (x0, x1, y0, y1, n) => { let d = ''; for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); d += `M${r1(x)} ${r1(y)}q${r1(-2 + R() * 4)} ${r1(6 + R() * 6)} ${r1(-1 + R() * 2)} ${r1(10 + R() * 8)}`; } return `<path d="${d}" stroke="${dk}" stroke-width="1.4" fill="none" opacity=".55"/><path d="${d}" stroke="${lighten(col, 0.3)}" stroke-width=".9" fill="none" opacity=".35" transform="translate(1.5 0)"/>`; };
  if (b === 'stubble') {
    let d = '';
    for (let i = 0; i < 90; i++) { const a = R() * Math.PI, rr = 0.6 + R() * 0.45; const x = cx + Math.cos(a) * w * 0.85 * rr, y = cy + h * 0.25 + Math.sin(a) * h * 0.7 * rr; d += `M${r1(x)} ${r1(y)}h.1`; }
    return `<path d="${d}" stroke="${col}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>`;
  }
  if (b === 'mustache' || b === 'longmust' || b === 'trim' || b === 'goatee' || b === 'short' || b === 'full' || b === 'long' || b === 'braided' || b === 'huge') {
    let len = { trim: 0.08, goatee: 0.2, short: 0.16, full: 0.32, long: 0.75, braided: 0.95, huge: 0.6, mustache: 0, longmust: 0 }[b];
    const wid = b === 'huge' ? 1.2 : b === 'goatee' ? 0.32 : 1.0;
    if (b !== 'mustache' && b !== 'longmust') {
      const bot = cy + h * (1.02 + len);
      let d;
      if (b === 'goatee') d = `M${r1(cx - w * 0.3)} ${r1(my + 4)}Q${r1(cx)} ${r1(my + 10)} ${r1(cx + w * 0.3)} ${r1(my + 4)}L${r1(cx + w * 0.16)} ${r1(bot)}Q${r1(cx)} ${r1(bot + 8)} ${r1(cx - w * 0.16)} ${r1(bot)}Z`;
      else {
        d = `M${r1(cx - w * 0.98 * wid)} ${r1(cy - h * 0.02)}C${r1(cx - w * 1.04 * wid)} ${r1(cy + h * 0.6)} ${r1(cx - w * 0.7 * wid)} ${r1(bot - h * 0.2)} ${r1(cx - w * 0.3)} ${r1(bot)}`;
        if (b === 'huge') { for (let i = 0; i < 6; i++) d += `l${r1(w * 0.1)} ${r1(i % 2 ? -10 : 8)}`; }
        d += `Q${r1(cx)} ${r1(bot + 8)} ${r1(cx + w * 0.3)} ${r1(bot)}C${r1(cx + w * 0.7 * wid)} ${r1(bot - h * 0.2)} ${r1(cx + w * 1.04 * wid)} ${r1(cy + h * 0.6)} ${r1(cx + w * 0.98 * wid)} ${r1(cy - h * 0.02)}`;
        // inner edge around the mouth and cheeks
        d += `C${r1(cx + w * 0.8)} ${r1(cy + h * 0.3)} ${r1(cx + mw * 1.3)} ${r1(my - 8)} ${r1(cx + mw * 0.6)} ${r1(my + 7)}Q${r1(cx)} ${r1(my + 13)} ${r1(cx - mw * 0.6)} ${r1(my + 7)}C${r1(cx - mw * 1.3)} ${r1(my - 8)} ${r1(cx - w * 0.8)} ${r1(cy + h * 0.3)} ${r1(cx - w * 0.98 * wid)} ${r1(cy - h * 0.02)}Z`;
      }
      s += P(d, fill);
      s += strands(cx - w * 0.8 * wid, cx + w * 0.8 * wid, my, bot - 12, b === 'huge' ? 40 : 24);
      if (b === 'braided') {
        s += P(`M${r1(cx - 9)} ${r1(bot - 10)}h18l-3 ${r1(54)}h-12z`, fill);
        let bd = '';
        for (let y = bot - 6; y < bot + 40; y += 8) bd += `M${r1(cx - 8)} ${r1(y)}l8 6l8 -6`;
        s += `<path d="${bd}" stroke="${dk}" stroke-width="1.6" fill="none"/><rect x="${r1(cx - 8)}" y="${r1(bot + 42)}" width="16" height="6" rx="2" fill="#c9a04a"/>`;
      }
    }
    // moustache
    const mlen = b === 'longmust' ? 1 : 0;
    s += P(`M${r1(cx)} ${r1(my - 9)}C${r1(cx + mw * 0.6)} ${r1(my - 12)} ${r1(cx + mw * 1.3)} ${r1(my - 6)} ${r1(cx + mw * 1.35 + mlen * 6)} ${r1(my + 3 + mlen * 22)}C${r1(cx + mw * 1.0)} ${r1(my - 1 + mlen * 6)} ${r1(cx + mw * 0.5)} ${r1(my - 3)} ${r1(cx)} ${r1(my - 4)}C${r1(cx - mw * 0.5)} ${r1(my - 3)} ${r1(cx - mw * 1.0)} ${r1(my - 1 + mlen * 6)} ${r1(cx - mw * 1.35 - mlen * 6)} ${r1(my + 3 + mlen * 22)}C${r1(cx - mw * 1.3)} ${r1(my - 6)} ${r1(cx - mw * 0.6)} ${r1(my - 12)} ${r1(cx)} ${r1(my - 9)}Z`, fill);
  }
  return s;
}

function frontHair(sp, cx, cy, w, h, fill, col, R) {
  const st = sp.style;
  const top = cy - h;
  let s = '';
  const dk = darken(col, 0.35);
  if (st === 'none' || (sp.head === 'helm') || (sp.head === 'bear') || (sp.head === 'scarf')) return '';
  if (st === 'bald') {
    s += P(`M${r1(cx - w * 1.0)} ${r1(cy - h * 0.1)}Q${r1(cx - w * 1.06)} ${r1(cy - h * 0.5)} ${r1(cx - w * 0.82)} ${r1(cy - h * 0.6)}L${r1(cx - w * 0.9)} ${r1(cy - h * 0.05)}Z`, fill);
    s += P(`M${r1(cx + w * 1.0)} ${r1(cy - h * 0.1)}Q${r1(cx + w * 1.06)} ${r1(cy - h * 0.5)} ${r1(cx + w * 0.82)} ${r1(cy - h * 0.6)}L${r1(cx + w * 0.9)} ${r1(cy - h * 0.05)}Z`, fill);
    s += `<ellipse cx="${r1(cx - w * 0.3)}" cy="${r1(cy - h * 0.82)}" rx="${r1(w * 0.3)}" ry="${r1(h * 0.1)}" fill="#fff" opacity=".22"/>`;
    return s;
  }
  if (st === 'tonsure') {
    s += P(`M${r1(cx - w * 1.04)} ${r1(cy - h * 0.05)}C${r1(cx - w * 1.1)} ${r1(cy - h * 0.6)} ${r1(cx - w * 0.6)} ${r1(top - 2)} ${r1(cx)} ${r1(top - 2)}C${r1(cx + w * 0.6)} ${r1(top - 2)} ${r1(cx + w * 1.1)} ${r1(cy - h * 0.6)} ${r1(cx + w * 1.04)} ${r1(cy - h * 0.05)}L${r1(cx + w * 0.9)} ${r1(cy - h * 0.2)}Q${r1(cx + w * 0.8)} ${r1(cy - h * 0.62)} ${r1(cx)} ${r1(cy - h * 0.66)}Q${r1(cx - w * 0.8)} ${r1(cy - h * 0.62)} ${r1(cx - w * 0.9)} ${r1(cy - h * 0.2)}Z`, fill);
    s += `<ellipse cx="${r1(cx)}" cy="${r1(top + 8)}" rx="${r1(w * 0.55)}" ry="${r1(h * 0.14)}" fill="${sp.skin}"/>`;
    return s;
  }
  if (sp.head === 'hood' && !sp.hoodDown) {
    // only a fringe shows inside the hood
    s += P(`M${r1(cx - w * 0.95)} ${r1(cy - h * 0.35)}C${r1(cx - w * 0.8)} ${r1(top - 2)} ${r1(cx + w * 0.8)} ${r1(top - 2)} ${r1(cx + w * 0.95)} ${r1(cy - h * 0.35)}Q${r1(cx + w * 0.4)} ${r1(cy - h * 0.62)} ${r1(cx - w * 0.1)} ${r1(cy - h * 0.55)}Q${r1(cx - w * 0.6)} ${r1(cy - h * 0.5)} ${r1(cx - w * 0.95)} ${r1(cy - h * 0.35)}Z`, fill);
    if (sp.style === 'long') for (const s2 of [-1, 1]) s += P(`M${r1(cx + s2 * w * 0.98)} ${r1(cy - h * 0.4)}Q${r1(cx + s2 * w * 1.12)} ${r1(cy + h * 0.4)} ${r1(cx + s2 * w * 0.86)} ${r1(cy + h * 1.1)}L${r1(cx + s2 * w * 0.74)} ${r1(cy + h * 0.6)}Q${r1(cx + s2 * w * 0.9)} ${r1(cy)} ${r1(cx + s2 * w * 0.86)} ${r1(cy - h * 0.4)}Z`, fill);
    return s;
  }
  // cap of hair over the skull
  let cap = `M${r1(cx - w * 1.04)} ${r1(cy - h * 0.05)}C${r1(cx - w * 1.12)} ${r1(cy - h * 0.7)} ${r1(cx - w * 0.6)} ${r1(top - 8)} ${r1(cx)} ${r1(top - 8)}C${r1(cx + w * 0.6)} ${r1(top - 8)} ${r1(cx + w * 1.12)} ${r1(cy - h * 0.7)} ${r1(cx + w * 1.04)} ${r1(cy - h * 0.05)}`;
  if (st === 'spiky') {
    cap = `M${r1(cx - w * 1.02)} ${r1(cy - h * 0.15)}L${r1(cx - w * 1.2)} ${r1(cy - h * 0.62)}L${r1(cx - w * 0.85)} ${r1(cy - h * 0.72)}L${r1(cx - w * 0.9)} ${r1(top - 18)}L${r1(cx - w * 0.45)} ${r1(top - 6)}L${r1(cx - w * 0.3)} ${r1(top - 28)}L${r1(cx)} ${r1(top - 8)}L${r1(cx + w * 0.3)} ${r1(top - 30)}L${r1(cx + w * 0.45)} ${r1(top - 6)}L${r1(cx + w * 0.95)} ${r1(top - 20)}L${r1(cx + w * 0.88)} ${r1(cy - h * 0.7)}L${r1(cx + w * 1.22)} ${r1(cy - h * 0.6)}L${r1(cx + w * 1.02)} ${r1(cy - h * 0.15)}`;
  }
  if (st === 'curly' || st === 'wild') {
    cap = `M${r1(cx - w * 1.06)} ${r1(cy - h * 0.05)}`;
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; const x = cx + Math.cos(a) * w * 1.1, y = cy - h * 0.25 + Math.sin(a) * h * 0.95; cap += `Q${r1(x + Math.cos(a) * 9)} ${r1(y + Math.sin(a) * 9)} ${r1(x)} ${r1(y)}`; }
  }
  // fringe line
  const fringe = st === 'braid' || st === 'bun'
    ? `Q${r1(cx + w * 0.6)} ${r1(cy - h * 0.55)} ${r1(cx + w * 0.05)} ${r1(cy - h * 0.66)}Q${r1(cx - w * 0.6)} ${r1(cy - h * 0.55)} ${r1(cx - w * 1.04)} ${r1(cy - h * 0.05)}Z`
    : st === 'long' ? `Q${r1(cx + w * 0.7)} ${r1(cy - h * 0.5)} ${r1(cx + w * 0.1)} ${r1(cy - h * 0.62)}Q${r1(cx - w * 0.3)} ${r1(cy - h * 0.45)} ${r1(cx - w * 0.75)} ${r1(cy - h * 0.5)}Q${r1(cx - w * 0.95)} ${r1(cy - h * 0.3)} ${r1(cx - w * 1.04)} ${r1(cy - h * 0.05)}Z`
    : `L${r1(cx + w * 0.9)} ${r1(cy - h * 0.3)}Q${r1(cx + w * 0.75)} ${r1(cy - h * 0.62)} ${r1(cx + w * 0.3)} ${r1(cy - h * 0.62)}L${r1(cx + w * 0.15)} ${r1(cy - h * 0.52)}L${r1(cx - w * 0.05)} ${r1(cy - h * 0.64)}L${r1(cx - w * 0.3)} ${r1(cy - h * 0.55)}Q${r1(cx - w * 0.8)} ${r1(cy - h * 0.6)} ${r1(cx - w * 0.9)} ${r1(cy - h * 0.3)}Z`;
  s += P(cap + fringe, fill);
  // strands
  let d = '';
  for (let i = 0; i < 9; i++) { const a = Math.PI * (1.1 + i * 0.09); d += `M${r1(cx + Math.cos(a) * w * 0.3)} ${r1(top - 2)}Q${r1(cx + Math.cos(a) * w * 0.9)} ${r1(cy - h * 0.8)} ${r1(cx + Math.cos(a) * w * 1.02)} ${r1(cy - h * 0.25)}`; }
  s += `<path d="${d}" stroke="${dk}" stroke-width="1.3" fill="none" opacity=".45"/>`;
  s += `<path d="M${r1(cx - w * 0.7)} ${r1(top + 4)}Q${r1(cx - w * 0.2)} ${r1(top - 8)} ${r1(cx + w * 0.2)} ${r1(top - 4)}" stroke="${lighten(col, 0.45)}" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>`;
  if (st === 'long' || st === 'wild') for (const s2 of [-1, 1]) s += P(`M${r1(cx + s2 * w * 1.04)} ${r1(cy - h * 0.2)}Q${r1(cx + s2 * w * 1.2)} ${r1(cy + h * 0.5)} ${r1(cx + s2 * w * 1.1)} ${r1(cy + h * 1.4)}L${r1(cx + s2 * w * 0.86)} ${r1(cy + h * 0.6)}Q${r1(cx + s2 * w * 0.96)} ${r1(cy)} ${r1(cx + s2 * w * 0.9)} ${r1(cy - h * 0.2)}Z`, fill);
  if (st === 'braid') { // thick braid over the left shoulder
    let b = '';
    for (let i = 0; i < 9; i++) {
      const x = cx - w * 0.95 - 4 + i * 2, y = cy + h * 0.06 + i * 11.5, sd = i % 2 ? 1 : -1, wd = 12.5 - i * 0.45;
      // plaited lobes alternate left and right
      b += `<path d="M${r1(x - sd * wd * 0.8)} ${r1(y - 7)}Q${r1(x + sd * wd * 1.15)} ${r1(y - 7)} ${r1(x + sd * wd * 0.8)} ${r1(y + 9)}Q${r1(x - sd * wd * 0.2)} ${r1(y + 8)} ${r1(x - sd * wd * 0.8)} ${r1(y - 7)}Z" fill="${fill}" stroke="${dk}" stroke-width="1.1"/>`;
      b += `<path d="M${r1(x - sd * wd * 0.4)} ${r1(y - 3)}q${r1(sd * wd * 0.6)} 1 ${r1(sd * wd * 0.9)} 6" stroke="${lighten(col, 0.35)}" stroke-width="1.4" fill="none" opacity=".5"/>`;
    }
    s += b + `<rect x="${r1(cx - w * 0.95 + 6)}" y="${r1(cy + h * 0.1 + 100)}" width="12" height="6" rx="2" fill="#c9a04a"/><path d="M${r1(cx - w * 0.95 + 8)} ${r1(cy + h * 0.1 + 106)}l-3 14M${r1(cx - w * 0.95 + 12)} ${r1(cy + h * 0.1 + 106)}l0 16M${r1(cx - w * 0.95 + 16)} ${r1(cy + h * 0.1 + 106)}l3 13" stroke="${fill}" stroke-width="3"/>`;
  }
  if (st === 'bun') s += `<circle cx="${r1(cx + w * 0.2)}" cy="${r1(top - 10)}" r="16" fill="${fill}"/>`;
  return s;
}

function headgear(sp, cx, cy, w, h, URL, R) {
  const top = cy - h;
  const hc = sp.headCol || '#5b3a22';
  let s = '';
  switch (sp.head) {
    case 'hood':
      if (sp.hoodDown) { s += P(`M${cx - 70} 200Q${cx - 60} 170 ${cx - 40} 180Q${cx} 196 ${cx + 40} 180Q${cx + 60} 170 ${cx + 70} 200Q${cx} 226 ${cx - 70} 200Z`, hc); break; }
      s += P(`M${r1(cx - w - 22)} 230C${r1(cx - w - 24)} 150 ${r1(cx - w - 14)} ${r1(top - 22)} ${cx} ${r1(top - 24)}C${r1(cx + w + 14)} ${r1(top - 22)} ${r1(cx + w + 24)} 150 ${r1(cx + w + 22)} 230L${r1(cx + w + 6)} 230C${r1(cx + w + 8)} 150 ${r1(cx + w * 0.9)} ${r1(top - 2)} ${cx} ${r1(top - 6)}C${r1(cx - w * 0.9)} ${r1(top - 2)} ${r1(cx - w - 8)} 150 ${r1(cx - w - 6)} 230Z`, URL('hd'));
      s = `<defs><linearGradient id="${URL('hd').slice(5, -1)}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lighten(hc, 0.2)}"/><stop offset=".6" stop-color="${hc}"/><stop offset="1" stop-color="${darken(hc, 0.45)}"/></linearGradient></defs>` + s;
      s += `<path d="M${r1(cx - w - 6)} 230C${r1(cx - w - 8)} 150 ${r1(cx - w * 0.9)} ${r1(top - 2)} ${cx} ${r1(top - 6)}C${r1(cx + w * 0.9)} ${r1(top - 2)} ${r1(cx + w + 8)} 150 ${r1(cx + w + 6)} 230" stroke="${darken(hc, 0.5)}" stroke-width="2" fill="none" opacity=".6"/>`;
      if (sp.body.kind === 'fur' && sp.headCol === '#1a2238') { // volva's catskin trim
        let d = ''; for (let i = 0; i < 26; i++) { const t = i / 25, a = Math.PI * (1 + t); d += `M${r1(cx + Math.cos(a) * (w + 8))} ${r1(cy - 10 + Math.sin(a) * (h + 6))}l${r1(Math.cos(a) * 6)} ${r1(Math.sin(a) * 6)}`; }
        s += `<path d="${d}" stroke="#e8e0d0" stroke-width="4" stroke-linecap="round"/>`;
      }
      break;
    case 'helm': {
      s += P(`M${r1(cx - w * 1.08)} ${r1(cy - h * 0.3)}C${r1(cx - w * 1.1)} ${r1(top - 30)} ${r1(cx + w * 1.1)} ${r1(top - 30)} ${r1(cx + w * 1.08)} ${r1(cy - h * 0.3)}Z`, URL('mt'));
      s += `<path d="M${r1(cx - w * 1.1)} ${r1(cy - h * 0.32)}H${r1(cx + w * 1.1)}" stroke="#5a5048" stroke-width="7"/><path d="M${cx} ${r1(top - 26)}V${r1(cy - h * 0.3)}" stroke="#5a5048" stroke-width="5"/>`;
      s += P(`M${r1(cx - 5)} ${r1(cy - h * 0.34)}h10l-1 ${r1(h * 0.55)}h-8z`, URL('mt'));
      for (let i = -3; i <= 3; i++) s += `<circle cx="${r1(cx + i * w * 0.3)}" cy="${r1(cy - h * 0.32)}" r="1.8" fill="#d8d0c0"/>`;
      // spectacle guard edges around the eyes
      s += `<path d="M${r1(cx - w * 0.85)} ${r1(cy - h * 0.3)}q${r1(w * 0.35)} ${r1(h * 0.34)} ${r1(w * 0.8)} 0M${r1(cx + w * 0.05)} ${r1(cy - h * 0.3)}q${r1(w * 0.4)} ${r1(h * 0.34)} ${r1(w * 0.8)} 0" stroke="#4a4440" stroke-width="3.5" fill="none"/>`;
      break;
    }
    case 'bear': {
      // bear's head worn as a hood: dome, ears, snout over the brow
      s += P(`M${r1(cx - w * 1.25)} ${r1(cy - h * 0.15)}C${r1(cx - w * 1.4)} ${r1(top - 40)} ${r1(cx + w * 1.4)} ${r1(top - 40)} ${r1(cx + w * 1.25)} ${r1(cy - h * 0.15)}Q${r1(cx)} ${r1(cy - h * 0.62)} ${r1(cx - w * 1.25)} ${r1(cy - h * 0.15)}Z`, '#5a3a22');
      for (const s2 of [-1, 1]) s += `<circle cx="${r1(cx + s2 * w * 0.9)}" cy="${r1(top - 18)}" r="13" fill="#4a3020"/><circle cx="${r1(cx + s2 * w * 0.9)}" cy="${r1(top - 18)}" r="6" fill="#2a1a10"/>`;
      s += P(`M${r1(cx - w * 0.5)} ${r1(cy - h * 0.5)}Q${r1(cx)} ${r1(cy - h * 0.35)} ${r1(cx + w * 0.5)} ${r1(cy - h * 0.5)}L${r1(cx + w * 0.3)} ${r1(top - 16)}Q${cx} ${r1(top - 24)} ${r1(cx - w * 0.3)} ${r1(top - 16)}Z`, '#6a4a2e');
      s += `<ellipse cx="${cx}" cy="${r1(cy - h * 0.52)}" rx="10" ry="6" fill="#1a120c"/><circle cx="${r1(cx - w * 0.38)}" cy="${r1(top - 6)}" r="3" fill="#e8c060"/><circle cx="${r1(cx + w * 0.38)}" cy="${r1(top - 6)}" r="3" fill="#e8c060"/>`;
      let fur = ''; for (let i = 0; i < 30; i++) { const a = Math.PI * (1.05 + R() * 0.9), rr = w * (1.0 + R() * 0.3); fur += `M${r1(cx + Math.cos(a) * rr)} ${r1(cy - h * 0.3 + Math.sin(a) * rr * 1.15)}l${r1(Math.cos(a) * 6)} ${r1(Math.sin(a) * 6)}`; }
      s += `<path d="${fur}" stroke="#8a6040" stroke-width="2" opacity=".7"/>`;
      // pelt sides down past the cheeks
      for (const s2 of [-1, 1]) s += P(`M${r1(cx + s2 * w * 1.25)} ${r1(cy - h * 0.2)}Q${r1(cx + s2 * w * 1.45)} ${r1(cy + h * 0.6)} ${r1(cx + s2 * w * 1.6)} 200L${r1(cx + s2 * w * 1.05)} 196Q${r1(cx + s2 * w * 1.1)} ${r1(cy + h * 0.3)} ${r1(cx + s2 * w * 1.02)} ${r1(cy - h * 0.1)}Z`, s2 > 0 ? '#3e2818' : '#5a3a22');
      break;
    }
    case 'furhat': {
      s += P(`M${r1(cx - w * 0.85)} ${r1(cy - h * 0.62)}C${r1(cx - w * 0.9)} ${r1(top - 44)} ${r1(cx + w * 0.9)} ${r1(top - 44)} ${r1(cx + w * 0.85)} ${r1(cy - h * 0.62)}Z`, hc);
      s += `<path d="M${r1(cx - w * 0.2)} ${r1(top - 30)}q${r1(w * 0.3)} -10 ${r1(w * 0.5)} 4" stroke="#fff" stroke-width="4" opacity=".25" fill="none"/>`;
      let d = `M${r1(cx - w * 1.12)} ${r1(cy - h * 0.48)}`;
      for (let i = 0; i <= 14; i++) { const t = i / 14, x = cx - w * 1.12 + t * w * 2.24, y = cy - h * 0.66 - Math.sin(t * Math.PI) * 10; d += `Q${r1(x - 4)} ${r1(y - 9)} ${r1(x)} ${r1(y)}`; }
      d += `L${r1(cx + w * 1.12)} ${r1(cy - h * 0.48)}Q${cx} ${r1(cy - h * 0.62)} ${r1(cx - w * 1.12)} ${r1(cy - h * 0.48)}Z`;
      s += P(d, '#7a6a58');
      let f = ''; for (let i = 0; i < 24; i++) { const x = cx - w + R() * w * 2; f += `M${r1(x)} ${r1(cy - h * 0.7 + R() * 10)}l${r1(-2 + R() * 4)} ${r1(5 + R() * 4)}`; }
      s += `<path d="${f}" stroke="#a8967e" stroke-width="2" opacity=".7"/>`;
      break;
    }
    case 'circlet':
      s += `<path d="M${r1(cx - w * 1.02)} ${r1(cy - h * 0.48)}Q${cx} ${r1(cy - h * 0.66)} ${r1(cx + w * 1.02)} ${r1(cy - h * 0.48)}" stroke="${URL('gd')}" stroke-width="6" fill="none"/><circle cx="${cx}" cy="${r1(cy - h * 0.6)}" r="4.5" fill="#c02a3a" stroke="#7a5212" stroke-width="1.2"/>`;
      break;
    case 'byzhat':
      s += P(`M${r1(cx - w * 0.92)} ${r1(cy - h * 0.55)}C${r1(cx - w * 0.95)} ${r1(top - 50)} ${r1(cx + w * 0.95)} ${r1(top - 50)} ${r1(cx + w * 0.92)} ${r1(cy - h * 0.55)}Z`, hc);
      s += P(`M${r1(cx + w * 0.2)} ${r1(top - 34)}C${r1(cx + w * 0.8)} ${r1(top - 30)} ${r1(cx + w * 0.95)} ${r1(cy - h * 0.8)} ${r1(cx + w * 0.92)} ${r1(cy - h * 0.55)}H${r1(cx + w * 0.4)}Z`, '#000', ' opacity=".2"');
      s += `<path d="M${r1(cx - w * 0.94)} ${r1(cy - h * 0.6)}Q${cx} ${r1(cy - h * 0.74)} ${r1(cx + w * 0.94)} ${r1(cy - h * 0.6)}" stroke="${URL('gd')}" stroke-width="7" fill="none"/>`;
      for (let i = -2; i <= 2; i++) s += `<circle cx="${r1(cx + i * w * 0.36)}" cy="${r1(cy - h * 0.66 + Math.abs(i) * 2)}" r="2.4" fill="${i % 2 ? '#c02a3a' : '#2a6ac0'}"/>`;
      break;
    case 'cap':
      s += P(`M${r1(cx - w * 1.06)} ${r1(cy - h * 0.42)}C${r1(cx - w * 1.1)} ${r1(top - 20)} ${r1(cx + w * 0.4)} ${r1(top - 34)} ${r1(cx + w * 0.9)} ${r1(top - 16)}C${r1(cx + w * 1.3)} ${r1(top - 4)} ${r1(cx + w * 1.12)} ${r1(cy - h * 0.6)} ${r1(cx + w * 1.06)} ${r1(cy - h * 0.42)}Q${cx} ${r1(cy - h * 0.6)} ${r1(cx - w * 1.06)} ${r1(cy - h * 0.42)}Z`, hc);
      s += `<path d="M${r1(cx - w * 1.08)} ${r1(cy - h * 0.42)}Q${cx} ${r1(cy - h * 0.62)} ${r1(cx + w * 1.08)} ${r1(cy - h * 0.42)}" stroke="${darken(hc, 0.35)}" stroke-width="6" fill="none"/>`;
      s += `<path d="M${r1(cx - w * 0.5)} ${r1(top - 14)}q${r1(w * 0.4)} -14 ${r1(w * 0.9)} -4" stroke="#fff" stroke-width="5" opacity=".18" fill="none"/>`;
      break;
    case 'headband':
      s += `<path d="M${r1(cx - w * 1.04)} ${r1(cy - h * 0.45)}Q${cx} ${r1(cy - h * 0.62)} ${r1(cx + w * 1.04)} ${r1(cy - h * 0.45)}" stroke="${hc}" stroke-width="7" fill="none"/><path d="M${r1(cx + w * 1.0)} ${r1(cy - h * 0.46)}l10 16M${r1(cx + w * 1.0)} ${r1(cy - h * 0.46)}l14 10" stroke="${hc}" stroke-width="4"/>`;
      break;
    case 'scarf':
      // headcloth: framing the face, falling to the shoulders, with a coloured band at the brow
      s += P(`M${r1(cx - w * 1.22)} 206C${r1(cx - w * 1.3)} 120 ${r1(cx - w * 1.2)} ${r1(top - 34)} ${cx} ${r1(top - 34)}C${r1(cx + w * 1.2)} ${r1(top - 34)} ${r1(cx + w * 1.3)} 120 ${r1(cx + w * 1.22)} 206L${r1(cx + w * 0.82)} 200C${r1(cx + w * 1.02)} ${r1(cy + h * 0.4)} ${r1(cx + w * 1.02)} ${r1(top - 10)} ${cx} ${r1(top - 12)}C${r1(cx - w * 1.02)} ${r1(top - 10)} ${r1(cx - w * 1.02)} ${r1(cy + h * 0.4)} ${r1(cx - w * 0.82)} 200Z`, URL('sf'));
      s = `<defs><linearGradient id="${URL('sf').slice(5, -1)}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lighten(hc, 0.1)}"/><stop offset=".55" stop-color="${hc}"/><stop offset="1" stop-color="${darken(hc, 0.35)}"/></linearGradient></defs>` + s;
      s += `<path d="M${r1(cx - w * 0.98)} ${r1(top + 10)}C${r1(cx - w * 0.9)} ${r1(top - 14)} ${r1(cx + w * 0.9)} ${r1(top - 14)} ${r1(cx + w * 0.98)} ${r1(top + 10)}" stroke="${sp.body.col}" stroke-width="5" fill="none"/>`;
      s += `<path d="M${r1(cx - w * 0.9)} ${r1(top - 22)}Q${r1(cx - w * 0.3)} ${r1(top - 34)} ${r1(cx + w * 0.2)} ${r1(top - 30)}" stroke="#fff" stroke-width="4" fill="none" opacity=".3"/>`;
      s += `<path d="M${r1(cx - w * 1.1)} 150q-4 30 2 52M${r1(cx + w * 1.12)} 150q4 30 -2 52" stroke="${darken(hc, 0.3)}" stroke-width="1.6" fill="none" opacity=".6"/>`;
      break;
    case 'flowers': {
      const cols = ['#f0e070', '#e87aa0', '#ffffff', '#9ac0f0', '#f09a40'];
      for (let i = 0; i < 9; i++) {
        const t = i / 8, a = Math.PI * (1.08 + t * 0.84), x = cx + Math.cos(a) * w * 1.02, y = cy - h * 0.3 + Math.sin(a) * h * 0.86;
        const col = cols[i % cols.length];
        let pet = '';
        for (let k = 0; k < 5; k++) { const b = k / 5 * Math.PI * 2; pet += `<circle cx="${r1(x + Math.cos(b) * 4.6)}" cy="${r1(y + Math.sin(b) * 4.6)}" r="3.6"/>`; }
        s += `<g fill="${col}">${pet}</g><circle cx="${r1(x)}" cy="${r1(y)}" r="2.6" fill="#d8901a"/>`;
        if (i % 2) s += `<path d="M${r1(x + 4)} ${r1(y + 4)}l7 3" stroke="#4a7a2a" stroke-width="3" stroke-linecap="round"/>`;
      }
      break;
    }
  }
  return s;
}

function accessories(sp, acc, cx, cy, w, h, URL, R) {
  let s = '';
  if (acc.has('feather')) s += `<path d="M${r1(cx + w * 0.9)} ${r1(cy - h * 0.55)}C${r1(cx + w * 1.4)} ${r1(cy - h * 1.2)} ${r1(cx + w * 1.6)} ${r1(cy - h * 1.6)} ${r1(cx + w * 1.4)} ${r1(cy - h * 2.0)}C${r1(cx + w * 1.15)} ${r1(cy - h * 1.6)} ${r1(cx + w * 1.0)} ${r1(cy - h * 1.1)} ${r1(cx + w * 0.9)} ${r1(cy - h * 0.55)}Z" fill="#14121c"/><path d="M${r1(cx + w * 0.92)} ${r1(cy - h * 0.6)}Q${r1(cx + w * 1.3)} ${r1(cy - h * 1.3)} ${r1(cx + w * 1.4)} ${r1(cy - h * 1.95)}" stroke="#5a6aa8" stroke-width="1.6" fill="none" opacity=".8"/>`;
  if (acc.has('torc')) s += `<path d="M${cx - 30} 194Q${cx} 214 ${cx + 30} 194" stroke="${URL('gd')}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="${cx - 30}" cy="194" r="5" fill="#d8a838"/><circle cx="${cx + 30}" cy="194" r="5" fill="#d8a838"/>`;
  if (acc.has('brooch')) s += `<circle cx="${cx + 52}" cy="212" r="10" fill="none" stroke="${URL('gd')}" stroke-width="4"/><path d="M${cx + 36} 222L${cx + 68} 202" stroke="#d8a838" stroke-width="2.4"/>`;
  if (acc.has('chain')) { let d = ''; for (let i = 0; i <= 12; i++) { const t = i / 12, x = cx - 50 + t * 100, y = 204 + Math.sin(t * Math.PI) * 30; d += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.4" fill="none" stroke="#d8a838" stroke-width="2"/>`; } s += d + `<circle cx="${cx}" cy="238" r="9" fill="${URL('gd')}"/>`; }
  if (acc.has('beads')) { let d = ''; for (let i = 0; i <= 10; i++) { const t = i / 10, x = cx - 34 + t * 68, y = 196 + Math.sin(t * Math.PI) * 20; d += `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.4" fill="${['#2a6aa8', '#e8e0c0', '#c8302a', '#3a8a5a', '#e0901c'][i % 5]}"/>`; } s += d; }
  if (acc.has('amber')) { let d = ''; for (let i = 0; i <= 10; i++) { const t = i / 10, x = cx - 36 + t * 72, y = 198 + Math.sin(t * Math.PI) * 22; d += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${i === 5 ? 7 : 4.4}" fill="${i % 2 ? '#e8941c' : '#c86a10'}"/><circle cx="${r1(x - 1.4)}" cy="${r1(y - 1.4)}" r="1.4" fill="#fff4c0" opacity=".8"/>`; } s += d; }
  if (acc.has('cross')) s += `<path d="M${cx} 200V236M${cx - 9} 212H${cx + 9}" stroke="#7a5a3a" stroke-width="5"/><path d="M${cx - 22} 190Q${cx} 204 ${cx} 200Q${cx} 204 ${cx + 22} 190" stroke="#3a2a1a" stroke-width="1.4" fill="none"/>`;
  if (acc.has('keys')) s += `<circle cx="${cx + 46}" cy="228" r="9" fill="none" stroke="#8a8a8e" stroke-width="2.6"/><path d="M${cx + 40} 236l-4 16h4l1 -3M${cx + 48} 237l2 16h4M${cx + 54} 233l8 13" stroke="#8a8a8e" stroke-width="2.6" fill="none"/>`;
  if (acc.has('coin')) s += `<circle cx="${cx + 56}" cy="236" r="13" fill="${URL('gd')}" stroke="#7a5212" stroke-width="1.6"/><path d="M${cx + 50} 236h12M${cx + 56} 230v12" stroke="#7a5212" stroke-width="1.6"/><path d="M${cx + 40} 256q4 -18 12 -12q8 -4 16 4" fill="${sp.skin}" stroke="${darken(sp.skin, 0.4)}" stroke-width="1.2"/>`;
  if (acc.has('scales')) s += `<path d="M${cx + 50} 214v26M${cx + 34} 222h32M${cx + 34} 222l-6 14h12zM${cx + 66} 222l-6 14h12z" stroke="#d8a838" stroke-width="2" fill="none"/><path d="M${cx + 27} 236q7 6 14 0zM${cx + 59} 236q7 6 14 0z" fill="#d8a838"/>`;
  if (acc.has('tankard')) s += `<path d="M${cx + 40} 256V214h34v42z" fill="#7a5230"/><path d="M${cx + 40} 222h34M${cx + 40} 246h34" stroke="#3a2a1a" stroke-width="3"/><path d="M${cx + 74} 222q14 2 12 16q-2 10 -12 8" stroke="#5a3a20" stroke-width="5" fill="none"/><path d="M${cx + 38} 214q6 -10 12 -4q6 -8 12 -2q8 -6 14 4z" fill="#f4ecd8"/>`;
  if (acc.has('axe')) s += `<path d="M${cx + 70} 256L${cx + 104} 150" stroke="#6a4a2a" stroke-width="6" stroke-linecap="round"/><path d="M${cx + 98} 168q22 -2 26 -24q-14 4 -20 -6z" fill="${URL('mt')}"/>`;
  if (acc.has('chisel')) s += `<path d="M${cx + 46} 256L${cx + 74} 208" stroke="#6a4a2a" stroke-width="7" stroke-linecap="round"/><path d="M${cx + 74} 208l8 -14" stroke="#9aa2aa" stroke-width="5"/><path d="M${cx - 80} 256l14 -30" stroke="#6a4a2a" stroke-width="5"/><rect x="${cx - 76}" y="212" width="26" height="16" rx="3" fill="#8a6a44" transform="rotate(-25 ${cx - 63} 220)"/>`;
  if (acc.has('lyre')) s += `<path d="M${cx + 30} 256C${cx + 26} 226 ${cx + 40} 206 ${cx + 52} 206C${cx + 64} 206 ${cx + 80} 222 ${cx + 76} 256" fill="none" stroke="#8a5a2a" stroke-width="7"/><path d="M${cx + 36} 216H${cx + 72}" stroke="#8a5a2a" stroke-width="5"/><path d="M${cx + 44} 216v40M${cx + 52} 216v40M${cx + 60} 216v40M${cx + 68} 216v40" stroke="#e8e0c0" stroke-width="1"/>`;
  if (acc.has('armring')) s += `<path d="M${cx - 78} 236q-8 10 0 18M${cx - 72} 234q-8 12 0 20" stroke="${URL('gd')}" stroke-width="4" fill="none"/>`;
  return s;
}

// custom hero from the hero-select look: {hair: fair|red|dark|grey, skin: light|ruddy|olive|brown,
// cloak: blood|sea|moss|wood, face: beard|braids|shaven|scar}. Hex colours are accepted too.
const CLOAK = { blood: '#8e2a22', sea: '#2f5d6e', moss: '#5f6b3a', wood: '#6a4a2e', red: '#8e2a22', blue: '#2f5d6e', green: '#5f6b3a', brown: '#6a4a2e' };
const LOOK_HAIR = { fair: HAIR.blond, red: HAIR.red, dark: HAIR.dark, grey: HAIR.grey, ...HAIR };
function customSpec(look = {}) {
  const sp = JSON.parse(JSON.stringify(SPECS.custom));
  const pick = (v, table) => (v && table[v]) || v;
  if (look.skin) sp.skin = pick(look.skin, SKIN);
  if (look.hair) sp.hair = pick(look.hair, LOOK_HAIR);
  if (look.cloak) { const c = pick(look.cloak, CLOAK); sp.body.col = c; sp.body.col2 = darken(c, 0.3); }
  const face = look.face || (look.beard === false || look.beard === 'none' ? 'shaven' : 'beard');
  if (typeof look.beard === 'string' && look.beard !== 'none') sp.beard = look.beard;
  if (face === 'braids') {
    sp.style = 'braid'; sp.beard = 'none'; sp.face = { w: 41, h: 54, jaw: 0.66, chin: 1.02 };
    sp.body.kind = 'apron'; sp.body.w = 0.92; sp.body.col2 = darken(sp.body.col, 0.35); sp.blush = 0.2; sp.acc = ['beads'];
  } else if (face === 'shaven') { sp.beard = 'none'; sp.style = 'short'; sp.mouth = 'smile'; }
  else if (face === 'scar') { sp.beard = 'stubble'; sp.scar = true; sp.brow = -0.15; sp.mouth = 'smirk'; }
  if (sp.hair === HAIR.grey) sp.age = 0.65;
  if (look.hairStyle) sp.style = look.hairStyle;
  if (look.eyes) sp.eyes.col = look.eyes;
  return sp;
}
