// Whale Road: shared painting helpers for code-drawn SVG art.
// Everything returns SVG markup strings. No DOM access, no globals.
// A "ctx" (see makeCtx) carries the palette, a seeded RNG, a unique id prefix and a
// defs collector, so several scenes can live on one page without id clashes.

let UID = 0;

// ---------- numbers, random ----------
export const f1 = v => { const r = Math.round(v * 10) / 10; return Object.is(r, -0) ? 0 : r; };
export const f0 = v => Math.round(v);
const f1_ = v => Math.round(v * 10) / 10;

export function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function rng(seed) {
  let a = (typeof seed === 'string' ? hash(seed) : seed) >>> 0;
  const r = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r());
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.chance = p => r() < p;
  r.sign = () => (r() < 0.5 ? -1 : 1);
  return r;
}

// ---------- colour ----------
const HEX = {};
export function rgb(hex) {
  if (Array.isArray(hex)) return hex;
  if (HEX[hex]) return HEX[hex];
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  HEX[hex] = v;
  return v;
}
export function hex(c) {
  return '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
export function mul(a, k) { const A = rgb(a); return hex([A[0] * k, A[1] * k, A[2] * k]); }
export function tint(a, t) { const A = rgb(a), T = rgb(t); return hex([A[0] * T[0] / 255, A[1] * T[1] / 255, A[2] * T[2] / 255]); }
export const lighten = (a, t) => mix(a, '#ffffff', t);
export const darken = (a, t) => mix(a, '#000000', t);

// ---------- palettes ----------
// time: day | dusk | night | dawn ; season: summer | winter | spring | autumn
const BASE = {
  day: {
    skyTop: '#4f86c0', skyMid: '#97bfdc', skyBot: '#e6e2cf', sun: '#fff4d6', sunGlow: '#fff1c4',
    light: '#fff3df', shadow: '#3c4866', shadowMix: 0.5, haze: '#bfd0d9', hazeK: 0.75,
    waterTop: '#8db2c0', waterMid: '#3f7286', waterBot: '#1c4252', cloudLit: '#ffffff', cloudShade: '#a9b7c9',
    glow: 0, ground: '#6f8a3e', groundDark: '#3f5a2a', foliage: '#4f6e32', rock: '#7d7a72', sunY: 150, sunR: 34,
  },
  dusk: {
    skyTop: '#28305a', skyMid: '#b8657a', skyBot: '#f6b25e', sun: '#ffd27a', sunGlow: '#ff9a4a',
    light: '#ffbf86', shadow: '#2a2442', shadowMix: 0.58, haze: '#c98a7e', hazeK: 0.7,
    waterTop: '#e3a06c', waterMid: '#7a5260', waterBot: '#1e2440', cloudLit: '#ffc08a', cloudShade: '#6c4a6a',
    glow: 0.85, ground: '#5f6a34', groundDark: '#2e3020', foliage: '#3e4a28', rock: '#6a5a58', sunY: 395, sunR: 46,
  },
  dawn: {
    skyTop: '#3a4a78', skyMid: '#c890a0', skyBot: '#f8d6a0', sun: '#fff0c0', sunGlow: '#ffc890',
    light: '#ffe0c0', shadow: '#363c62', shadowMix: 0.52, haze: '#d4b0b4', hazeK: 0.72,
    waterTop: '#e8c0a8', waterMid: '#7a7090', waterBot: '#25304e', cloudLit: '#ffe0c8', cloudShade: '#8a7896',
    glow: 0.5, ground: '#62743a', groundDark: '#33402a', foliage: '#425530', rock: '#706670', sunY: 380, sunR: 40,
  },
  night: {
    skyTop: '#050918', skyMid: '#111c40', skyBot: '#2a3a62', sun: '#e9eefc', sunGlow: '#8ea4d8',
    light: '#7f8fc0', shadow: '#090d20', shadowMix: 0.66, haze: '#26345a', hazeK: 0.7,
    waterTop: '#2a3c64', waterMid: '#16233f', waterBot: '#060b18', cloudLit: '#56648e', cloudShade: '#1c2440',
    glow: 1, ground: '#2c3a2c', groundDark: '#141c18', foliage: '#1e2a22', rock: '#3a3e4a', sunY: 140, sunR: 26,
  },
};
const WINTER = {
  day: { skyTop: '#7b98bd', skyMid: '#c3d1df', skyBot: '#eeeeea', sun: '#fffaf0', sunGlow: '#fff8e8', light: '#f3f4fa',
    shadow: '#5a6a8c', haze: '#d6dee6', waterTop: '#a9bcc6', waterMid: '#557282', waterBot: '#243c4a', cloudShade: '#b7c0cc',
    ground: '#e9edf0', groundDark: '#b8c3cf', foliage: '#3e5444', sunY: 330, sunR: 30 },
  dusk: { skyTop: '#2c3762', skyMid: '#a07898', skyBot: '#f2c4a2', sun: '#ffd8b0', sunGlow: '#ffb090', light: '#f4c8b4',
    haze: '#b99cac', waterTop: '#d6a99c', ground: '#d8d0d8', groundDark: '#8e8aa4', foliage: '#2c3a34' },
  dawn: { ground: '#e0dce4', groundDark: '#a4a2bc' },
  night: { skyBot: '#24365e', ground: '#7d8aa8', groundDark: '#3c4868', light: '#8a9ad0' },
};
const AUTUMN = { ground: '#8a8a3e', foliage: '#a4642a' };

export function palette(time = 'day', season = 'summer', over = {}) {
  const t = BASE[time] ? time : 'day';
  const p = Object.assign({}, BASE[t]);
  if (season === 'winter') Object.assign(p, WINTER[t] || {});
  if (season === 'autumn') { p.foliage = mix(p.foliage, AUTUMN.foliage, t === 'night' ? 0.3 : 0.75); p.ground = mix(p.ground, AUTUMN.ground, 0.5); }
  if (season === 'spring') { p.foliage = mix(p.foliage, '#7aa040', t === 'night' ? 0.1 : 0.35); }
  Object.assign(p, over);
  p.time = t; p.season = season;
  p.night = t === 'night'; p.dusk = t === 'dusk' || t === 'dawn';
  p.winter = season === 'winter';
  return p;
}

// ---------- ctx ----------
export function makeCtx(o = {}) {
  const pal = palette(o.time, o.season, o.pal || {});
  const uid = 'w' + (++UID).toString(36);
  const defs = [];
  const seen = new Set();
  const c = {
    pal, uid, defs, rng: rng(o.seed || 'whale'),
    detail: o.detail || 'high',
    W: 1600, H: 900,
    sunX: o.sunX ?? 1100,
    anims: [],         // animated overlay markup (never inside the filtered static group)
    smoke: [],         // [x,y,scale]
    animate: o.animate !== false,
    id: name => `${uid}-${name}`,
    url: name => `url(#${uid}-${name})`,
    def(name, markup) { if (!seen.has(name)) { seen.add(name); defs.push(markup); } return `url(#${uid}-${name})`; },
  };
  c.sunSide = c.sunX >= 800 ? 1 : -1;
  // shading: k = 1 lit face, ~0.8 front, ~0.6 shadow face; depth 0 near .. 1 far
  c.col = (base, k = 1, depth = 0) => {
    let col = tint(base, pal.light);
    if (k !== 1) col = mul(col, k);
    if (k < 1) col = mix(col, pal.shadow, (1 - k) * pal.shadowMix);
    if (depth > 0) col = mix(col, pal.haze, Math.min(1, depth * pal.hazeK));
    return col;
  };
  c.lit = (base, depth = 0) => c.col(base, 1, depth);
  c.shd = (base, depth = 0) => c.col(base, 0.62, depth);
  c.mid = (base, depth = 0) => c.col(base, 0.84, depth);
  return c;
}

// ---------- shared defs ----------
export function stdDefs(c) {
  const p = c.pal;
  c.def('glow', `<radialGradient id="${c.id('glow')}"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".35" stop-color="#ffa53c" stop-opacity=".45"/><stop offset="1" stop-color="#ff8a20" stop-opacity="0"/></radialGradient>`);
  c.def('ao', `<linearGradient id="${c.id('ao')}" x1="0" y1="0" x2="0" y2="1"><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>`);
  c.def('roofsh', `<linearGradient id="${c.id('roofsh')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>`);
  c.def('puffL', `<radialGradient id="${c.id('puffL')}"><stop offset="0" stop-color="${p.cloudLit}" stop-opacity=".95"/><stop offset=".55" stop-color="${p.cloudLit}" stop-opacity=".7"/><stop offset="1" stop-color="${p.cloudLit}" stop-opacity="0"/></radialGradient>`);
  c.def('puffS', `<radialGradient id="${c.id('puffS')}"><stop offset="0" stop-color="${p.cloudShade}" stop-opacity=".9"/><stop offset=".6" stop-color="${p.cloudShade}" stop-opacity=".6"/><stop offset="1" stop-color="${p.cloudShade}" stop-opacity="0"/></radialGradient>`);
  c.def('mist', `<linearGradient id="${c.id('mist')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.haze}" stop-opacity="0"/><stop offset="1" stop-color="${p.haze}" stop-opacity=".85"/></linearGradient>`);
  c.def('soft', `<filter id="${c.id('soft')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>`);
  // wall/roof texture patterns (dark strokes at low alpha, so they work on any base colour)
  c.def('pPlank', `<pattern id="${c.id('pPlank')}" width="9" height="40" patternUnits="userSpaceOnUse"><path d="M0.5 0V40" stroke="#000" stroke-opacity=".22" stroke-width="1"/><path d="M4 9v4M7 25v5" stroke="#000" stroke-opacity=".12"/></pattern>`);
  c.def('pLog', `<pattern id="${c.id('pLog')}" width="40" height="8" patternUnits="userSpaceOnUse"><path d="M0 7.5H40" stroke="#000" stroke-opacity=".3" stroke-width="1.6"/><path d="M0 2H40" stroke="#fff" stroke-opacity=".12" stroke-width="1.4"/></pattern>`);
  c.def('pStone', `<pattern id="${c.id('pStone')}" width="28" height="16" patternUnits="userSpaceOnUse"><path d="M0 .5H28M0 8.5H28M9 .5v8M23 .5v8M3 8.5v8M16 8.5v8" stroke="#000" stroke-opacity=".2" fill="none"/><path d="M1 2h6M12 10h4" stroke="#fff" stroke-opacity=".15"/></pattern>`);
  c.def('pAshlar', `<pattern id="${c.id('pAshlar')}" width="36" height="12" patternUnits="userSpaceOnUse"><path d="M0 .5H36M0 6.5H36M12 .5v6M30 6.5v6" stroke="#6a5a40" stroke-opacity=".22" fill="none"/></pattern>`);
  c.def('pTurf', `<pattern id="${c.id('pTurf')}" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M0 9L4 1M5 9L9 1M10 9L14 1" stroke="#000" stroke-opacity=".22" fill="none"/><path d="M0 9.5H14" stroke="#000" stroke-opacity=".25"/></pattern>`);
  c.def('pShingle', `<pattern id="${c.id('pShingle')}" width="10" height="7" patternUnits="userSpaceOnUse"><path d="M0 7Q2.5 3 5 7Q7.5 3 10 7" stroke="#000" stroke-opacity=".3" fill="none"/><path d="M-5 3.5Q-2.5 -.5 0 3.5Q2.5 -.5 5 3.5Q7.5 -.5 10 3.5Q12.5 -.5 15 3.5" stroke="#000" stroke-opacity=".18" fill="none"/></pattern>`);
  c.def('pThatch', `<pattern id="${c.id('pThatch')}" width="12" height="10" patternUnits="userSpaceOnUse"><path d="M1 0l1 10M5 0l-.6 10M8 0l1.2 10M11 0l-.5 10" stroke="#3a2a10" stroke-opacity=".28" fill="none"/><path d="M0 9.5H12" stroke="#2a1a08" stroke-opacity=".18"/></pattern>`);
  c.def('pTile', `<pattern id="${c.id('pTile')}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 7.5H8" stroke="#3a1006" stroke-opacity=".35"/><path d="M4 0v8" stroke="#fff" stroke-opacity=".14" stroke-width="2"/><path d="M0 0v8" stroke="#3a1006" stroke-opacity=".2"/></pattern>`);
  c.def('pSlate', `<pattern id="${c.id('pSlate')}" width="10" height="6" patternUnits="userSpaceOnUse"><path d="M0 5.5H10M5 0v5.5" stroke="#000" stroke-opacity=".28" fill="none"/></pattern>`);
  c.def('pWattle', `<pattern id="${c.id('pWattle')}" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 3Q4 0 8 3T16 3M0 8Q4 5 8 8T16 8" stroke="#3a2a14" stroke-opacity=".22" fill="none"/></pattern>`);
}

// The one painterly filter: brush-wobble on edges + paper grain. Disabled for detail:'low'
// (which uses a cheap tiled grain pattern instead).
export function textureDefs(c) {
  if (c.detail === 'low') {
    const d = rng('grain');
    let dots = '';
    for (let i = 0; i < 70; i++) dots += `M${f1(d() * 64)} ${f1(d() * 64)}h${f1(0.6 + d() * 1.4)}`;
    c.def('grainP', `<pattern id="${c.id('grainP')}" width="64" height="64" patternUnits="userSpaceOnUse"><path d="${dots}" stroke="#2a1a08" stroke-opacity=".1"/></pattern>`);
    return;
  }
  // brush wobble on edges, brush-scale mottling of value, fine paper tooth; alpha forced opaque
  c.def('brush', `<filter id="${c.id('brush')}" x="-20" y="-20" width="1640" height="940" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">`
    + `<feTurbulence type="fractalNoise" baseFrequency=".018 .036" numOctaves="2" seed="4" result="w"/>`
    + `<feDisplacementMap in="SourceGraphic" in2="w" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>`
    + `<feColorMatrix in="w" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="m"/>`
    + `<feColorMatrix in="m" type="matrix" values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1" result="mg"/>`
    + `<feComposite in="d" in2="mg" operator="arithmetic" k1=".18" k2=".91" k3="0" k4="0" result="dm"/>`
    + `<feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="1" seed="9" result="n"/>`
    + `<feComposite in="dm" in2="n" operator="arithmetic" k1=".08" k2=".965" k3="0" k4="0" result="dn"/>`
    + `<feColorMatrix in="dn" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1"/></filter>`);
}
export function staticOpen(c) { return c.detail === 'low' ? '<g class="wr-static">' : `<g class="wr-static" filter="${c.url('brush')}">`; }
export function grainOverlay(c, w = 1600, h = 900) {
  return c.detail === 'low' ? `<rect width="${w}" height="${h}" fill="${c.url('grainP')}" pointer-events="none"/>` : '';
}

// ---------- geometry ----------
export function pts2d(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join(''); }

// Catmull-Rom -> cubic Bezier through the points (open path)
export function smooth(pts, tension = 0.5, start = 'M') {
  if (pts.length < 2) return '';
  let d = `${start}${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const t = tension / 3;
    d += `C${f1(p1[0] + (p2[0] - p0[0]) * t)} ${f1(p1[1] + (p2[1] - p0[1]) * t)} ${f1(p2[0] - (p3[0] - p1[0]) * t)} ${f1(p2[1] - (p3[1] - p1[1]) * t)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
}

// midpoint displacement from control points; returns dense [[x,y]]
export function ridgeFrom(ctrl, r, iter = 5, rough = 0.32) {
  let p = ctrl.map(q => [q[0], q[1]]);
  let amp = rough;
  for (let k = 0; k < iter; k++) {
    const n = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      const len = Math.abs(b[0] - a[0]);
      n.push([(a[0] + b[0]) / 2 + (r() - 0.5) * len * 0.15, (a[1] + b[1]) / 2 + (r() - 0.5) * len * amp], b);
    }
    p = n; amp *= 0.62;
  }
  return p;
}

// linear interpolation of y on a polyline of [x,y]
export function yAt(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (x >= a[0] && x <= b[0]) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0] || 1);
  }
  return pts[pts.length - 1][1];
}

export function vgrad(c, name, stops, x2 = 0, y2 = 1) {
  return c.def(name, `<linearGradient id="${c.id(name)}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</linearGradient>`);
}
export function rgrad(c, name, stops, extra = '') {
  return c.def(name, `<radialGradient id="${c.id(name)}" ${extra}>${stops.map(s => `<stop offset="${s[0]}" stop-color="${s[1]}"${s[2] != null ? ` stop-opacity="${s[2]}"` : ''}/>`).join('')}</radialGradient>`);
}

// ---------- sky ----------
export function sky(c, o = {}) {
  const p = c.pal, r = c.rng;
  const H = o.h || 900;
  let s = `<rect x="-40" y="-40" width="1680" height="${H + 80}" fill="${vgrad(c, 'sky', [[0, p.skyTop], [o.midAt || 0.42, p.skyMid], [o.botAt || 0.62, p.skyBot], [1, p.skyBot]])}"/>`;
  const sx = o.sunX ?? c.sunX, sy = o.sunY ?? p.sunY;
  if (p.night && !o.noStars) {
    const lay = ['', '', ''];
    let tw = '';
    for (let i = 0; i < (o.stars || 160); i++) {
      const x = f0(r() * 1600), y = f0(Math.pow(r(), 1.6) * (o.starH || 520)), k = r() < 0.6 ? 0 : r() < 0.75 ? 1 : 2;
      if (i < 10 && c.animate) tw += `<path d="M${x} ${y}h0" stroke-width="3.4"><animate attributeName="opacity" values="1;.2;1" dur="${f1(2 + r() * 4)}s" repeatCount="indefinite"/></path>`;
      else lay[k] += `M${x} ${y}h0`;
    }
    s += `<g stroke="#fff" stroke-linecap="round"><path d="${lay[0]}" stroke-width="1.6" opacity=".55"/><path d="${lay[1]}" stroke-width="2.4" opacity=".8"/><path d="${lay[2]}" stroke-width="3.2"/></g>`;
    if (tw) c.anims.push(`<g class="wr-anim-stars" stroke="#fff" stroke-linecap="round">${tw}</g>`);
  }
  if (o.aurora) s += aurora(c, o.aurora === true ? {} : o.aurora);
  if (!o.noSun) {
    const glowR = o.glowR || (p.dusk ? 620 : p.night ? 260 : 460);
    s += `<circle cx="${f0(sx)}" cy="${f0(sy)}" r="${glowR}" fill="${rgrad(c, 'sunglow', [[0, p.sunGlow, p.night ? 0.45 : 0.9], [0.18, p.sunGlow, p.night ? 0.16 : 0.5], [1, p.sunGlow, 0]])}"/>`;
    if (p.night) {
      const mr = p.sunR;
      s += `<circle cx="${f0(sx)}" cy="${f0(sy)}" r="${mr}" fill="#eef2fb"/><path d="M${f0(sx - mr * 0.35)} ${f0(sy - mr * 0.3)}a${f1(mr * 0.22)} ${f1(mr * 0.2)} 0 1 0 1 0zM${f0(sx + mr * 0.25)} ${f0(sy + mr * 0.2)}a${f1(mr * 0.3)} ${f1(mr * 0.26)} 0 1 0 1 0z" fill="#c9d0e4" opacity=".7"/>`;
    } else {
      s += `<circle cx="${f0(sx)}" cy="${f0(sy)}" r="${p.sunR}" fill="${p.sun}"/><circle cx="${f0(sx)}" cy="${f0(sy)}" r="${f0(p.sunR * 1.6)}" fill="${p.sun}" opacity=".25"/>`;
    }
  }
  if (o.rays && !p.night) {
    let d = '';
    for (let i = 0; i < 7; i++) {
      const a = (o.rayDir ?? Math.PI / 2) + (i - 3) * 0.17 + (r() - 0.5) * 0.08, w = 0.03 + r() * 0.04;
      const L = 1300;
      d += `M${f0(sx)} ${f0(sy)}L${f0(sx + Math.cos(a - w) * L)} ${f0(sy + Math.sin(a - w) * L)}L${f0(sx + Math.cos(a + w) * L)} ${f0(sy + Math.sin(a + w) * L)}Z`;
    }
    s += `<path d="${d}" fill="${rgrad(c, 'ray', [[0, p.sun, o.rayOp ?? 0.16], [1, p.sun, 0]], `cx="${f0(sx)}" cy="${f0(sy)}" r="1100" gradientUnits="userSpaceOnUse"`)}"/>`;
  }
  const n = o.clouds ?? 6;
  for (let i = 0; i < n; i++) {
    const band = o.cloudBand || [60, 330];
    const x = (i + 0.2 + r() * 0.6) * 1600 / n + (r() - 0.5) * 60;
    const y = band[0] + r() * (band[1] - band[0]);
    const band2 = o.cloudBand || [60, 330];
    const tdep = (y - band2[0]) / Math.max(1, band2[1] - band2[0]);
    s += cloud(c, x, y, (o.cloudW || 220) * (0.55 + r() * 0.7) * (1.15 - tdep * 0.5) * (p.winter && !o.streaks ? 1.25 : 1), o.streaks || p.dusk || p.winter, tdep * 0.6);
  }
  return s;
}

export function cloud(c, x, y, w, streak = false, depth = 0) {
  // gouache-like cumulus: flat shaded base, mid body, sunlit crowns. Solid fills, softened by the brush filter.
  const r = c.rng, p = c.pal, sd = c.sunSide;
  const hz = Math.min(0.75, depth);

  const shade = mix(p.cloudShade, p.haze, hz), lit = mix(p.cloudLit, p.haze, hz * 0.6), midc = mix(shade, lit, 0.5);
  if (streak) { // soft stratus: long feathered ellipses, lit on the side facing the sun (under-lit at dusk)
    const h = w * 0.07, n = 3 + Math.floor(r() * 3), under = p.dusk || p.night;
    let d1 = '', d2 = '';
    for (let i = 0; i < n; i++) {
      const cx = x + (r() - 0.5) * w * 0.6, cy = y + (r() - 0.5) * h * 2, rx = w * (0.25 + r() * 0.3), ry = h * (0.6 + r() * 0.6);
      d1 += `<ellipse cx="${f0(cx)}" cy="${f0(cy)}" rx="${f0(rx)}" ry="${f0(ry)}"/>`;
      d2 += `<ellipse cx="${f0(cx + sd * rx * 0.1)}" cy="${f0(cy + (under ? ry * 0.35 : -ry * 0.3))}" rx="${f0(rx * 0.75)}" ry="${f0(ry * 0.45)}"/>`;
    }
    return `<g fill="${c.url('puffS')}">${d1}</g><g fill="${c.url('puffL')}">${d2}</g>`;
  }
  const h = w * (0.26 + r() * 0.12);
  const n = Math.max(4, Math.round(w / 40));
  const bumps = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const hump = Math.sin(t * Math.PI);
    const rr = (w / n) * (0.62 + r() * 0.4) * (0.7 + hump * 0.6);
    bumps.push([x - w / 2 + t * w + (r() - 0.5) * w / n * 0.5, y - hump * h * (0.5 + r() * 0.35), rr]);
  }
  // a couple of crowning towers
  for (let k = 0; k < 2; k++) { const b = bumps[1 + Math.floor(r() * (n - 2))]; bumps.push([b[0] + (r() - 0.5) * 20, b[1] - b[2] * 0.7, b[2] * 0.75]); }
  const circ = (list, dx, dy, k) => list.map(([cx, cy, rr]) => `<ellipse cx="${f0(cx + dx)}" cy="${f0(cy + dy)}" rx="${f0(rr * k * 1.32)}" ry="${f0(rr * k * 0.9)}"/>`).join('');
  let s = `<g fill="${shade}">${circ(bumps, 0, 0, 1)}<rect x="${f0(x - w / 2)}" y="${f0(y - h * 0.25)}" width="${f0(w)}" height="${f0(h * 0.28)}" rx="${f0(h * 0.14)}"/></g>`;
  s += `<g fill="${midc}">${circ(bumps, sd * 3, -h * 0.1, 0.84)}</g>`;
  s += `<g fill="${lit}">${circ(bumps.filter((q, i) => i % 3 !== 2), sd * w * 0.025, -h * 0.2, 0.62)}</g>`;
  return depth > 0.3 ? `<g opacity="${f1(1 - depth * 0.4)}">${s}</g>` : s;
}

export function aurora(c, o = {}) {
  const r = c.rng;
  const g = vgrad(c, 'aur', [[0, '#7affc4', 0], [0.45, '#5cf0a8', 0.55], [0.8, '#2bd08a', 0.25], [1, '#8a5cff', 0]]);
  const g2 = vgrad(c, 'aur2', [[0, '#c87aff', 0], [0.5, '#9a7aff', 0.35], [1, '#52e0b0', 0]]);
  let s = '';
  const bands = o.bands || 3;
  for (let b = 0; b < bands; b++) {
    const y0 = (o.y || 60) + b * 55 + r() * 30, hh = 170 + r() * 90;
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([-50 + i * 212, y0 + Math.sin(i * 0.9 + b * 2 + r()) * 50]);
    const top = smooth(pts);
    const bot = smooth(pts.map(q => [q[0], q[1] + hh]).reverse(), 0.5, 'L');
    const op = f1(0.45 + r() * 0.3);
    let rays = '';
    for (let x = -40; x < 1640; x += 9 + r() * 14) { const yy = yAt(pts, x); rays += `M${f0(x)} ${f0(yy + r() * 20)}v${f0(hh * (0.35 + r() * 0.5))}`; }
    const path = `<path d="${top}${bot}Z" fill="${b === 1 ? g2 : g}" opacity="${f1(op * 0.7)}"/><path d="${rays}" stroke="${b === 1 ? g2 : g}" stroke-width="4" opacity="${f1(op * 0.5)}"/>`;
    if (c.animate && o.animate && b === 0) c.anims.push(`<g class="wr-anim-aurora" opacity="${op}">${path}<animate attributeName="opacity" values="${op};${f1(op * 0.4)};${op}" dur="9s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;30 6;0 0" dur="14s" repeatCount="indefinite"/></g>`);
    else s += path;
  }
  return s;
}

// ---------- mountains / hills / trees ----------
// o: {pts:[[x,y]...], base, depth, color, foot (colour of lower slopes), snow (y), iter, rough, rim, shadeOp, gullies}
export function range(c, o) {
  const r = c.rng, p = c.pal;
  const base = o.base ?? 700, depth = o.depth ?? 0.5;
  const pts = (o.dense || ridgeFrom(o.pts, r, o.iter ?? (depth > 0.6 ? 4 : 5), o.rough ?? 0.3)).map(q => [f0(q[0]), f0(q[1])]);
  const top = Math.min(...pts.map(q => q[1]));
  const rock = o.color || p.rock;
  const foot = o.foot || rock;
  const gname = 'rg' + (c._rg = (c._rg || 0) + 1);
  const winterFoot = p.winter ? mix(foot, '#dfe5ee', 0.55) : foot;
  c.def(gname, `<linearGradient id="${c.id(gname)}" x1="0" y1="${f0(top)}" x2="0" y2="${f0(base)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.col(rock, 1, depth)}"/><stop offset=".55" stop-color="${c.col(mix(rock, winterFoot, 0.6), 0.9, depth)}"/><stop offset="1" stop-color="${mix(c.col(winterFoot, 0.8, depth), p.haze, 0.45 * (o.mist ?? 1))}"/></linearGradient>`);
  const ridge = pts2d(pts);
  const mid = c.id('m' + gname);
  c.def('m' + gname, `<path id="${mid}" d="${ridge}L${f0(pts[pts.length - 1][0])} ${base}L${f0(pts[0][0])} ${base}Z"/>`);
  let s = `<use href="#${mid}" fill="${c.url(gname)}"/>`;
  const sd = c.sunSide, away = -sd;
  // shadow facets: each prominent peak shades its slope facing away from the sun, full height
  if (o.shade !== false) {
    let d = '';
    for (let i = 1; i < pts.length - 1; i++) {
      const pk = pts[i];
      if (!(pk[1] < pts[i - 1][1] && pk[1] <= pts[i + 1][1])) continue;
      const hgt = base - pk[1];
      if (hgt < (base - top) * 0.3) continue;
      const poly = [pk];
      let j = i;
      while (j + away > 0 && j + away < pts.length - 1) {
        j += away; poly.push(pts[j]);
        const nx = pts[j + away];
        if (Math.abs(pts[j][0] - pk[0]) > (o.maxShade || 320)) break;
        if (nx && nx[1] < pts[j][1] - 2 && (base - pts[j][1]) < hgt * 0.8) break; // valley reached
      }
      const vl = pts[j];
      poly.push([vl[0], base]);
      const fx = pk[0] + away * hgt * 0.04;
      poly.push([fx + away * hgt * 0.1, base]);
      poly.push([fx + away * hgt * 0.06 + (r() - 0.5) * 10, pk[1] + hgt * 0.62]);
      poly.push([fx + (r() - 0.5) * 8, pk[1] + hgt * 0.3]);
      d += pts2d(poly.filter((q, k) => k % 2 === 0 || k >= poly.length - 4)) + 'Z';
    }
    if (d) s += `<path d="${d}" fill="${c.col(o.shadeCol || rock, 0.42, depth)}" opacity="${o.shadeOp ?? 0.5}"/>`;
  }
  // rock ribs: light streaks on the sun side, dark gullies
  if (o.gullies) {
    let dl = '', dd = '';
    for (let i = 0; i < o.gullies; i++) {
      const q = pts[2 + Math.floor(r() * (pts.length - 4))];
      const hh = base - q[1];
      if (hh < 60) continue;
      const len = hh * (0.25 + r() * 0.45);
      const seg = `M${f0(q[0])} ${f0(q[1] + 4)}q${f0(away * len * 0.12 + (r() - 0.5) * 16)} ${f0(len / 2)} ${f0(away * len * 0.08)} ${f0(len)}`;
      if (r() < 0.5) dl += seg; else dd += seg;
    }
    s += `<path d="${dd}" stroke="${c.col(rock, 0.45, depth)}" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/><path d="${dl}" stroke="${c.col(rock, 1.25, depth)}" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/>`;
  }
  if (o.snow != null && pts.some(q => q[1] < o.snow)) {
    const sl = o.snow, ph = r() * 6, ph2 = r() * 6;
    let d = `M${pts[0][0] - 5} -50`;
    for (let x = pts[0][0] - 5; x <= pts[pts.length - 1][0] + 25; x += 20) d += `L${x} ${f0(sl + Math.sin(x * 0.012 + ph) * 18 + Math.sin(x * 0.047 + ph2) * 9 + (r() - 0.5) * 8)}`;
    d += `L${pts[pts.length - 1][0] + 25} -50Z`;
    c.def('sc' + gname, `<clipPath id="${c.id('sc' + gname)}"><path d="${d}"/></clipPath>`);
    s += `<use href="#${mid}" fill="${c.col('#f4f6fa', 1, depth * 0.7)}" clip-path="${c.url('sc' + gname)}"/>`;
  }
  if (o.rim !== false && !p.night) s += `<path d="${pts2d(pts.filter((q, i) => i % 2 === 0 || i === pts.length - 1))}" stroke="${p.winter ? '#fff' : p.sun}" stroke-width="1.6" fill="none" opacity="${p.dusk ? 0.6 : 0.35}"/>`;
  if (o.mistBand) s += `<rect x="-20" y="${f0(base - o.mistBand)}" width="1640" height="${o.mistBand}" fill="${c.url('mist')}"/>`;
  return s;
}

// smooth rolling hills: o.pts control points, fill gradient from lit to dark
export function hills(c, o) {
  const p = c.pal;
  const base = o.base ?? 900, depth = o.depth ?? 0.3;
  const color = o.color ? (p.winter && o.snow !== false ? mix(o.color, '#e6ebf1', 0.75) : o.color) : p.ground;
  const top = Math.min(...o.pts.map(q => q[1]));
  const gname = 'hg' + (c._hg = (c._hg || 0) + 1);
  c.def(gname, `<linearGradient id="${c.id(gname)}" x1="0" y1="${f0(top)}" x2="0" y2="${f0(base)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.col(color, 1, depth)}"/><stop offset="1" stop-color="${c.col(color, 0.7, depth)}"/></linearGradient>`);
  const d = smooth(o.pts, o.tension ?? 0.5);
  let s = `<path d="${d}L${o.pts[o.pts.length - 1][0]} ${base}L${o.pts[0][0]} ${base}Z" fill="${c.url(gname)}"/>`;
  if (o.rim !== false && !p.night) s += `<path d="${d}" stroke="${p.winter ? '#fff' : p.sun}" stroke-width="2" fill="none" opacity="${p.dusk ? 0.45 : 0.3}"/>`;
  if (o.mist) s += `<rect x="0" y="${f0(base - o.mist)}" width="1600" height="${o.mist}" fill="${c.url('mist')}"/>`;
  return s;
}

// compact polyline: absolute start, then relative steps between rounded points (no drift)
export function relPoly(pts, dec = 0) {
  const k = dec ? 10 : 1, q = v => Math.round(v * k);
  let px = q(pts[0][0]), py = q(pts[0][1]);
  let d = `M${px / k} ${py / k}l`;
  const parts = [];
  for (let i = 1; i < pts.length; i++) {
    const x = q(pts[i][0]), y = q(pts[i][1]);
    parts.push(`${(x - px) / k} ${(y - py) / k}`); px = x; py = y;
  }
  return d + parts.join(' ').replace(/ -/g, '-') + 'z';
}
export function spruce(x, y, h, w = h * 0.36) {
  // jagged silhouette; returns [left half, right half, whole outline] as compact paths
  const k = Math.max(2, Math.min(6, Math.round(h / 11)));
  const dec = h < 40 ? 0 : 1;
  const Lp = [[x, y - h]], Rp = [[x, y - h]];
  for (let i = 1; i <= k; i++) {
    const t = i / k, yy = y - h + h * t * 0.92, ww = w / 2 * (0.25 + t * 0.75);
    Lp.push([x - ww, yy], [x - ww * 0.45, yy - h / k * 0.25]);
    Rp.push([x + ww, yy], [x + ww * 0.45, yy - h / k * 0.25]);
  }
  Lp.push([x, y]); Rp.push([x, y]);
  const full = Lp.slice(0, -1).concat([[x, y]], Rp.slice(1, -1).reverse());
  return [relPoly(Lp, dec), relPoly(Rp, dec), relPoly(full, dec)];
}

// a row of conifers along a ground function; far = single tone merged path
export function forest(c, o) {
  const r = c.rng, p = c.pal;
  const depth = o.depth ?? 0.4;
  const base = o.color || p.foliage;
  let dark = '', light = '', snow = '';
  for (let x = o.x0; x < o.x1; x += o.step * (0.6 + r() * 0.8)) {
    const gy = o.ground(x) + (o.sink ?? 4);
    const h = o.hMin + r() * (o.hMax - o.hMin);
    if (o.kind === 'birch' || (o.kind === 'mixed' && r() < 0.35)) {
      const rr = h * 0.28, g = h < 70 ? f0 : f1;
      dark += `M${g(x - 1)} ${g(gy)}h2v${g(-h * 0.5)}h-2zM${g(x - rr)} ${g(gy - h * 0.6)}a${g(rr)} ${g(rr * 1.2)} 0 1 0 ${g(rr * 2)} 0a${g(rr)} ${g(rr * 1.2)} 0 1 0 ${g(-rr * 2)} 0z`;
      if (o.twoTone !== false || h > 30) light += `M${g(x + c.sunSide * rr * 0.2 - rr * 0.6)} ${g(gy - h * 0.68)}a${g(rr * 0.6)} ${g(rr * 0.75)} 0 1 0 ${g(rr * 1.2)} 0a${g(rr * 0.6)} ${g(rr * 0.75)} 0 1 0 ${g(-rr * 1.2)} 0z`;
    } else {
      const [Lh, Rh, Fh] = spruce(x, gy, h, h * (o.wide || 0.38));
      dark += Fh;
      if (o.twoTone !== false) light += c.sunSide > 0 ? Rh : Lh;
      if (p.winter) snow += spruce(x, gy - h * 0.25, h * 0.6, h * 0.3)[2];
    }
  }
  let s = `<path d="${dark}" fill="${c.col(base, 0.7, depth)}"/>`;
  if (light) s += `<path d="${light}" fill="${c.col(base, 1.05, depth)}" opacity=".8"/>`;
  if (snow) s += `<path d="${snow}" fill="${c.col('#f2f5f8', 1, depth)}" opacity=".55"/>`;
  return s;
}

// deciduous/broadleaf tree with lit crown side
export function broadTree(c, x, y, h, o = {}) {
  const r = c.rng, p = c.pal, depth = o.depth ?? 0;
  const base = o.color || p.foliage;
  const rr = h * 0.3;
  let s = `<path d="M${f1(x - h * 0.03)} ${f1(y)}L${f1(x - h * 0.015)} ${f1(y - h * 0.55)}L${f1(x + h * 0.02)} ${f1(y - h * 0.55)}L${f1(x + h * 0.04)} ${f1(y)}Z" fill="${c.col('#4a3626', 0.8, depth)}"/>`;
  if (p.winter && !o.ever) {
    s += `<path d="M${f1(x)} ${f1(y - h * 0.5)}l${f1(-rr)} ${f1(-rr * 1.2)}M${f1(x)} ${f1(y - h * 0.55)}l${f1(rr * 0.8)} ${f1(-rr * 1.3)}M${f1(x)} ${f1(y - h * 0.6)}v${f1(-rr * 1.3)}" stroke="${c.col('#4a3626', 0.8, depth)}" stroke-width="${f1(h * 0.02)}" fill="none"/>`;
    return s;
  }
  let dk = '', lt = '';
  const n = o.puffs || 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, d = rr * (0.5 + r() * 0.35);
    const cx = x + Math.cos(a) * d, cy = y - h * 0.66 + Math.sin(a) * d * 0.75, pr = rr * (0.5 + r() * 0.3);
    dk += `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(pr)}"/>`;
    if (Math.cos(a) * c.sunSide > -0.2 && Math.sin(a) < 0.5) lt += `<circle cx="${f1(cx + c.sunSide * pr * 0.2)}" cy="${f1(cy - pr * 0.25)}" r="${f1(pr * 0.7)}"/>`;
  }
  s += `<g fill="${c.col(base, 0.72, depth)}">${dk}<circle cx="${f1(x)}" cy="${f1(y - h * 0.66)}" r="${f1(rr * 0.8)}"/></g><g fill="${c.col(base, 1.08, depth)}" opacity=".85">${lt}</g>`;
  return s;
}

export function cypress(c, x, y, h, depth = 0) {
  const w = h * 0.13;
  const L = `M${f1(x)} ${f1(y - h)}C${f1(x - w * 1.2)} ${f1(y - h * 0.7)} ${f1(x - w * 1.3)} ${f1(y - h * 0.2)} ${f1(x - w * 0.5)} ${f1(y)}L${f1(x)} ${f1(y)}Z`;
  const R = `M${f1(x)} ${f1(y - h)}C${f1(x + w * 1.2)} ${f1(y - h * 0.7)} ${f1(x + w * 1.3)} ${f1(y - h * 0.2)} ${f1(x + w * 0.5)} ${f1(y)}L${f1(x)} ${f1(y)}Z`;
  const lit = c.sunSide > 0 ? R : L, dk = c.sunSide > 0 ? L : R;
  return `<path d="${dk}" fill="${c.col('#1f3a24', 0.65, depth)}"/><path d="${lit}" fill="${c.col('#2f5a34', 1, depth)}"/>`;
}

// ---------- water ----------
// o: {y, reflect: id of group to mirror, deep, glitter:true}
export function water(c, o) {
  const r = c.rng, p = c.pal;
  const y = o.y, H = o.h || (900 - y);
  const g = vgrad(c, 'water' + f0(y), [[0, p.waterTop], [0.35, p.waterMid], [1, p.waterBot]]);
  let s = `<rect x="${o.x0 ?? 0}" y="${f0(y)}" width="${(o.x1 ?? 1600) - (o.x0 ?? 0)}" height="${f0(H)}" fill="${g}"/>`;
  if (o.reflect) {
    const cid = 'wclip' + f0(y);
    c.def(cid, `<clipPath id="${c.id(cid)}"><rect x="0" y="${f0(y)}" width="1600" height="${f0(H)}"/></clipPath>`);
    s += `<g clip-path="${c.url(cid)}" pointer-events="none" opacity="${o.reflOp ?? 0.42}"><use href="#${o.reflect}" transform="matrix(1 0 0 -1 0 ${f0(2 * y + (o.reflOff || 0))})"/></g>`;
    s += `<rect x="0" y="${f0(y)}" width="1600" height="${f0(H)}" fill="${vgrad(c, 'wfade' + f0(y), [[0, p.waterMid, 0.05], [0.5, p.waterMid, 0.55], [1, p.waterBot, 0.9]])}"/>`;
  }
  // ripples
  let lt = '', dk = '', glit = '', glit2 = '';
  const n = o.ripples ?? 160;
  for (let i = 0; i < n; i++) {
    const t = Math.pow(r(), 1.3);
    const yy = y + 4 + t * (H - 6), w = 8 + t * 70 * r();
    const x = r() * 1600;
    if (r() < 0.55) lt += `M${f0(x)} ${f0(yy)}h${f0(w)}`; else dk += `M${f0(x)} ${f0(yy)}h${f0(w * 1.2)}`;
  }
  s += `<path d="${dk}" stroke="${p.waterBot}" stroke-width="2" opacity=".35"/>`;
  const sx = o.sunX ?? c.sunX;
  if (o.glitter !== false) {
    for (let i = 0; i < 60; i++) {
      const t = r();
      const yy = y + 3 + t * t * H;
      const spread = 20 + t * 180;
      const x = sx + (r() - 0.5) * spread * 2;
      const w = 6 + r() * (14 + t * 40);
      const seg = `M${f0(x - w / 2)} ${f0(yy)}h${f0(w)}`; if (i % 2) glit += seg; else glit2 += seg;
    }
  }
  const gl = p.night ? '#dfe6ff' : p.sun;
  const sw = 1.6;
  if (c.animate) {
    c.anims.push(`<g class="wr-anim-shimmer" pointer-events="none"><path d="${lt}" stroke="${p.night ? '#8fa2cc' : mix(p.waterTop, '#ffffff', 0.4)}" stroke-width="${sw}" opacity=".45"><animate attributeName="opacity" values=".2;.55;.2" dur="4s" repeatCount="indefinite"/></path>`
      + (glit ? `<path d="${glit}" stroke="${gl}" stroke-width="2.4" opacity=".8"><animate attributeName="opacity" values=".9;.25;.9" dur="2.2s" repeatCount="indefinite"/></path><path d="${glit2}" stroke="${gl}" stroke-width="2.4" opacity=".3"><animate attributeName="opacity" values=".25;.9;.25" dur="2.2s" repeatCount="indefinite"/></path>` : '')
      + `</g>`);
  } else {
    s += `<path d="${lt}" stroke="${mix(p.waterTop, '#ffffff', 0.4)}" stroke-width="${sw}" opacity=".4"/><path d="${glit + glit2}" stroke="${gl}" stroke-width="2.4" opacity=".6"/>`;
  }
  // shore foam line
  if (o.foam !== false) s += `<path d="M${o.x0 ?? 0} ${f0(y + 1.5)}H${o.x1 ?? 1600}" stroke="${p.night ? '#6a7aa0' : '#f4f1ea'}" stroke-width="2" opacity=".35"/>`;
  return s;
}

// distant sea band to a horizon
export function sea(c, y0, y1, o = {}) {
  const p = c.pal;
  const g = vgrad(c, 'sea' + f0(y0), [[0, mix(p.skyBot, p.waterTop, 0.5)], [1, p.waterMid]]);
  let s = `<rect x="${o.x0 ?? 0}" y="${f0(y0)}" width="${(o.x1 ?? 1600) - (o.x0 ?? 0)}" height="${f0(y1 - y0)}" fill="${g}"/>`;
  s += `<path d="M${o.x0 ?? 0} ${f0(y0 + 0.5)}H${o.x1 ?? 1600}" stroke="${p.night ? '#3a4a70' : mix(p.skyBot, '#ffffff', 0.4)}" stroke-width="1.5" opacity=".7"/>`;
  if (!o.noGlint) {
    const r = c.rng; let d = '';
    for (let i = 0; i < 40; i++) { const t = r(), x = c.sunX + (r() - 0.5) * (40 + t * 260); d += `M${f0(x)} ${f0(y0 + 2 + t * (y1 - y0 - 3))}h${f0(4 + r() * 18)}`; }
    s += `<path d="${d}" stroke="${p.night ? '#cfd8f4' : p.sun}" stroke-width="1.4" opacity="${p.night ? 0.5 : 0.7}"/>`;
  }
  return s;
}

// ---------- animated bits (pushed to c.anims) ----------
export function smokeAnim(c, x, y, s = 1, o = {}) {
  const col = o.color || (c.pal.night ? '#6a7090' : c.pal.dusk ? '#c8a4a0' : '#e4e2de');
  if (!c.animate) return `<g opacity=".3" fill="${col}"><circle cx="${f0(x)}" cy="${f0(y - 10 * s)}" r="${f1(6 * s)}"/><circle cx="${f0(x + 6 * s)}" cy="${f0(y - 30 * s)}" r="${f1(10 * s)}"/></g>`;
  const v = (c._smk = (c._smk || 0) + 1) % 2;
  const key = 'smk' + v + col.slice(1) + (o.drift ?? 40) + (o.dur || 0);
  const gid = 'sg' + col.slice(1);
  c.def(gid, `<radialGradient id="${c.id(gid)}"><stop offset="0" stop-color="${col}" stop-opacity=".75"/><stop offset=".6" stop-color="${col}" stop-opacity=".4"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`);
  const dur = (o.dur || 6) + v * 0.9, n = o.puffs || 4, drift = o.drift ?? 40;
  let g = '';
  for (let i = 0; i < n; i++) {
    const b = f1(-i * dur / n - v * 0.7);
    g += `<circle r="5"><animate attributeName="cy" values="0;-120" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="cx" values="0;${drift}" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="r" values="5;26" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="${dur}s" begin="${b}s" repeatCount="indefinite"/></circle>`;
  }
  c.def(key, `<g id="${c.id(key)}" fill="${c.url(gid)}">${g}</g>`);
  return `<use class="wr-anim-smoke" href="#${c.id(key)}" transform="translate(${f0(x)} ${f0(y)}) scale(${f1(s)})"/>`;
}

// banner on a pole; anchored at pole top (x,y), length L, height H, dir 1 right
export function flagAnim(c, x, y, L, H, col, o = {}) {
  const dir = o.dir ?? 1;
  const mk = ph => {
    const a = Math.sin(ph) * H * 0.18, b = Math.cos(ph) * H * 0.22;
    if (o.tail) return `M${f1(x)} ${f1(y)}Q${f1(x + dir * L * 0.5)} ${f1(y + a)} ${f1(x + dir * L)} ${f1(y + H * 0.5 + b)}Q${f1(x + dir * L * 0.5)} ${f1(y + H + a)} ${f1(x)} ${f1(y + H)}Z`;
    return `M${f1(x)} ${f1(y)}Q${f1(x + dir * L * 0.5)} ${f1(y + a)} ${f1(x + dir * L)} ${f1(y + b * 0.5)}L${f1(x + dir * L + b * 0.3)} ${f1(y + H + b * 0.5)}Q${f1(x + dir * L * 0.5)} ${f1(y + H + a)} ${f1(x)} ${f1(y + H)}Z`;
  };
  const shade = c.col(col, 1);
  if (!c.animate) return `<path d="${mk(0.6)}" fill="${shade}"/>`;
  const v = [0, 1.6, 3.2, 4.8, 6.28].map(mk).join(';');
  return `<path class="wr-anim-flag" d="${mk(0)}" fill="${shade}" pointer-events="none"><animate attributeName="d" values="${v}" dur="${o.dur || 2.4}s" repeatCount="indefinite"/></path>`;
}

export function gullsAnim(c, n = 4, o = {}) {
  const r = c.rng;
  let s = '';
  for (let i = 0; i < n; i++) {
    const y = (o.y0 ?? 120) + r() * (o.h ?? 220), sc = 0.6 + r() * 0.8;
    const dur = f1(30 + r() * 30), dir = r() < 0.5 ? 1 : -1;
    const x0 = dir > 0 ? -60 : 1660, x1 = dir > 0 ? 1660 : -60;
    const col = c.pal.night ? '#c8d0e8' : c.pal.dusk ? '#3a2a34' : '#ffffff';
    const wing = `M-10 0Q-5 -6 0 0Q5 -6 10 0`;
    const wing2 = `M-10 -3Q-5 2 0 0Q5 2 10 -3`;
    const body = `<path d="${wing}" stroke="${col}" stroke-width="2.2" fill="none" stroke-linecap="round">${c.animate ? `<animate attributeName="d" values="${wing};${wing2};${wing}" dur="${f1(0.6 + r() * 0.5)}s" repeatCount="indefinite"/>` : ''}</path>`;
    if (!c.animate) { s += `<g transform="translate(${f0(r() * 1600)} ${f0(y)}) scale(${f1(sc)})">${body}</g>`; continue; }
    s += `<g class="wr-anim-gull"><animateTransform attributeName="transform" type="translate" values="${x0} ${f0(y)};${f0((x0 + x1) / 2)} ${f0(y - 30 + r() * 60)};${x1} ${f0(y)}" dur="${dur}s" begin="${f1(-r() * dur)}s" repeatCount="indefinite"/><g transform="scale(${f1(sc)})">${body}</g></g>`;
  }
  return s;
}

export function snowfall(c, n = 70) {
  if (!c.animate) return '';
  const r = c.rng;
  // three depth layers; each is one path of round dots tiled twice vertically, scrolled one tile per loop
  const layers = [[1.8, 0.55, 16, 30], [3, 0.75, 11, 50], [4.6, 0.9, 7.5, 70]];
  let s = '';
  layers.forEach(([w, op, dur, dx], li) => {
    let d = '';
    const m = Math.round(n * (li === 2 ? 0.2 : 0.4));
    for (let i = 0; i < m; i++) { const x = f0(r() * 1700 - 60), y = f0(r() * 900); d += `M${x} ${y}h0M${x} ${y - 900}h0`; }
    s += `<path d="${d}" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="${op}"><animateTransform attributeName="transform" type="translate" values="0 0;${dx} 900" dur="${dur}s" repeatCount="indefinite"/></path>`;
  });
  return `<g class="wr-anim-snow" pointer-events="none">${s}</g>`;
}

export function rainfall(c, n = 90, slant = -0.25) {
  const r = c.rng;
  let d = '';
  for (let i = 0; i < n; i++) { const x = r() * 1700, y = r() * 900, l = 18 + r() * 26; d += `M${f0(x)} ${f0(y)}l${f1(slant * l)} ${f0(l)}`; }
  const path = `<path d="${d}" stroke="#c8d4e0" stroke-width="1.3" opacity=".45"/>`;
  if (!c.animate) return path;
  return `<g class="wr-anim-rain" pointer-events="none"><g>${path}<animateTransform attributeName="transform" type="translate" values="0 -450;${f0(-slant * 450)} 0" dur=".7s" repeatCount="indefinite"/></g><g>${path.replace('.45', '.3')}<animateTransform attributeName="transform" type="translate" values="40 -900;${f0(40 - slant * 900)} 0" dur="1.1s" repeatCount="indefinite"/></g></g>`;
}

export function torch(c, x, y, s = 1) {
  const glow = `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(26 * s)}" fill="${c.url('glow')}"/>`;
  const fl = `M${f1(x - 3 * s)} ${f1(y + 2 * s)}Q${f1(x)} ${f1(y - 12 * s)} ${f1(x + 3 * s)} ${f1(y + 2 * s)}Z`;
  if (!c.animate) return glow + `<path d="${fl}" fill="#ffd36a"/>`;
  return `<g class="wr-anim-torch" pointer-events="none">${glow.replace('/>', `><animate attributeName="r" values="${f1(24 * s)};${f1(30 * s)};${f1(22 * s)};${f1(24 * s)}" dur="1.3s" repeatCount="indefinite"/></circle>`)}<path d="${fl}" fill="#ffd36a"><animate attributeName="opacity" values="1;.7;1;.85;1" dur=".9s" repeatCount="indefinite"/></path></g>`;
}

export function vignette(c, k = 0.5) {
  return `<rect width="1600" height="900" fill="${rgrad(c, 'vig', [[0.55, '#000', 0], [1, '#000', k]], 'cx=".5" cy=".5" r=".75"')}" pointer-events="none"/>`;
}

export function svgOpen(w, h, vw = 1600, vh = 900, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"${extra}>`;
}
