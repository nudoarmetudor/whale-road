// node tools/near_water.mjs lon,lat [minClearance]: nearest open-water point to lon/lat.
import {project} from '../js/data/routes.js';
import {PROJ, MAP_W, MAP_H} from '../js/data/coast.js';
import {onLand, coastClearance} from './coastgeo.mjs';
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const YT = merc(PROJ.lat1), YB = merc(PROJ.lat0);
const unproject = (x, y) => [PROJ.lon0 + (x / MAP_W) * (PROJ.lon1 - PROJ.lon0),
  (2 * Math.atan(Math.exp(YT - (y / MAP_H) * (YT - YB))) - Math.PI / 2) * 180 / Math.PI];
const [lon, lat] = process.argv[2].split(',').map(Number), minC = +(process.argv[3] || 1);
const [x, y] = project(lon, lat);
let best = null;
for (let r = 0; r <= 25 && !best; r += 0.25) for (let a = 0; a < 64; a++) {
  const px = x + r * Math.cos(a * Math.PI / 32), py = y + r * Math.sin(a * Math.PI / 32);
  if (!onLand(px, py) && coastClearance(px, py) >= minC) { best = [px, py, r]; break; }
}
if (!best) console.log('none'); else { const [lo, la] = unproject(best[0], best[1]); console.log(`[${lo.toFixed(2)}, ${la.toFixed(2)}] off by ${best[2]} units`); }
