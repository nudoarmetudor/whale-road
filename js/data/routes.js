// Whale Road: the sea-lane graph (map owner).
// Waypoints are written in lon/lat for readability and projected once into map
// coordinates (the 1000 x 772 Mercator box of js/data/coast.js). Every edge is
// either open sea (checked against the coastline by tests/routes.test.mjs), or an
// inland leg flagged `river` (river, fjord, lake, narrow strait) or `portage`
// (ships dragged overland on rollers), which the test allows to cross land.

import {MAP_W, MAP_H, PROJ} from './coast.js';

const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const YT = merc(PROJ.lat1), YB = merc(PROJ.lat0);

/** lon/lat -> [x, y] in map units (same projection as tools/build_map.py). */
export function project(lon, lat) {
  return [((lon - PROJ.lon0) / (PROJ.lon1 - PROJ.lon0)) * MAP_W, ((YT - merc(lat)) / (YT - YB)) * MAP_H];
}

/** Port positions on land (fallback until js/data/ports.js supplies them). */
export const PORT_LL = {
  ravnfjord: [6.0, 61.1], kaupang: [10.03, 59.03], hladir: [10.43, 63.45], halogaland: [13.8, 68.24],
  faereyjar: [-6.77, 62.01], island: [-21.94, 64.15], orkney: [-3.0, 59.0], dyflin: [-6.26, 53.35],
  jorvik: [-1.08, 53.96], hamwic: [-1.4, 50.9], rudaborg: [1.1, 49.44], heidaby: [9.57, 54.49],
  jomsborg: [14.62, 53.84], truso: [19.35, 54.15], gotland: [18.29, 57.64], birka: [17.54, 59.33],
  aldeigja: [32.3, 60.0], holmgard: [31.27, 58.52], kaenugard: [30.52, 50.45], miklagard: [28.98, 41.01],
};
export const PORT_IDS = Object.keys(PORT_LL);

// Waypoints. Port ids are nodes too: the quay where a voyage starts and ends.
const WP = {
  // ports (quay positions; inland ones sit at the town, reached by river legs)
  ravnfjord: [6.0, 61.12], kaupang: [10.05, 58.98], hladir: [10.4, 63.47], halogaland: [13.74, 68.27],
  faereyjar: [-6.72, 62.01], island: [-22.02, 64.15], orkney: [-2.9, 59.05], dyflin: [-6.05, 53.35],
  jorvik: [-1.08, 53.96], hamwic: [-1.31, 50.85], rudaborg: [1.1, 49.44], heidaby: [9.57, 54.49],
  jomsborg: [14.62, 53.84], dziwna: [14.52, 54.01], truso: [19.4, 54.15], gotland: [18.2, 57.64], birka: [17.54, 59.33],
  aldeigja: [32.3, 60.0], holmgard: [31.27, 58.52], kaenugard: [30.52, 50.45], miklagard: [28.98, 41.02],

  // North Atlantic
  isl_faxa: [-22.92, 64.12], isl_rey: [-23.3, 63.6], isl_s: [-20, 63.0], isl_se: [-15, 63.4],
  faer_nw: [-9, 62.6], faer_s: [-6.8, 61.3], faer_se: [-6.35, 61.64], faer_e: [-5.3, 61.9],
  nor_sea: [0, 64.5], shet_n: [0.2, 61.0], fair_isle: [-1.6, 59.5],
  ork_n: [-3.0, 59.6], ork_w: [-3.14, 59.23], ork_se: [-2.17, 58.78], cape_wrath: [-5.3, 58.95], minch_n: [-5.9, 58.6], minch: [-6.1, 57.8],
  heb_n: [-6.9, 57.5], heb_s: [-6.9, 56.9], islay: [-6.9, 55.9], n_channel: [-5.55, 55.05],
  irish_n: [-5.2, 54.2], irish_m: [-5.4, 53.4], st_george: [-5.8, 52.2], celtic: [-6.3, 51.0],
  lands_end: [-5.9, 49.85],
  // Channel
  ch_w: [-3.8, 49.95], ch_m: [-1.9, 50.3], solent_w: [-1.56, 50.65], solent: [-1.34, 50.79], ch_e: [0.3, 50.35],
  seine: [0.0, 49.55], seine_up: [0.5, 49.45], dover: [1.6, 51.0],
  // North Sea
  thames: [2.1, 51.6], ns_s: [3.0, 52.8], ns_frisia: [5.5, 53.9], eider: [8.4, 54.3],
  holling: [9.35, 54.45], humber: [0.4, 53.62], humber_in: [-0.2, 53.68], ouse: [-0.75, 53.72],
  yorks: [0.9, 54.4], ns_c: [3.0, 55.6], ns_w: [-1.2, 56.6], moray: [-1.6, 58.0],
  ns_n: [2.0, 58.8], jutland_w: [7.3, 56.6], utsira: [4.5, 59.3], hordaland: [4.4, 60.4],
  sogn_mouth: [4.6, 61.12], sogn_in: [5.3, 61.13], stad: [4.8, 62.25], more: [6.2, 63.15],
  trond_mouth: [8.75, 63.85], trond_in: [9.7, 63.6], vikna: [10.3, 64.9], helgeland: [11.6, 66.0],
  vestfjord: [12.7, 67.4], lofoten: [12.87, 68.18], lofoten_e: [13.68, 68.29],
  // Skagerrak, Kattegat, Belts
  lindesnes: [6.75, 57.72], skagerrak: [9.0, 57.95], oslo_s: [10.3, 58.85], skagen: [10.9, 57.95],
  kattegat: [11.5, 57.1], kattegat_s: [11.6, 56.3], belt_n: [11.0, 55.95], belt_m: [10.86, 55.6], belt: [11.0, 55.4],
  belt_s: [10.97, 54.83], fehmarn_w: [10.97, 54.7], fehmarn: [11.84, 54.53], kiel: [10.4, 54.6], schlei: [10.12, 54.66],
  // Baltic
  baltic_sw: [12.6, 54.6], rugen_n: [13.8, 54.85], pomer: [14.4, 54.15], bornholm_s: [15.0, 54.8],
  baltic_s: [17.0, 55.2], gdansk: [18.99, 54.7], vistula: [19.35, 54.4],
  oland: [17.3, 56.6], baltic_c: [19.0, 56.3], gotland_w: [17.8, 57.5], gotland_e: [19.6, 57.3],
  gotska: [19.38, 58.12], landsort: [18.4, 58.6], stock_out: [19.0, 59.35], stock_in: [18.4, 59.35], stockholm: [18.07, 59.33],
  aland_s: [19.8, 59.55], hanko: [22.8, 59.6], gof_w: [24.2, 59.75], gof_c: [26.5, 60.0],
  gof_e: [28.3, 60.0], gof_e2: [29.45, 60.04], kotlin: [29.59, 59.96], neva_mouth: [30.08, 59.91],
  // River road east (Neva, Ladoga, Volkhov)
  neva_mid: [30.85, 59.85], shlissel: [31.05, 59.96], ladoga_s: [31.6, 60.15], volkhov_mouth: [32.3, 60.1],
  kirishi: [32.0, 59.45], volkhov_s: [31.55, 59.0],
  // Portage road south (Ilmen, Lovat, Dvina, Dnieper)
  ilmen: [31.3, 58.25], lovat: [31.4, 57.8], kholm: [31.2, 57.15], luki: [30.53, 56.34],
  usvyat: [30.9, 55.75], velizh: [31.2, 55.6], gnezdovo: [31.85, 54.8], smolensk: [32.05, 54.78],
  orsha: [30.42, 54.5], mogilev: [30.33, 53.9], zhlobin: [30.0, 52.9], rechytsa: [30.4, 52.37],
  lyubech: [30.65, 51.7], vyshhorod: [30.48, 50.6],
  kaniv: [31.47, 49.75], cherkasy: [32.06, 49.44], kremenchuk: [33.42, 49.07], dnipro: [35.0, 48.45],
  rapids: [35.15, 48.0], khortytsia: [35.1, 47.82], nikopol: [34.4, 47.57], kherson: [32.6, 46.63],
  liman: [31.9, 46.55], berezan: [31.45, 46.6],
  // Black Sea and the Bosporus
  bs_nw: [30.9, 46.0], danube_off: [30.2, 45.0], bs_w: [29.4, 43.8], varna: [28.6, 43.0],
  bosporus_n: [29.15, 41.35], bosporus: [29.06, 41.15],
};

// Chains: "a b c" means edges a-b and b-c.
const SEA = [
  'island isl_faxa isl_rey isl_s isl_se faer_nw faer_s faer_se faereyjar',
  'faereyjar faer_e shet_n hordaland', 'faer_e nor_sea stad', 'isl_se nor_sea', 'faer_s fair_isle',
  'faer_nw minch_n', 'faer_s cape_wrath',
  'shet_n fair_isle ork_n ork_w orkney', 'fair_isle orkney', 'ork_n cape_wrath minch_n minch heb_n heb_s islay n_channel irish_n irish_m dyflin',
  'fair_isle ns_n', 'fair_isle moray', 'orkney ork_se moray ns_w ns_c',
  'irish_m st_george celtic lands_end ch_w ch_m solent_w solent hamwic', 'ch_m ch_e dover thames ns_s',
  'ch_e seine', 'ns_s humber yorks ns_c', 'ns_s ns_frisia eider', 'ns_frisia jutland_w',
  'ns_c ns_n utsira hordaland sogn_mouth stad more trond_mouth vikna helgeland vestfjord lofoten lofoten_e halogaland',
  'ns_c jutland_w skagerrak', 'utsira lindesnes skagerrak skagen kattegat kattegat_s belt_n belt_m belt belt_s kiel schlei',
  'oslo_s kaupang', 'skagerrak oslo_s', 'ns_n lindesnes', 'yorks ns_w',
  'belt_s fehmarn_w fehmarn baltic_sw rugen_n bornholm_s baltic_s gdansk vistula', 'rugen_n pomer dziwna',
  'baltic_s oland gotland_w gotland', 'baltic_s baltic_c gotland_e gotska landsort', 'gotland_w landsort stock_out',
  'gdansk baltic_c', 'gotland_e aland_s', 'stock_out aland_s hanko gof_w gof_c gof_e gof_e2 kotlin neva_mouth',
  'bs_nw danube_off bs_w varna bosporus_n',
];
const RIVER = [
  'sogn_mouth sogn_in ravnfjord', 'trond_mouth trond_in hladir', 'seine seine_up rudaborg',
  'humber humber_in ouse jorvik', 'schlei heidaby', 'dziwna jomsborg', 'eider holling', 'vistula truso',
  'stock_out stock_in stockholm birka',
  'neva_mouth neva_mid shlissel ladoga_s volkhov_mouth aldeigja kirishi volkhov_s holmgard ilmen lovat kholm luki',
  'usvyat velizh', 'gnezdovo smolensk orsha mogilev zhlobin rechytsa lyubech vyshhorod kaenugard kaniv cherkasy kremenchuk dnipro rapids khortytsia nikopol kherson liman berezan bs_nw',
  'bosporus_n bosporus miklagard',
];
const PORTAGE = ['luki usvyat', 'velizh gnezdovo', 'holling heidaby'];

/** Travel cost per map unit by kind: rowing upriver and dragging ships are slow. */
export const COST = {sea: 1, river: 1.4, portage: 2.5};

export const NODES = {};
for (const [id, [lon, lat]] of Object.entries(WP)) NODES[id] = project(lon, lat);

/** Flat edge list: {a, b, kind, len}. */
export const EDGES = [];
/** Chains as polylines for drawing: {kind, ids, points}. */
export const LANES = [];
const ADJ = {};
for (const [kind, chains] of [['sea', SEA], ['river', RIVER], ['portage', PORTAGE]]) {
  for (const chain of chains) {
    const ids = chain.split(/\s+/).filter(Boolean);
    if (ids.length < 2) continue;
    LANES.push({kind, ids, points: ids.map((id) => NODES[id])});
    for (let i = 1; i < ids.length; i++) {
      const a = ids[i - 1], b = ids[i];
      if (!NODES[a] || !NODES[b]) throw new Error(`routes: unknown waypoint ${NODES[a] ? b : a}`);
      const len = Math.hypot(NODES[a][0] - NODES[b][0], NODES[a][1] - NODES[b][1]);
      EDGES.push({a, b, kind, len});
      (ADJ[a] ||= []).push({to: b, w: len * COST[kind], kind, len});
      (ADJ[b] ||= []).push({to: a, w: len * COST[kind], kind, len});
    }
  }
}

/** Named sea points for quest battles (contract ids). Each sits on a lane node. */
export const SEA_MARKS = {};
for (const [id, name, node] of [
  ['skagerrak', 'Skagerrak', 'skagerrak'], ['kattegat', 'Kattegat', 'kattegat'],
  ['north_sea', 'North Sea', 'ns_c'], ['norwegian_sea', 'Norwegian Sea', 'nor_sea'],
  ['iceland_sea', 'Iceland Sea', 'isl_se'], ['pentland', 'Pentland Firth', 'cape_wrath'],
  ['irish_sea', 'Irish Sea', 'irish_n'], ['channel', 'The Channel', 'ch_m'],
  ['baltic_south', 'Southern Baltic', 'baltic_s'], ['baltic_east', 'Eastern Baltic', 'gotland_e'],
  ['gulf_finland', 'Gulf of Finland', 'gof_c'], ['dnieper_rapids', 'Dnieper Rapids', 'rapids'],
  ['black_sea', 'Black Sea', 'bs_w'],
]) SEA_MARKS[id] = {name, x: NODES[node][0], y: NODES[node][1], node};

const cache = new Map();
function dijkstra(src) {
  if (cache.has(src)) return cache.get(src);
  const dist = {[src]: 0}, prev = {}, done = new Set();
  const open = [src];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (dist[open[i]] < dist[open[bi]]) bi = i;
    const u = open.splice(bi, 1)[0];
    if (done.has(u)) continue;
    done.add(u);
    for (const e of ADJ[u] || []) {
      const nd = dist[u] + e.w;
      if (nd < (dist[e.to] ?? Infinity)) { dist[e.to] = nd; prev[e.to] = u; open.push(e.to); }
    }
  }
  const r = {dist, prev};
  cache.set(src, r);
  return r;
}

/** Node ids of the cheapest route, or [] if there is none. */
export function route(from, to) {
  if (!NODES[from] || !NODES[to]) return [];
  if (from === to) return [from];
  const {dist, prev} = dijkstra(from);
  if (dist[to] === undefined) return [];
  const ids = [to];
  while (ids[0] !== from) ids.unshift(prev[ids[0]]);
  return ids;
}

/** [[x, y], ...] in map coords, sea and river legs only. */
export function path(from, to) {
  return route(from, to).map((id) => NODES[id].slice());
}

/** Route cost in map units (sea legs at face value, river x1.4, portage x2.5). */
export function distance(from, to) {
  if (from === to) return 0;
  const {dist} = NODES[from] ? dijkstra(from) : {dist: {}};
  return dist[to] ?? Infinity;
}

/** Points plus the kind of every leg, for drawing and animation. */
export function pathInfo(from, to) {
  const ids = route(from, to);
  const kinds = [];
  for (let i = 1; i < ids.length; i++) {
    const e = (ADJ[ids[i - 1]] || []).find((x) => x.to === ids[i]);
    kinds.push(e ? e.kind : 'sea');
  }
  return {ids, points: ids.map((id) => NODES[id].slice()), kinds, length: distance(from, to)};
}

/** Sea marks the route from -> to passes through (ids from SEA_MARKS). */
export function marksOnPath(from, to) {
  const ids = new Set(route(from, to));
  return Object.keys(SEA_MARKS).filter((k) => ids.has(SEA_MARKS[k].node));
}
