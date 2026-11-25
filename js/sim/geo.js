// Geography helpers: port positions in map coordinates, voyage distance and sea marks.
// Uses the map owner's routes.js when it is there and working, else straight lines.

import {PORTS} from '../data/ports.js';
import {EXT} from './ext.js';

// Same projection as tools/build_map.py / coast.js (Mercator in a 1000 x 772 box).
const LON0 = -26, LON1 = 44, LAT0 = 38, LAT1 = 68.5, W = 1000, H = 772;
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const YT = merc(LAT1), YB = merc(LAT0);
export const project = (lon, lat) => [((lon - LON0) / (LON1 - LON0)) * W, ((YT - merc(lat)) / (YT - YB)) * H];
export const portXY = (id) => project(PORTS[id].lon, PORTS[id].lat);
export const straight = (a, b) => { const p = portXY(a), q = portXY(b); return Math.hypot(p[0] - q[0], p[1] - q[1]); };

const DETOUR = 1.3; // straight-line fallback stretched to allow for coasts

/** Sailing distance in map units: routes.distance when available, else straight * 1.3. */
export function distance(a, b) {
  if (a === b) return 0;
  try {
    const d = EXT.routes.distance && EXT.routes.distance(a, b);
    if (Number.isFinite(d) && d > 0) return d;
  } catch (e) { /* fall through */ }
  return straight(a, b) * DETOUR;
}

/** Voyage path as [[x,y],...] in map units. */
export function path(a, b) {
  try {
    const p = EXT.routes.path && EXT.routes.path(a, b);
    if (Array.isArray(p) && p.length >= 2) return p;
  } catch (e) { /* fall through */ }
  return [portXY(a), portXY(b)];
}

const FALLBACK_MARKS = {
  skagerrak: ['Skagerrak', 9.5, 57.8], kattegat: ['Kattegat', 11.5, 56.8], north_sea: ['North Sea', 3, 56.5],
  norwegian_sea: ['Norwegian Sea', 4, 64.5], iceland_sea: ['Iceland Sea', -12, 63.8], pentland: ['Pentland Firth', -3.1, 58.7],
  irish_sea: ['Irish Sea', -4.8, 53.8], channel: ['The Channel', 0, 50.2], baltic_south: ['South Baltic', 15.5, 55.0],
  baltic_east: ['East Baltic', 20, 57.5], gulf_finland: ['Gulf of Finland', 26, 59.8],
  dnieper_rapids: ['Dnieper Rapids', 35.1, 47.9], black_sea: ['Black Sea', 31, 44.5],
};
export function seaMarks() {
  const m = EXT.routes.SEA_MARKS;
  if (m && typeof m === 'object' && Object.keys(m).length) return m;
  return Object.fromEntries(Object.entries(FALLBACK_MARKS).map(([id, [name, lon, lat]]) => {
    const [x, y] = project(lon, lat); return [id, {name, x, y}];
  }));
}

/** Sea marks a path passes within `r` map units of, with the fraction of the way (0..1). */
export function marksOnPath(pts, r = 50) {
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push([pts[i - 1], pts[i], total, L]); total += L;
  }
  const out = [];
  for (const [id, m] of Object.entries(seaMarks())) {
    let best = Infinity, at = 0.5;
    for (const [p, q, start, L] of segs) {
      const t = L ? Math.max(0, Math.min(1, ((m.x - p[0]) * (q[0] - p[0]) + (m.y - p[1]) * (q[1] - p[1])) / (L * L))) : 0;
      const d = Math.hypot(p[0] + t * (q[0] - p[0]) - m.x, p[1] + t * (q[1] - p[1]) - m.y);
      if (d < best) { best = d; at = total ? (start + t * L) / total : 0.5; }
    }
    if (best <= r) out.push({id, at});
  }
  return out;
}

/** Sea marks on the voyage from port a to port b: [{id, at}] (at = fraction of the way). */
export function marksBetween(a, b) {
  try {
    const R = EXT.routes;
    if (R.marksOnPath && R.route && R.SEA_MARKS) {
      const ids = R.route(a, b);
      if (ids.length > 1) {
        return R.marksOnPath(a, b).map((id) => ({id, at: Math.max(0, ids.indexOf(R.SEA_MARKS[id].node)) / (ids.length - 1)}));
      }
    }
  } catch (e) { /* fall through */ }
  return marksOnPath(path(a, b));
}
