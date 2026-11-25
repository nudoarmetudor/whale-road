// Suggest sea waypoints for an edge that crosses land:
//   node tools/fix_edge.mjs nodeA nodeB      (or x1,y1 x2,y2 in map units)
// Routes through a fine water grid (preferring distance from the coast), then pulls
// the string tight and prints intermediate points as lon/lat.
import {NODES, project} from '../js/data/routes.js';
import {PROJ, MAP_W, MAP_H} from '../js/data/coast.js';
import {onLand, crossesCoast} from './coastgeo.mjs';

const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const YT = merc(PROJ.lat1), YB = merc(PROJ.lat0);
const unproject = (x, y) => {
  const lon = PROJ.lon0 + (x / MAP_W) * (PROJ.lon1 - PROJ.lon0);
  const m = YT - (y / MAP_H) * (YT - YB);
  return [lon, (2 * Math.atan(Math.exp(m)) - Math.PI / 2) * 180 / Math.PI];
};
const pt = (s) => NODES[s] || s.split(',').map(Number);
const A = pt(process.argv[2]), B = pt(process.argv[3]);
const R = 0.4, PAD = 30;
const x0 = Math.min(A[0], B[0]) - PAD, y0 = Math.min(A[1], B[1]) - PAD;
const W = Math.ceil((Math.abs(A[0] - B[0]) + 2 * PAD) / R), H = Math.ceil((Math.abs(A[1] - B[1]) + 2 * PAD) / R);
const land = new Uint8Array(W * H), dist = new Float32Array(W * H).fill(1e9);
const q = [];
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
  if (onLand(x0 + i * R, y0 + j * R)) { land[j * W + i] = 1; dist[j * W + i] = 0; q.push(j * W + i); }
}
for (let h = 0; h < q.length; h++) { // BFS distance to land
  const c = q[h], i = c % W, j = (c / W) | 0;
  for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
    const n = nj * W + ni;
    if (dist[n] > dist[c] + 1) { dist[n] = dist[c] + 1; q.push(n); }
  }
}
const cell = ([x, y]) => Math.round((y - y0) / R) * W + Math.round((x - x0) / R);
const s = cell(A), t = cell(B);
const g = new Float64Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1);
g[s] = 0;
const open = [[0, s]];
const pop = () => { let b = 0; for (let i = 1; i < open.length; i++) if (open[i][0] < open[b][0]) b = i; return open.splice(b, 1)[0]; };
while (open.length) {
  const [d, c] = pop();
  if (d > g[c]) continue;
  if (c === t) break;
  const i = c % W, j = (c / W) | 0;
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    if (!di && !dj) continue;
    const ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= W || nj >= H) continue;
    const n = nj * W + ni;
    if (land[n] && n !== t) continue;
    const step = Math.hypot(di, dj) * (1 + 6 / (1 + dist[n] * R * 1.5));
    if (g[c] + step < g[n]) { g[n] = g[c] + step; prev[n] = c; open.push([g[n], n]); }
  }
}
if (!isFinite(g[t])) { console.log('no water route'); process.exit(1); }
const cells = [];
for (let c = t; c !== -1; c = prev[c]) cells.unshift([x0 + (c % W) * R, y0 + ((c / W) | 0) * R]);
cells[0] = A; cells[cells.length - 1] = B;
const clear = (p, q2) => {
  const dx = q2[0] - p[0], dy = q2[1] - p[1], L = Math.hypot(dx, dy) || 1, ox = (-dy / L) * 0.7, oy = (dx / L) * 0.7;
  return !crossesCoast(p, q2) && !crossesCoast([p[0] + ox, p[1] + oy], [q2[0] + ox, q2[1] + oy]) && !crossesCoast([p[0] - ox, p[1] - oy], [q2[0] - ox, q2[1] - oy]);
};
const out = [cells[0]];
let k = 0;
while (k < cells.length - 1) {
  let best = k + 1;
  for (let m = cells.length - 1; m > k + 1; m--) if (clear(cells[k], cells[m])) { best = m; break; }
  out.push(cells[best]); k = best;
}
console.log(out.slice(1, -1).map((p) => { const [lo, la] = unproject(...p); return `[${lo.toFixed(2)}, ${la.toFixed(2)}]`; }).join(' '));
