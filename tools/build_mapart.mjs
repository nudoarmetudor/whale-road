// Bakes decorative glyph positions into js/art/mapart.js (between <gen> markers):
//   node tools/build_mapart.mjs
// Mountains follow hand-drawn range lines, trees fill forest ellipses, tufts the steppe,
// waves the open sea; everything is kept off coasts, lakes, ports and the big ornaments.
import {readFileSync, writeFileSync} from 'node:fs';
import {project, PORT_LL} from '../js/data/routes.js';
import {LAKES} from '../js/art/mapart.js';
import {onLand, coastClearance} from './coastgeo.mjs';

let seed = 1234;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const P = (lo, la) => project(lo, la);
const r1 = (n) => Math.round(n * 10) / 10;

const lakePolys = Object.values(LAKES).map((ll) => ll.map(([lo, la]) => P(lo, la)));
const inPoly = (x, y, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const nearLake = (x, y, m = 3) => lakePolys.some((p) => inPoly(x, y, p) || inPoly(x + m, y, p) || inPoly(x - m, y, p) || inPoly(x, y + m, p) || inPoly(x, y - m, p));
const ports = Object.values(PORT_LL).map(([lo, la]) => P(lo, la));
const nearPort = (x, y, d = 16) => ports.some(([px, py]) => Math.hypot(px - x, py - y) < d);
// big ornaments (map units): compass rose, cartouche, sea creatures, ships
const KEEP_OUT = [[P(-16.5, 47.6), 72], [P(2.0, 66.2), 60], [P(-16.5, 61.0), 46], [P(-21.5, 57.2), 34],
  [P(3.6, 57.4), 22], [P(18.6, 55.6), 18], [P(-14, 63.9), 20], [P(33.4, 44.2), 20]];
const cart = [P(-25.2, 41.7), [0, 0]];
const inOrnament = (x, y) => KEEP_OUT.some(([[cx, cy], r]) => Math.hypot(cx - x, cy - y) < r)
  || (x > cart[0][0] - 20 && x < cart[0][0] + 240 && y > cart[0][1] - 45 && y < cart[0][1] + 85);

// mountain ranges: [points lon/lat, spread in map units, size]
const RANGES = [
  [[[6.6, 59.4], [7.6, 60.6], [8.4, 61.6], [9.6, 62.4], [11.6, 63.8], [13.2, 65.0], [14.6, 66.2], [16.2, 67.4], [17.6, 68.3]], 9, 1.25],
  [[[-21, 64.4], [-18.5, 64.5], [-16, 64.4]], 7, 1.2],
  [[[-5.6, 56.4], [-4.6, 57.0], [-4.9, 57.8], [-4.6, 58.3]], 5, 0.85],
  [[[-3.8, 52.2], [-3.6, 53.0]], 3, 0.7], [[[-2.2, 54.1], [-2.3, 55.0]], 2.5, 0.65],
  [[[6.2, 45.2], [7.4, 45.9], [8.6, 46.4], [10.2, 46.6], [12.4, 47.0], [14.4, 47.3], [15.6, 47.4]], 8, 1.15],
  [[[18.8, 49.4], [20.4, 49.2], [22.4, 48.9], [24.4, 47.8], [25.4, 46.6], [25.4, 45.6], [24.0, 45.4], [22.4, 45.3]], 6, 0.95],
  [[[22.6, 42.9], [24.6, 42.8], [26.8, 42.7]], 4, 0.85], [[[16.2, 44.4], [17.6, 43.6], [19.2, 42.6], [20.4, 41.4]], 5, 0.85],
  [[[-1.6, 42.9], [0.4, 42.7], [2.2, 42.5]], 4, 0.95], [[[-6.4, 40.4], [-4.4, 40.6], [-2.6, 40.9]], 5, 0.8],
  [[[10.4, 44.3], [12.4, 43.4], [13.8, 42.2], [15.4, 40.8]], 4, 0.8],
  [[[30.6, 40.6], [33.6, 41.0], [36.6, 40.8], [40.4, 40.6]], 5, 0.95], [[[40.0, 43.4], [42.0, 43.0], [44.0, 42.6]], 5, 1.15],
  [[[2.6, 45.0], [3.2, 45.6]], 3, 0.7], [[[19.6, 63.6], [17.4, 62.6]], 3, 0.7],
];
const mountains = [];
for (const [ll, spread, size] of RANGES) {
  const pts = ll.map(([lo, la]) => P(lo, la));
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay);
    const nx = -(by - ay) / L, ny = (bx - ax) / L;
    for (let t = 0; t < L; t += 5.2) {
      for (let k = 0; k < 2; k++) {
        const off = (rnd() - 0.5) * 2 * spread, j = (rnd() - 0.5) * 3;
        const x = ax + ((bx - ax) * t) / L + nx * off + j, y = ay + ((by - ay) * t) / L + ny * off;
        if (!onLand(x, y) || coastClearance(x, y) < 3 || nearLake(x, y, 4) || nearPort(x, y, 13)) continue;
        if (mountains.some(([mx, my]) => Math.hypot(mx - x, my - y) < 5.4)) continue;
        const s = size * (1 - (Math.abs(off) / spread) * 0.35) * (0.85 + rnd() * 0.3);
        mountains.push([r1(x), r1(y), Math.round(s * 100) / 100]);
      }
    }
  }
}
mountains.sort((a, b) => a[1] - b[1]); // draw back to front

// forests: [lon, lat, rx°, ry°, density, kind 0 fir / 1 broadleaf / 2 mixed]
const FORESTS = [
  [15.5, 61.4, 3.6, 2.2, 0.55, 0], [18.6, 64.6, 2.6, 1.6, 0.45, 0], [25.0, 63.0, 3.6, 1.8, 0.5, 0], [28.6, 61.2, 2.6, 1.2, 0.5, 0],
  [36.5, 59.3, 5.5, 2.6, 0.5, 0], [33.2, 61.6, 2, 1.2, 0.45, 0], [40, 62.6, 3.6, 1.6, 0.4, 0], [33.0, 56.0, 4, 1.6, 0.45, 2],
  [27.5, 57.0, 2.4, 1.2, 0.45, 2], [22.6, 55.8, 2.2, 1.1, 0.4, 2], [21.6, 53.2, 2.6, 1.0, 0.35, 2], [10.5, 50.8, 2.6, 1.1, 0.4, 1],
  [13.3, 52.6, 1.6, 0.7, 0.35, 2], [11.0, 60.2, 1.4, 0.8, 0.45, 0], [14.6, 57.0, 1.6, 0.8, 0.45, 2], [2.6, 48.6, 1.6, 0.6, 0.35, 1],
  [5.4, 50.1, 1.0, 0.45, 0.4, 1], [-1.4, 51.3, 1.0, 0.35, 0.35, 1], [-2.4, 53.2, 0.6, 0.6, 0.3, 1], [8.8, 47.6, 1.4, 0.5, 0.35, 0],
  [26.4, 50.6, 3, 1.0, 0.4, 2], [30.6, 52.0, 2.2, 1.0, 0.35, 2], [19.4, 59.7, 0.9, 0.4, 0.3, 0], [24.4, 58.6, 1.4, 0.5, 0.35, 0],
];
const trees = [];
for (const [lo, la, rx, ry, dens, kind] of FORESTS) {
  const [cx, cy] = P(lo, la), [ex] = P(lo + rx, la), [, ey] = P(lo, la - ry);
  const RX = Math.abs(ex - cx), RY = Math.abs(ey - cy);
  for (let y = cy - RY; y <= cy + RY; y += 5.2) for (let x = cx - RX; x <= cx + RX; x += 4.4) {
    const px = x + (rnd() - 0.5) * 3.6, py = y + (rnd() - 0.5) * 3.2;
    const d = ((px - cx) / RX) ** 2 + ((py - cy) / RY) ** 2;
    if (d > 1 || rnd() > dens * 0.62 * (1.15 - d * 0.7)) continue;
    if (!onLand(px, py) || coastClearance(px, py) < 2.5 || nearLake(px, py, 3) || nearPort(px, py)) continue;
    if (mountains.some(([mx, my]) => Math.hypot(mx - px, my - py) < 6)) continue;
    trees.push([r1(px), r1(py), kind === 2 ? (rnd() < 0.5 ? 1 : 0) : kind]);
  }
}
trees.sort((a, b) => a[1] - b[1]);

const tufts = [];
for (const [lo, la, rx, ry] of [[34.5, 47.4, 4.5, 1.4], [38.5, 46.4, 3, 1.2], [29.5, 47.2, 1.8, 0.8], [20, 46.8, 1.6, 0.8]]) {
  const [cx, cy] = P(lo, la), [ex] = P(lo + rx, la), [, ey] = P(lo, la - ry);
  const RX = Math.abs(ex - cx), RY = Math.abs(ey - cy);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * 6.28, m = Math.sqrt(rnd());
    const x = cx + Math.cos(a) * RX * m, y = cy + Math.sin(a) * RY * m;
    if (!onLand(x, y) || coastClearance(x, y) < 2 || nearPort(x, y, 12)) continue;
    if (tufts.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 6)) continue;
    tufts.push([r1(x), r1(y)]);
  }
}

const waves = [];
for (let y = 10; y < 772; y += 26) for (let x = 10; x < 1000; x += 34) {
  const px = x + (rnd() - 0.5) * 22 + ((y / 26) % 2) * 17, py = y + (rnd() - 0.5) * 12;
  if (px < 4 || px > 996 || onLand(px, py) || coastClearance(px, py) < 13 || inOrnament(px, py)) continue;
  waves.push([r1(px), r1(py)]);
}

const pack = (a) => a.map((p) => p.join(',')).join(';');
const block = `// <gen>\nexport const GEN = {\n  mountains: '${pack(mountains)}',\n  trees: '${pack(trees)}',\n  tufts: '${pack(tufts)}',\n  waves: '${pack(waves)}',\n};\n// </gen>`;
const file = new URL('../js/art/mapart.js', import.meta.url);
const src = readFileSync(file, 'utf8');
writeFileSync(file, src.replace(/\/\/ <gen>[\s\S]*?\/\/ <\/gen>/, block));
console.log(`mountains ${mountains.length}, trees ${trees.length}, tufts ${tufts.length}, waves ${waves.length}`);
