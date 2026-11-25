// Ships and foes, drawn in code.
//   shipSVG(type, opts)                         -> side-view SVG string
//   drawShip(ctx, type, x, y, scale, opts)       -> canvas, with bobbing, damage, sinking
//   drawEnemy(ctx, art, x, y, scale, opts)       -> canvas, ships + beasts + fortress pieces
// Local ship space: waterline at y=0, prow towards +x, 1 unit = 1 px at scale 1.
// (x, y) passed to drawShip is the waterline point under the mast.

/** Ship shapes. L length, h freeboard at midships, d draft, post stem height. */
export const SHIP_SPECS = {
  faering: {L: 64, h: 8, d: 5, post: 16, mast: 30, sw: 22, sh: 17, shields: 0, oars: 2, prow: 'scroll', stern: 'plain', stripes: 3},
  karvi: {L: 100, h: 10, d: 6, post: 22, mast: 48, sw: 40, sh: 30, shields: 7, oars: 6, prow: 'scroll', stern: 'plain', stripes: 5},
  knarr: {L: 108, h: 17, d: 9, post: 27, mast: 58, sw: 52, sh: 40, shields: 0, oars: 2, prow: 'plain', stern: 'plain', stripes: 5, cargo: 3},
  byrding: {L: 92, h: 13, d: 7, post: 22, mast: 50, sw: 42, sh: 32, shields: 0, oars: 4, prow: 'scroll', stern: 'plain', stripes: 5, cargo: 2},
  snekkja: {L: 130, h: 10, d: 6, post: 30, mast: 58, sw: 52, sh: 36, shields: 11, oars: 12, prow: 'dragon', stern: 'scroll', stripes: 6},
  busse: {L: 150, h: 16, d: 9, post: 32, mast: 70, sw: 64, sh: 46, shields: 12, oars: 12, prow: 'dragon', stern: 'scroll', stripes: 7, cargo: 2},
  skeid: {L: 172, h: 13, d: 8, post: 36, mast: 74, sw: 72, sh: 48, shields: 17, oars: 18, prow: 'dragon', stern: 'tail', stripes: 7},
  drakkar: {L: 192, h: 15, d: 9, post: 44, mast: 84, sw: 84, sh: 56, shields: 20, oars: 20, prow: 'dragon', stern: 'tail', stripes: 9, gold: true},
  // enemy-only shapes
  draugr: {L: 180, h: 14, d: 8, post: 40, mast: 78, sw: 74, sh: 50, shields: 16, oars: 14, prow: 'dragon', stern: 'tail', stripes: 7, ghost: true},
  dromon: {L: 190, h: 14, d: 8, post: 22, mast: 76, sw: 70, sh: 60, shields: 0, oars: 22, prow: 'ram', stern: 'scroll', lateen: true},
  cog: {L: 120, h: 30, d: 10, post: 34, mast: 76, sw: 60, sh: 48, shields: 0, oars: 0, prow: 'cog', stern: 'cog', stripes: 0, hstripes: 5, castles: true},
};

const DEFAULT_SAIL = {
  faering: ['#c8b48a', '#efe2c4'], karvi: ['#8e2a22', '#efe2c4'], knarr: ['#b8862e', '#efe2c4'],
  byrding: ['#5f6b3a', '#efe2c4'], snekkja: ['#2f5d6e', '#efe2c4'], busse: ['#8e2a22', '#c99a2e'],
  skeid: ['#183a48', '#c99a2e'], drakkar: ['#8e2a22', '#efe2c4'], draugr: ['#8fa39a', '#3d4a44'],
  dromon: ['#efe2c4', '#6b2a6e'], cog: ['#efe2c4', '#3b5c8e'],
};
const SHIELD_COLORS = ['#c99a2e', '#8e2a22', '#efe2c4', '#2f5d6e'];

// ---------------------------------------------------------------- geometry

const f = (n) => (Math.round(n * 10) / 10).toString();
const P = (x, y) => `${f(x)},${f(y)}`;

function bez(a, b, c, d, t) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

/** Rail (sheer line) control points for a spec. */
function railCtl(s) {
  const c = (-8 * s.h + 2 * s.post) / 6;
  return [[-s.L / 2, -s.post], [-s.L * 0.3, c], [s.L * 0.3, c], [s.L / 2, -s.post]];
}
/** y of the rail at x (sampled bezier). */
function railY(s, x) {
  const k = railCtl(s);
  let best = 0; let bd = Infinity;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const bx = bez(k[0][0], k[1][0], k[2][0], k[3][0], t);
    const d = Math.abs(bx - x);
    if (d < bd) { bd = d; best = t; }
  }
  return bez(k[0][1], k[1][1], k[2][1], k[3][1], best);
}

function hullPath(s) {
  const {L, d, post} = s;
  if (s.prow === 'cog') {
    // high, round-bellied hull with straight raked posts
    return `M${P(-L / 2, -post)} C${P(-L * 0.3, -s.h * 1.02)} ${P(L * 0.3, -s.h * 1.02)} ${P(L / 2, -post)}`
      + ` L${P(L * 0.36, d)} C${P(L * 0.2, d * 1.5)} ${P(-L * 0.2, d * 1.5)} ${P(-L * 0.36, d)} Z`;
  }
  const k = railCtl(s);
  const lift = s.prow === 'ram' ? 0.15 : 0.4;
  return `M${P(...k[0])} C${P(...k[1])} ${P(...k[2])} ${P(...k[3])}`
    + ` C${P(L / 2 + L * 0.03, -post * lift)} ${P(L * 0.45, d)} ${P(L * 0.3, d)}`
    + ` L${P(-L * 0.3, d)}`
    + ` C${P(-L * 0.45, d)} ${P(-L / 2 - L * 0.03, -post * 0.4)} ${P(...k[0])} Z`;
}

function strakePaths(s) {
  const out = [];
  const k = railCtl(s);
  for (let i = 1; i <= 3; i++) {
    const q = i / 4;
    const ex = s.L / 2 - s.L * 0.03 * i - (s.prow === 'cog' ? s.L * 0.04 * i : 0);
    const ey = -s.post + (s.post + s.d) * q * 0.85;
    const cy = k[1][1] + (s.d - k[1][1]) * q;
    out.push(`M${P(-ex, ey)} C${P(-s.L * 0.3, cy)} ${P(s.L * 0.3, cy)} ${P(ex, ey)}`);
  }
  return out;
}

function dragonPath(sz) {
  const pts = [
    ['M', -0.15, 0.2], ['C', -0.1, -0.8, 0.1, -1.6, 0.5, -2.0], ['L', 0.55, -2.4], ['L', 0.75, -2.05],
    ['C', 1.0, -2.15, 1.3, -2.05, 1.55, -1.9], ['L', 1.62, -1.74], ['L', 1.22, -1.68], ['L', 1.5, -1.42],
    ['L', 1.0, -1.45], ['C', 0.7, -1.4, 0.55, -1.2, 0.5, -0.9], ['C', 0.45, -0.5, 0.35, -0.1, 0.25, 0.2], ['Z'],
  ];
  return pts.map(([c, ...n]) => {
    const pairs = [];
    for (let i = 0; i < n.length; i += 2) pairs.push(P(n[i] * sz, n[i + 1] * sz));
    return c + pairs.join(' ');
  }).join(' ');
}
function scrollPath(sz, dir) {
  const x = (v) => f(v * sz * dir);
  const y = (v) => f(v * sz);
  return `M0,0 C${x(0.35)},${y(-0.8)} ${x(-0.25)},${y(-1.5)} ${x(-0.7)},${y(-1.05)} C${x(-0.95)},${y(-0.75)} ${x(-0.62)},${y(-0.42)} ${x(-0.42)},${y(-0.66)}`;
}

/**
 * Build the drawing primitives for a ship.
 * Returns {back:[], sail:[], front:[], meta} where each entry is
 * {d|circle, fill, stroke, w, op}. `oars` are produced separately (animated).
 */
function build(type, o = {}) {
  const s = SHIP_SPECS[type] || SHIP_SPECS.karvi;
  const [sc1, sc2] = [o.sail || DEFAULT_SAIL[type]?.[0] || '#8e2a22', o.sail2 || DEFAULT_SAIL[type]?.[1] || '#efe2c4'];
  const ghost = s.ghost || o.ghost;
  const wood = ghost ? '#4b5a52' : (o.hull || '#6b4526');
  const woodDark = ghost ? '#2a332f' : '#3a2414';
  const line = ghost ? '#1c2420' : '#24160c';
  const torn = o.torn || (ghost ? 2 : 0);
  const back = []; const sail = []; const front = [];
  const mx = s.lateen ? s.L * 0.05 : 0;
  const top = -s.h - s.mast;

  // mast, yard, rigging
  back.push({d: `M${P(mx, -s.h)} L${P(mx, top)}`, stroke: woodDark, w: 3});
  if (!s.lateen) {
    back.push({d: `M${P(mx, top + 2)} L${P(s.L / 2 - 2, -s.post + 2)} M${P(mx, top + 2)} L${P(-s.L / 2 + 2, -s.post + 2)}`, stroke: line, w: 0.8, op: 0.7});
  }
  // sail
  if (s.lateen) {
    const ya = top - 6; const xa = mx - s.sw * 0.75; const xb = mx + s.sw * 0.55;
    back.push({d: `M${P(xa, -s.h - 6)} L${P(xb, ya)}`, stroke: woodDark, w: 2.2});
    const tri = `M${P(xb - 2, ya + 1)} Q${P(mx + s.sw * 0.25, -s.h - s.sh * 0.25)} ${P(xa + 4, -s.h - 7)} Z`;
    sail.push({d: tri, fill: sc1, stroke: line, w: 1});
    sail.push({d: `M${P(mx + s.sw * 0.05, top + 8)} L${P(mx - s.sw * 0.2, -s.h - 9)}`, stroke: sc2, w: 5, op: 0.8});
  } else if (s.sw) {
    const yy = top + 4; const x0 = mx - s.sw / 2; const x1 = mx + s.sw / 2;
    back.push({d: `M${P(x0 - 4, yy)} L${P(x1 + 4, yy)}`, stroke: woodDark, w: 2.4});
    const belly = s.sh * 0.14;
    const by = (x) => yy + s.sh + belly * (1 - Math.pow((x - mx) / (s.sw / 2), 2)) - belly * 0.3;
    const sideBulge = s.sw * 0.04;
    const N = s.stripes || 1;
    if (s.hstripes) {
      for (let i = 0; i < s.hstripes; i++) {
        const ya = yy + (s.sh * i) / s.hstripes; const yb = yy + (s.sh * (i + 1)) / s.hstripes;
        sail.push({d: `M${P(x0, ya)} L${P(x1, ya)} L${P(x1 + sideBulge, yb)} L${P(x0 - sideBulge, yb)} Z`, fill: i % 2 ? sc2 : sc1});
      }
    } else {
      for (let i = 0; i < N; i++) {
        const xa = x0 + (s.sw * i) / N; const xb = x0 + (s.sw * (i + 1)) / N;
        let dd = `M${P(xa, yy)} L${P(xb, yy)}`;
        const bulge = (x) => (x === x1 ? sideBulge : x === x0 ? -sideBulge : 0);
        const steps = 4;
        for (let j = 0; j <= steps; j++) {
          const x = xb - ((xb - xa) * j) / steps;
          const tornCut = torn ? ((Math.sin(x * 1.7) > 0.3 ? 1 : 0) * s.sh * 0.12 * torn) : 0;
          dd += ` L${P(x + bulge(x) * (j === 0 ? 1 : j === steps ? 1 : 0), by(x) - tornCut)}`;
        }
        dd += ' Z';
        sail.push({d: dd, fill: i % 2 ? sc2 : sc1});
      }
    }
    // outline + shading
    let outline = `M${P(x0, yy)} L${P(x1, yy)} Q${P(x1 + sideBulge * 2, yy + s.sh * 0.5)} ${P(x1, by(x1))}`;
    for (let j = 1; j <= 8; j++) { const x = x1 - (s.sw * j) / 8; outline += ` L${P(x, by(x) - (torn ? ((Math.sin(x * 1.7) > 0.3 ? 1 : 0) * s.sh * 0.12 * torn) : 0))}`; }
    outline += ` Q${P(x0 - sideBulge * 2, yy + s.sh * 0.5)} ${P(x0, yy)} Z`;
    sail.push({d: outline, fill: 'url(#SHADE)', stroke: line, w: 1});
    if (torn >= 2 || o.holes) {
      const hx = mx + s.sw * 0.18; const hy = yy + s.sh * 0.4;
      sail.push({d: `M${P(hx, hy)} l${f(s.sw * 0.08)},${f(s.sh * 0.1)} l${f(-s.sw * 0.12)},${f(s.sh * 0.06)} l${f(s.sw * 0.02)},${f(-s.sh * 0.18)} Z`, fill: 'rgba(20,16,12,0.55)'});
    }
  }

  // far-side gunwale (interior shadow)
  const k = railCtl(s);
  front.push({d: `M${P(-s.L * 0.42, k[0][1] * 0.45)} C${P(-s.L * 0.3, k[1][1] - s.h * 0.35)} ${P(s.L * 0.3, k[2][1] - s.h * 0.35)} ${P(s.L * 0.42, k[3][1] * 0.45)} L${P(s.L * 0.4, k[3][1] * 0.35)} C${P(s.L * 0.3, k[2][1])} ${P(-s.L * 0.3, k[1][1])} ${P(-s.L * 0.4, k[0][1] * 0.35)} Z`, fill: woodDark});

  // cargo bundles
  for (let i = 0; i < (s.cargo || 0); i++) {
    const cx = -s.L * 0.12 + i * s.L * 0.12 - (s.cargo - 1) * s.L * 0.03;
    const ry = railY(s, cx);
    front.push({d: `M${P(cx - s.L * 0.06, ry + 1)} Q${P(cx - s.L * 0.055, ry - s.h * 0.75)} ${P(cx, ry - s.h * 0.8)} Q${P(cx + s.L * 0.055, ry - s.h * 0.75)} ${P(cx + s.L * 0.06, ry + 1)} Z`, fill: i % 2 ? '#a8865a' : '#8b6b43', stroke: line, w: 0.8});
  }

  // castles (cog)
  if (s.castles) {
    for (const [cx, w] of [[s.L * 0.36, s.L * 0.2], [-s.L * 0.36, s.L * 0.22]]) {
      const ry = railY(s, cx) - 1;
      const hgt = s.h * 0.55;
      let crenel = `M${P(cx - w / 2, ry)} L${P(cx - w / 2, ry - hgt)}`;
      const n = 5;
      for (let i = 0; i < n; i++) {
        const xa = cx - w / 2 + (w * i) / n; const xb = xa + w / n;
        crenel += ` L${P(xa, ry - hgt - 4)} L${P((xa + xb) / 2, ry - hgt - 4)} L${P((xa + xb) / 2, ry - hgt)} L${P(xb, ry - hgt)}`;
      }
      crenel += ` L${P(cx + w / 2, ry)} Z`;
      front.push({d: crenel, fill: '#7a5532', stroke: line, w: 1});
    }
  }

  // hull
  front.push({d: hullPath(s), fill: 'url(#HULL)', stroke: line, w: 1.4});
  for (const d of strakePaths(s)) front.push({d, stroke: line, w: 0.8, op: 0.55});
  // rail highlight
  front.push({d: `M${P(...k[0])} C${P(...k[1])} ${P(...k[2])} ${P(...k[3])}`, stroke: s.gold ? '#c99a2e' : (ghost ? '#8fa39a' : '#a77b4c'), w: s.gold ? 2 : 1.4});
  if (s.prow === 'ram') {
    // bronze siphon at the bow + purple band
    front.push({d: `M${P(s.L * 0.46, -s.h * 0.7)} l12,-3 l1,5 l-12,2 Z`, fill: '#b08a3a', stroke: line, w: 0.8});
    front.push({d: `M${P(-s.L * 0.44, -s.h * 0.55)} C${P(-s.L * 0.3, -s.h * 0.2)} ${P(s.L * 0.3, -s.h * 0.2)} ${P(s.L * 0.45, -s.h * 0.55)}`, stroke: '#6b2a6e', w: 3});
    front.push({d: `M${P(s.L * 0.4, s.d * 0.6)} l${f(s.L * 0.12)},${f(-1)} l${f(-s.L * 0.1)},${f(-4)} Z`, fill: '#8a6a2a', stroke: line, w: 0.8});
  }

  front.push({oars: true}); // oars are drawn here: over the hull, under the shields

  // shields
  if (s.shields && o.shields !== false) {
    const cols = Array.isArray(o.shields) ? o.shields : SHIELD_COLORS;
    const span = s.L * 0.62; const r = Math.max(3.2, s.h * 0.42);
    for (let i = 0; i < s.shields; i++) {
      const sx = -span / 2 + (span * (i + 0.5)) / s.shields;
      const sy = railY(s, sx) + r * 0.45;
      const c = ghost ? (i % 2 ? '#4b5a52' : '#8fa39a') : cols[i % cols.length];
      front.push({circle: [sx, sy, r], fill: c, stroke: line, w: 0.9});
      front.push({d: `M${P(sx - r * 0.9, sy)} L${P(sx + r * 0.9, sy)}`, stroke: line, w: 0.5, op: 0.35});
      front.push({circle: [sx, sy, r * 0.32], fill: ghost ? '#9fb3aa' : '#b9b1a0', stroke: line, w: 0.5});
    }
  }

  // prow and stern pieces
  const tipB = [s.L / 2, -s.post]; const tipS = [-s.L / 2, -s.post];
  const postW = Math.max(2.4, s.post * 0.1);
  const piece = (kind, tip, dir) => {
    const [tx, ty] = tip;
    if (kind === 'dragon') {
      const sz = s.post * 0.3;
      front.push({d: dragonPath(sz), fill: s.gold ? '#c99a2e' : wood, stroke: line, w: 1, tx, ty, flip: dir < 0});
      front.push({circle: [tx + dir * 0.98 * sz, ty - 1.85 * sz, Math.max(0.9, sz * 0.09)], fill: ghost ? '#9fffb0' : '#f4f1ea'});
    } else if (kind === 'scroll' || kind === 'tail') {
      const sz = s.post * (kind === 'tail' ? 0.42 : 0.32);
      front.push({d: scrollPath(sz, dir), stroke: s.gold ? '#c99a2e' : wood, w: postW, tx, ty, cap: true});
      front.push({d: scrollPath(sz, dir), stroke: line, w: 0.6, tx, ty, op: 0.6});
    } else if (kind === 'plain') {
      front.push({d: `M0,0 l${f(dir * 2)},${f(-s.post * 0.15)}`, stroke: wood, w: postW, tx, ty, cap: true});
    }
  };
  piece(s.prow, tipB, 1);
  piece(s.stern, tipS, -1);
  if (s.lateen || s.prow === 'cog') {
    // banner at mast top
    front.push({d: `M${P(mx, top)} l0,-8 l14,3 l-14,4 Z`, fill: s.lateen ? '#6b2a6e' : '#3b5c8e', stroke: line, w: 0.6});
  } else if (!ghost && s.mast) {
    front.push({d: `M${P(mx, top)} l0,-7 l${f(s.L * 0.06)},2.5 l${f(-s.L * 0.06)},2.5 Z`, fill: '#c99a2e', stroke: line, w: 0.5});
  }
  return {back, sail, front, s, wood, line, woodDark, ghost};
}

// ---------------------------------------------------------------- SVG

let svgUid = 0;
function primSVG(p) {
  const tr = p.tx !== undefined ? ` transform="translate(${f(p.tx)},${f(p.ty)})${p.flip ? ' scale(-1,1)' : ''}"` : '';
  const style = `fill="${p.fill || 'none'}"${p.stroke ? ` stroke="${p.stroke}" stroke-width="${p.w || 1}"` : ''}${p.op ? ` opacity="${p.op}"` : ''}${p.cap ? ' stroke-linecap="round"' : ''} stroke-linejoin="round"`;
  if (p.circle) return `<circle cx="${f(p.circle[0])}" cy="${f(p.circle[1])}" r="${f(p.circle[2])}" ${style}/>`;
  return `<path d="${p.d}" ${style}${tr}/>`;
}

function oarLines(s, phase = 0) {
  const out = [];
  if (!s.oars) return out;
  const span = s.L * (s.oars <= 2 ? 0.5 : 0.6);
  const n = s.oars;
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : -span / 2 + (span * i) / (n - 1);
    const y = railY(s, x) + s.h * 0.55;
    const a = 0.95 + Math.sin(phase) * 0.18;
    const len = s.h + s.d + 14;
    out.push([x, y, x - Math.cos(a) * len * 0.55, y + Math.sin(a) * len]);
  }
  return out;
}

/** Side-view SVG of a ship. opts: {w, sail, sail2, shields:true|false|[colors], water:true, torn, hull} */
export function shipSVG(type, opts = {}) {
  const B = build(type, opts);
  const s = B.s;
  const id = 'wrs' + (++svgUid);
  const minX = -s.L / 2 - s.L * 0.12; const maxX = s.L / 2 + s.L * 0.14;
  const minY = -s.h - s.mast - 18; const maxY = s.d + 12;
  const vw = maxX - minX; const vh = maxY - minY;
  const w = opts.w || 240; const h = Math.round((w * vh) / vw);
  const sub = (str) => str.replace(/url\(#HULL\)/g, `url(#${id}h)`).replace(/url\(#SHADE\)/g, `url(#${id}s)`);
  const parts = [];
  parts.push(`<defs><linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${B.ghost ? '#6d7d74' : '#8a5d34'}"/><stop offset="0.55" stop-color="${B.wood}"/><stop offset="1" stop-color="${B.woodDark}"/></linearGradient>`
    + `<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.22"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></linearGradient></defs>`);
  if (opts.water !== false) {
    parts.push(`<ellipse cx="0" cy="${f(s.d * 0.3)}" rx="${f(s.L * 0.6)}" ry="${f(s.d * 0.9 + 3)}" fill="#183a48" opacity="0.25"/>`);
  }
  for (const p of B.back) parts.push(sub(primSVG(p)));
  for (const p of B.sail) parts.push(sub(primSVG(p)));
  for (const p of B.front) {
    if (p.oars) {
      for (const [x1, y1, x2, y2] of oarLines(s, 0.3)) parts.push(`<path d="M${P(x1, y1)} L${P(x2, y2)}" stroke="${B.ghost ? '#8fa39a' : '#c9a876'}" stroke-width="1.6" stroke-linecap="round"/>`);
    } else parts.push(sub(primSVG(p)));
  }
  if (opts.water !== false) {
    parts.push(`<path d="M${P(minX, s.d * 0.5)} Q${P(minX + vw * 0.25, s.d * 0.5 - 3)} ${P(minX + vw * 0.5, s.d * 0.5)} T${P(maxX, s.d * 0.5)} L${P(maxX, maxY)} L${P(minX, maxY)} Z" fill="#2f5d6e" opacity="0.85"/>`);
    parts.push(`<path d="M${P(-s.L * 0.5, s.d * 0.5)} q${f(s.L * 0.1)},-3 ${f(s.L * 0.2)},0 t${f(s.L * 0.2)},0 t${f(s.L * 0.2)},0 t${f(s.L * 0.2)},0 t${f(s.L * 0.2)},0" stroke="#efe2c4" stroke-width="1" fill="none" opacity="0.6"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(minX)} ${f(minY)} ${f(vw)} ${f(vh)}" width="${w}" height="${h}" role="img" aria-label="${type}">${parts.join('')}</svg>`;
}

// ---------------------------------------------------------------- canvas

const cache = new Map();
function compiled(type, o) {
  const torn = o.torn || 0;
  const key = `${type}|${o.sail}|${o.sail2}|${Array.isArray(o.shields) ? o.shields.join() : o.shields}|${torn}|${o.ghost ? 1 : 0}|${o.hull || ''}`;
  let c = cache.get(key);
  if (c) return c;
  const B = build(type, {...o, torn});
  const conv = (p) => ({...p, path: p.d ? new Path2D(p.d) : null});
  c = {...B, back: B.back.map(conv), sail: B.sail.map(conv), front: B.front.map(conv)};
  cache.set(key, c);
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  return c;
}

function fillFor(ctx, p, B) {
  if (p.fill === 'url(#HULL)') {
    const g = ctx.createLinearGradient(0, -B.s.post, 0, B.s.d);
    g.addColorStop(0, B.ghost ? '#6d7d74' : '#8a5d34'); g.addColorStop(0.55, B.wood); g.addColorStop(1, B.woodDark);
    return g;
  }
  if (p.fill === 'url(#SHADE)') {
    const g = ctx.createLinearGradient(-B.s.sw / 2, 0, B.s.sw / 2, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(0.45, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    return g;
  }
  return p.fill;
}

function drawPrims(ctx, list, B, oars) {
  for (const p of list) {
    if (p.oars) { if (oars) oars(); continue; }
    ctx.save();
    if (p.tx !== undefined) { ctx.translate(p.tx, p.ty); if (p.flip) ctx.scale(-1, 1); }
    if (p.op) ctx.globalAlpha *= p.op;
    ctx.lineJoin = 'round';
    ctx.lineCap = p.cap ? 'round' : 'butt';
    if (p.circle) {
      ctx.beginPath(); ctx.arc(p.circle[0], p.circle[1], p.circle[2], 0, Math.PI * 2);
      if (p.fill) { ctx.fillStyle = fillFor(ctx, p, B); ctx.fill(); }
      if (p.stroke) { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.w || 1; ctx.stroke(); }
    } else {
      if (p.fill && p.fill !== 'none') { ctx.fillStyle = fillFor(ctx, p, B); ctx.fill(p.path); }
      if (p.stroke) { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.w || 1; ctx.stroke(p.path); }
    }
    ctx.restore();
  }
}

/** A deterministic pseudo-random for per-ship damage marks. */
function hash(n) { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

/**
 * Draw a ship on canvas.
 * opts: {facing:1|-1, sail, sail2, shields, damage:0..1, t (seconds), phase, sink:0..1,
 *        ghost, burning, stunned, rowing:true, alpha, glow:'#hex'}
 */
export function drawShip(ctx, type, x, y, scale, opts = {}) {
  const t = opts.t || 0; const ph = opts.phase || 0;
  const dmg = Math.max(0, Math.min(1, opts.damage || 0));
  const sink = Math.max(0, Math.min(1, opts.sink || 0));
  const torn = dmg > 0.66 ? 2 : dmg > 0.33 ? 1 : 0;
  const B = compiled(type, {...opts, torn});
  const s = B.s;
  const facing = opts.facing === -1 ? -1 : 1;
  const bob = Math.sin(t * 1.7 + ph) * 1.6;
  const roll = Math.sin(t * 1.15 + ph * 1.3) * 0.025;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  // clip at the waterline so a sinking ship slips under
  ctx.beginPath();
  ctx.rect(-s.L * 1.5, -s.mast - s.post - 200, s.L * 3, s.mast + s.post + 200 + s.d * 0.55);
  ctx.clip();
  ctx.translate(0, bob + sink * (s.h + s.mast + s.post) * 0.9);
  ctx.rotate(roll - sink * 0.45 * facing);
  ctx.scale(facing, 1);

  if (opts.glow) {
    ctx.save();
    ctx.shadowColor = opts.glow; ctx.shadowBlur = 16;
    ctx.fillStyle = opts.glow; ctx.globalAlpha *= 0.25;
    ctx.beginPath(); ctx.ellipse(0, -s.h, s.L * 0.55, s.h + s.d + 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawPrims(ctx, B.back, B);
  drawPrims(ctx, B.sail, B);
  // oars (animated) go in at the marker inside B.front
  const oars = () => {
    if (!s.oars || opts.rowing === false || sink) return;
    ctx.save();
    ctx.strokeStyle = B.ghost ? '#8fa39a' : '#c9a876';
    ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    const phase = opts.stunned ? 1.2 : t * 3.2 + ph;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of oarLines(s, phase)) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
    ctx.stroke();
    ctx.restore();
  };
  drawPrims(ctx, B.front, B, oars);

  // damage: holes and scorch on the hull
  const holes = Math.floor(dmg * 5);
  for (let i = 0; i < holes; i++) {
    const hx = (hash(i + s.L) - 0.5) * s.L * 0.6;
    const hy = -s.h * 0.3 + hash(i * 3 + s.L) * (s.h * 0.5);
    ctx.fillStyle = '#140d07';
    ctx.beginPath(); ctx.ellipse(hx, hy, 2.6 + hash(i) * 2, 1.8 + hash(i + 9) * 1.5, hash(i) * 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(hx - 3, hy - 2); ctx.lineTo(hx + 1, hy); ctx.lineTo(hx - 2, hy + 3); ctx.stroke();
  }
  ctx.restore();

  // smoke and fire (not clipped, not flipped)
  if ((dmg > 0.45 || opts.burning) && sink < 0.8) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const n = opts.burning ? 7 : Math.round(dmg * 6);
    for (let i = 0; i < n; i++) {
      const life = (t * 0.6 + i / n + ph) % 1;
      const sx = (hash(i + 3) - 0.5) * s.L * 0.4 + life * 10 * -facing;
      const sy = -s.h - life * 45;
      ctx.globalAlpha = (1 - life) * 0.45;
      ctx.fillStyle = opts.burning && life < 0.25 ? '#f0a030' : '#3c3530';
      ctx.beginPath(); ctx.arc(sx, sy, 3 + life * 9, 0, Math.PI * 2); ctx.fill();
    }
    if (opts.burning) {
      for (let i = 0; i < 3; i++) {
        const fx = (hash(i + 7) - 0.5) * s.L * 0.5; const fl = 6 + Math.sin(t * 12 + i) * 2.5;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = i % 2 ? '#f6c344' : '#e0662a';
        ctx.beginPath(); ctx.moveTo(fx - 3, -s.h + 1); ctx.quadraticCurveTo(fx, -s.h - fl * 2, fx + 3, -s.h + 1); ctx.fill();
      }
    }
    ctx.restore();
  }
}

/** Approximate size of a drawn ship (unscaled), for layout and hit tests. */
export function shipSize(type) {
  const s = SHIP_SPECS[type];
  if (s) return {w: s.L * 1.2, h: s.h + s.mast + 14 + s.d, top: s.h + s.mast + 14};
  const beast = {serpent: [150, 70, 60], kraken: [150, 100, 80], crow: [110, 80, 40], tower: [90, 150, 150], gate: [150, 120, 120]}[type] || [100, 80, 70];
  return {w: beast[0], h: beast[1], top: beast[2]};
}

// ---------------------------------------------------------------- beasts and fortress

function drawSerpent(ctx, t, o) {
  const body = o.ghost ? '#6d8d80' : '#2f6b5e'; const belly = '#a9c79a'; const line = '#12302a';
  const k = Math.sin(t * 2.2 + (o.phase || 0));
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // coils behind the head
  for (let i = 0; i < 3; i++) {
    const cx = 18 + i * 34; const hgt = 16 + Math.sin(t * 2.2 + i * 1.3) * 5;
    ctx.fillStyle = body; ctx.strokeStyle = line; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 14, 2);
    ctx.bezierCurveTo(cx - 12, -hgt, cx + 12, -hgt, cx + 14, 2);
    ctx.lineTo(cx + 7, 2); ctx.bezierCurveTo(cx + 6, -hgt * 0.5, cx - 6, -hgt * 0.5, cx - 7, 2); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // fin spikes
    ctx.fillStyle = '#c99a2e';
    for (let j = -1; j <= 1; j++) {
      const fx = cx + j * 6; const fy = -hgt * (1 - Math.abs(j) * 0.18) + 2;
      ctx.beginPath(); ctx.moveTo(fx - 2.5, fy + 1); ctx.lineTo(fx, fy - 6); ctx.lineTo(fx + 2.5, fy + 1); ctx.fill();
    }
  }
  // neck and head rearing up (facing -x towards the player)
  ctx.fillStyle = body; ctx.strokeStyle = line; ctx.lineWidth = 1.4;
  const hx = -30 + k * 3; const hy = -52 - k * 4;
  ctx.beginPath();
  ctx.moveTo(-6, 3);
  ctx.bezierCurveTo(-4, -20, -10, -38, hx + 10, hy + 4);
  ctx.lineTo(hx + 16, hy - 6);
  ctx.bezierCurveTo(hx + 4, hy - 12, hx - 14, hy - 10, hx - 24, hy - 2);
  ctx.lineTo(hx - 26, hy + 3);
  ctx.lineTo(hx - 12, hy + 4);
  ctx.lineTo(hx - 22, hy + 11);
  ctx.bezierCurveTo(hx - 8, hy + 12, hx + 2, hy + 12, hx + 6, hy + 16);
  ctx.bezierCurveTo(-18, -20, -16, -6, -18, 3);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = belly; ctx.globalAlpha *= 0.6;
  ctx.beginPath(); ctx.moveTo(-17, 2); ctx.bezierCurveTo(-15, -10, -16, -24, hx + 6, hy + 15); ctx.lineTo(hx + 9, hy + 12); ctx.bezierCurveTo(-11, -24, -10, -8, -11, 2); ctx.fill();
  ctx.globalAlpha /= 0.6;
  ctx.fillStyle = '#f6c344'; ctx.beginPath(); ctx.arc(hx - 8, hy - 4, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(hx - 8.4, hy - 4, 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c99a2e';
  ctx.beginPath(); ctx.moveTo(hx + 4, hy - 10); ctx.lineTo(hx + 14, hy - 20); ctx.lineTo(hx + 10, hy - 7); ctx.fill();
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath(); ctx.moveTo(hx - 20, hy + 3); ctx.lineTo(hx - 18, hy + 7); ctx.lineTo(hx - 16, hy + 3); ctx.fill();
}

function drawKraken(ctx, t, o) {
  const skin = '#7a3550'; const dark = '#3e1526'; const ph = o.phase || 0;
  ctx.lineCap = 'round';
  // tentacles
  for (let i = 0; i < 6; i++) {
    const bx = -40 + i * 16; const sway = Math.sin(t * 1.8 + i * 1.1 + ph);
    const len = 46 + (i % 3) * 10;
    const tipx = bx - 22 + sway * 14 - (i < 3 ? 20 : 0); const tipy = -len;
    ctx.strokeStyle = dark; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(bx, 4); ctx.bezierCurveTo(bx - 4, -len * 0.4, tipx + 22, tipy * 0.8, tipx, tipy); ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(bx, 4); ctx.bezierCurveTo(bx - 4, -len * 0.4, tipx + 22, tipy * 0.8, tipx, tipy); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.quadraticCurveTo(tipx - 8, tipy - 6 + sway * 3, tipx - 6, tipy + 6); ctx.stroke();
    ctx.fillStyle = '#e8b8c4';
    for (let j = 1; j <= 3; j++) {
      const q = j / 4.2;
      const sx = (1 - q) ** 3 * bx + 3 * (1 - q) ** 2 * q * (bx - 4) + 3 * (1 - q) * q * q * (tipx + 22) + q ** 3 * tipx;
      const sy = (1 - q) ** 3 * 4 + 3 * (1 - q) ** 2 * q * (-len * 0.4) + 3 * (1 - q) * q * q * (tipy * 0.8) + q ** 3 * tipy;
      ctx.beginPath(); ctx.arc(sx - 2, sy, 1.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  // mantle
  const g = ctx.createRadialGradient(10, -30, 4, 10, -20, 46);
  g.addColorStop(0, '#a5506e'); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.strokeStyle = '#2a0d18'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-26, 4); ctx.bezierCurveTo(-30, -40, 0, -78 + Math.sin(t + ph) * 3, 26, -60); ctx.bezierCurveTo(46, -44, 44, -10, 40, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f6e27a'; ctx.beginPath(); ctx.ellipse(-8, -16, 6, 4.5, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d1a16'; ctx.beginPath(); ctx.ellipse(-9, -16, 1.6, 3.6, 0, 0, Math.PI * 2); ctx.fill();
}

function drawCrow(ctx, t, o) {
  const ph = o.phase || 0; const flap = Math.sin(t * 7 + ph);
  const black = '#16141c'; const sheen = '#3a3f5c';
  ctx.lineJoin = 'round';
  const wing = (dir) => {
    ctx.save(); ctx.scale(1, 1);
    ctx.fillStyle = dir > 0 ? black : '#22202a';
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    const wy = -34 * flap * dir - 4;
    ctx.bezierCurveTo(4, wy - 6, 28, wy - 10, 46, wy + 2);
    for (let i = 0; i < 5; i++) ctx.lineTo(42 - i * 8, wy + 8 + i * 2 + (i % 2) * 4);
    ctx.lineTo(8, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  wing(-1);
  // body
  ctx.fillStyle = black;
  ctx.beginPath(); ctx.ellipse(4, 0, 24, 10, -0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(24, -2); ctx.lineTo(42, -6); ctx.lineTo(44, 4); ctx.lineTo(24, 6); ctx.fill(); // tail
  ctx.beginPath(); ctx.arc(-20, -4, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a5248';
  ctx.beginPath(); ctx.moveTo(-27, -7); ctx.lineTo(-42, -2); ctx.lineTo(-27, -1); ctx.fill();
  ctx.fillStyle = '#f6e27a'; ctx.beginPath(); ctx.arc(-22, -6, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = sheen; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-8, -6); ctx.quadraticCurveTo(6, -10, 20, -5); ctx.stroke();
  wing(1);
  // talons
  ctx.strokeStyle = '#5a5248'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(-4, 16); ctx.moveTo(6, 9); ctx.lineTo(4, 16); ctx.stroke();
  // crackle
  if (Math.sin(t * 5 + ph * 3) > 0.92) {
    ctx.strokeStyle = '#cfe8ff'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(30, -20); ctx.lineTo(24, -12); ctx.lineTo(30, -10); ctx.lineTo(22, 0); ctx.stroke();
  }
}

function drawTower(ctx, t, o) {
  const line = '#1d1a16';
  // rock
  ctx.fillStyle = '#4a4740'; ctx.strokeStyle = line; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-48, 6); ctx.lineTo(-40, -18); ctx.lineTo(-20, -30); ctx.lineTo(18, -28); ctx.lineTo(40, -14); ctx.lineTo(50, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5f6b3a'; ctx.beginPath(); ctx.moveTo(-40, -18); ctx.lineTo(-20, -30); ctx.lineTo(18, -28); ctx.lineTo(40, -14); ctx.lineTo(10, -22); ctx.closePath(); ctx.fill();
  // tower body (log and stone)
  const g = ctx.createLinearGradient(-26, 0, 26, 0);
  g.addColorStop(0, '#5b3a22'); g.addColorStop(0.5, '#8a5d34'); g.addColorStop(1, '#3a2414');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-24, -26); ctx.lineTo(-20, -112); ctx.lineTo(20, -112); ctx.lineTo(24, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(29,26,22,0.5)'; ctx.lineWidth = 0.8;
  for (let y = -36; y > -110; y -= 8) { ctx.beginPath(); ctx.moveTo(-23 + (y + 26) * -0.05, y); ctx.lineTo(23 - (y + 26) * -0.05, y); ctx.stroke(); }
  // overhanging fighting platform
  ctx.fillStyle = '#6b4526'; ctx.strokeStyle = line; ctx.lineWidth = 1.2;
  ctx.fillRect(-30, -124, 60, 14); ctx.strokeRect(-30, -124, 60, 14);
  for (let i = 0; i < 6; i++) { ctx.fillRect(-30 + i * 11, -132, 6, 9); ctx.strokeRect(-30 + i * 11, -132, 6, 9); }
  // roof
  ctx.fillStyle = '#3a2414'; ctx.beginPath(); ctx.moveTo(-26, -132); ctx.lineTo(0, -156); ctx.lineTo(26, -132); ctx.closePath(); ctx.fill(); ctx.stroke();
  // slits with archer glow
  ctx.fillStyle = '#140d07';
  for (const [sx, sy] of [[-8, -60], [8, -60], [0, -88]]) ctx.fillRect(sx - 2, sy - 7, 4, 14);
  // banner
  const wv = Math.sin(t * 3 + (o.phase || 0)) * 3;
  ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -156); ctx.lineTo(0, -184); ctx.stroke();
  ctx.fillStyle = '#8e2a22'; ctx.beginPath(); ctx.moveTo(0, -184); ctx.quadraticCurveTo(-14, -180 + wv, -26, -182 + wv); ctx.lineTo(-24, -170 + wv); ctx.quadraticCurveTo(-12, -170 - wv, 0, -172); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1d1a16'; ctx.beginPath(); ctx.arc(-13, -177 + wv * 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
}

function drawGate(ctx, t, o) {
  const line = '#1d1a16';
  ctx.fillStyle = '#4a4740'; ctx.strokeStyle = line; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-82, 6); ctx.lineTo(-74, -14); ctx.lineTo(74, -14); ctx.lineTo(82, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
  // palisade
  for (let i = -9; i <= 9; i++) {
    if (Math.abs(i) <= 2) continue;
    const x = i * 8; const top = -60 - (i % 2) * 4;
    ctx.fillStyle = i % 2 ? '#6b4526' : '#5b3a22';
    ctx.beginPath(); ctx.moveTo(x - 4, -14); ctx.lineTo(x - 4, top); ctx.lineTo(x, top - 6); ctx.lineTo(x + 4, top); ctx.lineTo(x + 4, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // towers flanking the gate
  for (const tx of [-30, 30]) {
    ctx.fillStyle = '#7a5532';
    ctx.fillRect(tx - 11, -96, 22, 82); ctx.strokeRect(tx - 11, -96, 22, 82);
    ctx.fillStyle = '#3a2414';
    ctx.beginPath(); ctx.moveTo(tx - 14, -96); ctx.lineTo(tx, -114); ctx.lineTo(tx + 14, -96); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#140d07'; ctx.fillRect(tx - 2, -80, 4, 12);
  }
  // gate leaves with iron bands
  ctx.fillStyle = '#5b3a22';
  ctx.beginPath(); ctx.moveTo(-19, -14); ctx.lineTo(-19, -58); ctx.quadraticCurveTo(0, -72, 19, -58); ctx.lineTo(19, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2.4;
  for (const y of [-24, -38, -52]) { ctx.beginPath(); ctx.moveTo(-19, y); ctx.lineTo(19, y); ctx.stroke(); }
  ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -66); ctx.stroke();
  // banner
  const wv = Math.sin(t * 3 + (o.phase || 0)) * 3;
  ctx.fillStyle = '#1d1a16'; ctx.fillRect(-1, -140, 2, 30);
  ctx.fillStyle = '#8e2a22'; ctx.beginPath(); ctx.moveTo(1, -140); ctx.quadraticCurveTo(14, -136 + wv, 26, -138 + wv); ctx.lineTo(24, -126 + wv); ctx.quadraticCurveTo(12, -126 - wv, 1, -128); ctx.fill();
}

const BEASTS = {serpent: drawSerpent, kraken: drawKraken, crow: drawCrow, tower: drawTower, gate: drawGate};

/**
 * Draw any foe. Ship arts go through drawShip; beasts/fortress pieces are drawn here.
 * opts as drawShip, plus {flash} (0..1 white hit flash).
 */
export function drawEnemy(ctx, art, x, y, scale, opts = {}) {
  if (SHIP_SPECS[art]) return drawShip(ctx, art, x, y, scale, {facing: -1, ...opts});
  const fn = BEASTS[art];
  if (!fn) return drawShip(ctx, 'karvi', x, y, scale, {facing: -1, ...opts});
  const t = opts.t || 0; const sink = Math.max(0, Math.min(1, opts.sink || 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (opts.alpha !== undefined) ctx.globalAlpha *= opts.alpha;
  const flying = art === 'crow';
  if (!flying) {
    ctx.beginPath(); ctx.rect(-300, -400, 600, 400 + 4); ctx.clip();
  }
  if (flying) {
    ctx.translate(0, Math.sin(t * 2 + (opts.phase || 0)) * 5 + sink * 120);
    ctx.rotate(sink * 1.2);
  } else {
    const bob = art === 'tower' || art === 'gate' ? 0 : Math.sin(t * 1.5 + (opts.phase || 0)) * 2;
    ctx.translate(0, bob + sink * 140);
    if (art === 'tower' || art === 'gate') ctx.rotate(sink * 0.25);
  }
  if (opts.facing === 1) ctx.scale(-1, 1);
  fn(ctx, t, opts);
  ctx.restore();
}
