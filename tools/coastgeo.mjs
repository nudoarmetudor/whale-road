// Coastline geometry helpers for tests and route tools (Node or browser).
// Parses js/data/coast.js COAST (one SVG path of closed rings, even-odd) into rings
// and answers "is this point on land" and "does this segment cross a coastline".
import {COAST} from '../js/data/coast.js';

export function parseRings(d = COAST) {
  return d.split('Z').filter(Boolean).map((sub) =>
    sub.split(/[ML]/).filter(Boolean).map((p) => p.split(',').map(Number)));
}

export const RINGS = parseRings();

// bounding boxes speed up the segment test
const BOXES = RINGS.map((r) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
});

export function onLand(x, y) {
  let inside = false;
  for (let k = 0; k < RINGS.length; k++) {
    const b = BOXES[k];
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
    const r = RINGS[k];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

function segX(ax, ay, bx, by, cx, cy, dx, dy) {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (d === 0) return false;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** Returns the first coastline segment hit by a-b, or null if the segment stays at sea. */
export function crossesCoast([ax, ay], [bx, by]) {
  const sx0 = Math.min(ax, bx), sx1 = Math.max(ax, bx), sy0 = Math.min(ay, by), sy1 = Math.max(ay, by);
  for (let k = 0; k < RINGS.length; k++) {
    const b = BOXES[k];
    if (sx1 < b[0] || sx0 > b[2] || sy1 < b[1] || sy0 > b[3]) continue;
    const r = RINGS[k];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if (segX(ax, ay, bx, by, r[j][0], r[j][1], r[i][0], r[i][1])) return [r[j], r[i]];
    }
  }
  return null;
}

/** Shortest distance from a point to any coastline segment (map units). */
export function coastClearance(x, y) {
  let best = Infinity;
  for (const r of RINGS) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [x1, y1] = r[j], [x2, y2] = r[i];
    const dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L));
    best = Math.min(best, Math.hypot(x - x1 - t * dx, y - y1 - t * dy));
  }
  return best;
}
