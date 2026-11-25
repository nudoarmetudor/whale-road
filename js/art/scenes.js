// Whale Road: port scenes, title scene and sea backdrops, all drawn in code as SVG strings.
// Original art. Layered depth planes, light and shadow faces, warm windows at dusk/night,
// reflections, and a single shared painterly filter (off with {detail:'low'}).
import {
  f0, f1, rng, mix, mul, lighten, darken, makeCtx, stdDefs, textureDefs, staticOpen, grainOverlay,
  sky, cloud, range, hills, forest, broadTree, cypress, spruce, water, sea, smokeAnim, flagAnim,
  gullsAnim, snowfall, rainfall, torch, vignette, svgOpen, smooth, pts2d, yAt, vgrad, rgrad, ridgeFrom, aurora,
} from './paint.js';

// ---------- port data (optional; sim owner writes js/data/ports.js) ----------
let PORTS = null;
try {
  const m = await import('../data/ports.js');
  const raw = m.PORTS || m.ports || m.default || null;
  if (raw) PORTS = Array.isArray(raw) ? Object.fromEntries(raw.map(p => [p.id, p])) : raw;
} catch (e) { PORTS = null; }

export const BUILDINGS = ['market', 'hall', 'meadhall', 'shipyard', 'altar', 'runecarver', 'guild', 'bank', 'moneylender', 'warehouse'];
export const PORT_CULTURE = {
  ravnfjord: 'norse', kaupang: 'norse', hladir: 'norse', halogaland: 'norse', faereyjar: 'island', island: 'island',
  orkney: 'norse', dyflin: 'gael', jorvik: 'anglonorse', hamwic: 'saxon', rudaborg: 'frank', heidaby: 'dane',
  jomsborg: 'wend', truso: 'aesti', gotland: 'gotlander', birka: 'svear', aldeigja: 'slav', holmgard: 'slav',
  kaenugard: 'slav', miklagard: 'byzantine',
};

// ---------- culture styles ----------
const ST = {
  norse: { wall: '#5e4430', wk: 'pPlank', roof: '#5d7a34', rk: 'turf', bow: 7, dragon: true, temple: 'stave', hallKind: 'long',
    banner: '#a3302a', banner2: '#24467a', awn: ['#a3302a', '#e9dcb8'], stone: '#8a867c', trim: '#c9a04a', door: '#3a2616' },
  dane: { wall: '#8d6e4a', wk: 'pWattle', roof: '#a98a4e', rk: 'thatch', bow: 5, dragon: false, temple: 'stave', hallKind: 'long',
    banner: '#b0302a', banner2: '#e8d8a8', awn: ['#b0302a', '#efe2c4'], stone: '#9a9384', trim: '#d0a040', door: '#3a2616' },
  svear: { wall: '#7a3c28', wk: 'pPlank', roof: '#4b4038', rk: 'shingle', bow: 4, dragon: true, temple: 'stave', hallKind: 'long',
    banner: '#d4a02c', banner2: '#2a4a86', awn: ['#2a4a86', '#efe2c4'], stone: '#8a8478', trim: '#d4a02c', door: '#2a1a10' },
  gotlander: { wall: '#d2c8ae', wk: 'pStone', roof: '#5a4a3c', rk: 'shingle', bow: 0, dragon: false, temple: 'horg', hallKind: 'long',
    banner: '#2a5a8a', banner2: '#efe2c4', awn: ['#2a5a8a', '#efe2c4'], stone: '#cfc6b0', trim: '#c9a04a', door: '#3a2a1c' },
  slav: { wall: '#8e6842', wk: 'pLog', roof: '#8a877d', rk: 'shingle', bow: 0, steep: 1.35, dragon: false, temple: 'idol', hallKind: 'terem',
    banner: '#c22a22', banner2: '#e8c040', awn: ['#c22a22', '#e8c040'], stone: '#9a9284', trim: '#d8b048', door: '#3a2414' },
  byzantine: { wall: '#e8dcc4', wk: 'pAshlar', roof: '#b4593a', rk: 'pTile', bow: 0, dragon: false, temple: 'dome', hallKind: 'palace',
    banner: '#7a1f66', banner2: '#d4a830', awn: ['#7a1f66', '#f2e6c8'], stone: '#e2d6bc', trim: '#d4a830', door: '#5a3a22' },
  saxon: { wall: '#d9c9a2', wk: 'pWattle', roof: '#b6985a', rk: 'thatch', bow: 0, dragon: false, temple: 'timberchurch', hallKind: 'long',
    banner: '#c8a030', banner2: '#8a2a2a', awn: ['#c8a030', '#5a3a6a'], stone: '#a8a090', trim: '#c8a030', door: '#4a3020' },
  frank: { wall: '#c8bb9c', wk: 'pStone', roof: '#566070', rk: 'slate', bow: 0, steep: 1.2, dragon: false, temple: 'abbey', hallKind: 'keep',
    banner: '#2a4a9a', banner2: '#d4b040', awn: ['#2a4a9a', '#efe2c4'], stone: '#c4b89c', trim: '#d4b040', door: '#4a3020' },
  anglonorse: { wall: '#7d5c3c', wk: 'pPlank', roof: '#a9894c', rk: 'thatch', bow: 3, dragon: false, temple: 'minster', hallKind: 'long',
    banner: '#9a2a2a', banner2: '#d8c070', awn: ['#9a2a2a', '#d8c070'], stone: '#a89c88', trim: '#c9a04a', door: '#3a2616' },
  gael: { wall: '#bba886', wk: 'pWattle', roof: '#9c8248', rk: 'thatch', bow: 2, dragon: false, temple: 'roundtower', hallKind: 'long',
    banner: '#2a7a3a', banner2: '#e8d8a8', awn: ['#2a7a3a', '#efe2c4'], stone: '#9a978c', trim: '#c9a04a', door: '#3a2616' },
  island: { wall: '#6f6a44', wk: 'pTurf', roof: '#6b8a3a', rk: 'turf', bow: 0, dragon: false, temple: 'stave', hallKind: 'long', gableFront: true,
    front: '#6a4a30', banner: '#2a4a86', banner2: '#efe2c4', awn: ['#2a4a86', '#efe2c4'], stone: '#5a5852', trim: '#c9a04a', door: '#2a1a10' },
  aesti: { wall: '#7c5c3e', wk: 'pLog', roof: '#b29660', rk: 'thatch', bow: 2, dragon: false, temple: 'grove', hallKind: 'long',
    banner: '#d0801a', banner2: '#efe2c4', awn: ['#d0801a', '#efe2c4'], stone: '#9a9080', trim: '#e0901c', door: '#3a2616' },
  wend: { wall: '#4f3b2b', wk: 'pLog', roof: '#3d3530', rk: 'shingle', bow: 2, dragon: false, temple: 'wendtemple', hallKind: 'long',
    banner: '#8e1a1a', banner2: '#1a1a1a', awn: ['#8e1a1a', '#2a2420'], stone: '#6a665e', trim: '#b08a3a', door: '#1a1410' },
};
const RKP = { turf: 'pTurf', shingle: 'pShingle', thatch: 'pThatch', pTile: 'pTile', tile: 'pTile', slate: 'pSlate' };
const BW = { turf: 8, thatch: 9, shingle: 3.5, pTile: 3, tile: 3, slate: 3 };

const TUNICS = ['#8e2a22', '#2f5d6e', '#5f6b3a', '#c99a2e', '#7a5a8a', '#d9c59a', '#5b3a22', '#a8462a', '#3e4e7a', '#e8e0cc'];

// ---------- low-level helpers ----------
function P(d, fill, extra = '') { return `<path d="${d}" fill="${fill}"${extra}/>`; }
function face(c, d, col, pat) {
  let s = P(d, col);
  if (pat) s += P(d, c.url(pat));
  s += P(d, c.url('ao'));
  return s;
}
const nightish = c => c.pal.night || c.pal.dusk;
function winGlow(c) { return c.pal.night ? '#ffbe55' : c.pal.dusk ? '#ffb04a' : '#2a2018'; }
function windowRect(c, x, y, w, h, frame) {
  let s = `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${winGlow(c)}"${frame ? ` stroke="${frame}" stroke-width="1"` : ''}/>`;
  if (nightish(c)) s += `<circle cx="${f1(x + w / 2)}" cy="${f1(y + h / 2)}" r="${f1(Math.max(w, h) * 1.8)}" fill="${c.url('glow')}" opacity="${c.pal.night ? 0.8 : 0.45}"/>`;
  return s;
}
function door(c, x, y, w, h, st, o = {}) {
  const lit = nightish(c) && o.lit !== false;
  let s = `<path d="M${f1(x - w / 2 - 2)} ${f1(y)}V${f1(y - h - 2)}${o.arch ? `Q${f1(x)} ${f1(y - h - w * 0.7)} ${f1(x + w / 2 + 2)} ${f1(y - h - 2)}` : `H${f1(x + w / 2 + 2)}`}V${f1(y)}Z" fill="${c.col(st.door, 0.7)}"/>`;
  s += `<path d="M${f1(x - w / 2)} ${f1(y)}V${f1(y - h)}${o.arch ? `Q${f1(x)} ${f1(y - h - w * 0.6)} ${f1(x + w / 2)} ${f1(y - h)}` : `H${f1(x + w / 2)}`}V${f1(y)}Z" fill="${lit ? '#ffb24a' : c.col(st.door, 0.9)}"/>`;
  if (lit) s += `<circle cx="${f1(x)}" cy="${f1(y - h * 0.4)}" r="${f1(h * 1.2)}" fill="${c.url('glow')}" opacity=".7"/><path d="M${f1(x - w / 2)} ${f1(y)}l${f1(-w * 0.8)} ${f1(10)}h${f1(w * 2.6)}l${f1(-w * 0.8)} -10z" fill="#ffb24a" opacity=".35"/>`;
  else s += `<path d="M${f1(x)} ${f1(y)}V${f1(y - h)}" stroke="#000" stroke-opacity=".3"/>`;
  return s;
}

// placement transform: drawers work in local coords; anims need scene coords
function at(c, lx, ly) { const k = c.cur; return [k.X + lx * k.s * (k.flip ? -1 : 1), k.Y + ly * k.s]; }
function addSmoke(c, lx, ly, k = 1, o) { const [x, y] = at(c, lx, ly); c.anims.push(smokeAnim(c, x, y, c.cur.s * k, o)); }
function addFlag(c, lx, ly, L, H, col, o = {}) { const [x, y] = at(c, lx, ly); c.anims.push(flagAnim(c, x, y, L * c.cur.s, H * c.cur.s, col, o)); }
function addTorch(c, lx, ly) { if (!nightish(c)) return; const [x, y] = at(c, lx, ly); c.anims.push(torch(c, x, y, c.cur.s)); }

function dragonHead(x, y, dir, s, col) {
  // crossed gable boards ending in a carved serpent head
  const hx = x + dir * 8 * s, hy = y - 19 * s;
  return `<path d="M${f1(x)} ${f1(y + 3 * s)}c${f1(dir * 1 * s)} ${f1(-7 * s)} ${f1(dir * 9 * s)} ${f1(-9 * s)} ${f1(dir * 8 * s)} ${f1(-22 * s)}M${f1(x + dir * 2 * s)} ${f1(y + 3 * s)}c${f1(-dir * 2 * s)} ${f1(-6 * s)} ${f1(-dir * 5 * s)} ${f1(-8 * s)} ${f1(-dir * 5 * s)} ${f1(-14 * s)}" stroke="${col}" stroke-width="${f1(2.6 * s)}" fill="none" stroke-linecap="round"/>`
    + `<path d="M${f1(hx - dir * 2.5 * s)} ${f1(hy - 1 * s)}L${f1(hx + dir * 9 * s)} ${f1(hy - 1.5 * s)}L${f1(hx + dir * 3.5 * s)} ${f1(hy + 1.2 * s)}L${f1(hx + dir * 8 * s)} ${f1(hy + 3.5 * s)}L${f1(hx - dir * 1 * s)} ${f1(hy + 3.5 * s)}Z" fill="${col}"/>`;
}

// ---------- houses ----------
// 3/4 view house, long wall facing the viewer, gable end on side `side` (+1 right).
function house(c, st, o) {
  const p = c.pal, dep = c.dep || 0;
  const sd = o.side ?? (c.rng() < 0.5 ? 1 : -1);
  const w = o.w, h = o.h, d = o.d ?? w * 0.42, rh = o.rh ?? h * (st.steep || 1), ov = o.ov ?? 5, bow = o.bow ?? st.bow ?? 0;
  const dx = d * 0.5 * sd, dy = d * 0.26;
  const X0 = -w / 2, X1 = w / 2, E = sd > 0 ? X1 : X0;
  const endLit = sd === c.sunSide;
  const kF = endLit ? 0.8 : 0.97, kE = endLit ? 1.06 : 0.56;
  const wall = o.wall || st.wall, roof = o.roof || st.roof, rk = o.rk || st.rk, wk = o.wk || st.wk;
  const rY = -h - rh - dy / 2;
  let s = '';
  if (!p.night) s += `<ellipse cx="${f1(-c.sunSide * w * 0.12 + dx * 0.4)}" cy="${f1(-dy * 0.3)}" rx="${f1(w * 0.62 + Math.abs(dx))}" ry="${f1(6 + dy * 0.5)}" fill="#000" opacity=".2"/>`;
  // end wall with gable
  const end = `M${f1(E)} 0L${f1(E + dx)} ${f1(-dy)}L${f1(E + dx)} ${f1(-dy - h)}L${f1(E + dx / 2)} ${f1(rY)}L${f1(E)} ${f1(-h)}Z`;
  s += face(c, end, c.col(o.endWall || wall, kE, dep), wk);
  // front wall
  const front = `M${f1(X0)} 0H${f1(X1)}V${f1(-h)}H${f1(X0)}Z`;
  s += face(c, front, c.col(wall, kF, dep), wk);
  if (o.beams) { // timber frame
    let bd = `M${f1(X0 + 2)} 0V${f1(-h)}M${f1(X1 - 2)} 0V${f1(-h)}M${f1(X0)} ${f1(-h + 2)}H${f1(X1)}M${f1(X0)} ${f1(-h * 0.5)}H${f1(X1)}`;
    for (let x = X0 + w / 4; x < X1 - 4; x += w / 4) bd += `M${f1(x)} 0V${f1(-h)}M${f1(x)} ${f1(-h * 0.5)}l${f1(w / 8)} ${f1(-h * 0.5)}`;
    s += `<path d="${bd}" stroke="${c.col('#3a2616', 0.9, dep)}" stroke-width="3" fill="none"/>`;
  }
  // roof front plane
  const ey = -h + ov * 0.35;
  const mx = (X0 + X1) / 2;
  const roofD = `M${f1(X0 - ov)} ${f1(ey)}Q${f1(mx)} ${f1(ey - bow * 0.6)} ${f1(X1 + ov)} ${f1(ey)}L${f1(X1 + ov + dx / 2)} ${f1(rY)}Q${f1(mx + dx / 2)} ${f1(rY - bow * 2)} ${f1(X0 - ov + dx / 2)} ${f1(rY)}Z`;
  const snow = p.winter;
  const rcol = snow ? c.col('#eef2f6', 0.95, dep) : c.col(roof, 0.9, dep);
  s += P(roofD, rcol);
  if (!snow && RKP[rk]) s += P(roofD, c.url(RKP[rk]));
  s += P(roofD, c.url('roofsh'));
  if (snow) s += `<path d="M${f1(X0 - ov)} ${f1(ey)}Q${f1(mx)} ${f1(ey - bow * 0.6)} ${f1(X1 + ov)} ${f1(ey)}" stroke="${c.col(roof, 0.6, dep)}" stroke-width="3" fill="none"/>`;
  if (rk === 'turf' && !snow) { // grassy tufts along the eave
    let t = '';
    for (let x = X0 - ov + 3; x < X1 + ov - 2; x += 5 + c.rng() * 4) t += `M${f1(x)} ${f1(ey + 1)}l${f1(c.rng() * 2 - 1)} ${f1(-3 - c.rng() * 4)}`;
    s += `<path d="${t}" stroke="${c.col(roof, 1.15, dep)}" stroke-width="1.6" fill="none"/>`;
    if (p.season !== 'autumn' && !p.night) { let fl = ''; for (let i = 0; i < w / 18; i++) fl += `<circle cx="${f1(X0 + c.rng() * w)}" cy="${f1(ey - 4 - c.rng() * (rh * 0.8))}" r="1.3"/>`; s += `<g fill="${c.rng() < 0.5 ? '#f2e27a' : '#f4f0ea'}" opacity=".8">${fl}</g>`; }
  }
  // barge edge on the gable side
  const bw = BW[rk] || 4;
  const barge = `M${f1(E + sd * ov)} ${f1(ey)}L${f1(E + sd * ov + dx / 2)} ${f1(rY)}L${f1(E + dx + sd * ov * 0.6)} ${f1(-dy - h + ov * 0.35)}`;
  s += `<path d="${barge}" stroke="${snow ? c.col('#f4f6f9', 1, dep) : c.col(roof, endLit ? 1.05 : 0.7, dep)}" stroke-width="${bw}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  // ridge highlight (rim light)
  if (!p.night) s += `<path d="M${f1(X0 - ov + dx / 2)} ${f1(rY)}Q${f1(mx + dx / 2)} ${f1(rY - bow * 2)} ${f1(X1 + ov + dx / 2)} ${f1(rY)}" stroke="${p.sun}" stroke-width="1.8" fill="none" opacity="${p.dusk ? 0.75 : 0.45}"/>`;
  if (o.dragon ?? st.dragon) {
    const dc = c.col('#3a2616', 0.9, dep);
    s += dragonHead(X0 - ov + dx / 2, rY, -1, (o.dscale || 1) * Math.max(0.8, h / 40), dc) + dragonHead(X1 + ov + dx / 2, rY, 1, (o.dscale || 1) * Math.max(0.8, h / 40), dc);
  }
  // door and windows
  if (o.door !== false) s += door(c, o.doorX ?? (w * (c.rng() - 0.5) * 0.4), 0, o.doorW || Math.min(16, w * 0.14), o.doorH || h * 0.72, st, { arch: o.arch });
  for (const wx of (o.wins || [])) s += windowRect(c, wx - 4, -h * 0.66, 8, 7, c.col('#2a1a10', 0.9, dep));
  if (o.shields) {
    let sh = '';
    const n = Math.floor(w / 26);
    for (let i = 0; i < n; i++) {
      const x = X0 + 14 + i * (w - 28) / Math.max(1, n - 1);
      if (Math.abs(x - (o.doorX || 0)) < 16) continue;
      const col = [st.banner, st.banner2, '#d8c8a0', st.trim][i % 4];
      sh += `<circle cx="${f1(x)}" cy="${f1(-h * 0.58)}" r="7.5" fill="${c.col(col, kF, dep)}" stroke="${c.col('#3a2616', 0.8, dep)}" stroke-width="1.5"/><circle cx="${f1(x)}" cy="${f1(-h * 0.58)}" r="2" fill="${c.col('#c9a04a', 1, dep)}"/>`;
    }
    s += sh;
  }
  const smokeAt = [mx + dx / 2 + (o.smokeOff || 0), rY - bow * 1.5];
  if (o.smokeHole !== false && rk !== 'tile' && rk !== 'pTile') s += `<rect x="${f1(smokeAt[0] - 4)}" y="${f1(smokeAt[1] - 3)}" width="8" height="5" fill="${c.col('#2a1a10', 0.8, dep)}"/>`;
  return { svg: s, top: rY - bow * 2 - 6, smoke: smokeAt, w, h, dx, dy, rY, ey };
}

// gable faces the viewer (Icelandic turf rows, town houses)
function gableHouse(c, st, o) {
  const p = c.pal, dep = c.dep || 0;
  const sd = o.side ?? (c.sunSide > 0 ? -1 : 1);
  const w = o.w, h = o.h, d = o.d ?? w * 1.1, rh = o.rh ?? w * 0.55 * (st.steep || 1), ov = o.ov ?? 4;
  const dx = d * 0.5 * sd, dy = d * 0.24;
  const X0 = -w / 2, X1 = w / 2, E = sd > 0 ? X1 : X0;
  const sideLit = sd === c.sunSide;
  const kF = sideLit ? 0.8 : 0.98, kS = sideLit ? 1.04 : 0.56;
  const wall = o.wall || st.wall, roof = o.roof || st.roof, rk = o.rk || st.rk;
  const fw = o.front || st.front || wall;
  let s = '';
  if (!p.night) s += `<ellipse cx="${f1(dx * 0.5 - c.sunSide * w * 0.2)}" cy="${f1(-dy * 0.4)}" rx="${f1(w * 0.6 + Math.abs(dx) * 0.7)}" ry="${f1(5 + dy * 0.5)}" fill="#000" opacity=".2"/>`;
  // side wall
  const side = `M${f1(E)} 0L${f1(E + dx)} ${f1(-dy)}L${f1(E + dx)} ${f1(-dy - h)}L${f1(E)} ${f1(-h)}Z`;
  s += face(c, side, c.col(wall, kS, dep), o.wk || st.wk);
  // roof over side wall
  const ey = -h + ov * 0.35;
  const roofD = `M${f1(E + sd * ov)} ${f1(ey)}L${f1(0)} ${f1(-h - rh)}L${f1(dx)} ${f1(-h - rh - dy)}L${f1(E + dx + sd * ov)} ${f1(ey - dy)}Z`;
  const snow = p.winter;
  s += P(roofD, snow ? c.col('#eef2f6', 0.9, dep) : c.col(roof, sideLit ? 0.98 : 0.72, dep));
  if (!snow && RKP[rk]) s += P(roofD, c.url(RKP[rk]));
  s += P(roofD, c.url('roofsh'));
  // front gable wall
  const front = `M${f1(X0)} 0H${f1(X1)}V${f1(-h)}L0 ${f1(-h - rh)}L${f1(X0)} ${f1(-h)}Z`;
  s += face(c, front, c.col(fw, kF, dep), o.fwk === undefined ? (st.gableFront ? 'pPlank' : (o.wk || st.wk)) : o.fwk);
  if (o.beams) s += `<path d="M${f1(X0 + 2)} 0V${f1(-h)}M${f1(X1 - 2)} 0V${f1(-h)}M${f1(X0)} ${f1(-h)}H${f1(X1)}M0 ${f1(-h)}V${f1(-h - rh + 4)}M${f1(X0)} ${f1(-h * 0.5)}H${f1(X1)}" stroke="${c.col('#3a2616', 0.9, dep)}" stroke-width="3" fill="none"/>`;
  // barge boards
  const bw = BW[rk] || 4;
  s += `<path d="M${f1(X0 - ov)} ${f1(ey)}L0 ${f1(-h - rh - 1)}L${f1(X1 + ov)} ${f1(ey)}" stroke="${snow ? c.col('#f4f6f9', 1, dep) : c.col(roof, 0.85, dep)}" stroke-width="${bw}" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (!p.night) s += `<path d="M0 ${f1(-h - rh - 1)}L${f1(dx)} ${f1(-h - rh - dy)}" stroke="${p.sun}" stroke-width="1.6" opacity="${p.dusk ? 0.7 : 0.4}"/>`;
  if (o.dragon) s += dragonHead(0, -h - rh - 2, c.sunSide, Math.max(0.8, w / 50), c.col('#3a2616', 0.9, dep));
  if (o.door !== false) s += door(c, o.doorX ?? 0, 0, o.doorW || Math.min(14, w * 0.22), o.doorH || h * 0.75, st, { arch: o.arch });
  for (const wv of (o.wins || [])) s += windowRect(c, wv[0] - 4, wv[1], 8, 8, c.col('#2a1a10', 0.9, dep));
  return { svg: s, top: -h - rh - dy - 6, smoke: [dx * 0.6, -h - rh - dy * 0.6], w, h, dx, dy };
}

// ---------- props ----------
function barrel(c, x, y, s = 1) {
  const dep = c.dep || 0;
  return `<rect x="${f1(x - 6 * s)}" y="${f1(y - 15 * s)}" width="${f1(12 * s)}" height="${f1(15 * s)}" rx="${f1(4 * s)}" fill="${c.col('#7a5230', 0.95, dep)}"/><path d="M${f1(x - 6 * s)} ${f1(y - 4 * s)}h${f1(12 * s)}M${f1(x - 6 * s)} ${f1(y - 11 * s)}h${f1(12 * s)}" stroke="${c.col('#3a2a1a', 0.9, dep)}" stroke-width="${f1(1.4 * s)}"/><path d="M${f1(x + c.sunSide * 3 * s)} ${f1(y - 14 * s)}v${f1(13 * s)}" stroke="#fff" stroke-opacity=".18" stroke-width="${f1(2 * s)}"/>`;
}
function crate(c, x, y, s = 1, col = '#9a7448') {
  const dep = c.dep || 0, w = 14 * s;
  return `<rect x="${f1(x - w / 2)}" y="${f1(y - w)}" width="${f1(w)}" height="${f1(w)}" fill="${c.col(col, 0.9, dep)}"/><path d="M${f1(x + w / 2)} ${f1(y)}l${f1(4 * s)} ${f1(-3 * s)}v${f1(-w)}l${f1(-4 * s)} ${f1(3 * s)}z" fill="${c.col(col, 0.6, dep)}"/><path d="M${f1(x - w / 2)} ${f1(y - w)}l${f1(4 * s)} ${f1(-3 * s)}h${f1(w)}l${f1(-4 * s)} ${f1(3 * s)}z" fill="${c.col(col, 1.1, dep)}"/><path d="M${f1(x - w / 2)} ${f1(y)}L${f1(x + w / 2)} ${f1(y - w)}" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="${f1(1.2 * s)}"/><rect x="${f1(x - w / 2)}" y="${f1(y - w)}" width="${f1(w)}" height="${f1(w)}" fill="none" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="${f1(1.2 * s)}"/>`;
}
function sack(c, x, y, s = 1, col = '#cdb88a') {
  const dep = c.dep || 0;
  return `<path d="M${f1(x - 7 * s)} ${f1(y)}Q${f1(x - 9 * s)} ${f1(y - 10 * s)} ${f1(x - 3 * s)} ${f1(y - 13 * s)}L${f1(x)} ${f1(y - 16 * s)}L${f1(x + 3 * s)} ${f1(y - 13 * s)}Q${f1(x + 9 * s)} ${f1(y - 10 * s)} ${f1(x + 7 * s)} ${f1(y)}Z" fill="${c.col(col, 0.92, dep)}"/><path d="M${f1(x + c.sunSide * 2 * s)} ${f1(y - 12 * s)}q${f1(c.sunSide * 4 * s)} ${f1(5 * s)} ${f1(c.sunSide * 3 * s)} ${f1(11 * s)}" stroke="#fff" stroke-opacity=".25" stroke-width="${f1(2 * s)}" fill="none"/>`;
}
function figure(c, x, y, s = 1, o = {}) {
  // drawn at the origin, placed with a transform (keeps the markup short)
  const r = c.rng, dep = c.dep || 0, sd = c.sunSide;
  const tun = c.col(o.col || r.pick(TUNICS), 0.95, dep), skin = c.col(o.skin || '#d9a882', 1, dep);
  const hair = c.col(o.hair || r.pick(['#3a2414', '#8a5a2a', '#c8a060', '#2a2020', '#b0b0a8']), 0.9, dep);
  const w = o.wide || 1;
  let g = `<path d="M-2.2 0V-7M2.2 0V-7" stroke="${c.col('#3a3028', 0.9, dep)}" stroke-width="1.8"/>`;
  g += `<path d="M${f1(-4.5 * w)} -6L${f1(-3.4 * w)} -16Q0 -18.5 ${f1(3.4 * w)} -16L${f1(4.5 * w)} -6Z" fill="${tun}"/><path d="M${sd} -16.5L${f1(sd * 4.3 * w)} -6.5" stroke="#fff" stroke-opacity=".22" stroke-width="1.6"/>`;
  if (o.arm) g += `<path d="M3 -15l${o.arm[0]} ${o.arm[1]}" stroke="${tun}" stroke-width="2.2" stroke-linecap="round"/>`;
  if (o.tool) g += `<path d="M${3 + (o.arm ? o.arm[0] : 0)} ${-15 + (o.arm ? o.arm[1] : 0)}l${o.tool[0]} ${o.tool[1]}" stroke="${c.col('#5a4030', 0.9, dep)}" stroke-width="1.4"/>`;
  g += `<circle cy="-20" r="3.2" fill="${skin}"/><path d="M-3.3 -20a3.3 3.4 0 0 1 6.6 0z" fill="${hair}"/>`;
  if (o.hood) g += `<path d="M-3.8 -17Q-4 -25 0 -24.5Q4 -25 3.8 -17" fill="${c.col(o.hood, 0.9, dep)}"/>`;
  return `<g transform="translate(${f1(x)} ${f1(y)})${s !== 1 ? ` scale(${f1(s)})` : ''}">${g}</g>`;
}
function crowd(c, x0, x1, y, n, s = 1) { let g = ''; for (let i = 0; i < n; i++) g += figure(c, x0 + c.rng() * (x1 - x0), y + c.rng() * 6 * s, s * (0.9 + c.rng() * 0.2)); return g; }
function logs(c, x, y, s = 1, n = 6) {
  const dep = c.dep || 0;
  let g = '';
  for (let i = 0; i < n; i++) {
    const row = i < 3 ? 0 : i < 5 ? 1 : 2, k = i < 3 ? i : i < 5 ? i - 3 : 0;
    const cx = x + (k * 9 + row * 4.5) * s, cy = y - (4.5 + row * 8) * s;
    g += `<path d="M${f1(cx)} ${f1(cy - 4.5 * s)}h${f1(-30 * s)}v${f1(9 * s)}h${f1(30 * s)}" fill="${c.col('#8a6238', 0.75, dep)}"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(4.5 * s)}" fill="${c.col('#c8a070', 1, dep)}" stroke="${c.col('#6a4a28', 0.9, dep)}" stroke-width="${f1(s)}"/>`;
  }
  return g;
}
function fence(c, x0, x1, y, s = 1, col = '#6a4a30') {
  const dep = c.dep || 0;
  let d = `M${f1(x0)} ${f1(y - 7 * s)}H${f1(x1)}M${f1(x0)} ${f1(y - 3 * s)}H${f1(x1)}`;
  for (let x = x0; x <= x1; x += 9 * s) d += `M${f1(x)} ${f1(y)}V${f1(y - 10 * s)}`;
  return `<path d="${d}" stroke="${c.col(col, 0.85, dep)}" stroke-width="${f1(1.5 * s)}" fill="none"/>`;
}
function palisade(c, x0, x1, yfn, hgt, o = {}) {
  const dep = o.depth ?? c.dep ?? 0, col = o.col || '#7a5a38';
  let dk = '', lt = '';
  const step = o.step || 7;
  for (let x = x0; x < x1; x += step) {
    const y = yfn(x), hh = hgt * (0.92 + c.rng() * 0.16);
    dk += `M${f1(x)} ${f1(y)}V${f1(y - hh)}l${f1(step / 2)} ${f1(-step * 0.7)}l${f1(step / 2)} ${f1(step * 0.7)}V${f1(yfn(x + step))}Z`;
    lt += `M${f1(x + (c.sunSide > 0 ? step / 2 : 0))} ${f1(y)}v${f1(-hh)}h${f1(step / 2)}v${f1(hh)}z`;
  }
  return `<path d="${dk}" fill="${c.col(col, 0.7, dep)}"/><path d="${lt}" fill="${c.col(col, 1, dep)}" opacity=".55"/><path d="M${f1(x0)} ${f1(yfn(x0) - hgt * 0.35)}${Array.from({ length: Math.ceil((x1 - x0) / 20) + 1 }, (_, i) => `L${f1(Math.min(x1, x0 + i * 20))} ${f1(yfn(Math.min(x1, x0 + i * 20)) - hgt * 0.35)}`).join('')}" stroke="${c.col('#3a2a1a', 0.8, dep)}" stroke-width="2" fill="none"/>`;
}
function stoneWall(c, x0, x1, yfn, hgt, o = {}) {
  const dep = o.depth ?? c.dep ?? 0, col = o.col || '#c8bca0';
  const top = x => yfn(x) - hgt;
  let d = `M${f1(x0)} ${f1(yfn(x0))}`;
  for (let x = x0; x <= x1; x += 20) d += `L${f1(x)} ${f1(yfn(x))}`;
  d += `L${f1(x1)} ${f1(top(x1))}`;
  // crenellations
  for (let x = x1; x >= x0; x -= 12) d += `L${f1(x)} ${f1(top(x))}L${f1(x)} ${f1(top(x) - 7)}L${f1(x - 6)} ${f1(top(x - 6) - 7)}L${f1(x - 6)} ${f1(top(x - 6))}`;
  d += 'Z';
  return face(c, d, c.col(col, o.k ?? 0.9, dep), o.pat || 'pAshlar');
}
function tower(c, x, y, w, h, o = {}) {
  // square tower in 3/4 with roof: 'tent' | 'cren' | 'cone' | 'flat'
  const dep = o.depth ?? c.dep ?? 0, col = o.col || '#8e6842', pat = o.pat || 'pLog';
  const sd = c.sunSide, dx = w * 0.4 * (o.side ?? -sd), dy = w * 0.2;
  const X0 = x - w / 2, X1 = x + w / 2, E = dx > 0 ? X1 : X0;
  const sideLit = Math.sign(dx) === sd;
  let s = face(c, `M${f1(X0)} ${f1(y)}H${f1(X1)}V${f1(y - h)}H${f1(X0)}Z`, c.col(col, sideLit ? 0.8 : 0.97, dep), pat);
  s += face(c, `M${f1(E)} ${f1(y)}l${f1(dx)} ${f1(-dy)}V${f1(y - h - dy)}L${f1(E)} ${f1(y - h)}Z`, c.col(col, sideLit ? 1.05 : 0.56, dep), pat);
  const roof = o.roof || '#8a877d';
  const top = y - h;
  if (o.kind === 'cren') {
    let d = '';
    for (let i = 0; i < 4; i++) d += `M${f1(X0 + i * w / 3.5)} ${f1(top)}h${f1(w / 7)}v-8h${f1(-w / 7)}z`;
    s += P(d, c.col(col, 0.9, dep));
    s += P(`M${f1(E)} ${f1(top)}l${f1(dx)} ${f1(-dy)}v-8l${f1(-dx)} ${f1(dy)}z`, c.col(col, sideLit ? 1.05 : 0.56, dep));
  } else if (o.kind === 'cone') {
    const cx = x + dx / 2, ap = top - (o.rh || w * 1.4);
    s += P(`M${f1(X0 - 3)} ${f1(top + 2)}Q${f1(cx)} ${f1(top + 8)} ${f1(X1 + dx + 3)} ${f1(top - dy + 2)}L${f1(cx)} ${f1(ap)}Z`, c.pal.winter ? c.col('#eef2f6', 0.95, dep) : c.col(roof, 0.92, dep));
    s += P(`M${f1(cx)} ${f1(ap)}L${f1(sd > 0 ? X1 + dx + 3 : X0 - 3)} ${f1(sd > 0 ? top - dy + 2 : top + 2)}L${f1(cx)} ${f1(top + 4)}Z`, '#fff', ' opacity=".14"');
  } else if (o.kind !== 'flat') { // tented pyramid roof
    const ov = 5, cx = x + dx / 2, ap = top - dy / 2 - (o.rh || w * 1.1);
    const snow = c.pal.winter;
    const lft = `M${f1(X0 - ov)} ${f1(top + 3)}L${f1(cx)} ${f1(ap)}L${f1(dx > 0 ? X1 + ov : X1 + ov)} ${f1(top + 3)}Z`;
    s += P(lft, snow ? c.col('#eef2f6', 0.92, dep) : c.col(roof, sideLit ? 0.78 : 0.98, dep));
    if (!snow) s += P(lft, c.url('pShingle'));
    const sdD = `M${f1(E + (dx > 0 ? ov : -ov))} ${f1(top + 3)}L${f1(cx)} ${f1(ap)}L${f1(E + dx + (dx > 0 ? ov : -ov))} ${f1(top - dy + 3)}Z`;
    s += P(sdD, snow ? c.col('#f6f8fa', sideLit ? 1 : 0.7, dep) : c.col(roof, sideLit ? 1.05 : 0.55, dep));
    if (o.spire !== false) s += `<path d="M${f1(cx)} ${f1(ap)}v-12" stroke="${c.col('#3a2a1a', 0.8, dep)}" stroke-width="2"/>` + (o.flag ? '' : '');
  }
  if (o.win) s += windowRect(c, x - 3, y - h * 0.65, 6, 8);
  return s;
}

// ---------- building drawers ----------
// Each draws in local coords (origin = ground centre), returns {svg, top}
const B = {};

B.house = (c, st, o = {}) => {
  const r = c.rng;
  const w = o.w || 84 + r() * 40, h = o.h || 28 + r() * 10;
  const H = st.gableFront || o.gable || (st.gableMix && r() < st.gableMix) ? gableHouse(c, st, { w: w * 0.62, h: h * 1.05, wins: r() < 0.6 ? [[0, -h * 0.75]] : [], doorX: 0 })
    : house(c, st, { w, h, wins: r() < 0.7 ? [w * 0.25 * r.sign()] : [], bow: (st.bow || 0) * 0.6, dragon: st.dragon && r() < 0.3, beams: st.beams });
  let s = H.svg;
  if (r() < 0.55) addSmoke(c, H.smoke[0], H.smoke[1], 0.7);
  if (r() < 0.35) s += barrel(c, w * 0.42, 2, 0.9);
  return { svg: s, top: H.top };
};

B.storehouse = (c, st) => { // raised store on posts (stabbur-like)
  const w = 44, h = 26;
  let s = `<path d="M-16 0v-12M16 0v-12M-4 0v-12" stroke="${c.col('#4a3420', 0.8, c.dep)}" stroke-width="4"/>`;
  s += `<g transform="translate(0 -12)">${house(c, st, { w, h, d: 30, rh: 22, door: true, doorW: 9, doorH: 16, wins: [], bow: 1, dragon: false, smokeHole: false }).svg}</g>`;
  return { svg: s, top: -64 };
};

// hall: the ruler's hall (quest giver) — biggest, banners, shields, carved doors
B.hall = (c, st) => {
  const k = st.hallKind;
  let s = '', top;
  if (k === 'keep') { // Frankish stone keep with timber hall
    const H = house(c, st, { w: 150, h: 44, d: 70, rh: 44, wins: [-50, -25, 25, 50], side: c.sunSide > 0 ? -1 : 1, arch: true });
    s += H.svg;
    s += tower(c, c.sunSide > 0 ? 95 : -95, 0, 58, 128, { col: st.stone, pat: 'pStone', kind: 'cren', win: true });
    top = -150;
    addFlag(c, c.sunSide > 0 ? 95 : -95, -160, 34, 20, st.banner);
    s += `<path d="M${c.sunSide > 0 ? 95 : -95} -138v-24" stroke="#3a2a1a" stroke-width="2.4"/>`;
  } else if (k === 'terem') { // Slavic prince's terem: tall log house with gallery and tented roofs
    const H = house(c, st, { w: 140, h: 66, d: 70, rh: 46, wins: [-46, -16, 16, 46], side: c.sunSide > 0 ? -1 : 1, door: true });
    s += H.svg;
    // gallery
    s += `<path d="M-72 -30h144" stroke="${c.col('#5a3a20', 0.9, c.dep)}" stroke-width="4"/>` + Array.from({ length: 13 }, (_, i) => `<path d="M${-70 + i * 11.6} -30v-12" stroke="${c.col('#5a3a20', 0.9, c.dep)}" stroke-width="2"/>`).join('');
    s += tower(c, -88, 0, 36, 106, { col: st.wall, pat: 'pLog', roof: st.roof, rh: 50, win: true });
    s += tower(c, 88, 0, 36, 96, { col: st.wall, pat: 'pLog', roof: st.roof, rh: 46, win: true });
    top = -190;
    addFlag(c, -86, -178, 30, 16, st.banner, { tail: true });
  } else if (k === 'palace') { // Byzantine palace: colonnade + dome
    s += byzBlock(c, st, 0, 0, 200, 70, { cols: 9, dome: 46, pediment: false });
    top = -175;
    addFlag(c, -96, -110, 30, 18, st.banner);
    s += `<path d="M-96 -70v-42" stroke="${c.col('#8a7a5a', 1, c.dep)}" stroke-width="2.4"/>`;
  } else {
    const great = st.greatHall ? 1.22 : 1;
    const H = house(c, st, { w: 230 * great, h: 46 * great, d: 96 * great, rh: 60 * great, bow: (st.bow || 2) * 1.8, wins: [], shields: true, doorX: 0, doorW: 20, doorH: 34 * great, dscale: 1.3 });
    s += H.svg;
    // carved portal posts
    s += `<path d="M-14 0v-40M14 0v-40M-17 -40q17 -14 34 0" stroke="${c.col(st.trim, 0.9, c.dep)}" stroke-width="3" fill="none"/>`;
    addSmoke(c, H.smoke[0], H.smoke[1], 1.1);
    top = H.top;
    // banner poles
    for (const px of [-128 * great, 128 * great]) {
      s += `<path d="M${px} 2V-118" stroke="${c.col('#3a2a1a', 0.9, c.dep)}" stroke-width="3"/><circle cx="${px}" cy="-120" r="3" fill="${c.col(st.trim, 1, c.dep)}"/>`;
      addFlag(c, px, -114, 34, 46, px < 0 ? st.banner : st.banner2, { dir: px < 0 ? -1 : 1, tail: true });
    }
    top = Math.min(top, -124);
    addTorch(c, -26, -30); addTorch(c, 26, -30);
  }
  return { svg: s, top };
};

B.meadhall = (c, st) => {
  let s = '';
  const k = st.hallKind;
  let H;
  if (k === 'palace') H = gableHouse(c, st, { w: 90, h: 50, d: 110, rk: 'pTile', wins: [[-26, -40], [26, -40]], arch: true, front: '#e0d0b0', fwk: 'pAshlar' });
  else if (st.gableFront) H = gableHouse(c, st, { w: 96, h: 44, d: 120, wins: [[-28, -30], [28, -30]] });
  else H = house(c, st, { w: 168, h: 40, d: 80, rh: 48, wins: [-55, 55], doorX: -10, doorW: 18, beams: st.beams });
  s += H.svg;
  // drinking-horn sign on a bracket
  const bx = st.gableFront || k === 'palace' ? 52 : 34, by = -58;
  s += `<path d="M${bx - 14} ${by + 16}h-2V${by + 4}M${bx - 16} ${by + 6}h30" stroke="${c.col('#3a2616', 0.9, c.dep)}" stroke-width="2.5" fill="none"/>`;
  s += `<path d="M${bx - 6} ${by + 6}v6M${bx + 10} ${by + 6}v6" stroke="${c.col('#2a1a10', 1, c.dep)}" stroke-width="1"/>`;
  s += `<path d="M${bx - 9} ${by + 13}q10 14 24 0l-2 -2q-10 9 -20 0z" fill="${c.col('#e0c890', 1, c.dep)}" stroke="${c.col('#6a4a20', 1, c.dep)}" stroke-width="1"/><path d="M${bx + 13} ${by + 11}l3 -4" stroke="${c.col(st.trim, 1, c.dep)}" stroke-width="3"/>`;
  s += barrel(c, -70, 3, 1.1) + barrel(c, -56, 3, 1.1) + barrel(c, -63, -12, 1.05);
  s += `<path d="M60 2h26M62 2v-10M84 2v-10M58 -10h30" stroke="${c.col('#6a4a2a', 0.9, c.dep)}" stroke-width="3" fill="none"/>`;
  s += figure(c, 72, -10, 0.85, { arm: [5, -4] });
  addSmoke(c, H.smoke[0], H.smoke[1], 1.3, { puffs: 5 });
  addTorch(c, -26, -32);
  return { svg: s, top: H.top };
};

B.market = (c, st, o = {}) => {
  const r = c.rng, dep = c.dep || 0;
  let s = '';
  if (st.hallKind === 'palace') s += byzStoa(c, st, 0, -4, 250, 70);
  const n = 3, sp = 82;
  const goods = [['#c8a060', '#e0c080'], ['#d08a2a', '#f0b040'], ['#8a3a2a', '#5a7a3a'], ['#d9c59a', '#a8b0b8'], ['#6a4a3a', '#c9a04a']];
  for (let i = 0; i < n; i++) {
    const x = (i - 1) * sp + (r() - 0.5) * 8, y = (i === 1 ? -14 : 0);
    const w = 66, hgt = 34;
    const a = st.awn[0], b = st.awn[1];
    const ac = i === 1 ? b : a;
    // posts + counter
    s += `<path d="M${x - w / 2 + 3} ${y}V${y - hgt - 6}M${x + w / 2 - 3} ${y}V${y - hgt - 6}" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="2.6"/>`;
    s += face(c, `M${x - w / 2 + 2} ${y}h${w - 4}v-14h${-(w - 4)}z`, c.col('#8a6238', 0.85, dep), 'pPlank');
    // goods on counter
    const gp = goods[(i + c.goodsSeed || 0) % goods.length];
    let gd = '';
    for (let k = 0; k < 7; k++) gd += `<circle cx="${f1(x - w / 2 + 8 + k * 8.5)}" cy="${f1(y - 16 - (k % 2) * 2)}" r="${f1(3.4 + r() * 1.2)}" fill="${c.col(gp[k % 2], 1, dep)}"/>`;
    s += gd;
    // striped awning sloping towards viewer with scalloped edge
    const ax0 = x - w / 2 - 6, ax1 = x + w / 2 + 6, ay0 = y - hgt - 10, ay1 = y - hgt + 6;
    s += P(`M${f1(ax0 + 6)} ${f1(ay0)}H${f1(ax1 - 6)}L${f1(ax1)} ${f1(ay1)}H${f1(ax0)}Z`, c.col(ac, 0.92, dep));
    let stp = '';
    for (let k = 0; k < 6; k++) { const t0 = k / 6, t1 = (k + 0.5) / 6; stp += `M${f1(ax0 + 6 + (ax1 - ax0 - 12) * t0)} ${f1(ay0)}L${f1(ax0 + 6 + (ax1 - ax0 - 12) * t1)} ${f1(ay0)}L${f1(ax0 + (ax1 - ax0) * t1)} ${f1(ay1)}L${f1(ax0 + (ax1 - ax0) * t0)} ${f1(ay1)}Z`; }
    s += P(stp, c.col(ac === a ? b : a, 0.92, dep));
    let sc = `M${f1(ax0)} ${f1(ay1)}`;
    for (let k = 0; k < 8; k++) sc += `q${f1((ax1 - ax0) / 16)} 7 ${f1((ax1 - ax0) / 8)} 0`;
    s += P(sc + 'Z', c.col(ac, 0.75, dep));
    s += P(`M${f1(ax0 + 6)} ${f1(ay0)}H${f1(ax1 - 6)}L${f1(ax1)} ${f1(ay1)}H${f1(ax0)}Z`, c.url('roofsh'));
    if (c.pal.winter) s += P(`M${f1(ax0 + 6)} ${f1(ay0)}H${f1(ax1 - 6)}l2 5H${f1(ax0 + 4)}z`, '#f2f5f8');
  }
  s += sack(c, -130, 4, 1.1) + sack(c, -118, 6, 1, '#b8a070') + barrel(c, 128, 5, 1.1) + crate(c, 112, 6, 1.1) + crate(c, 140, -8, 0.9, '#7a6040');
  s += crowd(c, -120, 120, 12, 6, 1.05);
  addTorch(c, -150, -30); addTorch(c, 150, -30);
  return { svg: s, top: -80 };
};

B.shipyard = (c, st) => {
  const dep = c.dep || 0;
  let s = '';
  // shed with open front
  const shed = house(c, st, { w: 90, h: 34, d: 60, rh: 30, door: false, side: -1, smokeHole: false, dragon: false, bow: 0 });
  s += `<g transform="translate(-118 -6)">${shed.svg}<rect x="-34" y="-30" width="68" height="28" fill="${c.col('#1e140c', 0.8, dep)}"/>${logs(c, -18, 0, 0.8, 3)}</g>`;
  // hull on stocks
  const hx = 30, hy = -16, L = 230;
  const hull = `M${hx - L / 2} ${hy - 30}Q${hx - L / 2 + 10} ${hy + 4} ${hx - L / 2 + 50} ${hy + 8}H${hx + L / 2 - 50}Q${hx + L / 2 - 10} ${hy + 4} ${hx + L / 2} ${hy - 30}`;
  // keel blocks / props
  let props = '';
  for (let i = -3; i <= 3; i++) props += `M${hx + i * 30 - 6} 2h12v${f1(hy + 8 - 2)}h-12z`;
  s += P(props, c.col('#5a4028', 0.8, dep));
  s += `<path d="M${hx - 90} 2L${hx - 70} ${hy - 6}M${hx + 90} 2L${hx + 70} ${hy - 6}M${hx - 40} 2l10 ${hy - 4}M${hx + 40} 2l-10 ${hy - 4}" stroke="${c.col('#5a4028', 0.85, dep)}" stroke-width="3"/>`;
  // lower strakes planked
  s += P(`${hull}Q${hx + L / 2 - 30} ${hy - 6} ${hx + L / 2 - 60} ${hy - 6}H${hx - L / 2 + 60}Q${hx - L / 2 + 30} ${hy - 6} ${hx - L / 2} ${hy - 30}Z`, c.col('#9a6e40', 0.95, dep));
  s += `<path d="M${hx - L / 2 + 30} ${hy}H${hx + L / 2 - 30}M${hx - L / 2 + 16} ${hy - 10}Q${hx} ${hy - 2} ${hx + L / 2 - 16} ${hy - 10}" stroke="${c.col('#4a3020', 0.9, dep)}" stroke-width="1.4" fill="none"/>`;
  // bare ribs above
  let ribs = '';
  for (let i = -5; i <= 5; i++) { const x = hx + i * 17, hh = 30 + Math.abs(i) * 3; ribs += `M${x} ${hy - 4}q${i * 1.5} ${-hh * 0.6} ${i * 3} ${-hh}`; }
  s += `<path d="${ribs}" stroke="${c.col('#b08a5a', 1, dep)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // stems
  s += `<path d="M${hx - L / 2} ${hy - 30}q-10 -24 4 -44M${hx + L / 2} ${hy - 30}q10 -24 -4 -44" stroke="${c.col('#8a5a30', 0.95, dep)}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  // scaffold
  s += `<path d="M${hx - 70} 2v-70M${hx + 70} 2v-70M${hx - 76} -48h152" stroke="${c.col('#6a4a2a', 0.9, dep)}" stroke-width="2.6"/>`;
  s += figure(c, hx - 20, -48, 0.85, { arm: [5, -6], tool: [3, -4] }) + figure(c, hx + 100, 2, 0.95, { arm: [6, -3], tool: [4, -5] });
  s += logs(c, hx + 140, 4, 1, 6);
  addSmoke(c, -150, -20, 0.6, { puffs: 3 });
  return { svg: s, top: -110 };
};

B.altar = (c, st) => {
  const t = st.temple;
  return (TEMPLE[t] || TEMPLE.stave)(c, st);
};

const TEMPLE = {};
TEMPLE.stave = (c, st) => { // tiered stave temple with dragon heads
  const dep = c.dep || 0, sd = c.sunSide;
  const wall = '#4a3424', roof = '#3a302a';
  const L = (k) => c.col(wall, k, dep), R = (k) => c.col(roof, k, dep);
  let s = '';
  if (!c.pal.night) s += `<ellipse cx="${-sd * 14}" cy="0" rx="76" ry="7" fill="#000" opacity=".22"/>`;
  const tier = (w, h, y, rh) => {
    // walls with light/shadow halves
    let g = face(c, `M${-w / 2} ${y}h${w}v${-h}h${-w}z`, L(0.9), 'pPlank');
    g += P(`M${sd > 0 ? 0 : -w / 2} ${y}h${w / 2}v${-h}h${-w / 2}z`, '#fff', ' opacity=".07"');
    // skirt roof (lean-to)
    const snow = c.pal.winter;
    const rf = `M${-w / 2 - 12} ${y - h + 6}L${-w / 2 + 6} ${y - h - rh}H${w / 2 - 6}L${w / 2 + 12} ${y - h + 6}Z`;
    g += P(rf, snow ? c.col('#eef2f6', 0.92, dep) : R(0.95));
    if (!snow) g += P(rf, c.url('pShingle'));
    g += P(`M${sd > 0 ? 0 : -w / 2 - 12} ${y - h + 6}L${sd > 0 ? 0 : -w / 2 + 6} ${y - h - rh}H${sd > 0 ? w / 2 - 6 : 0}L${sd > 0 ? w / 2 + 12 : 0} ${y - h + 6}Z`, '#000', ' opacity=".18"');
    return g;
  };
  s += tier(116, 30, 0, 16);
  s += tier(76, 30, -40, 12);
  // central gable with dragon heads
  const gy = -82;
  s += face(c, `M-30 ${gy}h60v-24l-30 -30l-30 30z`, L(0.95), 'pPlank');
  s += `<path d="M-36 ${gy - 20}L0 ${gy - 58}L36 ${gy - 20}" stroke="${c.pal.winter ? '#eef2f6' : R(0.8)}" stroke-width="6" fill="none" stroke-linejoin="round"/>`;
  s += dragonHead(-34, gy - 24, -1, 1.2, R(0.7)) + dragonHead(34, gy - 24, 1, 1.2, R(0.7));
  // tower and spire
  s += face(c, `M-11 ${gy - 50}h22v-26h-22z`, L(0.9), 'pPlank');
  s += P(`M-16 ${gy - 74}L0 ${gy - 126}L16 ${gy - 74}Z`, c.pal.winter ? c.col('#eef2f6', 0.92, dep) : R(0.95));
  s += P(`M${sd > 0 ? 0 : -16} ${gy - 74}L0 ${gy - 126}L${sd > 0 ? 16 : 0} ${gy - 74}Z`, '#000', ' opacity=".2"');
  s += dragonHead(-14, gy - 78, -1, 0.8, R(0.7)) + dragonHead(14, gy - 78, 1, 0.8, R(0.7));
  s += `<path d="M-46 0v-12M46 0v-12" stroke="${L(0.6)}" stroke-width="4"/>`;
  s += door(c, 0, 0, 14, 24, st, { arch: true });
  s += windowRect(c, -2, gy - 12, 4, 6);
  // fire bowl
  s += `<path d="M-74 2l4 -10h14l4 10z" fill="${c.col('#5a5248', 0.9, dep)}"/>`;
  const [fx, fy] = at(c, -63, -10);
  c.anims.push(torch(c, fx, fy, c.cur.s * 1.3));
  addSmoke(c, -63, -16, 0.5, { puffs: 3, color: '#9a9590' });
  return { svg: s, top: gy - 134 };
};
TEMPLE.horg = (c, st) => { // Gotland: stone hörgr with picture stones and a carved pillar
  const dep = c.dep || 0;
  let s = `<path d="M-80 0Q-70 -20 -40 -22H40Q70 -20 80 0Z" fill="${c.col(st.stone, 0.8, dep)}"/><path d="M-80 0Q-70 -20 -40 -22H40Q70 -20 80 0Z" fill="${c.url('pStone')}"/>`;
  const pic = (x, h, w) => {
    let g = P(`M${x - w / 2} -18V${-18 - h + w / 2}A${w / 2} ${w / 2.2} 0 0 1 ${x + w / 2} ${-18 - h + w / 2}V-18Z`, c.col('#d6cdb6', 0.95, dep));
    g += P(`M${x + (c.sunSide > 0 ? 0 : -w / 2)} -18V${-18 - h + w / 2}A${w / 2} ${w / 2.2} 0 0 ${c.sunSide > 0 ? 1 : 0} ${x + (c.sunSide > 0 ? w / 2 : -w / 2)} ${-18 - h + w / 2}V-18Z`, '#000', ' opacity=".14"');
    // carved ship and spirals
    g += `<path d="M${x - w * 0.32} ${-18 - h * 0.35}q${w * 0.32} ${w * 0.18} ${w * 0.64} 0M${x} ${-18 - h * 0.35}v${-h * 0.22}l${w * 0.22} ${h * 0.16}M${x - w * 0.2} ${-18 - h * 0.72}a${w * 0.12} ${w * 0.12} 0 1 1 ${w * 0.4} 0" stroke="${c.col('#8a2a20', 1, dep)}" stroke-width="2" fill="none"/>`;
    return g;
  };
  s += pic(-40, 70, 30) + pic(42, 58, 26);
  s += `<path d="M2 -20V-112" stroke="${c.col('#5a3a22', 0.9, dep)}" stroke-width="9"/><path d="M-4 -96h12M-4 -78h12" stroke="${c.col('#2a1a10', 1, dep)}" stroke-width="2"/><circle cx="2" cy="-114" r="7" fill="${c.col('#5a3a22', 0.9, dep)}"/>`;
  s += `<path d="M-16 -18l4 -10h14l4 10z" fill="${c.col('#4a4440', 0.9, dep)}"/>`;
  const [fx, fy] = at(c, -5, -30); c.anims.push(torch(c, fx, fy, c.cur.s * 1.3));
  addSmoke(c, -5, -34, 0.5, { puffs: 3 });
  return { svg: s, top: -128 };
};
TEMPLE.idol = (c, st) => { // Slavic sanctuary: mound, ring palisade, carved pillar idol
  const dep = c.dep || 0;
  let s = `<path d="M-100 0Q-60 -34 0 -36Q60 -34 100 0Z" fill="${c.col(c.pal.ground, 0.85, dep)}"/>`;
  s += palisade(c, -84, 84, x => -6 - Math.cos(x / 84 * Math.PI / 2) * 22, 22, { step: 8, col: '#7a5a38' });
  s += `<path d="M-9 -30V-140h18V-30Z" fill="${c.col('#7a5230', 0.95, dep)}"/><path d="M${c.sunSide > 0 ? 0 : -9} -30V-140h9V-30Z" fill="#000" opacity=".2"/>`;
  s += `<path d="M-13 -140q13 -22 26 0z" fill="${c.col('#5a3a20', 0.9, dep)}"/><path d="M-5 -126h3M3 -126h3M-3 -116h6M-9 -104h18M-9 -80h18M-6 -70l6 8 6 -8" stroke="${c.col('#2a1a10', 1, dep)}" stroke-width="1.8" fill="none"/>`;
  s += `<circle cx="0" cy="-90" r="4" fill="${c.col('#d0a040', 1, dep)}"/>`;
  for (const x of [-34, 34]) { const [fx, fy] = at(c, x, -40); c.anims.push(torch(c, fx, fy, c.cur.s * 1.1)); s += `<path d="M${x - 7} -32l3 -8h8l3 8z" fill="${c.col('#4a4440', 0.9, dep)}"/>`; }
  return { svg: s, top: -156 };
};
TEMPLE.dome = (c, st) => byzChurch(c, st, 0, 0, 1);
TEMPLE.timberchurch = (c, st) => { // Saxon stave-walled church with west tower
  const dep = c.dep || 0;
  const H = house(c, st, { w: 110, h: 38, d: 50, rh: 40, wk: 'pPlank', wall: '#7a5a3a', side: c.sunSide > 0 ? -1 : 1, door: false, wins: [-30, 0, 30], smokeHole: false, dragon: false, bow: 0 });
  let s = H.svg;
  const tx = c.sunSide > 0 ? 70 : -70;
  s += tower(c, tx, 0, 40, 76, { col: '#8a6a44', pat: 'pPlank', roof: '#5a4a3a', rh: 40, win: true });
  s += door(c, tx, 0, 12, 22, st, { arch: true });
  s += `<path d="M${tx + 4} -160v-22M${tx - 4} -174h16" stroke="${c.col('#3a2a1a', 1, dep)}" stroke-width="2.5"/>`;
  s += crossStone(c, c.sunSide > 0 ? -84 : 84, 0, 0.8);
  return { svg: s, top: -186 };
};
TEMPLE.abbey = (c, st) => { // Frankish stone abbey church with apse and crossing tower
  const dep = c.dep || 0;
  const side = c.sunSide > 0 ? -1 : 1;
  const H = house(c, st, { w: 170, h: 56, d: 64, rh: 44, wk: 'pStone', wall: st.stone, side, door: false, smokeHole: false, dragon: false, bow: 0, wins: [] });
  let s = H.svg;
  for (const x of [-60, -30, 0, 30, 60]) s += `<path d="M${x - 5} -18v-18q5 -7 10 0v18z" fill="${winGlow(c)}"/>` + (nightish(c) ? `<circle cx="${x}" cy="-28" r="12" fill="${c.url('glow')}" opacity=".6"/>` : '');
  s += `<path d="M-85 0v-56M-42 0v-56M0 0v-56M42 0v-56M85 0v-56" stroke="#000" stroke-opacity=".12" stroke-width="5"/>`;
  // crossing tower
  s += tower(c, side * 20, -56, 48, 62, { col: st.stone, pat: 'pStone', roof: st.roof, rh: 46, side: -side });
  for (const x of [side * 20 - 12, side * 20 + 4]) s += `<path d="M${x} -96v-12q4 -6 8 0v12z" fill="#1a1410"/>`;
  s += `<path d="M${side * 20 + 4} -168v-22M${side * 20 - 4} -182h16" stroke="${c.col('#3a2a1a', 1, dep)}" stroke-width="2.5"/>`;
  // west front
  const wx = -side * 85;
  s += face(c, `M${wx - 22} 0h44v-74l-22 -20l-22 20z`, c.col(st.stone, 0.98, dep), 'pStone');
  s += door(c, wx, 0, 14, 26, st, { arch: true });
  s += `<circle cx="${wx}" cy="-56" r="6" fill="${winGlow(c)}" stroke="${c.col('#6a5a40', 1, dep)}" stroke-width="2"/>`;
  // cloister wall
  s += stoneWall(c, side * 85, side * 85 + side * 60, () => 0, 22, { col: st.stone, pat: 'pStone' });
  return { svg: s, top: -192 };
};
TEMPLE.minster = (c, st) => { // Anglo-Norse stone minster: nave, aisles, tower
  const dep = c.dep || 0;
  const side = c.sunSide > 0 ? -1 : 1;
  let s = house(c, st, { w: 150, h: 48, d: 60, rh: 40, wk: 'pStone', wall: '#b0a48e', roof: '#6a5a4a', rk: 'shingle', side, door: false, smokeHole: false, dragon: false, bow: 0, wins: [] }).svg;
  for (const x of [-50, -18, 18, 50]) s += `<path d="M${x - 4} -16v-16q4 -6 8 0v16z" fill="${winGlow(c)}"/>`;
  const tx = -side * 92;
  s += tower(c, tx, 0, 52, 120, { col: '#b0a48e', pat: 'pStone', kind: 'cren' });
  for (const y of [-90, -60]) s += `<path d="M${tx - 5} ${y}v-12q5 -7 10 0v12z" fill="${winGlow(c)}"/>`;
  s += door(c, tx, 0, 14, 26, st, { arch: true });
  s += `<path d="M${tx} -128v-26M${tx - 8} -146h16" stroke="${c.col('#3a2a1a', 1, dep)}" stroke-width="2.5"/>`;
  return { svg: s, top: -160 };
};
TEMPLE.roundtower = (c, st) => { // Gael: stone oratory with steep stone roof, round tower, high cross
  const dep = c.dep || 0;
  const side = c.sunSide > 0 ? -1 : 1;
  let s = gableHouse(c, st, { w: 54, h: 34, d: 70, rh: 44, wall: '#8a877e', front: '#9a978c', wk: 'pStone', fwk: 'pStone', roof: '#6a6862', rk: 'slate', side, arch: true, doorW: 10, doorH: 20 }).svg;
  const tx = -side * 66, tw = 26, th = 150;
  const g = vgrad(c, 'rtw', [[0, c.col('#9a978c', 1.05, dep)], [1, c.col('#9a978c', 0.55, dep)]], 1, 0);
  s += `<path d="M${tx - tw / 2} 0L${tx - tw / 2 + 2} ${-th}H${tx + tw / 2 - 2}L${tx + tw / 2} 0Z" fill="${c.sunSide > 0 ? `url(#${c.id('rtw')})` : g}"/>`;
  if (c.sunSide > 0) c.def('rtw', `<linearGradient id="${c.id('rtw')}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${c.col('#9a978c', 1.05, dep)}"/><stop offset="1" stop-color="${c.col('#9a978c', 0.55, dep)}"/></linearGradient>`);
  s += P(`M${tx - tw / 2} 0L${tx - tw / 2 + 2} ${-th}H${tx + tw / 2 - 2}L${tx + tw / 2} 0Z`, c.url('pStone'));
  s += P(`M${tx - tw / 2 + 1} ${-th}L${tx} ${-th - 34}L${tx + tw / 2 - 1} ${-th}Z`, c.pal.winter ? '#eef2f6' : c.col('#6a6862', 0.9, dep));
  for (const y of [-40, -90, -130]) s += `<rect x="${tx - 2.5}" y="${y}" width="5" height="9" fill="#1a1410"/>`;
  s += highCross(c, side * 52, 0, 1);
  return { svg: s, top: -th - 40 };
};
TEMPLE.grove = (c, st) => { // Aesti sacred oak: carved posts, stones, fire
  const dep = c.dep || 0;
  let s = `<ellipse cx="0" cy="-2" rx="90" ry="10" fill="${c.col(c.pal.groundDark, 0.9, dep)}" opacity=".5"/>`;
  s += broadTree(c, 0, 0, 170, { puffs: 9, depth: dep, color: c.pal.winter ? '#3a4a30' : '#4a6a2a', ever: c.pal.winter });
  for (const x of [-62, -38, 40, 64]) s += `<path d="M${x - 4} 0V-46l4 -6 4 6V0Z" fill="${c.col('#6a4a2a', 0.9, dep)}"/><path d="M${x - 2} -40h4M${x - 2} -30h4" stroke="#1a1008" stroke-width="1.4"/>`;
  for (const x of [-80, 80, -20, 22]) s += `<ellipse cx="${x}" cy="0" rx="8" ry="5" fill="${c.col('#8a867c', 0.9, dep)}"/>`;
  s += `<path d="M-6 0l2 -6h10l2 6z" fill="${c.col('#4a4440', 0.9, dep)}"/>`;
  const [fx, fy] = at(c, 2, -10); c.anims.push(torch(c, fx, fy, c.cur.s * 1.5));
  addSmoke(c, 2, -14, 0.6, { puffs: 3 });
  s += `<path d="M-30 -60l60 0" stroke="${c.col(st.trim, 1, dep)}" stroke-width="2" opacity=".0"/>`;
  return { svg: s, top: -176 };
};
TEMPLE.wendtemple = (c, st) => { // Wendish temple: red-hung wooden hall, carved posts, many-faced idol
  const dep = c.dep || 0;
  let s = palisade(c, -96, 96, () => 0, 26, { step: 8, col: '#5a4232' });
  const H = gableHouse(c, st, { w: 84, h: 52, d: 80, rh: 50, wall: '#8a1e1e', front: '#a32424', wk: 'pPlank', fwk: 'pPlank', roof: '#3a302a', side: c.sunSide > 0 ? -1 : 1, door: false });
  s += `<g transform="translate(0 -10)">${H.svg}`;
  s += `<rect x="-14" y="-44" width="28" height="44" fill="${nightish(c) ? '#3a1408' : '#1a0c08'}"/>`;
  // idol with four faces visible through the doorway
  s += `<path d="M-5 0v-36h10v36z" fill="${c.col('#c8a060', 1, dep)}"/><path d="M-7 -36h14l-2 -6h-10z" fill="${c.col('#8a6a3a', 1, dep)}"/><path d="M-3 -30h2M1 -30h2M-2 -25h4" stroke="#2a1a10" stroke-width="1.2"/>`;
  s += `<path d="M-46 0v-56M46 0v-56" stroke="${c.col('#2a1a10', 0.9, dep)}" stroke-width="5"/><path d="M-50 -56h8M42 -56h8" stroke="${c.col(st.trim, 1, dep)}" stroke-width="3"/></g>`;
  addFlag(c, 0, -150, 30, 16, st.banner, { tail: true });
  s += `<path d="M0 -112v-40" stroke="${c.col('#2a1a10', 1, dep)}" stroke-width="2.4"/>`;
  addTorch(c, -50, -70); addTorch(c, 50, -70);
  return { svg: s, top: -160 };
};

function crossStone(c, x, y, s = 1) {
  const dep = c.dep || 0;
  return `<path d="M${x - 3 * s} ${y}v${-26 * s}h${-7 * s}v${-6 * s}h${7 * s}v${-7 * s}h${6 * s}v${7 * s}h${7 * s}v${6 * s}h${-7 * s}v${26 * s}z" fill="${c.col('#8a867c', 0.9, dep)}"/>`;
}
function highCross(c, x, y, s = 1) {
  const dep = c.dep || 0, col = c.col('#9a968a', 0.95, dep);
  return `<path d="M${x - 5 * s} ${y}v${-44 * s}h${-14 * s}v${-9 * s}h${14 * s}v${-12 * s}h${10 * s}v${12 * s}h${14 * s}v${9 * s}h${-14 * s}v${44 * s}z" fill="${col}"/><circle cx="${x}" cy="${y - 48 * s}" r="${11 * s}" fill="none" stroke="${col}" stroke-width="${3.5 * s}"/><path d="M${x - 8 * s} ${y}h${16 * s}v${-6 * s}h${-16 * s}z" fill="${c.col('#7a766a', 0.9, dep)}"/>`;
}

B.runecarver = (c, st) => {
  const dep = c.dep || 0;
  const hut = house(c, st, { w: 70, h: 26, d: 44, rh: 26, wins: [], side: c.sunSide > 0 ? -1 : 1, bow: 1, dragon: false });
  let s = `<g transform="translate(-52 -4)">${hut.svg}</g>`;
  const stone = (x, h, w, lean, carve) => {
    let g = P(`M${x - w / 2} 2Q${x - w / 2 - 3} ${-h * 0.6} ${x - w * 0.3 + lean} ${-h}Q${x + lean} ${-h - 8} ${x + w * 0.35 + lean} ${-h + 4}Q${x + w / 2 + 3} ${-h * 0.5} ${x + w / 2} 2Z`, c.col('#9a958a', 0.95, dep));
    g += P(`M${x + (c.sunSide > 0 ? 0 : -w / 2)} 2Q${x + (c.sunSide > 0 ? 0 : -w / 2)} ${-h * 0.6} ${x + lean} ${-h - 4}L${x + (c.sunSide > 0 ? w * 0.35 : -w * 0.3) + lean} ${-h + 2}Q${x + (c.sunSide > 0 ? w / 2 + 3 : -w / 2 - 3)} ${-h * 0.5} ${x + (c.sunSide > 0 ? w / 2 : -w / 2)} 2Z`, '#000', ' opacity=".16"');
    if (carve) { // serpent band painted red, with rune ticks
      g += `<path d="M${x - w * 0.32} -2Q${x - w * 0.4} ${-h * 0.7} ${x + lean * 0.8} ${-h * 0.86}Q${x + w * 0.36} ${-h * 0.6} ${x + w * 0.3} -2" stroke="${c.col('#b0281e', 1, dep)}" stroke-width="3.2" fill="none"/>`;
      let t = '';
      for (let i = 0; i < 9; i++) { const yy = -6 - i * h * 0.075; t += `M${x - w * 0.36 + i * 0.4} ${yy}l3 -2`; }
      g += `<path d="${t}" stroke="${c.col('#2a1a10', 1, dep)}" stroke-width="1.2"/>`;
      g += `<circle cx="${x + w * 0.05}" cy="${-h * 0.45}" r="${w * 0.12}" fill="none" stroke="${c.col('#1a3a6a', 1, dep)}" stroke-width="2"/>`;
    }
    return g;
  };
  s += stone(22, 70, 34, 3, true) + stone(62, 52, 28, -2, true) + stone(92, 36, 22, 1, false);
  s += figure(c, 42, 4, 1, { arm: [-6, -2], tool: [-3, -4] });
  s += `<path d="M84 4l6 -3 12 0 4 3z" fill="${c.col('#8a857a', 0.9, dep)}"/>`;
  addSmoke(c, -52 + hut.smoke[0], -4 + hut.smoke[1], 0.6);
  return { svg: s, top: -90 };
};

B.guild = (c, st) => {
  const dep = c.dep || 0;
  let H, s = '';
  if (st.hallKind === 'palace') H = gableHouse(c, st, { w: 100, h: 54, d: 90, rk: 'pTile', front: '#ddd0b4', fwk: 'pAshlar', door: false });
  else H = house(c, st, { w: 150, h: 40, d: 66, rh: 40, door: false, wins: [50], side: c.sunSide > 0 ? 1 : -1, beams: st.beams });
  s += H.svg;
  // open workshop front with forge glow
  const gx = st.hallKind === 'palace' ? 0 : -24;
  s += `<path d="M${gx - 34} 0v-30h68v30z" fill="${c.col('#1c120a', 0.8, dep)}"/>`;
  s += `<ellipse cx="${gx - 14}" cy="-8" rx="16" ry="9" fill="#ff8a2a" opacity=".85"/><circle cx="${gx - 14}" cy="-10" r="34" fill="${c.url('glow')}" opacity=".8"/>`;
  s += `<path d="M${gx + 6} -2h14v-6h4v-4h-20v4h2z" fill="${c.col('#3a3a40', 1, dep)}"/>`;
  s += figure(c, gx + 18, 0, 0.95, { arm: [-2, -9], tool: [-2, -5], col: '#5b3a22' });
  // hanging sign: hammer and tongs
  s += `<path d="M${gx + 40} -36h22M${gx + 52} -36v4" stroke="${c.col('#3a2616', 0.9, dep)}" stroke-width="2.4"/><rect x="${gx + 42}" y="-32" width="20" height="15" rx="2" fill="${c.col('#c8a868', 1, dep)}" stroke="${c.col('#4a3020', 1, dep)}"/><path d="M${gx + 46} -20l10 -9M${gx + 53} -31l5 4M${gx + 58} -20l-8 -8" stroke="${c.col('#2a2a30', 1, dep)}" stroke-width="2"/>`;
  // stone chimney
  const cx = st.hallKind === 'palace' ? 30 : -50;
  s += face(c, `M${cx - 8} ${H.ey ?? -40}v-58h16v58z`, c.col(st.stone, 0.95, dep), 'pStone');
  addSmoke(c, cx, (H.ey ?? -40) - 60, 1, { color: c.pal.night ? '#55586a' : '#b8b2aa' });
  // wares: bolts of cloth, pots
  s += `<rect x="${gx + 40}" y="-10" width="10" height="10" fill="${c.col('#5a7aa0', 1, dep)}"/><rect x="${gx + 52}" y="-10" width="10" height="10" fill="${c.col('#a0402a', 1, dep)}"/><path d="M${gx + 66} 0q-2 -10 5 -12q7 2 5 12z" fill="${c.col('#a8643a', 1, dep)}"/>`;
  return { svg: s, top: Math.min(H.top, (H.ey ?? -40) - 70) };
};

B.bank = (c, st) => {
  const dep = c.dep || 0;
  let s = '';
  if (st.hallKind === 'palace') {
    s += byzBlock(c, st, 0, 0, 120, 60, { cols: 4, pediment: true });
  } else {
    const H = house(c, st, { w: 116, h: 54, d: 60, rh: 26, wk: 'pStone', wall: st.stone, roof: st.rk === 'turf' ? '#4a4038' : st.roof, rk: st.rk === 'turf' ? 'shingle' : st.rk, door: false, smokeHole: false, dragon: false, bow: 0, side: c.sunSide > 0 ? 1 : -1 });
    s += H.svg;
    // buttresses
    s += `<path d="M-58 0v-54l-6 6v48zM58 0v-54l6 6v48z" fill="${c.col(st.stone, 0.7, dep)}"/>`;
  }
  // iron-bound door
  s += `<path d="M-15 0v-34q15 -10 30 0v34z" fill="${c.col('#4a3020', 0.9, dep)}"/><path d="M-15 -8h30M-15 -22h30" stroke="${c.col('#2a2a2e', 1, dep)}" stroke-width="3"/>`;
  let studs = ''; for (let i = 0; i < 5; i++) studs += `<circle cx="${-11 + i * 5.5}" cy="-15" r="1.2"/><circle cx="${-11 + i * 5.5}" cy="-28" r="1.2"/>`;
  s += `<g fill="${c.col('#c8c0b0', 1, dep)}">${studs}</g>`;
  // barred windows
  for (const x of [-38, 38]) s += `<rect x="${x - 6}" y="-42" width="12" height="12" fill="${winGlow(c)}"/><path d="M${x - 2} -42v12M${x + 2} -42v12M${x - 6} -36h12" stroke="${c.col('#2a2a2e', 1, dep)}" stroke-width="1.5"/>`;
  // coin sign
  s += `<path d="M30 -60h24M44 -60v4" stroke="${c.col('#3a2616', 0.9, dep)}" stroke-width="2.4"/><circle cx="44" cy="-46" r="10" fill="${c.col('#d8b040', 1.05, dep)}" stroke="${c.col('#8a6a1a', 1, dep)}" stroke-width="1.5"/><path d="M40 -46h8M44 -50v8" stroke="${c.col('#8a6a1a', 1, dep)}" stroke-width="1.5"/>`;
  // guard
  s += figure(c, -30, 2, 1, { col: '#3e4e7a' }) + `<path d="M-25 2v-34" stroke="${c.col('#5a4030', 1, dep)}" stroke-width="1.4"/><path d="M-27 -32l2 -6 2 6z" fill="${c.col('#c8c8d0', 1, dep)}"/><circle cx="-34" cy="-10" r="5" fill="${c.col(st.banner, 1, dep)}" stroke="${c.col('#3a2616', 1, dep)}"/>`;
  addTorch(c, 22, -38);
  return { svg: s, top: -90 };
};

B.moneylender = (c, st) => {
  const dep = c.dep || 0;
  let s = '';
  const H = gableHouse(c, st, { w: 62, h: 62, d: 70, rh: 38, beams: st.wk === 'pWattle' || st.wk === 'pStone', wins: [[-14, -50], [14, -50], [14, -26]], doorX: -14, doorW: 12, doorH: 26, front: st.hallKind === 'palace' ? '#e0d2b4' : (st.front || st.wall), fwk: st.hallKind === 'palace' ? 'pAshlar' : undefined });
  s += H.svg;
  // hanging scales sign
  const bx = -34, by = -66;
  s += `<path d="M${bx + 4} ${by}h-26M${bx - 10} ${by}v5" stroke="${c.col('#3a2616', 0.9, dep)}" stroke-width="2.4"/>`;
  s += `<path d="M${bx - 10} ${by + 5}v16M${bx - 22} ${by + 9}h24M${bx - 22} ${by + 9}l-4 10h8zM${bx + 2} ${by + 9}l-4 10h8z" stroke="${c.col('#c9a04a', 1.05, dep)}" stroke-width="1.6" fill="none"/>`;
  s += `<path d="M${bx - 27} ${by + 19}q5 4 10 0zM${bx - 3} ${by + 19}q5 4 10 0z" fill="${c.col('#c9a04a', 1, dep)}"/>`;
  // table with coin stacks
  s += `<path d="M24 2v-12M48 2v-12M20 -12h32" stroke="${c.col('#6a4a2a', 0.9, dep)}" stroke-width="3"/>`;
  s += `<rect x="26" y="-20" width="6" height="8" fill="${c.col('#d8b040', 1, dep)}"/><rect x="34" y="-17" width="6" height="5" fill="${c.col('#c8c8c0', 1, dep)}"/><rect x="42" y="-22" width="6" height="10" fill="${c.col('#d8b040', 1, dep)}"/>`;
  s += figure(c, 58, 2, 1, { col: '#5a3a5a', hood: '#4a2a4a' });
  addTorch(c, 10, -40);
  addSmoke(c, H.smoke[0], H.smoke[1], 0.7);
  return { svg: s, top: H.top };
};

B.warehouse = (c, st) => {
  const dep = c.dep || 0;
  let s = '';
  const H = st.hallKind === 'palace'
    ? house(c, st, { w: 180, h: 50, d: 60, rh: 24, rk: 'pTile', door: false, smokeHole: false, side: c.sunSide > 0 ? 1 : -1 })
    : house(c, st, { w: 180, h: 46, d: 74, rh: 40, door: false, smokeHole: false, dragon: false, bow: 1, side: c.sunSide > 0 ? 1 : -1 });
  s += H.svg;
  // big open double doors with crates inside
  s += `<rect x="-30" y="-38" width="44" height="38" fill="${c.col('#1c140c', 0.8, dep)}"/>`;
  s += crate(c, -20, -1, 0.9, '#7a5a38') + crate(c, -6, -1, 0.9, '#6a4a30') + crate(c, -13, -14, 0.8, '#7a5a38');
  s += `<path d="M-30 0v-38l-12 4v38zM14 0v-38l12 4v38z" fill="${c.col('#7a5a38', 0.95, dep)}"/>`;
  // hoist beam
  s += `<path d="M58 -46v-50h40" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="5" fill="none"/><path d="M58 -80l18 -16" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="3"/><path d="M94 -96v40" stroke="${c.col('#3a3028', 1, dep)}" stroke-width="1.2"/>`;
  s += sack(c, 94, -42, 1.1, '#b8a070');
  // crates and barrels outside
  s += crate(c, 64, 4, 1.2) + crate(c, 82, 4, 1.2, '#8a6440') + crate(c, 72, -13, 1.1) + barrel(c, -64, 4, 1.2) + barrel(c, -78, 4, 1.2) + barrel(c, -71, -12, 1.1) + sack(c, -94, 4, 1.1);
  s += figure(c, 40, 4, 1, { arm: [4, -10], col: '#d9c59a' });
  return { svg: s, top: H.top };
};

// ---------- Byzantine kit ----------
function byzBlock(c, st, x, y, w, h, o = {}) {
  const dep = c.dep || 0;
  let s = '';
  const H = house(c, st, { w, h, d: w * 0.35, rh: 22, rk: 'pTile', wk: 'pAshlar', door: false, smokeHole: false, dragon: false, bow: 0, side: c.sunSide > 0 ? 1 : -1 });
  s += `<g transform="translate(${x} ${y})">${H.svg}`;
  // colonnade
  const n = o.cols || 6;
  let cols = '';
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + 10 + i * (w - 20) / (n - 1);
    cols += `<rect x="${f1(cx - 3.5)}" y="${-h + 8}" width="7" height="${h - 10}" fill="${c.col('#f4ece0', 1, dep)}"/><rect x="${f1(cx - 5)}" y="${-h + 6}" width="10" height="4" fill="${c.col('#d8ccb0', 1, dep)}"/>`;
    if (i < n - 1) cols += `<path d="M${f1(cx + 3.5)} ${-h + 16}Q${f1(cx + (w - 20) / (n - 1) / 2)} ${-h + 4} ${f1(cx + (w - 20) / (n - 1) - 3.5)} ${-h + 16}V${-2}H${f1(cx + 3.5)}Z" fill="${nightish(c) ? '#5a3418' : c.col('#6a5a48', 0.55, dep)}"/>`;
  }
  s += cols;
  if (o.pediment) s += P(`M${-w / 2 - 4} ${-h}L0 ${-h - 26}L${w / 2 + 4} ${-h}Z`, c.col('#efe6d4', 0.95, dep)) + `<path d="M${-w / 2 - 4} ${-h}L0 ${-h - 26}L${w / 2 + 4} ${-h}Z" fill="none" stroke="${c.col('#c8b890', 1, dep)}" stroke-width="2"/>`;
  if (o.dome) s += dome(c, 0, -h - 18, o.dome, { drum: 16 });
  s += '</g>';
  return s;
}
function byzStoa(c, st, x, y, w, h) {
  const dep = c.dep || 0;
  let s = P(`M${x - w / 2} ${y}h${w}v${-h}h${-w}z`, c.col('#e2d6bc', 0.6, dep));
  s += P(`M${x - w / 2 - 6} ${y - h}h${w + 12}l-10 -14h${-w + 8}z`, c.col(st.roof, 0.9, dep)) + P(`M${x - w / 2 - 6} ${y - h}h${w + 12}l-10 -14h${-w + 8}z`, c.url('pTile'));
  for (let i = 0; i <= 10; i++) s += `<rect x="${f1(x - w / 2 + i * w / 10 - 3)}" y="${y - h}" width="6" height="${h}" fill="${c.col('#f4ece0', 1, dep)}"/>`;
  return s;
}
function dome(c, x, y, r, o = {}) {
  const dep = c.dep || 0, sd = c.sunSide;
  const col = o.col || '#b8a890';
  let s = '';
  if (o.drum) {
    s += face(c, `M${x - r * 0.92} ${y + o.drum}V${y}H${x + r * 0.92}V${y + o.drum}Z`, c.col('#e6dcc6', 0.92, dep), 'pAshlar');
    const n = Math.max(6, Math.round(r / 6));
    let wn = '';
    for (let i = 0; i < n; i++) { const wx = x - r * 0.8 + i * (r * 1.6) / (n - 1); wn += `<path d="M${f1(wx - 2)} ${f1(y + o.drum - 3)}v${f1(-o.drum * 0.55)}q2 -3 4 0v${f1(o.drum * 0.55)}z"/>`; }
    s += `<g fill="${winGlow(c)}">${wn}</g>`;
  }
  const g = rgrad(c, 'domeg' + (o.gold ? 'g' : ''), [[0, c.col(o.gold ? '#f0d890' : lighten(col, 0.35), 1.08, dep)], [0.55, c.col(col, 0.95, dep)], [1, c.col(col, 0.5, dep)]], `cx="${sd > 0 ? 0.68 : 0.32}" cy=".3" r=".85"`);
  s += `<path d="M${f1(x - r)} ${f1(y)}A${f1(r)} ${f1(r * (o.flat || 0.82))} 0 0 1 ${f1(x + r)} ${f1(y)}Z" fill="${c.pal.winter && !o.gold ? c.col('#eef2f6', 0.95, dep) : g}"/>`;
  if (o.ribs !== false) {
    let rb = '';
    for (let i = 1; i < 8; i++) { const t = i / 8; rb += `M${f1(x - r + 2 * r * t)} ${f1(y)}Q${f1(x - r + 2 * r * t + (x - (x - r + 2 * r * t)) * 0.6)} ${f1(y - r * 0.7)} ${f1(x)} ${f1(y - r * (o.flat || 0.82))}`; }
    s += `<path d="${rb}" stroke="#000" stroke-opacity=".12" stroke-width="1.4" fill="none"/>`;
  }
  s += `<path d="M${f1(x)} ${f1(y - r * (o.flat || 0.82))}v-14M${f1(x - 5)} ${f1(y - r * (o.flat || 0.82) - 9)}h10" stroke="${c.col('#c9a04a', 1.1, dep)}" stroke-width="2.2"/>`;
  return s;
}
function byzChurch(c, st, x, y, k = 1) {
  const dep = c.dep || 0;
  let s = `<g transform="translate(${x} ${y}) scale(${k})">`;
  s += house(c, st, { w: 130, h: 50, d: 60, rh: 22, rk: 'pTile', wk: 'pAshlar', door: false, smokeHole: false, dragon: false, bow: 0, side: c.sunSide > 0 ? 1 : -1 }).svg;
  s += `<path d="M-60 0v-50M-20 0v-50M20 0v-50M60 0v-50" stroke="#a89878" stroke-opacity=".35" stroke-width="2"/>`;
  for (const wx of [-40, 0, 40]) s += `<path d="M${wx - 5} -14v-20q5 -8 10 0v20z" fill="${winGlow(c)}"/>`;
  // apse
  s += `<path d="M65 0V-40A22 22 0 0 1 65 0" fill="${c.col('#e6dcc6', c.sunSide > 0 ? 1.02 : 0.6, dep)}"/>`;
  s += dome(c, 0, -76, 40, { drum: 18 });
  s += door(c, -40, 0, 12, 22, st, { arch: true });
  s += '</g>';
  return s;
}

// ---------- ships, boats, quays ----------
export function longship(c, x, y, s = 1, o = {}) {
  const dep = o.depth ?? 0, dir = o.facing ?? 1;
  const L = 300;
  const hullC = o.hull || '#3e2c1e';
  const g = [];
  g.push(`<path d="M-150 -40Q-140 8 -95 12H95Q140 8 150 -40Q130 -10 95 -12H-95Q-130 -10 -150 -40Z" fill="${c.col(hullC, 0.85, dep)}"/>`);
  g.push(`<path d="M-140 -26Q-110 0 -80 2H80Q110 0 140 -26M-130 -14Q-100 6 -70 7H70Q100 6 130 -14" stroke="${c.col('#1a120a', 1, dep)}" stroke-width="1.6" fill="none" opacity=".6"/>`);
  g.push(`<path d="M-150 -40Q-140 -8 -95 -12H95Q140 -8 150 -40" stroke="${c.col('#7a5a3a', 1.1, dep)}" stroke-width="2.4" fill="none"/>`);
  // stems: dragon prow, curled stern
  g.push(`<path d="M150 -40q14 -30 2 -58q-4 -10 -14 -6q8 4 6 12q-10 2 -6 10" stroke="${c.col(hullC, 0.85, dep)}" stroke-width="7" fill="none" stroke-linecap="round"/>`);
  g.push(`<path d="M-150 -40q-12 -26 -2 -46q6 -8 12 -2q-6 0 -6 8" stroke="${c.col(hullC, 0.85, dep)}" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  if (o.shields !== false) {
    let sh = '';
    const cols = o.shieldCols || ['#a3302a', '#e8d8b0', '#24467a', '#c9a04a'];
    for (let i = 0; i < 12; i++) { const sx = -100 + i * 18; sh += `<circle cx="${sx}" cy="-14" r="8" fill="${c.col(cols[i % cols.length], 0.95, dep)}" stroke="${c.col('#2a1a10', 1, dep)}" stroke-width="1.2"/><circle cx="${sx}" cy="-14" r="2" fill="${c.col('#c9a04a', 1, dep)}"/>`; }
    g.push(sh);
  }
  if (o.sail !== 'none') {
    g.push(`<path d="M0 -14V-190" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="5"/><path d="M-60 -170L0 -190L60 -170" stroke="${c.col('#2a1a10', 1, dep)}" stroke-width="1" fill="none" opacity=".6"/>`);
    g.push(`<path d="M0 -190L-150 -42M0 -190L148 -44" stroke="${c.col('#2a1a10', 1, dep)}" stroke-width="1" opacity=".5"/>`);
    const sc = o.sailCols || ['#a3302a', '#efe2c4'];
    if (o.sail === 'set') {
      const top = -180, bot = -50, w = 92;
      g.push(`<path d="M${-w} ${top}H${w}Q${w + 14} ${(top + bot) / 2} ${w - 4} ${bot}H${-w + 4}Q${-w + 14} ${(top + bot) / 2} ${-w} ${top}Z" fill="${c.col(sc[1], 0.95, dep)}"/>`);
      let stp = '';
      for (let i = 0; i < 5; i += 2) { const x0 = -w + i * w * 2 / 5, x1 = x0 + w * 2 / 5; stp += `M${f1(x0)} ${top}H${f1(x1)}L${f1(x1 + 6)} ${bot}H${f1(x0 + 6)}Z`; }
      g.push(`<path d="${stp}" fill="${c.col(sc[0], 0.95, dep)}"/>`);
      g.push(`<path d="M${-w} ${top}H${w}Q${w + 14} ${(top + bot) / 2} ${w - 4} ${bot}H${-w + 4}Q${-w + 14} ${(top + bot) / 2} ${-w} ${top}Z" fill="${c.url('roofsh')}"/><path d="M${-w - 6} ${top}H${w + 6}" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="5"/>`);
    } else {
      g.push(`<path d="M-86 -178Q0 -170 86 -178L84 -168Q0 -160 -84 -168Z" fill="${c.col(sc[1], 0.95, dep)}"/><path d="M-60 -177l6 9M-30 -174l6 8M0 -174l6 8M30 -174l6 8M60 -177l6 9" stroke="${c.col(sc[0], 0.95, dep)}" stroke-width="5"/><path d="M-92 -180H92" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="4"/>`);
    }
    if (o.vane) g.push(flagStatic(c, 0, -192, 20, 10, sc[0], dep));
  }
  if (o.oars) { let od = ''; for (let i = 0; i < 9; i++) od += `M${-80 + i * 20} -6l${-14} 34`; g.push(`<path d="${od}" stroke="${c.col('#8a6a40', 0.9, dep)}" stroke-width="2.4"/>`); }
  const body = g.join('');
  const tr = `translate(${f1(x)} ${f1(y)}) scale(${f1(s * dir)} ${f1(s)})`;
  return { body, tr, svg: `<g transform="${tr}">${body}</g>` };
}
function flagStatic(c, x, y, L, H, col, dep = 0) { return `<path d="M${x} ${y}l${L} ${H * 0.3}l${-L * 0.1} ${H * 0.4}l${-L * 0.9} ${H * 0.3}z" fill="${c.col(col, 1, dep)}"/>`; }

// moored, bobbing ship (animated, so it goes to the anim layer) + static reflection
function mooredShip(c, x, y, s, o = {}) {
  const sh = longship(c, x, y, s, o);
  const refl = `<g transform="translate(${f1(x)} ${f1(y + 6 * s)}) scale(${f1(s * (o.facing ?? 1))} ${f1(-s * 0.9)})" opacity=".28" pointer-events="none">${sh.body}</g>`;
  if (!c.animate) return { stat: refl, anim: sh.svg };
  const anim = `<g class="wr-anim-ship" transform="${sh.tr}"><g><animateTransform attributeName="transform" type="rotate" values="-1.2 0 0;1.2 0 -10;-1.2 0 0" dur="${f1(4 + c.rng() * 2)}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 3;0 0" dur="${f1(3 + c.rng())}s" additive="sum" repeatCount="indefinite"/>${sh.body}</g></g>`;
  return { stat: refl, anim };
}
function boat(c, x, y, s = 1, o = {}) { // small faering, static
  const dep = o.depth ?? 0, dir = o.facing ?? 1;
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * dir)} ${f1(s)})"><path d="M-40 -12Q-36 4 -20 5H20Q36 4 40 -12Q30 -4 20 -4H-20Q-30 -4 -40 -12Z" fill="${c.col(o.col || '#5a3e26', 0.9, dep)}"/><path d="M40 -12q5 -10 0 -18M-40 -12q-5 -10 0 -18" stroke="${c.col(o.col || '#5a3e26', 0.9, dep)}" stroke-width="3" fill="none"/><path d="M-36 -8Q-30 0 -20 0H20Q30 0 36 -8" stroke="${c.col('#a07a4a', 1, dep)}" stroke-width="1.4" fill="none"/>${o.mast ? `<path d="M0 -4V-60" stroke="${c.col('#4a3420', 0.9, dep)}" stroke-width="2.4"/>` : ''}${o.man ? figure(c, 8, -2, 0.9) : ''}</g>`
    + (o.refl !== false ? `<g transform="translate(${f1(x)} ${f1(y + 8 * s)}) scale(${f1(s * dir)} ${f1(-s * 0.8)})" opacity=".25"><path d="M-40 -12Q-36 4 -20 5H20Q36 4 40 -12Q30 -4 20 -4H-20Q-30 -4 -40 -12Z" fill="${c.col(o.col || '#5a3e26', 0.6, dep)}"/></g>` : '');
}
// wooden pier: from (x0,y) to (x1,y) with planks, posts into water
function pier(c, x0, x1, y, o = {}) {
  const dep = o.depth ?? 0, th = o.th || 10, col = o.col || '#7a5a3a';
  const stone = o.stone;
  let s = '';
  // posts
  if (!stone) {
    let d = '';
    for (let x = x0 + 6; x < x1; x += o.postStep || 34) d += `M${f1(x)} ${f1(y + th)}v${o.postH || 26}`;
    s += `<path d="${d}" stroke="${c.col('#3a2a1c', 0.8, dep)}" stroke-width="6"/>`;
  }
  const top = `M${f1(x0)} ${f1(y)}H${f1(x1)}l${o.skew ?? -10} ${-(o.depthY ?? 8)}H${f1(x0 + (o.skew ?? -10))}Z`;
  s += P(top, c.col(stone ? '#c8bca0' : col, 1.05, dep)) + P(top, c.url(stone ? 'pAshlar' : 'pPlank'));
  s += face(c, `M${f1(x0)} ${f1(y)}H${f1(x1)}v${th}H${f1(x0)}z`, c.col(stone ? '#b8ac90' : col, 0.7, dep), stone ? 'pAshlar' : null);
  if (c.pal.winter) s += P(top, '#f2f5f8', ' opacity=".8"');
  // reflection strip
  s += `<rect x="${f1(x0)}" y="${f1(y + th + (stone ? 0 : o.postH || 26))}" width="${f1(x1 - x0)}" height="${f1(th * 1.5)}" fill="#000" opacity=".15"/>`;
  return s;
}
function mooringPosts(c, xs, y, dep = 0) { return `<path d="${xs.map(x => `M${x} ${y}v-30`).join('')}" stroke="${c.col('#3a2a1c', 0.8, dep)}" stroke-width="7" stroke-linecap="round"/>`; }

// ---------- landforms & signature features ----------
function land(c, pts, bottom, o = {}) {
  const p = c.pal, dep = o.depth ?? 0;
  const top = Math.min(...pts.map(q => q[1]));
  const gname = 'land' + (c._ld = (c._ld || 0) + 1);
  // in winter a custom ground colour is snowed over too, unless the caller opts out
  const snowy = k => (p.winter && o.snow !== false ? mix(k, '#e8edf2', 0.8) : k);
  const col = o.color ? snowy(o.color) : p.ground;
  const col2 = o.color2 ? snowy(o.color2) : p.groundDark;
  c.def(gname, `<linearGradient id="${c.id(gname)}" x1="0" y1="${f0(top)}" x2="0" y2="${f0(bottom)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.col(col, 1, dep)}"/><stop offset="1" stop-color="${c.col(col2, 0.85, dep)}"/></linearGradient>`);
  const d = (o.smooth === false ? pts2d(pts) : smooth(pts, 0.4)) + `L${pts[pts.length - 1][0]} ${bottom}L${pts[0][0]} ${bottom}Z`;
  let s = P(d, c.url(gname));
  // grass strokes / texture
  if (o.tufts !== false) {
    let t = '';
    const r = c.rng;
    for (let i = 0; i < (o.tufts || 120); i++) {
      const x = pts[0][0] + r() * (pts[pts.length - 1][0] - pts[0][0]);
      const y0 = yAt(pts, x), y = y0 + 4 + r() * (bottom - y0 - 6);
      t += `M${f0(x)} ${f0(y)}l${f1(r() * 4 - 2)} ${f1(-3 - r() * 5)}`;
    }
    s += `<path d="${t}" stroke="${c.col(p.winter ? '#c8d0dc' : col, p.winter ? 0.85 : 1.2, dep)}" stroke-width="1.5" opacity=".6"/>`;
  }
  // bank edge (earth / rock) along the shore
  if (o.bank) s += `<path d="M${pts[0][0]} ${bottom - o.bank}H${pts[pts.length - 1][0]}V${bottom}H${pts[0][0]}Z" fill="${c.col(o.bankCol || '#6a5a44', 0.7, dep)}"/>`;
  if (!p.night && o.rim !== false) s += `<path d="${o.smooth === false ? pts2d(pts) : smooth(pts, 0.4)}" stroke="${p.winter ? '#ffffff' : p.sun}" stroke-width="2" fill="none" opacity=".35"/>`;
  return s;
}
function rocks(c, x, y, n, s = 1, dep = 0, col) {
  const r = c.rng; let g = '';
  for (let i = 0; i < n; i++) {
    const rx = x + (r() - 0.5) * 80 * s, ry = y + r() * 8 * s, w = (8 + r() * 16) * s, h = w * (0.5 + r() * 0.3);
    g += `<path d="M${f1(rx - w)} ${f1(ry)}Q${f1(rx - w * 0.8)} ${f1(ry - h)} ${f1(rx)} ${f1(ry - h * 1.1)}Q${f1(rx + w * 0.9)} ${f1(ry - h * 0.8)} ${f1(rx + w)} ${f1(ry)}Z" fill="${c.col(col || c.pal.rock, 0.8, dep)}"/><path d="M${f1(rx + c.sunSide * w * 0.1)} ${f1(ry - h * 1.05)}Q${f1(rx + c.sunSide * w * 0.8)} ${f1(ry - h * 0.7)} ${f1(rx + c.sunSide * w * 0.95)} ${f1(ry - 1)}L${f1(rx + c.sunSide * w * 0.2)} ${f1(ry - 1)}Z" fill="${c.col(col || c.pal.rock, 1.1, dep)}" opacity=".7"/>`;
  }
  return g;
}
function cliff(c, pts, base, o = {}) { // steep rock face with strata, grass top
  const dep = o.depth ?? 0, col = o.color || '#6a6458';
  const top = smooth(pts, 0.3);
  let s = `<path d="${top}L${pts[pts.length - 1][0]} ${base}L${pts[0][0]} ${base}Z" fill="${c.col(col, 0.8, dep)}"/>`;
  // strata
  let st = '';
  const r = c.rng;
  for (let i = 0; i < (o.strata || 14); i++) {
    const x = pts[0][0] + r() * (pts[pts.length - 1][0] - pts[0][0]);
    const y = yAt(pts, x) + 10 + r() * (base - yAt(pts, x) - 20);
    st += `M${f0(x)} ${f0(y)}h${f0(20 + r() * 80)}`;
  }
  s += `<path d="${st}" stroke="${c.col(col, 0.55, dep)}" stroke-width="2.5" opacity=".55"/>`;
  // vertical light/shadow streaks
  let vs = '';
  for (let i = 0; i < (o.streaks || 18); i++) { const x = pts[0][0] + r() * (pts[pts.length - 1][0] - pts[0][0]); const y = yAt(pts, x); vs += `M${f0(x)} ${f0(y + 6)}l${f1((r() - 0.5) * 8)} ${f0((base - y) * (0.4 + r() * 0.6))}`; }
  s += `<path d="${vs}" stroke="${c.col(col, 1.15, dep)}" stroke-width="4" opacity=".35"/>`;
  if (o.grass !== false) s += `<path d="${top}" stroke="${c.col(c.pal.winter ? '#eef2f6' : c.pal.ground, 1, dep)}" stroke-width="${o.grassW || 10}" fill="none" stroke-linecap="round"/>`;
  return s;
}
function faroeCliff(c, pts, base, dep) { // steep green slopes, stepped basalt bands, sheer foot
  const r = c.rng;
  let s = hills(c, { pts, base, depth: dep, color: c.pal.winter ? '#dfe5ec' : '#5d7e38', tension: 0.4 });
  // basalt steps: horizontal broken dark bands following the slope
  let d = '';
  const x0 = pts[0][0], x1 = pts[pts.length - 1][0];
  for (let k = 0; k < 9; k++) {
    const yy = 220 + k * 50 + r() * 12;
    let started = false;
    for (let x = x0; x <= x1; x += 18) {
      const top = yAt(pts, x);
      if (yy > top + 14 && r() > 0.12) { d += `${started ? 'L' : 'M'}${f0(x)} ${f0(yy + Math.sin(x * 0.03 + k) * 4)}`; started = true; } else started = false;
    }
  }
  s += `<path d="${d}" stroke="${c.col('#3a3a36', 0.8, dep)}" stroke-width="7" fill="none" opacity=".55" stroke-linejoin="round"/>`;
  s += `<path d="${d}" stroke="${c.col('#8a8a7a', 1, dep)}" stroke-width="2" fill="none" opacity=".35" transform="translate(0 -4)"/>`;
  // sheer rock foot at the sea
  const fp = [];
  for (let x = x0; x <= x1; x += 40) fp.push([x, Math.max(yAt(pts, x) + 6, base - 130 + Math.sin(x * 0.02) * 20)]);
  s += cliff(c, fp, base, { depth: dep, color: '#4a4640', grass: false, strata: 10, streaks: 14 });
  return s;
}
function waterfall(c, x, y0, y1, w = 10, dep = 0) {
  const k = c.pal.night ? 0.45 : 1;
  const g = vgrad(c, 'wfall', [[0, '#ffffff', 0.55 * k], [0.5, '#e8f2f6', 0.85 * k], [1, '#ffffff', 0.95 * k]]);
  let s = `<path d="M${x - w * 0.4} ${y0}C${x - w * 0.6} ${y0 + (y1 - y0) * 0.4} ${x - w * 1.1} ${y1 - 40} ${x - w * 1.6} ${y1}H${x + w * 1.6}C${x + w * 1.1} ${y1 - 40} ${x + w * 0.6} ${y0 + (y1 - y0) * 0.4} ${x + w * 0.4} ${y0}Z" fill="${g}"/>`;
  s += `<ellipse cx="${x}" cy="${y1 + 2}" rx="${w * 3.4}" ry="${w * 1.1}" fill="#fff" opacity=".45"/><ellipse cx="${x}" cy="${y1 - 6}" rx="${w * 2.2}" ry="${w * 1.6}" fill="#fff" opacity=".3"/>`;
  if (c.animate) c.anims.push(`<g class="wr-anim-fall" stroke="#fff" fill="none" opacity=".55"><path d="M${x - w * 0.3} ${y0}Q${x - w * 0.5} ${(y0 + y1) / 2} ${x - w} ${y1}" stroke-width="2" stroke-dasharray="18 26"><animate attributeName="stroke-dashoffset" values="0;-88" dur="1.1s" repeatCount="indefinite"/></path><path d="M${x + w * 0.2} ${y0}Q${x + w * 0.3} ${(y0 + y1) / 2} ${x + w * 0.7} ${y1}" stroke-width="1.5" stroke-dasharray="12 30"><animate attributeName="stroke-dashoffset" values="0;-84" dur=".9s" repeatCount="indefinite"/></path></g>`);
  return s;
}
function fishRack(c, x, y, s = 1, dep = 0) { // hjell: A-frame rack with hanging stockfish
  const wd = c.col('#5a4030', 0.85, dep);
  let g = `<path d="M${x - 60 * s} ${y}l${10 * s} ${-46 * s}l${10 * s} ${46 * s}M${x + 40 * s} ${y}l${10 * s} ${-46 * s}l${10 * s} ${46 * s}M${x - 52 * s} ${y - 44 * s}H${x + 52 * s}M${x - 56 * s} ${y - 28 * s}H${x + 56 * s}" stroke="${wd}" stroke-width="${f1(2.6 * s)}" fill="none"/>`;
  let fd = '';
  for (let i = 0; i < 20; i++) { const fx = x - 46 * s + i * 4.8 * s; fd += `M${f1(fx)} ${f1(y - 44 * s)}v${f1(12 * s + (i % 3) * 2 * s)}M${f1(fx + 2 * s)} ${f1(y - 28 * s)}v${f1(11 * s + (i % 2) * 2 * s)}`; }
  g += `<path d="${fd}" stroke="${c.col('#a89a80', 1, dep)}" stroke-width="${f1(2.6 * s)}" stroke-linecap="round"/>`;
  return g;
}
function standingStones(c, cx, cy, rx, n, h, dep = 0) {
  let s = '';
  const items = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; items.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * rx * 0.22, Math.sin(a)]); }
  items.sort((a, b) => a[1] - b[1]);
  for (const [x, y, z] of items) {
    const hh = h * (0.7 + c.rng() * 0.5) * (1 + z * 0.12), w = hh * 0.42;
    s += `<path d="M${f1(x - w / 2)} ${f1(y)}l${f1(w * 0.1)} ${f1(-hh)}l${f1(w * 0.8)} ${f1(-hh * 0.08)}l${f1(w * 0.1)} ${f1(hh * 1.08)}z" fill="${c.col('#7a786e', z < 0 ? 0.75 : 0.95, dep)}"/><path d="M${f1(x + (c.sunSide > 0 ? 0 : -w / 2))} ${f1(y)}v${f1(-hh)}h${f1(w / 2)}v${f1(hh)}z" fill="#fff" opacity=".1"/>`;
  }
  return s;
}
function steam(c, x, y, s = 1) {
  if (!c.animate) return `<ellipse cx="${x}" cy="${y - 30 * s}" rx="${20 * s}" ry="${30 * s}" fill="#fff" opacity=".35"/>`;
  return smokeAnim(c, x, y, s, { color: '#f4f6f8', drift: 20, dur: 5, puffs: 5 });
}
function geyserAnim(c, x, y, s = 1) {
  if (!c.animate) return `<path d="M${x - 4 * s} ${y}Q${x} ${y - 120 * s} ${x + 4 * s} ${y}Z" fill="#fff" opacity=".7"/>`;
  return `<g class="wr-anim-geyser" pointer-events="none"><path d="M${x - 5 * s} ${y}Q${x} ${y - 10 * s} ${x + 5 * s} ${y}Z" fill="#f4f8fa" opacity=".85"><animate attributeName="d" values="M${x - 5 * s} ${y}Q${x} ${y - 10 * s} ${x + 5 * s} ${y}Z;M${x - 8 * s} ${y}Q${x} ${y - 190 * s} ${x + 8 * s} ${y}Z;M${x - 14 * s} ${y}Q${x} ${y - 150 * s} ${x + 14 * s} ${y}Z;M${x - 5 * s} ${y}Q${x} ${y - 10 * s} ${x + 5 * s} ${y}Z;M${x - 5 * s} ${y}Q${x} ${y - 10 * s} ${x + 5 * s} ${y}Z" keyTimes="0;.12;.3;.5;1" dur="9s" repeatCount="indefinite"/></path></g>` + steam(c, x, y - 20 * s, s * 1.4);
}

// ---------- more signature pieces ----------
function rampart(c, pts, h, o = {}) { // earth bank with a palisade on top
  const dep = o.depth ?? 0;
  const top = smooth(pts, 0.4);
  const bot = smooth(pts.map(q => [q[0], q[1] + h]).reverse(), 0.4, 'L');
  let s = P(top + bot + 'Z', c.col(c.pal.winter ? '#dfe4ea' : '#6f7a3e', 0.85, dep));
  if (o.strong) { // shadowed outer face and a lit crest, so the bank reads against the fields
    s += P(smooth(pts.map(q => [q[0], q[1] + h * 0.45]), 0.4) + bot + 'Z', c.col(c.pal.winter ? '#b8c2ce' : '#4a5a2c', 0.8, dep), ' opacity=".8"');
    s += `<path d="${top}" stroke="${c.pal.winter ? '#ffffff' : c.pal.sun}" stroke-width="3" fill="none" opacity=".4"/>`;
  }
  s += P(top + smooth(pts.map(q => [q[0], q[1] + h * 0.35]).reverse(), 0.4, 'L') + 'Z', c.col(c.pal.winter ? '#f2f5f8' : '#87924c', 1, dep), ' opacity=".7"');
  if (o.palisade !== false) s += palisade(c, pts[0][0], pts[pts.length - 1][0], x => yAt(pts, x) + 3, o.ph || 22, { depth: dep, step: o.step || 7 });
  return s;
}
function kremlin(c, x0, x1, yfn, h, towers, o = {}) { // log wall with tented towers
  const dep = o.depth ?? 0, col = o.col || '#8a6440';
  let s = '';
  let d = `M${x0} ${f1(yfn(x0))}`;
  for (let x = x0; x <= x1; x += 20) d += `L${x} ${f1(yfn(x))}`;
  d += `L${x1} ${f1(yfn(x1) - h)}`;
  for (let x = x1; x >= x0; x -= 20) d += `L${x} ${f1(yfn(x) - h)}`;
  d += 'Z';
  s += face(c, d, c.col(col, 0.85, dep), o.pat || 'pLog');
  // covered wall-walk roof
  let rd = `M${x0 - 4} ${f1(yfn(x0) - h)}`;
  for (let x = x0; x <= x1; x += 20) rd += `L${x} ${f1(yfn(x) - h)}`;
  for (let x = x1; x >= x0; x -= 20) rd += `L${x + 6} ${f1(yfn(x) - h - 9)}`;
  s += P(rd + 'Z', c.pal.winter ? c.col('#eef2f6', 0.95, dep) : c.col(o.roof || '#7a776d', 0.9, dep));
  for (const t of towers) {
    const [tx, tw, th] = Array.isArray(t) ? t : [t, 44, h + 50];
    s += tower(c, tx, yfn(tx) + 4, tw, th, { col, pat: o.pat || 'pLog', roof: o.roof || '#7a776d', rh: tw * 1.15, win: true, depth: dep });
  }
  return s;
}
function seaWall(c, x0, x1, y, h, towers, o = {}) {
  const dep = o.depth ?? 0, col = o.col || '#d8ccb0';
  let s = stoneWall(c, x0, x1, () => y, h, { col, depth: dep, pat: 'pAshlar' });
  for (const tx of towers) s += tower(c, tx, y + 2, o.tw || 40, h + (o.th || 34), { col, pat: 'pAshlar', kind: 'cren', depth: dep, win: true });
  return s;
}
function bridge(c, x0, x1, y, o = {}) { // long timber bridge on piles
  const dep = o.depth ?? 0, col = '#7a5a3a', th = o.th || 9, arch = o.arch || 0;
  const yb = x => y - Math.sin((x - x0) / (x1 - x0) * Math.PI) * arch;
  let piles = '';
  for (let x = x0 + 10; x < x1; x += o.step || 46) piles += `M${f1(x - 6)} ${f1(yb(x) + th)}V${f1(y + (o.pileH || 46))}M${f1(x + 6)} ${f1(yb(x) + th)}V${f1(y + (o.pileH || 46))}M${f1(x - 6)} ${f1(yb(x) + th + 12)}L${f1(x + 6)} ${f1(yb(x) + th + 28)}`;
  let s = `<path d="${piles}" stroke="${c.col('#3a2a1c', 0.75, dep)}" stroke-width="5" fill="none"/>`;
  let deck = `M${x0} ${f1(yb(x0))}`;
  for (let x = x0; x <= x1; x += 20) deck += `L${x} ${f1(yb(x))}`;
  for (let x = x1; x >= x0; x -= 20) deck += `L${x} ${f1(yb(x) + th)}`;
  s += P(deck + 'Z', c.col(col, 0.8, dep));
  let rail = '';
  for (let x = x0; x <= x1; x += 12) rail += `M${x} ${f1(yb(x))}v-12`;
  let rt = `M${x0} ${f1(yb(x0) - 12)}`;
  for (let x = x0; x <= x1; x += 20) rt += `L${x} ${f1(yb(x) - 12)}`;
  s += `<path d="${rail}${rt}" stroke="${c.col(col, 1, dep)}" stroke-width="2" fill="none"/>`;
  if (c.pal.winter) s += `<path d="${rt}" stroke="#f2f5f8" stroke-width="2.5" fill="none"/>`;
  // folk crossing
  for (let i = 0; i < (o.people || 6); i++) { const x = x0 + 30 + c.rng() * (x1 - x0 - 60); s += figure(c, x, yb(x), 0.9 * (o.fs || 1)); }
  return s;
}
function greatDome(c, x, y, k = 1) { // a vast domed church: original design, buttresses and half domes
  const dep = c.dep || 0;
  const st = ST.byzantine;
  let s = `<g transform="translate(${x} ${y}) scale(${k})">`;
  s += face(c, `M-190 0V-70H190V0Z`, c.col('#e2d4b8', 0.9, dep), 'pAshlar');
  s += face(c, `M-150 -70V-120H150V-70Z`, c.col('#e8dcc4', 0.95, dep), 'pAshlar');
  for (const bx of [-170, -110, 110, 170]) s += P(`M${bx - 12} 0V-96l12 -10l12 10V0Z`, c.col('#d8c8a8', bx * c.sunSide > 0 ? 1.02 : 0.6, dep));
  for (let i = 0; i < 9; i++) s += `<path d="M${-120 + i * 30 - 6} -78v-26q6 -9 12 0v26z" fill="${winGlow(c)}"/>`;
  s += dome(c, -120, -120, 46, { drum: 0, ribs: false, flat: 0.7 });
  s += dome(c, 120, -120, 46, { drum: 0, ribs: false, flat: 0.7 });
  s += dome(c, 0, -150, 118, { drum: 30, flat: 0.62, col: '#a8a090' });
  s += `</g>`;
  return s;
}
function volcano(c, x, y, w, h, o = {}) {
  const dep = o.depth ?? 0.55;
  const tw = w * 0.11;
  const cone = `M${x - w / 2} ${y}C${x - w * 0.26} ${y - h * 0.3} ${x - tw * 1.6} ${y - h * 0.85} ${x - tw} ${y - h}L${x + tw} ${y - h}C${x + tw * 1.6} ${y - h * 0.85} ${x + w * 0.26} ${y - h * 0.3} ${x + w / 2} ${y}Z`;
  let s = P(cone, c.col('#4a4a50', 0.9, dep));
  const sd = c.sunSide;
  s += P(`M${x} ${y - h}L${x - sd * tw} ${y - h}C${x - sd * tw * 1.6} ${y - h * 0.85} ${x - sd * w * 0.26} ${y - h * 0.3} ${x - sd * w / 2} ${y}L${x - sd * w * 0.05} ${y}Z`, c.col('#3a3a44', 0.5, dep), ' opacity=".55"');
  // snow cap with a ragged lower edge
  const sh = h * 0.38;
  const cx0 = x - tw - (w * 0.2) * 0.62, cx1 = x + tw + (w * 0.2) * 0.62;
  let snow = `M${x - tw} ${y - h}L${x + tw} ${y - h}C${x + tw * 1.5} ${y - h * 0.9} ${x + w * 0.12} ${y - h + sh * 0.7} ${cx1} ${y - h + sh}`;
  const steps = 12;
  for (let i = 1; i <= steps; i++) { const t = i / steps; const xx = cx1 + (cx0 - cx1) * t; const yy = y - h + sh - (i % 2 ? 16 + c.rng() * 22 : -c.rng() * 10) - Math.sin(t * Math.PI) * 10; snow += `L${f1(xx)} ${f1(i === steps ? y - h + sh : yy)}`; }
  snow += `C${x - w * 0.12} ${y - h + sh * 0.7} ${x - tw * 1.5} ${y - h * 0.9} ${x - tw} ${y - h}Z`;
  s += P(snow, c.col('#f2f5f8', 1, dep * 0.8));
  s += P(`M${x} ${y - h}L${x - sd * tw} ${y - h}C${x - sd * tw * 1.5} ${y - h * 0.9} ${x - sd * w * 0.12} ${y - h + sh * 0.7} ${x - sd * (tw + w * 0.124)} ${y - h + sh}L${x - sd * w * 0.02} ${y - h + sh * 0.8}Z`, c.col('#9aa8c0', 1, dep), ' opacity=".45"');
  let gl = '';
  for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9 - 0.5; gl += `M${f1(x + t * tw * 2.4)} ${f1(y - h + sh * 0.9)}L${f1(x + t * w * 0.9)} ${f1(y - 6)}`; }
  s += `<path d="${gl}" stroke="${c.col('#2a2a30', 0.7, dep)}" stroke-width="3" opacity=".35"/>`;
  s += P(`M${x - w / 2} ${y}C${x - w * 0.3} ${y - h * 0.16} ${x + w * 0.3} ${y - h * 0.16} ${x + w / 2} ${y}Z`, c.col(c.pal.winter ? '#dfe4ea' : '#5a6a3a', 0.9, dep), ' opacity=".8"');
  if (o.lava) s += `<path d="M${x - 6} ${y - h + 6}q-10 ${h * 0.3} 4 ${h * 0.55}M${x + 8} ${y - h + 8}q14 ${h * 0.25} 2 ${h * 0.4}" stroke="#ff7a2a" stroke-width="3" fill="none" opacity="${c.pal.night || c.pal.dusk ? 0.9 : 0.35}"/>`;
  c.anims.push(smokeAnim(c, x, y - h - 4, 2.6, { color: c.pal.night ? '#585c70' : '#bdb8b4', drift: 70, dur: 9, puffs: 5 }));
  return s;
}
function seaStack(c, x, y, w, h, o = {}) {
  const dep = o.depth ?? 0.1, col = o.col || '#5a5650', r = c.rng;
  const pts = [[x - w / 2, y], [x - w * 0.45, y - h * 0.5], [x - w * 0.3 + r() * 6, y - h * 0.9], [x - w * 0.05, y - h], [x + w * 0.3, y - h * 0.94], [x + w * 0.42, y - h * 0.5], [x + w / 2, y]];
  let s = P(pts2d(pts) + 'Z', c.col(col, 0.85, dep));
  const sd = c.sunSide;
  s += P(pts2d([[x + sd * w * 0.05, y - h], [x + sd * w * 0.3, y - h * 0.94], [x + sd * w * 0.42, y - h * 0.5], [x + sd * w / 2, y], [x + sd * w * 0.1, y]]) + 'Z', c.col(col, 1.15, dep), ' opacity=".6"');
  let st = '';
  for (let i = 1; i < 6; i++) st += `M${f0(x - w * 0.42)} ${f0(y - h * i / 6)}h${f0(w * (0.5 + r() * 0.3))}`;
  s += `<path d="${st}" stroke="${c.col(col, 0.5, dep)}" stroke-width="2" opacity=".5"/>`;
  if (o.grass !== false) s += P(`M${f0(x - w * 0.32)} ${f0(y - h * 0.9)}L${f0(x - w * 0.05)} ${f0(y - h - 3)}L${f0(x + w * 0.3)} ${f0(y - h * 0.95)}L${f0(x + w * 0.2)} ${f0(y - h * 0.86)}Z`, c.col(c.pal.winter ? '#eef2f6' : '#6a8a3a', 1, dep));
  s += `<path d="M${x - w / 2 - 8} ${y}h${w + 16}" stroke="#fff" stroke-width="3" opacity=".5"/>`;
  return s;
}
function broch(c, x, y, k = 1, dep = 0) { // round dry-stone tower
  const w = 70 * k, h = 90 * k;
  const g = c.sunSide > 0 ? 'brochR' : 'brochL';
  c.def(g, `<linearGradient id="${c.id(g)}" x1="${c.sunSide > 0 ? 0 : 1}" y1="0" x2="${c.sunSide > 0 ? 1 : 0}" y2="0"><stop offset="0" stop-color="${c.col('#8a8478', 0.55, dep)}"/><stop offset=".7" stop-color="${c.col('#8a8478', 1, dep)}"/><stop offset="1" stop-color="${c.col('#8a8478', 0.85, dep)}"/></linearGradient>`);
  let s = P(`M${x - w / 2} ${y}C${x - w / 2 + 6 * k} ${y - h * 0.5} ${x - w * 0.36} ${y - h} ${x - w * 0.36} ${y - h}H${x + w * 0.36}C${x + w * 0.36} ${y - h} ${x + w / 2 - 6 * k} ${y - h * 0.5} ${x + w / 2} ${y}Z`, c.url(g));
  s += P(`M${x - w / 2} ${y}C${x - w / 2 + 6 * k} ${y - h * 0.5} ${x - w * 0.36} ${y - h} ${x - w * 0.36} ${y - h}H${x + w * 0.36}C${x + w * 0.36} ${y - h} ${x + w / 2 - 6 * k} ${y - h * 0.5} ${x + w / 2} ${y}Z`, c.url('pStone'));
  s += `<ellipse cx="${x}" cy="${y - h}" rx="${w * 0.36}" ry="${5 * k}" fill="${c.col('#3a3630', 0.8, dep)}"/><path d="M${x - 6 * k} ${y}v${-16 * k}h${12 * k}v${16 * k}z" fill="#1a1612"/>`;
  return s;
}
function dunes(c, pts, base, dep = 0) {
  let s = hills(c, { pts, base, depth: dep, color: c.pal.winter ? '#e0e2e4' : '#d8c08a', rim: true });
  let g = '';
  const r = c.rng;
  for (let i = 0; i < 70; i++) { const x = pts[0][0] + r() * (pts[pts.length - 1][0] - pts[0][0]); const y = yAt(pts, x) + 2 + r() * 20; g += `M${f0(x)} ${f0(y)}l${f0(-4 + r() * 3)} ${f0(-8 - r() * 8)}M${f0(x)} ${f0(y)}l${f0(2 + r() * 4)} ${f0(-7 - r() * 8)}`; }
  s += `<path d="${g}" stroke="${c.col(c.pal.winter ? '#a0a890' : '#8a9a50', 1, dep)}" stroke-width="1.6" fill="none"/>`;
  return s;
}
function amberPicker(c, x, y, s = 1) {
  return figure(c, x, y, s, { arm: [9, -8], col: c.rng.pick(['#5f6b3a', '#8e2a22', '#d9c59a', '#2f5d6e']) }) + `<path d="M${f1(x + 12 * s)} ${f1(y - 23 * s)}l${f1(22 * s)} ${f1(20 * s)}" stroke="${c.col('#6a4a2a')}" stroke-width="${f1(1.6 * s)}"/><path d="M${f1(x + 30 * s)} ${f1(y - 6 * s)}q${f1(6 * s)} ${f1(10 * s)} ${f1(12 * s)} 0z" fill="none" stroke="${c.col('#c8b890')}" stroke-width="${f1(1.4 * s)}"/>`;
}
function amberPile(c, x, y, s = 1) {
  let g = '';
  for (let i = 0; i < 9; i++) g += `<circle cx="${f1(x + (c.rng() - 0.5) * 22 * s)}" cy="${f1(y - c.rng() * 6 * s)}" r="${f1((2 + c.rng() * 2.5) * s)}"/>`;
  return `<g fill="${c.col('#e8941c', 1.1)}">${g}</g><circle cx="${x}" cy="${y - 3 * s}" r="${16 * s}" fill="${c.url('glow')}" opacity=".45"/>`;
}
function mounds(c, list, dep = 0.2) {
  let s = '';
  for (const [x, y, w] of list) s += `<path d="M${x - w} ${y}Q${x - w * 0.5} ${y - w * 0.55} ${x} ${y - w * 0.56}Q${x + w * 0.5} ${y - w * 0.55} ${x + w} ${y}Z" fill="${c.col(c.pal.winter ? '#e4e8ee' : '#6d8a3e', 0.92, dep)}"/><path d="M${x + c.sunSide * w * 0.1} ${y - w * 0.55}Q${x + c.sunSide * w * 0.6} ${y - w * 0.5} ${x + c.sunSide * w} ${y}H${x}Z" fill="#fff" opacity=".12"/>`;
  return s;
}
function harbourChain(c, x0, x1, y) {
  let s = `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + 16} ${x1} ${y}" stroke="${c.col('#2a2a2e', 0.9)}" stroke-width="4" stroke-dasharray="7 3" fill="none"/>`;
  for (let i = 1; i < 12; i++) { const t = i / 12, x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI) * 12; s += `<rect x="${f1(x - 9)}" y="${f1(yy - 6)}" width="18" height="8" rx="3" fill="${c.col('#6a4a2a', 0.95)}"/>`; }
  return s;
}
function stockade(c, x0, x1, y, h = 30, dep = 0) {
  let d = '';
  for (let x = x0; x < x1; x += 13) d += `M${x} ${y + (c.rng() - 0.5) * 4}v${-h * (0.8 + c.rng() * 0.4)}`;
  return `<path d="${d}" stroke="${c.col('#3a2a1c', 0.8, dep)}" stroke-width="5" stroke-linecap="round"/>`;
}
function seaGate(c, x, y, k = 1) { // Jómsborg: fortified harbour gate over the water
  const dep = c.dep || 0, col = '#5e564a';
  let s = `<g transform="translate(${x} ${y}) scale(${k})">`;
  s += P(`M-72 0V-60Q0 -134 72 -60V0Z`, nightish(c) ? '#3a2010' : '#14161a');
  s += face(c, `M-160 0V-120H160V0H70V-60Q0 -130 -70 -60V0Z`, c.col(col, 0.9, dep), 'pStone');
  s += face(c, `M-250 0V-80H-160V0ZM160 0V-80H250V0Z`, c.col(col, 0.8, dep), 'pStone');
  // portcullis in the arch
  let pc = '';
  for (let i = -60; i <= 60; i += 12) pc += `M${i} ${-60 - Math.sqrt(Math.max(0, 1 - (i / 70) ** 2)) * 50}V-14`;
  s += `<path d="${pc}M-64 -40H64M-68 -20H68" stroke="${c.col('#1e1a16', 1, dep)}" stroke-width="3"/>`;
  // towers
  for (const tx of [-130, 130]) s += tower(c, tx, 0, 70, 190, { col, pat: 'pStone', kind: 'tent', roof: '#3a302a', rh: 60, depth: dep, win: true });
  let cr = '';
  for (let i = -150; i < 150; i += 20) cr += `M${i} -120h12v-12h-12z`;
  s += P(cr, c.col(col, 0.9, dep));
  s += `</g>`;
  return s;
}
function kastal(c, st) { // Gotland stone storehouse tower
  const s = tower(c, 0, 0, 52, 92, { col: '#d6ccb2', pat: 'pStone', roof: '#5a4a3c', rh: 34, win: true });
  return { svg: s + door(c, 0, 0, 12, 20, st, { arch: true }), top: -140 };
}

// ---------- town placement ----------
const PRIO = ['hall', 'shipyard', 'warehouse', 'market', 'altar', 'meadhall', 'guild', 'bank', 'moneylender', 'runecarver'];
const PREF = {
  hall: ['high', 'center'], shipyard: ['shore'], warehouse: ['shore', 'center'], market: ['center', 'shore'],
  altar: ['high', 'edge'], meadhall: ['center'], guild: ['center', 'edge'], bank: ['center'], moneylender: ['center', 'edge'], runecarver: ['edge', 'high'],
};
const BSIZE = { hall: 1.1, market: 1, shipyard: 1, warehouse: 0.95, meadhall: 0.95, altar: 1, guild: 0.95, bank: 0.95, moneylender: 0.95, runecarver: 0.95 };

// slots: [{x, y, s, tag, dep, flip}]; returns svg string with .bld groups (and label anchors)
function town(c, st, slots, buildings, o = {}) {
  const free = slots.map((sl, i) => ({ ...sl, i }));
  const assign = new Map();
  const want = PRIO.filter(b => buildings.includes(b));
  for (const b of want) {
    let pick = null;
    for (const tag of PREF[b]) { pick = free.find(sl => !assign.has(sl.i) && sl.tag === tag && !sl.fillerOnly); if (pick) break; }
    if (!pick) pick = free.find(sl => !assign.has(sl.i) && !sl.fillerOnly);
    if (pick) assign.set(pick.i, b);
  }
  const order = free.slice().sort((a, b) => a.y - b.y);
  let s = '', labels = '';
  for (const sl of order) {
    const b = assign.get(sl.i);
    if (!b && sl.empty) continue;
    c.dep = sl.dep || 0;
    const sc = sl.s * (b ? BSIZE[b] : 1);
    c.cur = { X: sl.x, Y: sl.y, s: sc, flip: false };
    let res;
    if (b) res = B[b](c, st, sl);
    else res = (sl.filler ? (FILL[sl.filler] || B.house) : (st.filler || B.house))(c, st, sl);
    const g = `<g transform="translate(${f1(sl.x)} ${f1(sl.y)}) scale(${f1(sc)})">${res.svg}</g>`;
    if (b) {
      s += `<g class="bld" data-b="${b}">${g}</g>`;
      labels += `<g class="bld-label" data-b="${b}" transform="translate(${f0(sl.x)} ${f0(sl.y + res.top * sc - 12)})"></g>`;
    } else s += g;
    if (sl.after) s += sl.after(c);
  }
  c.dep = 0;
  return { svg: s, labels };
}
const FILL = {
  kastal: (c, st) => kastal(c, st),
  izba: (c, st) => { const H = gableHouse(c, st, { w: 54 + c.rng() * 16, h: 34, d: 70, rh: 40, wins: [[-12, -26], [12, -26]], doorX: 99 }); addSmoke(c, H.smoke[0], H.smoke[1], 0.7); return { svg: H.svg, top: H.top }; },
  hut: (c, st) => { const H = house(c, st, { w: 70, h: 22, d: 46, rh: 32, wins: [], bow: 2, smokeOff: 0 }); addSmoke(c, H.smoke[0], H.smoke[1], 0.6); return { svg: H.svg, top: H.top }; },
  ttown: (c, st) => { const H = gableHouse(c, st, { w: 56, h: 52, d: 70, rh: 36, beams: true, wins: [[-12, -42], [12, -42]], doorX: 0 }); return { svg: H.svg, top: H.top }; },
  flag: (c, st) => { const H = house(c, st, { w: 90, h: 30, d: 50, rh: 26, wk: 'pStone', wall: '#9a948a', rk: 'slate', roof: '#6a6660', wins: [20], bow: 0, dragon: false }); addSmoke(c, H.smoke[0], H.smoke[1], 0.7); return { svg: H.svg, top: H.top }; },
  birch: (c) => ({ svg: forest(c, { x0: -30, x1: 30, step: 18, hMin: 70, hMax: 100, kind: 'birch', depth: c.dep, ground: () => 0, sink: 0 }), top: -100 }),
  store: (c, st) => B.storehouse(c, st),
  tree: (c) => ({ svg: broadTree(c, 0, 0, 90 + c.rng() * 40, { depth: c.dep }), top: -120 }),
  spruce: (c) => { const [a, b] = spruce(0, 0, 110, 40); return { svg: P(a + b, c.col(c.pal.foliage, 0.7, c.dep)) + P(c.sunSide > 0 ? b : a, c.col(c.pal.foliage, 1.05, c.dep)), top: -110 }; },
  cypress: (c) => ({ svg: cypress(c, -10, 0, 120, c.dep) + cypress(c, 14, 0, 96, c.dep), top: -120 }),
  byzhouse: (c, st) => {
    const r = c.rng;
    const H = r() < 0.5 ? house(c, st, { w: 80 + r() * 40, h: 40 + r() * 30, rh: 16, rk: 'pTile', door: true, smokeHole: false, wins: [-18, 18], arch: true })
      : gableHouse(c, st, { w: 56, h: 50 + r() * 20, rh: 16, rk: 'pTile', front: '#ecdcc0', fwk: 'pAshlar', wins: [[-12, -40], [12, -40]], arch: true });
    return { svg: H.svg, top: H.top };
  },
  turf: (c, st) => { // Icelandic turf gable row
    let s = '';
    const n = 2 + Math.floor(c.rng() * 2);
    for (let i = 0; i < n; i++) s += `<g transform="translate(${(i - (n - 1) / 2) * 44} 0)">${gableHouse(c, st, { w: 40, h: 22, d: 90, rh: 22, wins: [[0, -16]], doorX: i === 0 ? 0 : 99 }).svg}</g>`;
    addSmoke(c, 0, -50, 0.6);
    return { svg: s, top: -60 };
  },
};

// rows: [[y, s, dep, [[x, tag, extra?], ...]], ...]
function rows(spec) {
  const out = [];
  for (const [y, sc, dep, xs] of spec) for (const it of xs) {
    const [x, tag, extra] = it;
    out.push(Object.assign({ x, y: typeof y === 'function' ? y(x) : y + ((x * 7919) % 13) - 6, s: sc, tag, dep }, tag === 'f' ? { fillerOnly: true } : {}, extra || {}));
  }
  return out;
}
// paths, worn patches, stones and haystacks on the town ground
function groundDetail(c, o) {
  const r = c.rng, p = c.pal;
  let s = '';
  const pathCol = c.col(p.winter ? '#c4c0bc' : '#8a7454', 0.9);
  for (const pth of (o.paths || [])) s += `<path d="${smooth(pth, 0.5)}" stroke="${pathCol}" stroke-width="${o.pathW || 16}" fill="none" stroke-linecap="round" opacity=".75"/><path d="${smooth(pth, 0.5)}" stroke="${c.col(p.winter ? '#e8ecf0' : '#b49a70', 1)}" stroke-width="${(o.pathW || 16) * 0.35}" fill="none" stroke-linecap="round" opacity=".5"/>`;
  let pd = '', pl = '';
  for (let i = 0; i < (o.patches || 18); i++) {
    const x = o.x0 + r() * (o.x1 - o.x0), y = o.y0 + r() * (o.y1 - o.y0), w = 30 + r() * 90;
    const seg = `M${f0(x - w)} ${f0(y)}q${f0(w)} ${f0(-6 - r() * 6)} ${f0(w * 2)} 0q${f0(-w)} ${f0(5)} ${f0(-w * 2)} 0z`;
    if (r() < 0.5) pd += seg; else pl += seg;
  }
  s += `<path d="${pd}" fill="${c.col(p.groundDark, 0.9)}" opacity=".35"/><path d="${pl}" fill="${c.col(p.winter ? '#ffffff' : lighten(p.ground, 0.25), 1)}" opacity=".3"/>`;
  for (const [x, y, k] of (o.hay || [])) s += `<path d="M${x - 14 * k} ${y}q${14 * k} ${-34 * k} ${28 * k} 0z" fill="${c.col(p.winter ? '#e8ecf0' : '#c8a456', 0.95)}"/><path d="M${x + c.sunSide * 2 * k} ${y - 30 * k}q${c.sunSide * 10 * k} ${12 * k} ${c.sunSide * 12 * k} ${30 * k}" stroke="#000" stroke-opacity=".18" stroke-width="${5 * k}" fill="none"/>`;
  for (const [x0, x1, y] of (o.fences || [])) s += fence(c, x0, x1, y, 1.1);
  for (const [x, y, n, k] of (o.rocks || [])) s += rocks(c, x, y, n, k || 1);
  for (const [x0, x1, y, n] of (o.people || [])) s += crowd(c, x0, x1, y, n, 1);
  return s;
}

// ---------- composition helpers ----------
function shoreSlots(list) { return list.map(([x, y, s, tag, dep, extra]) => Object.assign({ x, y, s, tag, dep: dep || 0 }, extra || {})); }
function portBuildings(id, o) {
  if (o.buildings) return o.buildings;
  if (PORTS && PORTS[id] && Array.isArray(PORTS[id].buildings)) return PORTS[id].buildings;
  return BUILDINGS.slice();
}

// assemble layers into the final SVG string
function assemble(c, L, o) {
  stdDefs(c); textureDefs(c);
  const vb = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="${o.width || 1600}" height="${o.height || 900}" preserveAspectRatio="${o.fit || 'xMidYMid slice'}" class="wr-scene">`;
  let s = vb + `<defs>${c.defs.join('')}</defs>`;
  s += staticOpen(c) + L.stat + '</g>';
  const k = L.split ?? c.anims.length;
  s += `<g class="wr-anims" pointer-events="none">${c.anims.slice(0, k).join('')}</g>`;
  if (L.front) s += `<g class="wr-front">${L.front}</g>`;
  if (k < c.anims.length) s += `<g class="wr-anims" pointer-events="none">${c.anims.slice(k).join('')}</g>`;
  if (L.top) s += L.top;
  s += grainOverlay(c);
  s += L.labels || '';
  s += '</svg>';
  return s;
}

// generic port pipeline: def provides layer functions
function buildPort(id, o, def) {
  const time = o.time || 'day', season = o.season || 'summer';
  const c = makeCtx({ seed: id + (def.seedExtra || ''), time, season, detail: o.detail || autoDetail(), sunX: def.sunX?.[time] ?? def.sunX?.day ?? (typeof def.sunX === 'number' ? def.sunX : 1150), pal: def.pal ? def.pal(time, season) : {}, animate: o.animate });
  c.port = id;
  const st = Object.assign({}, ST[def.culture || PORT_CULTURE[id]], def.style || {});
  c.st = st;
  stdDefs(c);
  const buildings = portBuildings(id, o);
  let stat = '';
  stat += sky(c, def.sky ? def.sky(c) : {});
  if (def.far) stat += def.far(c);
  // reflected group: land + back + town
  const refl = c.id('refl');
  let grp = '';
  if (def.land) grp += def.land(c);
  if (def.back) grp += def.back(c);
  if (def.landmark && !buildings.includes('altar')) {
    const lm = def.landmark;
    c.dep = lm.dep || 0; c.cur = { X: lm.x, Y: lm.y, s: lm.s, flip: false };
    const res = (lm.draw || ((cc, st2) => (TEMPLE[lm.temple || st2.temple] || TEMPLE.stave)(cc, st2)))(c, st);
    grp += `<g class="landmark" transform="translate(${lm.x} ${lm.y}) scale(${lm.s})">${res.svg}</g>`;
    c.dep = 0;
  }
  const T = town(c, st, def.slots(c), buildings);
  grp += T.svg;
  if (def.mid) grp += def.mid(c);
  stat += `<g id="${refl}">${grp}</g>`;
  if (def.over) stat += def.over(c);
  if (def.water) stat += def.water(c, refl);
  const split = c.anims.length;
  const front = def.front ? def.front(c) : '';
  if (c.pal.winter && def.snowfall !== false) c.anims.push(snowfall(c, 60));
  c.anims.push(gullsAnim(c, def.gulls ?? 4, def.gullBand || {}));
  return assemble(c, { stat, labels: T.labels, front: front + vignette(c, 0.42), split }, o);
}

function autoDetail() {
  try { if (typeof document !== 'undefined' && document.documentElement.classList.contains('low')) return 'low'; } catch (e) { /* ignore */ }
  try { if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) return 'low'; } catch (e) { /* ignore */ }
  return 'high';
}

// ---------- the 20 ports ----------
const PORT_DEFS = {};

// Ravnfjord (home, fictional): deep fjord, steep walls, waterfall, ravens, cozy turf town
PORT_DEFS.ravnfjord = {
  culture: 'norse', sunX: { day: 1180, dusk: 980, night: 1150 },
  sky: c => ({ clouds: 6, cloudBand: [50, 230], cloudW: 200, rays: c.pal.dusk, aurora: c.pal.night && c.pal.winter }),
  far: c => {
    let s = range(c, { pts: [[560, 470], [700, 330], [800, 372], [900, 300], [1010, 360], [1120, 340], [1240, 470]], base: 520, depth: 0.85, snow: 380, rough: 0.22, mistBand: 40 });
    s += sea(c, 486, 620, { x0: 400, x1: 1300 });
    s += range(c, { pts: [[-30, 60], [120, 40], [260, 140], [400, 300], [520, 440], [620, 520]], base: 600, depth: 0.25, snow: c.pal.winter ? 330 : 150, color: '#5f5c55', foot: '#3e5a32', gullies: 14, maxShade: 500 });
    s += range(c, { pts: [[1000, 520], [1100, 360], [1230, 200], [1380, 120], [1500, 90], [1640, 80]], base: 600, depth: 0.25, snow: c.pal.winter ? 330 : 150, color: '#5f5c55', foot: '#3e5a32', gullies: 14, maxShade: 500 });
    s += waterfall(c, 1268, 222, 540, 10, 0.25);
    s += forest(c, { x0: -10, x1: 560, step: 15, hMin: 24, hMax: 42, depth: 0.28, ground: x => 520 + x * 0.06 });
    s += forest(c, { x0: 1040, x1: 1620, step: 15, hMin: 26, hMax: 44, depth: 0.28, ground: x => 548 - (x - 1040) * 0.05 });
    return s;
  },
  land: c => land(c, [[-30, 552], [200, 556], [420, 580], [640, 600], [860, 604], [1080, 590], [1300, 562], [1630, 540]], 712, { bank: 10 })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 580, y1: 700, paths: [[[120, 700], [300, 640], [560, 650], [800, 632], [1060, 652], [1320, 610], [1560, 590]]], hay: [[60, 600, 1], [1540, 572, 0.9]], fences: [[20, 140, 620], [1440, 1580, 600]] }),
  slots: c => rows([
    [568, 0.74, 0.05, [[110, 'high'], [330, 'edge'], [1180, 'high'], [1420, 'edge'], [760, 'f', { filler: 'store' }], [540, 'f', { filler: 'spruce' }], [1560, 'f', { filler: 'spruce' }]]],
    [628, 0.88, 0, [[230, 'center'], [520, 'center'], [820, 'center'], [1060, 'center'], [1330, 'center']]],
    [698, 1.02, 0, [[120, 'edge'], [430, 'shore'], [900, 'shore'], [1300, 'center']]],
  ]),
  water: (c, refl) => water(c, { y: 712, reflect: refl }),
  front: c => {
    let s = pier(c, 560, 940, 780, { th: 10 });
    const m = mooredShip(c, 760, 838, 0.82, { sail: 'furled', vane: true });
    s += m.stat; c.anims.push(m.anim);
    s += boat(c, 300, 806, 1, { facing: -1, man: true }) + boat(c, 1240, 846, 1.2, { mast: true });
    s += rocks(c, 70, 892, 6, 2.2) + rocks(c, 1550, 896, 5, 2.4);
    s += mooringPosts(c, [990, 1050], 812);
    s += `<path d="M984 780q6 -8 14 -4l6 -3-2 5q-6 6 -18 2zM1044 780q6 -8 14 -4l6 -3-2 5q-6 6 -18 2z" fill="#14121a"/>`;
    return s;
  },
};

// Kaupang: gentle Vestfold bay, low wooded hills, beach market, many boats
PORT_DEFS.kaupang = {
  landmark: { x: 1500, y: 548, s: 0.62, dep: 0.15 },
  culture: 'norse', sunX: { day: 420, dusk: 340, night: 380 },
  style: { rk: 'shingle', roof: '#4e4236', wall: '#6a4a32' },
  sky: c => ({ clouds: 8, cloudBand: [50, 260], cloudW: 220 }),
  far: c => {
    let s = sea(c, 420, 540);
    s += hills(c, { pts: [[-20, 446], [220, 420], [460, 440], [700, 424], [940, 452], [1160, 432], [1380, 446], [1620, 428]], base: 560, depth: 0.72, color: '#56703c', mist: 36 });
    s += forest(c, { x0: 0, x1: 1600, step: 9, hMin: 12, hMax: 22, depth: 0.62, kind: 'mixed', twoTone: false, ground: x => 444 + Math.sin(x / 140) * 9 });
    s += hills(c, { pts: [[-20, 500], [260, 480], [620, 496], [980, 486], [1300, 470], [1620, 482]], base: 600, depth: 0.42, color: '#5f7a3a' });
    s += forest(c, { x0: 900, x1: 1620, step: 11, hMin: 30, hMax: 52, depth: 0.36, kind: 'mixed', ground: x => 486 + Math.sin(x / 90) * 6 });
    s += forest(c, { x0: -20, x1: 260, step: 11, hMin: 30, hMax: 50, depth: 0.36, kind: 'mixed', ground: x => 494 });
    return s;
  },
  land: c => land(c, [[-30, 534], [300, 524], [620, 532], [940, 528], [1240, 516], [1630, 522]], 700, { color2: '#8a8a52' })
    + `<path d="M-30 690Q400 672 800 684T1630 676V712H-30Z" fill="${c.col(c.pal.winter ? '#e4e6ea' : '#d8c898', 0.95)}"/>`
    + groundDetail(c, { x0: 0, x1: 1600, y0: 550, y1: 670, paths: [[[60, 640], [400, 600], [760, 616], [1100, 594], [1540, 600]]], hay: [[1500, 560, 1]], fences: [[1380, 1520, 580]], people: [[300, 700, 690, 5]] }),
  slots: c => rows([
    [548, 0.74, 0.06, [[140, 'edge'], [380, 'high'], [640, 'high'], [900, 'edge'], [1150, 'center'], [1400, 'edge'], [770, 'f', { filler: 'store' }]]],
    [606, 0.88, 0, [[250, 'center'], [530, 'center'], [820, 'center'], [1080, 'center'], [1340, 'center'], [1560, 'f', { filler: 'tree' }], [30, 'f', { filler: 'tree' }]]],
    [672, 1.0, 0, [[200, 'shore'], [620, 'shore'], [1040, 'shore'], [1420, 'center']]],
  ]),
  water: (c, refl) => water(c, { y: 712, reflect: refl, reflOp: 0.35 }),
  front: c => {
    let s = '';
    const m1 = mooredShip(c, 560, 800, 0.7, { sail: 'furled', facing: -1 }); s += m1.stat; c.anims.push(m1.anim);
    const m2 = mooredShip(c, 1140, 846, 0.95, { sail: 'none', shieldCols: ['#24467a', '#e8d8b0'] }); s += m2.stat; c.anims.push(m2.anim);
    s += boat(c, 250, 752, 0.9) + boat(c, 330, 764, 0.9, { facing: -1 }) + boat(c, 860, 756, 1, { man: true }) + boat(c, 1470, 780, 1.1, { facing: -1 });
    return s;
  },
};

// Hlaðir: the jarl's seat on a headland of the broad fjord; the great hall crowns the rise
PORT_DEFS.hladir = {
  culture: 'norse', sunX: { day: 360, dusk: 300, night: 420 }, seedExtra: 'b', style: { greatHall: true },
  sky: c => ({ clouds: 7, cloudBand: [60, 280], cloudW: 240, rays: !c.pal.night, aurora: c.pal.night && c.pal.winter }),
  far: c => {
    let s = range(c, { pts: [[-30, 430], [160, 380], [380, 405], [560, 360], [760, 400], [980, 372], [1200, 410], [1420, 380], [1630, 420]], base: 470, depth: 0.88, snow: c.pal.winter ? 420 : 380, rough: 0.2, mistBand: 30 });
    s += sea(c, 452, 720);
    s += hills(c, { pts: [[560, 720], [760, 600], [980, 520], [1180, 470], [1380, 480], [1630, 500]], base: 720, depth: 0.3, color: '#5f7a3a' });
    s += forest(c, { x0: 1300, x1: 1630, step: 13, hMin: 30, hMax: 50, depth: 0.3, ground: x => 486 + (x - 1300) * 0.05 });
    return s;
  },
  land: c => land(c, [[620, 720], [800, 640], [980, 566], [1160, 518], [1360, 522], [1630, 540]], 720, { bank: 8 })
    + groundDetail(c, { x0: 800, x1: 1600, y0: 560, y1: 700, paths: [[[760, 700], [960, 630], [1120, 580], [1240, 540]]], hay: [[1560, 560, 1]], fences: [[1420, 1580, 590]] }),
  slots: c => rows([
    [536, 1.0, 0.04, [[1250, 'high'], [1500, 'edge'], [1060, 'center']]],
    [612, 0.92, 0, [[920, 'center'], [1140, 'center'], [1380, 'center'], [1580, 'f', { filler: 'spruce' }]]],
    [690, 1.0, 0, [[860, 'shore'], [1130, 'shore'], [1420, 'center'], [700, 'edge']]],
  ]),
  water: (c, refl) => water(c, { y: 720, reflect: refl, reflOp: 0.38 }),
  front: c => {
    let s = '';
    const m1 = mooredShip(c, 360, 780, 0.75, { sail: 'set', facing: 1 }); s += m1.stat; c.anims.push(m1.anim);
    const m2 = mooredShip(c, 560, 850, 1.0, { sail: 'furled', facing: -1, shieldCols: ['#a3302a', '#c9a04a'] }); s += m2.stat; c.anims.push(m2.anim);
    s += boat(c, 140, 740, 0.8, { mast: true }) + boat(c, 960, 770, 1, { man: true, facing: -1 });
    s += pier(c, 820, 1140, 742);
    return s;
  },
};

// Hálogaland: jagged peaks straight from the sea, fish racks, the midnight sun of summer
PORT_DEFS.halogaland = {
  culture: 'norse', sunX: { day: 1240, dusk: 1000, night: 820 }, seedExtra: 'c',
  style: { roof: '#6a8a3a' },
  pal: (t, se) => t === 'night' && se !== 'winter'
    ? { skyTop: '#3b4a7a', skyMid: '#d88a7a', skyBot: '#ffd08a', sun: '#ffe2a0', sunGlow: '#ffb060', light: '#ffcf9a', shadow: '#3a3058', haze: '#d8a090', waterTop: '#f0b884', waterMid: '#8a6a7a', waterBot: '#2a2c4a', cloudLit: '#ffd0a0', cloudShade: '#8a6a86', glow: 0.6, sunY: 470, sunR: 40, ground: '#6a7038', groundDark: '#3a3a28', foliage: '#4a5a30' }
    : t === 'day' ? { skyTop: '#3f7cc0', skyMid: '#8fc0e4', light: '#fff8ec' } : {},
  sky: c => ({ clouds: 5, cloudBand: [80, 300], cloudW: 180, noStars: c.pal.time === 'night' && !c.pal.winter, aurora: c.pal.night && c.pal.winter, glowR: c.pal.time === 'night' && !c.pal.winter ? 700 : undefined }),
  far: c => {
    let s = sea(c, 480, 720);
    s += range(c, { pts: [[700, 520], [780, 430], [840, 450], [900, 380], [960, 410], [1010, 330], [1060, 380], [1120, 300], [1170, 350], [1230, 280], [1290, 340], [1350, 270], [1420, 330], [1490, 290], [1560, 350], [1630, 330]], base: 540, depth: 0.62, snow: c.pal.winter ? 420 : 330, rough: 0.7, iter: 5, color: '#5a5a66', foot: '#46603a', gullies: 18, maxShade: 90 });
    s += range(c, { pts: [[-30, 480], [30, 360], [80, 300], [110, 330], [150, 220], [190, 260], [230, 170], [270, 230], [300, 200], [350, 140], [390, 210], [430, 180], [480, 260], [540, 320], [600, 400], [680, 500]], base: 540, depth: 0.42, snow: c.pal.winter ? 380 : 230, rough: 0.7, iter: 5, color: '#56565c', foot: '#46603a', gullies: 22, maxShade: 90 });
    return s;
  },
  land: c => land(c, [[-30, 590], [260, 560], [560, 590], [880, 600], [1180, 584], [1630, 570]], 716, { bank: 10, color2: '#5a5a42' })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 590, y1: 700, rocks: [[100, 700, 5, 1], [1500, 690, 5, 1]] }),
  slots: c => rows([
    [588, 0.78, 0.05, [[200, 'high'], [470, 'edge'], [1080, 'high'], [1340, 'edge']]],
    [646, 0.92, 0, [[330, 'center'], [700, 'center'], [980, 'center'], [1260, 'center']]],
    [700, 1.0, 0, [[150, 'shore', { filler: 'house' }], [560, 'shore'], [1460, 'shore']]],
  ]),
  mid: c => fishRack(c, 860, 708, 1.25) + fishRack(c, 1110, 712, 1.1) + fishRack(c, 60, 660, 0.9) + fishRack(c, 1530, 640, 0.9) + figure(c, 990, 712, 1.1, { arm: [6, -10] }),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = '';
    const m1 = mooredShip(c, 620, 820, 0.9, { sail: 'furled', facing: 1, sailCols: ['#24467a', '#efe2c4'] }); s += m1.stat; c.anims.push(m1.anim);
    s += boat(c, 300, 772, 1.1, { man: true }) + boat(c, 1300, 790, 1.2, { mast: true, facing: -1 }) + boat(c, 1100, 860, 1.3, { man: true });
    s += rocks(c, 1560, 892, 6, 2.6, 0, '#4a4a4e') + rocks(c, 40, 896, 5, 2.2, 0, '#4a4a4e');
    return s;
  },
};

// Færeyjar: sheer green cliffs, sea stacks, grass roofs in a cove, mist
PORT_DEFS.faereyjar = {
  culture: 'island', sunX: { day: 1060, dusk: 900, night: 1000 },
  pal: (t) => t === 'day' ? { skyTop: '#7a94ae', skyMid: '#b8c6cc', skyBot: '#dcdcd2', haze: '#c4ccd0', hazeK: 0.9, light: '#f2f0ea' } : { hazeK: 0.85 },
  sky: c => ({ clouds: 12, cloudBand: [20, 300], cloudW: 300 }),
  far: c => {
    let s = sea(c, 470, 720);
    s += seaStack(c, 760, 486, 50, 120, { depth: 0.75 }) + seaStack(c, 830, 488, 30, 80, { depth: 0.75 });
    s += faroeCliff(c, [[-30, 130], [120, 140], [260, 190], [400, 290], [520, 410], [600, 520]], 720, 0.3);
    s += faroeCliff(c, [[1000, 520], [1120, 360], [1260, 230], [1400, 170], [1630, 150]], 720, 0.3);
    s += waterfall(c, 1330, 196, 520, 7, 0.3);
    return s;
  },
  land: c => land(c, [[220, 718], [300, 660], [480, 592], [700, 600], [920, 594], [1120, 570], [1330, 562], [1430, 640], [1480, 718]], 716, { bank: 12, color: '#6a8a3a' })
    + groundDetail(c, { x0: 400, x1: 1300, y0: 600, y1: 700, fences: [[440, 560, 640]], rocks: [[1240, 690, 4, 1]] }),
  slots: c => rows([
    [588, 0.8, 0.05, [[560, 'high'], [820, 'edge'], [1060, 'high']]],
    [640, 0.94, 0, [[480, 'center'], [740, 'center'], [980, 'center'], [1200, 'center']]],
    [698, 1.0, 0, [[620, 'shore'], [900, 'shore'], [1140, 'edge']]],
  ]),
  mid: c => {
    // grazing sheep
    let g = '';
    for (const [x, y] of [[470, 612], [500, 620], [1250, 590], [1290, 596], [1180, 604]]) g += `<ellipse cx="${x}" cy="${y}" rx="9" ry="6" fill="${c.col('#f0ece0', 1)}"/><circle cx="${x + 9}" cy="${y - 3}" r="3" fill="${c.col('#2a2420', 1)}"/>`;
    return g;
  },
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.35 }),
  front: c => {
    let s = seaStack(c, 160, 880, 160, 300, { depth: 0 }) + seaStack(c, 1480, 900, 120, 220, { depth: 0 });
    const m = mooredShip(c, 760, 810, 0.8, { sail: 'furled', sailCols: ['#24467a', '#efe2c4'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 1100, 780, 1, { man: true }) + boat(c, 460, 770, 0.9, { facing: -1 });
    return s;
  },
  gulls: 7,
};

// Ísland: turf farmsteads on a black-sand bay, a snow volcano, glacier and steaming springs
PORT_DEFS.island = {
  culture: 'island', sunX: { day: 520, dusk: 420, night: 600 },
  pal: (t) => t === 'day' ? { skyTop: '#5e86b4', skyMid: '#a8c4d8', light: '#fffaf0' } : {},
  sky: c => ({ clouds: 6, cloudBand: [60, 240], cloudW: 260, aurora: c.pal.night }),
  far: c => {
    let s = range(c, { pts: [[-30, 440], [200, 404], [420, 414], [600, 392], [760, 420], [900, 470]], base: 480, depth: 0.82, snow: 425, rough: 0.12, color: '#6a6a70' });
    s += volcano(c, 1120, 470, 760, 300, { depth: 0.55, lava: true });
    s += hills(c, { pts: [[-30, 490], [300, 470], [640, 486], [900, 470], [1200, 480], [1630, 466]], base: 560, depth: 0.5, color: '#6a6a3e' });
    s += hills(c, { pts: [[-30, 530], [400, 520], [800, 540], [1200, 526], [1630, 534]], base: 620, depth: 0.32, color: '#7a7a42' });
    return s;
  },
  land: c => land(c, [[-30, 560], [300, 552], [640, 566], [980, 560], [1300, 548], [1630, 556]], 716, { color: '#7a7a40', color2: '#4a4a36' })
    + `<path d="M-30 704Q400 690 800 700T1630 694V720H-30Z" fill="${c.col(c.pal.winter ? '#cfd4dc' : '#2e2c2e', 0.95)}"/>`
    + groundDetail(c, { x0: 0, x1: 1600, y0: 570, y1: 690, rocks: [[250, 640, 4, 0.8], [1350, 620, 5, 0.8], [800, 690, 3, 0.7]], fences: [[60, 220, 640]] }),
  slots: c => rows([
    [576, 0.84, 0.05, [[200, 'high'], [520, 'edge'], [1100, 'high'], [1380, 'edge'], [820, 'f', { filler: 'turf' }]]],
    [632, 0.98, 0, [[340, 'center'], [680, 'center'], [980, 'center'], [1260, 'center'], [1520, 'f', { filler: 'turf' }]]],
    [690, 1.04, 0, [[160, 'edge'], [560, 'shore'], [1420, 'shore']]],
  ]),
  over: c => {
    // hot springs: steaming pools, one geyser
    let s = '';
    for (const [x, y, w] of [[860, 678, 40], [1000, 690, 30], [1180, 668, 26]]) s += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${w * 0.25}" fill="${c.col('#6ac0c8', 1)}"/><ellipse cx="${x}" cy="${y}" rx="${w * 1.15}" ry="${w * 0.32}" fill="none" stroke="${c.col('#d8d0b0', 1)}" stroke-width="3"/>`;
    c.anims.push(steam(c, 860, 674, 1.2), steam(c, 1180, 664, 0.9), geyserAnim(c, 1000, 688, 1));
    return s;
  },
  water: (c, refl) => water(c, { y: 720, reflect: refl, reflOp: 0.35 }),
  front: c => {
    let s = '';
    const m = mooredShip(c, 900, 820, 0.85, { sail: 'furled', sailCols: ['#24467a', '#efe2c4'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 380, 780, 1.1, { man: true }) + rocks(c, 1520, 896, 5, 2.4, 0, '#2e2c30') + rocks(c, 60, 896, 4, 2, 0, '#2e2c30');
    return s;
  },
  snowfall: true,
};

// Orkneyjar: low green isles, a ring of standing stones, a broch on a tidal islet
PORT_DEFS.orkney = {
  culture: 'norse', sunX: { day: 1250, dusk: 1150, night: 1200 }, seedExtra: 'd',
  style: { wk: 'pStone', wall: '#9a948a', rk: 'turf', dragon: false, filler: (c, st) => FILL.flag(c, st) },
  sky: c => ({ clouds: 9, cloudBand: [40, 320], cloudW: 280, rays: c.pal.dusk }),
  far: c => {
    let s = sea(c, 470, 720);
    s += hills(c, { pts: [[-30, 486], [200, 470], [460, 480], [700, 474]], base: 500, depth: 0.85, color: '#6a8a4a' });
    s += hills(c, { pts: [[900, 490], [1100, 462], [1400, 470], [1630, 480]], base: 500, depth: 0.85, color: '#6a8a4a' });
    s += cliff(c, [[1180, 640], [1300, 560], [1420, 540], [1630, 530]], 720, { depth: 0.2, color: '#7a6a58' });
    return s;
  },
  land: c => land(c, [[-30, 560], [260, 540], [520, 566], [800, 584], [1060, 600], [1260, 620]], 716, { bank: 10 })
    + standingStones(c, 300, 530, 120, 11, 46, 0.12)
    + groundDetail(c, { x0: 0, x1: 1200, y0: 580, y1: 700, fences: [[880, 1020, 620]], rocks: [[1100, 700, 3, 0.8]] }),
  slots: c => rows([
    [596, 0.82, 0.04, [[560, 'high'], [820, 'edge'], [120, 'edge']]],
    [646, 0.95, 0, [[260, 'center'], [500, 'center'], [760, 'center'], [1000, 'center']]],
    [700, 1.0, 0, [[160, 'shore'], [620, 'shore'], [1040, 'shore']]],
  ]),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.35 }),
  front: c => {
    let s = `<path d="M1260 760Q1380 720 1500 726Q1580 732 1630 760V790H1260Z" fill="${c.col(c.pal.winter ? '#e8ecf0' : '#6a8a3a', 0.9)}"/>` + broch(c, 1430, 738, 1.1);
    const m = mooredShip(c, 760, 820, 0.85, { sail: 'furled' }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 380, 780, 1, { man: true }) + boat(c, 1100, 860, 1.2);
    return s;
  },
  gulls: 6,
};

// Dyflin: the longphort by the black pool, an earthen bank, round tower on the hill, soft mountains
PORT_DEFS.dyflin = {
  landmark: { x: 230, y: 506, s: 0.85, dep: 0.12 },
  culture: 'gael', sunX: { day: 400, dusk: 360, night: 460 },
  sky: c => ({ clouds: 10, cloudBand: [40, 300], cloudW: 260 }),
  far: c => {
    let s = hills(c, { pts: [[-30, 420], [180, 380], [360, 400], [560, 360], [760, 410], [1000, 384], [1240, 400], [1630, 380]], base: 520, depth: 0.82, color: '#5a6a7a', mist: 40, tension: 0.6 });
    s += hills(c, { pts: [[-30, 480], [260, 460], [600, 486], [900, 466], [1300, 480], [1630, 470]], base: 600, depth: 0.5, color: '#5f8a3a' });
    s += forest(c, { x0: 1150, x1: 1630, step: 12, hMin: 26, hMax: 40, depth: 0.45, kind: 'mixed', ground: x => 478 });
    return s;
  },
  land: c => land(c, [[-30, 520], [200, 500], [420, 540], [700, 560], [1000, 556], [1300, 548], [1630, 560]], 716, { bank: 10 })
    + rampart(c, [[520, 560], [700, 548], [920, 545], [1140, 552], [1360, 566]], 26, { ph: 20 })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 700, paths: [[[200, 700], [460, 640], [800, 650], [1200, 630], [1560, 640]]], hay: [[1530, 580, 1]], fences: [[40, 200, 580]] }),
  slots: c => rows([
    [536, 0.8, 0.05, [[140, 'high'], [380, 'edge']]],
    [600, 0.86, 0, [[640, 'center'], [880, 'center'], [1120, 'center'], [1360, 'edge']]],
    [644, 0.95, 0, [[320, 'center'], [760, 'center'], [1240, 'center'], [1520, 'f', { filler: 'tree' }]]],
    [700, 1.02, 0, [[160, 'edge'], [560, 'shore'], [1000, 'shore'], [1420, 'shore']]],
  ]),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = pier(c, 300, 560, 760);
    const m1 = mooredShip(c, 840, 816, 0.85, { sail: 'furled', sailCols: ['#2a7a3a', '#efe2c4'] }); s += m1.stat; c.anims.push(m1.anim);
    const m2 = mooredShip(c, 1300, 860, 0.95, { sail: 'none' }); s += m2.stat; c.anims.push(m2.anim);
    s += boat(c, 140, 800, 1, { man: true });
    return s;
  },
};

// Jórvík: river town of the Danes in the old Roman walls; minster tower, wooden bridge
PORT_DEFS.jorvik = {
  landmark: { x: 1230, y: 548, s: 0.95, dep: 0.06 },
  culture: 'anglonorse', sunX: { day: 1180, dusk: 1060, night: 1100 },
  sky: c => ({ clouds: 9, cloudBand: [50, 280], cloudW: 240 }),
  far: c => {
    let s = hills(c, { pts: [[-30, 440], [300, 420], [700, 436], [1100, 416], [1630, 430]], base: 520, depth: 0.85, color: '#7a7a5a', mist: 30 });
    s += hills(c, { pts: [[-30, 480], [400, 470], [800, 486], [1200, 470], [1630, 480]], base: 560, depth: 0.55, color: '#6a8a40' });
    s += forest(c, { x0: -30, x1: 1630, step: 16, hMin: 20, hMax: 34, depth: 0.5, kind: 'mixed', ground: x => 484 });
    return s;
  },
  land: c => land(c, [[-30, 540], [400, 530], [800, 540], [1200, 528], [1630, 536]], 716, { bank: 10 })
    + seaWall(c, 120, 1480, 546, 40, [180, 520, 860, 1200, 1430], { col: '#b4a88e', tw: 46, th: 30, depth: 0.08 })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 580, y1: 700, paths: [[[60, 690], [420, 640], [800, 650], [1200, 630], [1560, 640]]], fences: [[1300, 1440, 690]] }),
  slots: c => rows([
    [586, 0.84, 0.04, [[300, 'high'], [700, 'center'], [1060, 'high'], [1340, 'edge']]],
    [640, 0.94, 0, [[160, 'center'], [480, 'center'], [880, 'center'], [1220, 'center'], [1500, 'center']]],
    [700, 1.0, 0, [[330, 'shore'], [700, 'shore'], [1100, 'edge']]],
  ]),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = bridge(c, 1180, 1640, 742, { arch: 10, people: 5 });
    const m = mooredShip(c, 640, 820, 0.8, { sail: 'furled', sailCols: ['#9a2a2a', '#d8c070'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 260, 780, 1, { man: true }) + boat(c, 980, 850, 1.1, { facing: -1 });
    return s;
  },
};

// Hamwic: flat Saxon estuary at low tide, mudflats and channels, thatch and a timber church
PORT_DEFS.hamwic = {
  landmark: { x: 1360, y: 560, s: 0.9, dep: 0.05 },
  culture: 'saxon', sunX: { day: 1100, dusk: 1000, night: 1060 },
  style: { gableMix: 0.2 },
  sky: c => ({ clouds: 8, cloudBand: [60, 330], cloudW: 300, rays: c.pal.dusk }),
  far: c => {
    let s = hills(c, { pts: [[-30, 470], [300, 456], [700, 466], [1100, 450], [1630, 462]], base: 520, depth: 0.85, color: '#7a8a5a', mist: 24 });
    s += hills(c, { pts: [[-30, 500], [500, 494], [1000, 504], [1630, 496]], base: 560, depth: 0.55, color: '#6a8a40' });
    for (const [x, h] of [[120, 70], [260, 60], [1380, 80], [1500, 66], [900, 56]]) s += broadTree(c, x, 506, h, { depth: 0.5 });
    return s;
  },
  land: c => land(c, [[-30, 540], [400, 536], [800, 546], [1200, 536], [1630, 542]], 690, { color2: '#6a7a40' })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 680, paths: [[[100, 680], [500, 620], [900, 640], [1400, 610]]], hay: [[60, 580, 1], [1550, 570, 1.1]], fences: [[1300, 1480, 600], [40, 200, 640]] }),
  slots: c => rows([
    [570, 0.82, 0.04, [[260, 'high'], [620, 'edge'], [980, 'high'], [1260, 'edge'], [1480, 'f', { filler: 'tree' }]]],
    [622, 0.94, 0, [[140, 'center'], [460, 'center'], [800, 'center'], [1120, 'center'], [1400, 'center']]],
    [674, 1.0, 0, [[300, 'shore'], [700, 'shore'], [1080, 'edge']]],
  ]),
  water: (c, refl) => {
    let s = water(c, { y: 700, reflect: refl, reflOp: 0.3 });
    // mudflats with channels
    s += `<path d="M-30 760Q300 740 600 770T1100 756T1630 774V820Q1300 800 1000 818T400 806T-30 820Z" fill="${c.col(c.pal.winter ? '#b8b8b4' : '#7a6a50', 0.85)}" opacity=".9"/><path d="M-30 700Q400 714 800 706T1630 712V724Q1200 730 800 720T-30 726Z" fill="${c.col('#8a7a5a', 0.85)}" opacity=".85"/>`;
    return s;
  },
  front: c => {
    let s = '';
    s += longship(c, 520, 792, 0.85, { sail: 'none', shieldCols: ['#c8a030', '#5a3a6a'] }).svg;
    const m = mooredShip(c, 1180, 860, 0.9, { sail: 'furled', sailCols: ['#c8a030', '#efe2c4'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 240, 800, 1, { man: true }) + boat(c, 860, 780, 0.9, { facing: -1 }) + figure(c, 640, 800, 1.2, { arm: [6, -4] }) + figure(c, 420, 806, 1.2);
    return s;
  },
};

// Rúðuborg: Frankish city on the river, chalk hills with vines, a great stone abbey
PORT_DEFS.rudaborg = {
  landmark: { x: 1180, y: 566, s: 1.05, dep: 0.04 },
  culture: 'frank', sunX: { day: 480, dusk: 400, night: 500 },
  style: { gableMix: 0.6, beams: true, wk: 'pWattle', wall: '#e0d4b4', filler: (c, st) => (c.rng() < 0.5 ? FILL.ttown(c, st) : B.house(c, st)) },
  sky: c => ({ clouds: 6, cloudBand: [60, 260], cloudW: 230 }),
  far: c => {
    let s = hills(c, { pts: [[-30, 420], [300, 380], [600, 400], [900, 370], [1200, 386], [1630, 360]], base: 560, depth: 0.7, color: '#8a9a5a' });
    s += cliff(c, [[900, 440], [1100, 400], [1300, 380], [1630, 370]], 560, { depth: 0.6, color: '#e8e2d0', grassW: 8, strata: 20 });
    // vineyard rows
    let v = '';
    for (let i = 0; i < 8; i++) for (let x = 90 + i * 10; x < 560 - i * 12; x += 9) v += `M${x} ${f0(424 + i * 15 + Math.sin(x / 80) * 4)}h0`;
    s += `<path d="${v}" stroke="${c.col(c.pal.winter ? '#8a8a7a' : '#3e5a24', 0.9, 0.6)}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
    s += hills(c, { pts: [[-30, 520], [400, 510], [800, 520], [1200, 506], [1630, 516]], base: 600, depth: 0.42, color: '#6a8a40' });
    return s;
  },
  land: c => land(c, [[-30, 552], [400, 544], [800, 552], [1200, 540], [1630, 548]], 712, { bank: 0 })
    + face(c, 'M-20 712V696H1620V712Z', c.col('#c4b89c', 0.85), 'pStone')
    + groundDetail(c, { x0: 0, x1: 1600, y0: 570, y1: 690, paths: [[[0, 680], [400, 640], [800, 660], [1200, 630], [1600, 650]]], pathW: 20 }),
  slots: c => rows([
    [578, 0.84, 0.04, [[820, 'high'], [300, 'edge'], [1240, 'high'], [1480, 'edge'], [560, 'f'], [1040, 'f']]],
    [632, 0.94, 0, [[160, 'center'], [460, 'center'], [760, 'center'], [1080, 'center'], [1380, 'center']]],
    [690, 1.0, 0, [[320, 'shore'], [740, 'shore'], [1180, 'shore'], [1520, 'f']]],
  ]),
  water: (c, refl) => water(c, { y: 712, reflect: refl, reflOp: 0.42 }),
  front: c => {
    let s = '';
    s += `<g>${longship(c, 380, 800, 0.8, { sail: 'furled', sailCols: ['#2a4a9a', '#efe2c4'] }).svg}</g>`;
    // Frankish river barge
    s += `<path d="M900 846h300l-20 22h-260z" fill="${c.col('#5a4030', 0.9)}"/><path d="M1050 846V720" stroke="${c.col('#4a3420')}" stroke-width="4"/><path d="M1052 724l60 50h-60z" fill="${c.col('#e8dcc0', 0.95)}"/>` + figure(c, 960, 846, 1.1) + figure(c, 1150, 846, 1.1, { arm: [6, -6], tool: [10, 20] });
    s += `<path d="M900 866h300l-20 16h-260z" fill="#000" opacity=".2"/>`;
    return s;
  },
};

// Heiðabýr: Danish market town inside its great semicircular rampart, by the Noor
function rauk(c, x, y, w, h, o = {}) {
  const dep = o.depth ?? 0, r = c.rng, sd = c.sunSide;
  const col = c.pal.night ? '#6a6a72' : '#a49c8a';
  const j = () => (r() - 0.5) * w * 0.12;
  const L = [[x - w * 0.5, y], [x - w * 0.4 + j(), y - h * 0.14], [x - w * 0.3 + j(), y - h * 0.3], [x - w * 0.34 + j(), y - h * 0.46], [x - w * 0.26 + j(), y - h * 0.6], [x - w * 0.36 + j(), y - h * 0.76], [x - w * 0.3, y - h * 0.9], [x - w * 0.12, y - h * 0.97], [x + w * 0.02, y - h], [x + w * 0.2, y - h * 0.95], [x + w * 0.34, y - h * 0.84], [x + w * 0.3 + j(), y - h * 0.66], [x + w * 0.22 + j(), y - h * 0.5], [x + w * 0.32 + j(), y - h * 0.32], [x + w * 0.38 + j(), y - h * 0.15], [x + w * 0.52, y]];
  let s = P(pts2d(L.map(q => [f0(q[0]), f0(q[1])])) + 'Z', c.col(col, 0.78, dep));
  // lit flank on the sun side, cap highlight, horizontal bedding and a dark wave-cut notch
  const lit = L.filter(q => (q[0] - x) * sd > -w * 0.05);
  s += P(pts2d(lit.map(q => [f0(q[0]), f0(q[1])])) + `L${f0(x + sd * w * 0.05)} ${y}Z`, c.col(col, 1.18, dep), ' opacity=".65"');
  s += P(`M${f0(x - w * 0.3)} ${f0(y - h * 0.9)}L${f0(x - w * 0.12)} ${f0(y - h * 0.97)}L${f0(x + w * 0.02)} ${f0(y - h)}L${f0(x + w * 0.2)} ${f0(y - h * 0.95)}L${f0(x + w * 0.1)} ${f0(y - h * 0.9)}Z`, c.col('#e8e2d0', 1, dep), ' opacity=".5"');
  let st = '';
  for (let i = 1; i < 9; i++) { const yy = y - h * i / 9; st += `M${f0(x - w * 0.3)} ${f0(yy)}q${f0(w * 0.3)} ${f1(r() * 4 - 2)} ${f0(w * (0.4 + r() * 0.2))} 0`; }
  s += `<path d="${st}" stroke="${c.col(col, 0.5, dep)}" stroke-width="2" opacity=".45" fill="none"/>`;
  s += P(`M${f0(x - w * 0.44)} ${f0(y)}Q${f0(x)} ${f0(y - h * 0.1)} ${f0(x + w * 0.48)} ${f0(y)}Z`, c.col('#3a3a34', 0.8, dep), ' opacity=".6"');
  // lichen
  for (let i = 0; i < 5; i++) s += `<ellipse cx="${f0(x + (r() - 0.5) * w * 0.5)}" cy="${f0(y - h * (0.3 + r() * 0.6))}" rx="${f0(4 + r() * 6)}" ry="${f0(2 + r() * 3)}" fill="${c.col('#7a8a5a', 0.9, dep)}" opacity=".5"/>`;
  s += `<path d="M${f0(x - w / 2 - 10)} ${y}h${f0(w + 20)}" stroke="#fff" stroke-width="3" opacity=".5"/>`;
  return s;
}
PORT_DEFS.heidaby = {
  landmark: { x: 1480, y: 548, s: 0.6, dep: 0.1 },
  culture: 'dane', sunX: { day: 1240, dusk: 1100, night: 1200 },
  style: { gableMix: 0.15 },
  sky: c => ({ clouds: 8, cloudBand: [60, 300], cloudW: 260 }),
  far: c => {
    let s = hills(c, { pts: [[-30, 452], [300, 440], [700, 452], [1100, 436], [1630, 448]], base: 520, depth: 0.8, color: '#6a8a4a', mist: 30 });
    s += forest(c, { x0: -30, x1: 1630, step: 13, hMin: 22, hMax: 38, depth: 0.6, kind: 'mixed', twoTone: false, ground: x => 452 + Math.sin(x / 200) * 6 });
    return s;
  },
  land: c => land(c, [[-30, 520], [400, 510], [800, 516], [1200, 508], [1630, 514]], 712, { bank: 8 })
    + rampart(c, [[-30, 590], [120, 512], [400, 478], [800, 470], [1200, 476], [1480, 506], [1630, 580]], 62, { ph: 18, strong: true })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 700, paths: [[[60, 700], [420, 640], [800, 650], [1180, 620], [1540, 640]]] })
    + (() => { const br = smooth([[770, 532], [800, 580], [776, 630], [806, 676], [800, 714]], 0.5); const p = c.pal;
      return `<path d="${br}" stroke="${c.col(p.groundDark, 0.8)}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="${br}" stroke="${c.col(mix(p.waterMid, p.groundDark, 0.35), 1)}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="${br}" stroke="${c.col(p.waterTop, 1)}" stroke-width="3" fill="none" opacity=".5" transform="translate(-2 0)"/>`
        + `<path d="M786 640h36" stroke="${c.col('#5a4030', 0.9)}" stroke-width="7"/><path d="M788 636v10M820 636v10" stroke="${c.col('#3a2a20', 0.9)}" stroke-width="3"/>`; })(),
  slots: c => rows([
    [556, 0.8, 0.04, [[260, 'high'], [520, 'edge'], [1040, 'high'], [1300, 'edge']]],
    [612, 0.9, 0, [[140, 'center'], [400, 'center'], [660, 'center'], [960, 'center'], [1200, 'center'], [1440, 'center']]],
    [692, 1.0, 0, [[300, 'shore'], [620, 'shore'], [1020, 'shore'], [1380, 'shore']]],
  ]),
  water: (c, refl) => water(c, { y: 712, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = stockade(c, -10, 380, 800, 34) + stockade(c, 1260, 1620, 806, 34);
    const m1 = mooredShip(c, 640, 810, 0.75, { sail: 'furled', sailCols: ['#b0302a', '#efe2c4'] }); s += m1.stat; c.anims.push(m1.anim);
    const m2 = mooredShip(c, 1010, 852, 0.9, { sail: 'none', facing: -1 }); s += m2.stat; c.anims.push(m2.anim);
    s += pier(c, 420, 640, 750) + boat(c, 1200, 770, 0.9, { man: true });
    return s;
  },
};

// Jómsborg: the raider fortress on the lagoon, sea gate over the harbour, grim sky
PORT_DEFS.jomsborg = {
  landmark: { x: 1050, y: 560, s: 0.8, dep: 0.05 },
  culture: 'wend', sunX: { day: 400, dusk: 300, night: 420 },
  pal: (t) => t === 'day' ? { skyTop: '#4a5470', skyMid: '#8a94a4', skyBot: '#c8c4b8', light: '#e8e4dc', haze: '#9aa0a8', cloudShade: '#5e6270', cloudLit: '#c8c8c8', waterTop: '#7a8a94', waterMid: '#3a4e5a', waterBot: '#1a262e' }
    : t === 'dusk' ? { skyMid: '#8a4a5a', skyBot: '#d07a4a', cloudShade: '#3a2a3a' } : {},
  sky: c => ({ clouds: 12, cloudBand: [20, 340], cloudW: 320 }),
  far: c => {
    let s = hills(c, { pts: [[-30, 470], [400, 456], [800, 466], [1200, 450], [1630, 462]], base: 520, depth: 0.82, color: '#4a5a40', mist: 26 });
    s += forest(c, { x0: -30, x1: 1630, step: 12, hMin: 22, hMax: 34, depth: 0.6, twoTone: false, ground: x => 466 });
    return s;
  },
  land: c => land(c, [[-30, 516], [400, 506], [800, 512], [1200, 504], [1630, 512]], 716, { bank: 8, color: '#5a6a3a' })
    + palisade(c, -20, 1620, x => 530 + Math.sin(x / 300) * 6, 40, { step: 8, col: '#4a3a2a' })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 700, patches: 12 }),
  slots: c => rows([
    [570, 0.82, 0.04, [[200, 'high'], [1400, 'high'], [500, 'edge'], [1120, 'edge']]],
    [626, 0.92, 0, [[120, 'center'], [380, 'center'], [1240, 'center'], [1500, 'center']]],
    [690, 1.0, 0, [[260, 'shore'], [1340, 'shore'], [560, 'edge'], [1060, 'edge']]],
  ]),
  mid: c => { c.dep = 0; return seaGate(c, 800, 740, 1.1); },
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = '';
    const m1 = mooredShip(c, 800, 790, 0.6, { sail: 'furled', sailCols: ['#1a1a1a', '#8e1a1a'], shieldCols: ['#1a1a1a', '#8e1a1a'], hull: '#2a201a' }); s += m1.stat; c.anims.push(m1.anim);
    const m2 = mooredShip(c, 360, 850, 0.95, { sail: 'set', sailCols: ['#8e1a1a', '#2a2420'], shieldCols: ['#1a1a1a', '#8e1a1a', '#b08a3a'], hull: '#2a201a', vane: true }); s += m2.stat; c.anims.push(m2.anim);
    const m3 = mooredShip(c, 1280, 846, 0.9, { sail: 'none', facing: -1, shieldCols: ['#1a1a1a', '#8e1a1a'], hull: '#2a201a' }); s += m3.stat; c.anims.push(m3.anim);
    return s;
  },
  gulls: 2,
};

// Truso: amber coast of the Aesti, dunes and pines, pickers in the surf
PORT_DEFS.truso = {
  culture: 'aesti', sunX: { day: 1150, dusk: 1050, night: 1150 },
  style: { filler: (c, st) => FILL.hut(c, st) },
  sky: c => ({ clouds: 6, cloudBand: [60, 280], cloudW: 280, rays: c.pal.dusk }),
  far: c => {
    let s = forest(c, { x0: -30, x1: 1630, step: 10, hMin: 30, hMax: 60, depth: 0.7, twoTone: false, wide: 0.3, ground: x => 486 + Math.sin(x / 160) * 10 });
    s += hills(c, { pts: [[-30, 500], [400, 490], [800, 500], [1200, 488], [1630, 496]], base: 560, depth: 0.5, color: '#5a7a3a' });
    s += forest(c, { x0: 1000, x1: 1630, step: 12, hMin: 50, hMax: 80, depth: 0.42, wide: 0.28, ground: x => 500 });
    return s;
  },
  land: c => land(c, [[-30, 546], [400, 540], [800, 552], [1200, 540], [1630, 548]], 690, { color2: '#7a7a4a' })
    + dunes(c, [[-30, 680], [200, 640], [420, 668], [640, 650], [900, 676], [1160, 648], [1400, 670], [1630, 650]], 720, 0)
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 640, patches: 10, fences: [[1300, 1460, 600]] }),
  slots: c => rows([
    [568, 0.84, 0.04, [[300, 'high'], [640, 'edge'], [1000, 'high'], [1300, 'edge']]],
    [618, 0.94, 0, [[160, 'center'], [480, 'center'], [820, 'center'], [1140, 'center'], [1460, 'center']]],
    [660, 1.0, 0, [[350, 'shore'], [940, 'shore']]],
  ]),
  water: (c, refl) => {
    let s = `<path d="M-30 720Q400 712 800 724T1630 716V760H-30Z" fill="${c.col(c.pal.winter ? '#dcdcd8' : '#e0cc96', 0.95)}"/>`;
    s += water(c, { y: 748, reflect: null });
    s += `<path d="M-30 750Q200 740 400 752T800 748T1200 754T1630 746" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/>`;
    return s;
  },
  front: c => {
    let s = amberPile(c, 300, 734, 1.2) + amberPile(c, 760, 738, 1) + amberPile(c, 1320, 730, 1.3);
    s += amberPicker(c, 480, 784, 1.5) + amberPicker(c, 620, 800, 1.6) + amberPicker(c, 1080, 790, 1.5) + amberPicker(c, 1200, 812, 1.7);
    s += figure(c, 330, 736, 1.3, { arm: [-4, 8] }) + figure(c, 1350, 732, 1.3);
    const m = mooredShip(c, 860, 856, 0.8, { sail: 'furled', sailCols: ['#d0801a', '#efe2c4'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 160, 760, 1.1, { refl: false });
    return s;
  },
};

// Gotland: limestone sea stacks, stone storehouse towers, turquoise sea, picture stones
PORT_DEFS.gotland = {
  culture: 'gotlander', sunX: { day: 1200, dusk: 1100, night: 1150 },
  pal: (t) => t === 'day' ? { waterTop: '#8fd0d0', waterMid: '#3a8a9a', waterBot: '#1c4a5a' } : {},
  style: { filler: (c, st) => (c.rng() < 0.4 ? FILL.kastal(c, st) : B.house(c, st)) },
  sky: c => ({ clouds: 5, cloudBand: [60, 260], cloudW: 220 }),
  far: c => {
    let s = sea(c, 470, 720);
    s += hills(c, { pts: [[-30, 500], [300, 480], [700, 488], [1100, 470], [1630, 482]], base: 560, depth: 0.55, color: '#7a8a5a' });
    for (let x = 30; x < 1600; x += 70) s += `<path d="M${x} ${492 + Math.sin(x) * 6}q8 -18 16 0z" fill="${c.col('#3a5a3a', 0.9, 0.5)}"/>`;
    return s;
  },
  land: c => land(c, [[-30, 540], [400, 530], [800, 540], [1200, 528], [1630, 536]], 712, { bank: 14, bankCol: '#cfc6b0', color: '#7a8a50' })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 700, fences: [[60, 240, 600]], rocks: [[700, 700, 4, 0.8]] }),
  slots: c => rows([
    [566, 0.84, 0.04, [[220, 'high'], [520, 'edge'], [860, 'f', { filler: 'kastal' }], [1160, 'high'], [1440, 'edge']]],
    [622, 0.94, 0, [[120, 'center'], [400, 'center'], [700, 'center'], [1000, 'center'], [1300, 'center'], [1540, 'f', { filler: 'kastal' }]]],
    [690, 1.0, 0, [[300, 'shore'], [740, 'shore'], [1200, 'shore']]],
  ]),
  water: (c, refl) => water(c, { y: 712, reflect: refl, reflOp: 0.35 }),
  front: c => {
    let s = rauk(c, 120, 862, 100, 240) + rauk(c, 236, 842, 64, 150) + rauk(c, 1500, 872, 120, 270);
    const m = mooredShip(c, 800, 830, 0.85, { sail: 'furled', sailCols: ['#2a5a8a', '#efe2c4'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 1100, 780, 1, { man: true }) + boat(c, 480, 770, 0.9);
    return s;
  },
};

// Birka: island town on the lake, the hillfort on its rock, a field of burial mounds
PORT_DEFS.birka = {
  culture: 'svear', sunX: { day: 1150, dusk: 1060, night: 1100 },
  sky: c => ({ clouds: 6, cloudBand: [60, 260], cloudW: 220, aurora: c.pal.night && c.pal.winter }),
  far: c => {
    let s = sea(c, 470, 720);
    s += hills(c, { pts: [[-30, 486], [200, 470], [420, 482]], base: 500, depth: 0.85, color: '#4a6a3a' }) + hills(c, { pts: [[600, 490], [800, 476], [1000, 488]], base: 500, depth: 0.85, color: '#4a6a3a' }) + hills(c, { pts: [[1240, 484], [1420, 466], [1630, 478]], base: 500, depth: 0.85, color: '#4a6a3a' });
    // the Borg: rocky hill with rampart and palisade
    s += hills(c, { pts: [[40, 600], [140, 480], [260, 424], [380, 432], [470, 500], [580, 590]], base: 640, depth: 0.2, color: '#5f7a3a', tension: 0.5 });
    s += rocks(c, 200, 500, 4, 1.4, 0.2, '#7a746a') + rocks(c, 430, 520, 3, 1.2, 0.2, '#7a746a') + rocks(c, 300, 560, 3, 1.5, 0.2, '#7a746a');
    s += palisade(c, 170, 440, x => 436 + Math.abs(x - 320) * 0.08, 22, { step: 7, depth: 0.2 });
    s += forest(c, { x0: 1150, x1: 1630, step: 12, hMin: 40, hMax: 70, depth: 0.25, kind: 'mixed', ground: x => 540 });
    return s;
  },
  land: c => land(c, [[-30, 600], [200, 586], [500, 570], [800, 556], [1100, 550], [1400, 556], [1630, 552]], 712, { bank: 10 })
    + mounds(c, [[1100, 566, 30], [1180, 572, 24], [1250, 562, 34], [1330, 574, 22], [1400, 566, 28], [1480, 576, 20]], 0.15)
    + groundDetail(c, { x0: 0, x1: 1600, y0: 590, y1: 700, paths: [[[100, 700], [400, 650], [760, 660], [1100, 630], [1500, 640]]] }),
  slots: c => rows([
    [592, 0.84, 0.04, [[620, 'high'], [880, 'edge'], [1500, 'f', { filler: 'birch' }]]],
    [640, 0.94, 0, [[200, 'center'], [460, 'center'], [740, 'center'], [1000, 'center'], [1280, 'center']]],
    [698, 1.0, 0, [[140, 'edge'], [520, 'shore'], [940, 'shore'], [1360, 'shore']]],
  ]),
  water: (c, refl) => water(c, { y: 712, reflect: refl, reflOp: 0.42 }),
  front: c => {
    let s = pier(c, 360, 620, 756) + pier(c, 1000, 1200, 770);
    const m = mooredShip(c, 760, 824, 0.8, { sail: 'furled', sailCols: ['#2a4a86', '#efe2c4'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 1340, 820, 1.1, { man: true }) + boat(c, 200, 800, 1);
    return s;
  },
};

// Aldeigjuborg: fortress on the high bank of the Volkhov, birch woods, log houses
PORT_DEFS.aldeigja = {
  culture: 'slav', sunX: { day: 420, dusk: 360, night: 460 },
  style: { gableMix: 0.6, filler: (c, st) => (c.rng() < 0.6 ? FILL.izba(c, st) : B.house(c, st)) },
  sky: c => ({ clouds: 7, cloudBand: [60, 280], cloudW: 260 }),
  far: c => {
    let s = forest(c, { x0: -30, x1: 1630, step: 11, hMin: 26, hMax: 44, depth: 0.72, twoTone: false, ground: x => 470 + Math.sin(x / 180) * 8 });
    s += hills(c, { pts: [[-30, 486], [400, 476], [800, 490], [1200, 478], [1630, 486]], base: 540, depth: 0.55, color: '#5f7a3a' });
    s += forest(c, { x0: -30, x1: 500, step: 13, kind: 'birch', hMin: 50, hMax: 80, depth: 0.4, ground: x => 500 });
    return s;
  },
  land: c => land(c, [[-30, 520], [400, 512], [800, 520], [1200, 508], [1630, 516]], 716, { bank: 40, bankCol: '#8a6a4a' })
    + kremlin(c, 900, 1600, x => 560 - (x - 900) * 0.02, 46, [[930, 54, 110], [1220, 50, 100], [1560, 56, 112]], { col: '#8a7a64', pat: 'pStone', roof: '#7a776d' })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 670, paths: [[[60, 660], [400, 620], [800, 630], [1100, 610]]] }),
  slots: c => rows([
    [560, 0.82, 0.04, [[160, 'edge'], [420, 'high'], [680, 'edge'], [1080, 'f', { filler: 'izba' }], [1380, 'high']]],
    [618, 0.94, 0, [[120, 'center'], [360, 'center'], [620, 'center'], [880, 'center'], [1160, 'center'], [1440, 'center']]],
    [672, 1.0, 0, [[260, 'shore'], [760, 'shore'], [1240, 'shore']]],
  ]),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = pier(c, 200, 460, 750);
    const m = mooredShip(c, 900, 820, 0.8, { sail: 'furled', sailCols: ['#c22a22', '#e8c040'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 1300, 800, 1.1, { man: true }) + boat(c, 600, 860, 1.2, { facing: -1, man: true });
    return s;
  },
};

// Hólmgarðr: the wide river, the long market bridge, the log kremlin on the left bank
PORT_DEFS.holmgard = {
  landmark: { x: 1480, y: 560, s: 0.7, dep: 0.12 },
  culture: 'slav', sunX: { day: 1180, dusk: 1080, night: 1120 },
  style: { gableMix: 0.6, filler: (c, st) => (c.rng() < 0.6 ? FILL.izba(c, st) : B.house(c, st)) },
  sky: c => ({ clouds: 8, cloudBand: [60, 280], cloudW: 260 }),
  far: c => {
    let s = sea(c, 456, 720, { noGlint: false });
    s += forest(c, { x0: -30, x1: 1630, step: 12, hMin: 16, hMax: 26, depth: 0.82, twoTone: false, ground: x => 460 });
    s += hills(c, { pts: [[-30, 520], [200, 486], [420, 476], [620, 500], [700, 540]], base: 600, depth: 0.25 });
    s += kremlin(c, 30, 640, x => 500 + Math.abs(x - 330) * 0.04, 44, [[60, 46, 96], [330, 56, 120], [610, 46, 96]], { depth: 0.22 });
    s += hills(c, { pts: [[960, 540], [1120, 500], [1400, 490], [1630, 500]], base: 600, depth: 0.25 });
    return s;
  },
  land: c => land(c, [[-30, 560], [300, 552], [640, 576], [760, 600]], 716, { bank: 10 }) + land(c, [[880, 600], [1000, 566], [1300, 548], [1630, 556]], 716, { bank: 10 })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 580, y1: 700, patches: 10 }),
  slots: c => rows([
    [590, 0.86, 0.03, [[140, 'high'], [420, 'edge'], [1100, 'high'], [1380, 'edge']]],
    [646, 0.95, 0, [[90, 'center'], [330, 'center'], [580, 'center'], [1040, 'center'], [1280, 'center'], [1520, 'center']]],
    [700, 1.0, 0, [[200, 'shore'], [1180, 'shore'], [1460, 'shore']]],
  ]),
  mid: c => bridge(c, 600, 1060, 590, { arch: 20, step: 40, pileH: 120, people: 8, fs: 0.95 }),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = '';
    const m = mooredShip(c, 760, 820, 0.85, { sail: 'furled', sailCols: ['#c22a22', '#e8c040'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 300, 790, 1, { man: true }) + boat(c, 1200, 800, 1.1, { man: true, facing: -1 }) + boat(c, 1420, 860, 1.2);
    return s;
  },
};

// Kænugarðr: the high hills above the great river, a kremlin on the crest, the lower town below
PORT_DEFS.kaenugard = {
  culture: 'slav', sunX: { day: 420, dusk: 340, night: 460 },
  style: { gableMix: 0.6, filler: (c, st) => (c.rng() < 0.6 ? FILL.izba(c, st) : B.house(c, st)) },
  sky: c => ({ clouds: 6, cloudBand: [50, 240], cloudW: 220, rays: c.pal.dusk }),
  far: c => {
    let s = sea(c, 520, 720);
    s += hills(c, { pts: [[-30, 520], [400, 512], [700, 522]], base: 540, depth: 0.85, color: '#7a8a5a' });
    s += hills(c, { pts: [[560, 720], [700, 560], [860, 420], [1060, 330], [1300, 310], [1630, 330]], base: 720, depth: 0.2, color: '#6a8a3a', tension: 0.6 });
    s += kremlin(c, 960, 1600, x => 340 + Math.abs(x - 1280) * 0.03, 48, [[990, 50, 108], [1280, 64, 140], [1580, 50, 108]], { depth: 0.18 });
    s += forest(c, { x0: 620, x1: 900, step: 14, kind: 'mixed', hMin: 30, hMax: 50, depth: 0.2, ground: x => 720 - (x - 560) * 1.05 + 40 });
    return s;
  },
  land: c => land(c, [[-30, 640], [300, 610], [560, 600], [800, 560], [1000, 470], [1200, 420], [1630, 410]], 716, { bank: 10 })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 600, y1: 700, paths: [[[200, 700], [600, 640], [900, 560], [1150, 470], [1300, 420]]], pathW: 18 }),
  slots: c => rows([
    [440, 0.92, 0.06, [[1180, 'high'], [1440, 'high']]],
    [520, 0.94, 0.03, [[980, 'high'], [1260, 'center'], [1500, 'edge']]],
    [626, 0.95, 0, [[120, 'center'], [380, 'center'], [640, 'center'], [880, 'center']]],
    [700, 1.0, 0, [[240, 'shore'], [600, 'shore'], [1180, 'shore'], [1480, 'edge']]],
  ]),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.36 }),
  front: c => {
    let s = `<path d="M-30 760Q120 740 280 752Q340 760 300 776H-30Z" fill="${c.col(c.pal.winter ? '#e0e2e4' : '#d8c08a', 0.95)}"/>`;
    const m = mooredShip(c, 860, 830, 0.85, { sail: 'furled', sailCols: ['#c22a22', '#e8c040'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 140, 760, 1, { refl: false, man: true }) + boat(c, 1300, 800, 1.1, { man: true });
    return s;
  },
};

// Miklagarðr: the Queen of Cities: sea walls, a sea of domes, cypresses, the chain across the harbour
PORT_DEFS.miklagard = {
  culture: 'byzantine', sunX: { day: 1200, dusk: 1080, night: 1150 },
  pal: (t, se) => t === 'day' ? { skyTop: '#3a78c0', skyMid: '#8cc0e8', skyBot: '#f0e6cc', light: '#fff0d8', waterTop: '#7ab8c8', waterMid: '#2b6f8a', waterBot: '#123a50', ground: '#8a8a4a', haze: '#d0d8d8' } : { ground: '#7a7a44' },
  style: { filler: (c, st) => (c.rng() < 0.25 ? FILL.cypress(c, st) : FILL.byzhouse(c, st)) },
  sky: c => ({ clouds: 4, cloudBand: [60, 220], cloudW: 200 }),
  far: c => {
    let s = sea(c, 470, 720);
    s += hills(c, { pts: [[-30, 474], [300, 456], [600, 468], [900, 450], [1300, 462], [1630, 452]], base: 500, depth: 0.85, color: '#8a9a6a', mist: 20 });
    s += hills(c, { pts: [[-30, 560], [200, 470], [500, 420], [800, 400], [1100, 410], [1400, 440], [1630, 470]], base: 720, depth: 0.25, color: '#8a8a4a', tension: 0.6 });
    c.dep = 0.15;
    s += greatDome(c, 760, 470, 1.05);
    c.dep = 0;
    for (const [x, y, h] of [[480, 470, 80], [540, 476, 70], [1000, 470, 90], [1060, 478, 66], [300, 520, 80], [1300, 500, 84]]) s += cypress(c, x, y, h, 0.18);
    return s;
  },
  land: c => land(c, [[-30, 540], [300, 500], [600, 490], [900, 488], [1200, 500], [1630, 520]], 716, { bank: 0, color: '#8a8a4a' })
    + groundDetail(c, { x0: 0, x1: 1600, y0: 560, y1: 690, patches: 8 }),
  slots: c => rows([
    [530, 0.82, 0.05, [[200, 'high'], [470, 'edge'], [1080, 'high'], [1360, 'edge'], [700, 'f'], [900, 'f']]],
    [594, 0.92, 0, [[100, 'center'], [360, 'center'], [620, 'center'], [880, 'center'], [1140, 'center'], [1420, 'center']]],
    [660, 0.98, 0, [[240, 'shore'], [560, 'shore'], [1020, 'shore'], [1320, 'shore'], [1540, 'f']]],
  ]),
  mid: c => seaWall(c, -30, 1630, 712, 46, [60, 380, 700, 1020, 1340, 1580], { col: '#ddd0b4', tw: 48, th: 32 }),
  water: (c, refl) => water(c, { y: 716, reflect: refl, reflOp: 0.4 }),
  front: c => {
    let s = harbourChain(c, -10, 1610, 790);
    // dromons
    s += longship(c, 1200, 850, 0.95, { sail: 'set', sailCols: ['#7a1f66', '#f2e6c8'], shields: false, hull: '#5a2a1a', oars: true }).svg;
    const m = mooredShip(c, 420, 846, 0.85, { sail: 'furled', sailCols: ['#a3302a', '#efe2c4'] }); s += m.stat; c.anims.push(m.anim);
    s += boat(c, 800, 770, 1, { man: true, col: '#7a4a2a' });
    return s;
  },
  gulls: 5,
};

// ---------- title scene ----------
// A dragon ship running out at sunrise beneath sea cliffs, aurora fading in the high sky.
// The top ~35% is kept calm for the game title.
export function titleScene(o = {}) {
  const c = makeCtx({ seed: 'title', time: 'dawn', season: 'summer', detail: o.detail || autoDetail(), sunX: 1010, animate: o.animate,
    pal: { skyTop: '#0e1838', skyMid: '#7a4a78', skyBot: '#ffb070', sun: '#fff0c8', sunGlow: '#ffa050', light: '#ffc890', shadow: '#1e1a38', haze: '#d08a7a', waterTop: '#f0a070', waterMid: '#5a3a5a', waterBot: '#0e1428', sunY: 548, sunR: 44, cloudLit: '#ffc890', cloudShade: '#5a3a5a' } });
  stdDefs(c);
  let stat = sky(c, { clouds: 5, cloudBand: [300, 470], cloudW: 380, streaks: true, noStars: true, glowR: 760, rays: true, rayOp: 0.1, rayDir: -Math.PI / 2, midAt: 0.38, botAt: 0.6 });
  // a few last stars and the aurora in the dark upper sky
  let st = '';
  const r = c.rng;
  for (let i = 0; i < 60; i++) st += `M${f0(r() * 1600)} ${f0(Math.pow(r(), 1.8) * 260)}h0`;
  stat += `<path d="${st}" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
  const aur = c.animate ? '' : '';
  stat += sea(c, 548, 900, { noGlint: true });
  stat += range(c, { pts: [[420, 548], [560, 500], [700, 520], [820, 488], [940, 530], [1040, 548]], base: 552, depth: 0.85, rough: 0.2, rim: true, shade: false });
  // aurora (animated, sits behind the cliffs because cliffs go to the front layer)
  c.anims.push(aurora(c, { y: 20, bands: 3, animate: true }));
  const wa = c.anims.length;
  stat += water(c, { y: 552, glitter: true, ripples: 220, foam: false, sunX: 1010 });
  const split = c.anims.length;
  // cliffs framing both sides, dark with warm rim light
  let front = '';
  const cl = (pts, side) => {
    let g = `<path d="${smooth(pts, 0.35)}L${pts[pts.length - 1][0]} 900L${pts[0][0]} 900Z" fill="#140f1c"/>`;
    g += `<path d="${smooth(pts, 0.35)}" stroke="#ffb070" stroke-width="3" fill="none" opacity=".55"/>`;
    let d = '';
    for (let i = 0; i < 16; i++) { const x = pts[0][0] + r() * (pts[pts.length - 1][0] - pts[0][0]), y = yAt(pts, x) + 20 + r() * 300; d += `M${f0(x)} ${f0(y)}h${f0(20 + r() * 60)}`; }
    g += `<path d="${d}" stroke="#3a2a3a" stroke-width="3" opacity=".6"/>`;
    return g;
  };
  front += cl([[-30, 120], [80, 110], [180, 170], [250, 300], [300, 460], [360, 620], [420, 760], [470, 900]], -1);
  front += forest(Object.assign(c, {}), { x0: 0, x1: 200, step: 16, hMin: 30, hMax: 54, depth: 0, color: '#120e18', twoTone: false, ground: x => 112 + Math.max(0, x - 80) * 0.5 });
  front += cl([[1300, 900], [1360, 700], [1420, 520], [1480, 380], [1540, 300], [1630, 260]], 1);
  // the dragon ship, sail set, oars out
  const sh = longship(c, 700, 760, 1.55, { sail: 'set', oars: true, vane: true, sailCols: ['#a3302a', '#efe2c4'] });
  front += `<g transform="translate(700 772) scale(1.55 -1.2)" opacity=".25">${sh.body}</g>`;
  front += `<path d="M420 770q60 -10 130 4M860 778q80 6 160 -4" stroke="#ffd0a0" stroke-width="3" fill="none" opacity=".5"/>`;
  c.anims.push(c.animate ? `<g class="wr-anim-ship" transform="${sh.tr}"><g><animateTransform attributeName="transform" type="rotate" values="-1.4 0 0;1 0 -20;-1.4 0 0" dur="5s" repeatCount="indefinite"/>${sh.body}</g></g>` : sh.svg);
  c.anims.push(gullsAnim(c, 5, { y0: 280, h: 200 }));
  front += vignette(c, 0.55);
  return assemble(c, { stat, front, split }, o);
}

// ---------- sea scene (voyages, battles) ----------
export function seaScene(o = {}) {
  const weather = o.weather || 'clear', time = o.time || 'day';
  const W = {
    clear: {},
    fog: { skyTop: '#9aa4aa', skyMid: '#c4c8c6', skyBot: '#d8d8d2', haze: '#d0d2ce', hazeK: 1, waterTop: '#a8b4b4', waterMid: '#6a7e82', waterBot: '#3a4c52', cloudLit: '#e8e8e4', cloudShade: '#b8bcbc', light: '#e8e8e4' },
    rain: { skyTop: '#4a5664', skyMid: '#7a8692', skyBot: '#a8b0b4', haze: '#8a949a', waterTop: '#7a8a92', waterMid: '#3e525c', waterBot: '#1a2a32', cloudLit: '#a8b0b8', cloudShade: '#4e5864', light: '#c8ccd0' },
    storm: { skyTop: '#151a24', skyMid: '#2e3644', skyBot: '#4a5260', haze: '#3a424e', waterTop: '#3a4a54', waterMid: '#1e2c36', waterBot: '#0a141a', cloudLit: '#5a6270', cloudShade: '#1e242e', light: '#8a929c', sun: '#c8d0dc' },
  }[weather] || {};
  if (time === 'night' && weather !== 'clear') Object.assign(W, { skyTop: '#05070e', skyMid: '#121822', skyBot: '#20283a', waterTop: '#1e2a3a', waterMid: '#0e1622', waterBot: '#04080e', cloudLit: '#3a4252', cloudShade: '#141a24', light: '#5a6280' });
  if (time === 'dusk' && weather !== 'clear') Object.assign(W, { skyBot: weather === 'storm' ? '#5a4448' : '#a88a84', skyMid: weather === 'storm' ? '#3a3440' : '#6a6878' });
  const c = makeCtx({ seed: 'sea-' + weather + time, time, season: o.season || 'summer', detail: o.detail || autoDetail(), sunX: 1150, animate: o.animate, pal: W });
  stdDefs(c);
  const p = c.pal, r = c.rng;
  const hz = 340;
  const heavy = weather === 'storm' || weather === 'rain';
  let stat = sky(c, { clouds: weather === 'clear' ? 6 : weather === 'fog' ? 0 : 14, cloudBand: heavy ? [-20, 300] : [40, 260], cloudW: heavy ? 380 : 240, noSun: weather !== 'clear', noStars: weather !== 'clear' });
  if (heavy) { // low scud band
    for (let i = 0; i < 6; i++) stat += cloud(c, i * 300 + r() * 80, 300 + r() * 30, 340, true, 0.3);
  }
  stat += hills(c, { pts: [[1040, hz], [1120, hz - 26], [1220, hz - 34], [1330, hz - 12], [1380, hz]], base: hz + 2, depth: weather === 'fog' ? 0.95 : 0.8, color: '#4a5a4a', rim: !heavy });
  // sea body with perspective wave bands
  stat += `<rect x="-20" y="${hz}" width="1640" height="${900 - hz + 20}" fill="${vgrad(c, 'seab', [[0, mix(p.skyBot, p.waterTop, 0.5)], [0.25, p.waterTop], [0.6, p.waterMid], [1, p.waterBot]])}"/>`;
  stat += `<path d="M-20 ${hz + 0.5}H1620" stroke="${mix(p.skyBot, '#ffffff', 0.3)}" stroke-width="1.5" opacity=".6"/>`;
  if (weather === 'clear' && !p.night) {
    let gd = '';
    for (let i = 0; i < 70; i++) { const t = r(); const y = hz + 4 + t * t * 500; gd += `M${f0(c.sunX + (r() - 0.5) * (30 + t * 420))} ${f0(y)}h${f0(6 + r() * (10 + t * 50))}`; }
    stat += `<path d="${gd}" stroke="${p.sun}" stroke-width="2" opacity=".6"/>`;
  }
  const rough = weather === 'storm' ? 2.3 : heavy ? 1.4 : weather === 'fog' ? 0.6 : 1;
  // distant chop: short dashes, denser and finer near the horizon
  let chopD = '', chopL = '';
  for (let i = 0; i < 260; i++) {
    const t = Math.pow(r(), 1.5), y = hz + 4 + t * 300, w = 6 + t * 40;
    const x = r() * 1640 - 20;
    if (r() < 0.55) chopD += `M${f0(x)} ${f0(y)}q${f0(w / 2)} ${f1(-2 - t * 5 * rough)} ${f0(w)} 0`; else chopL += `M${f0(x)} ${f0(y)}h${f0(w * 0.6)}`;
  }
  stat += `<path d="${chopD}" stroke="${mix(p.waterBot, '#000000', 0.15)}" stroke-width="1.6" fill="none" opacity=".45"/><path d="${chopL}" stroke="${p.night ? '#6a7a9a' : mix(p.waterTop, '#ffffff', 0.45)}" stroke-width="1.4" opacity=".5"/>`;
  // swells: staggered painted waves, back to front, each with a dark back, lit face and a foam crest
  const back = mix(p.waterBot, '#000000', 0.1), faceC = mix(p.waterMid, p.waterTop, 0.45), foam = p.night ? '#9aaac4' : '#f2f4f0';
  const groups = [[], [], []];
  for (let row = 0; row < 11; row++) {
    const t = row / 10, y = hz + 40 + Math.pow(t, 1.6) * 560;
    const w = (60 + t * 300) * (0.8 + rough * 0.2), h = (5 + t * 34) * rough;
    let x = -w * r();
    let dB = '', dF = '', dC = '', dL = '';
    while (x < 1640 + w) {
      const ww = w * (0.6 + r() * 0.8), hh = h * (0.6 + r() * 0.7), yy = y + (r() - 0.5) * 14 * (0.4 + t), lean = ww * 0.12;
      const pk = [x + ww * 0.45 + lean, yy - hh];
      dB += `M${f0(x)} ${f0(yy)}Q${f0(x + ww * 0.25)} ${f0(yy - hh * 0.55)} ${f0(pk[0])} ${f0(pk[1])}Q${f0(pk[0] + ww * 0.18)} ${f0(yy - hh * 0.7)} ${f0(x + ww)} ${f0(yy)}Z`;
      dF += `M${f0(pk[0])} ${f0(pk[1])}Q${f0(pk[0] + ww * 0.18)} ${f0(yy - hh * 0.7)} ${f0(x + ww)} ${f0(yy)}L${f0(pk[0] + ww * 0.05)} ${f0(yy)}Z`;
      dC += `M${f0(pk[0] - ww * 0.16)} ${f0(pk[1] + hh * 0.3)}Q${f0(pk[0] - ww * 0.04)} ${f0(pk[1] - hh * 0.06)} ${f0(pk[0] + ww * 0.12)} ${f0(pk[1] + hh * 0.2)}`;
      if (rough > 1.2 || r() < 0.4) dL += `M${f0(pk[0] + ww * 0.08)} ${f0(pk[1] + hh * 0.45)}h${f0(ww * 0.12)}M${f0(pk[0] - ww * 0.02)} ${f0(pk[1] + hh * 0.7)}h${f0(ww * 0.08)}`;
      x += ww * (0.55 + r() * 0.5);
    }
    const sw = f1(1.2 + t * 3.5);
    groups[row % 3].push(`<path d="${dB}" fill="${back}" opacity="${f1(0.35 + t * 0.4)}"/><path d="${dF}" fill="${faceC}" opacity="${f1(0.3 + t * 0.35)}"/><path d="${dC}" stroke="${foam}" stroke-width="${sw}" fill="none" stroke-linecap="round" opacity="${f1(0.45 + t * 0.4)}"/><path d="${dL}" stroke="${foam}" stroke-width="${f1(sw * 0.6)}" stroke-linecap="round" opacity="${f1(0.3 + t * 0.3)}"/>`);
  }
  if (c.animate) {
    groups.forEach((g, i) => c.anims.push(`<g class="wr-anim-wave">${g.join('')}<animateTransform attributeName="transform" type="translate" values="0 0;${f0((i - 1) * 14 * rough + 8)} ${f1(2 * rough)};0 0" dur="${f1(3.5 + i * 0.9 - (rough - 1))}s" repeatCount="indefinite"/></g>`));
  } else stat += groups.map(g => g.join('')).join('');
  const split = c.anims.length;
  let front = '';
  if (weather === 'fog') {
    const fg = vgrad(c, 'fogb', [[0, '#e4e6e2', 0], [0.5, '#e4e6e2', 0.75], [1, '#e4e6e2', 0]]);
    for (let i = 0; i < 4; i++) {
      const y = 260 + i * 150, band = `<rect x="-200" y="${y}" width="2000" height="${120 + i * 30}" fill="${fg}" opacity="${f1(0.7 - i * 0.12)}"/>`;
      if (c.animate) c.anims.push(`<g class="wr-anim-fog">${band}<animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? -120 : 120} 0;0 0" dur="${18 + i * 5}s" repeatCount="indefinite"/></g>`);
      else front += band;
    }
  }
  if (heavy) c.anims.push(rainfall(c, weather === 'storm' ? 150 : 100, weather === 'storm' ? -0.4 : -0.15));
  if (weather === 'storm') {
    const bolt = `M1180 40l-30 110l26 -6l-40 120l24 -4l-50 130`;
    const fl = c.animate
      ? `<g class="wr-anim-lightning" pointer-events="none"><rect x="-20" y="-20" width="1640" height="940" fill="#dfe6ff" opacity="0"><animate attributeName="opacity" values="0;0;.55;0;.35;0;0" keyTimes="0;.62;.64;.67;.7;.74;1" dur="7s" repeatCount="indefinite"/></rect><path d="${bolt}" stroke="#f4f6ff" stroke-width="4" fill="none" opacity="0" stroke-linejoin="bevel"><animate attributeName="opacity" values="0;0;1;0;1;0;0" keyTimes="0;.62;.64;.67;.7;.74;1" dur="7s" repeatCount="indefinite"/></path></g>`
      : '';
    c.anims.push(fl);
  }
  if (weather === 'clear') c.anims.push(gullsAnim(c, 3, { y0: 100, h: 160 }));
  front += vignette(c, heavy ? 0.6 : 0.45);
  return assemble(c, { stat, front, split }, o);
}

export function portScene(portId, o = {}) {
  const def = PORT_DEFS[portId] || PORT_DEFS.ravnfjord;
  return buildPort(PORT_DEFS[portId] ? portId : 'ravnfjord', o, def);
}
export const PORT_IDS = Object.keys(PORT_CULTURE);
