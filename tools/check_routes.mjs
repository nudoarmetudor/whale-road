// Route checker: node tools/check_routes.mjs [out.json]
// Lists sea waypoints on land, sea edges crossing the coast, tight clearances,
// and optionally writes the graph as JSON for plotting.
import {NODES, EDGES, PORT_IDS, path} from '../js/data/routes.js';
import {onLand, crossesCoast, coastClearance} from './coastgeo.mjs';
import {writeFileSync} from 'node:fs';

const seaNodes = new Set();
for (const e of EDGES) if (e.kind === 'sea') { seaNodes.add(e.a); seaNodes.add(e.b); }
let bad = 0;
for (const id of seaNodes) {
  const [x, y] = NODES[id];
  if (onLand(x, y)) { bad++; console.log('ON LAND  ', id, x.toFixed(1), y.toFixed(1)); }
  else if (coastClearance(x, y) < 1.2) console.log('tight    ', id, coastClearance(x, y).toFixed(2));
}
const out = [];
for (const e of EDGES) {
  const hit = crossesCoast(NODES[e.a], NODES[e.b]);
  const ok = e.kind !== 'sea' || !hit;
  if (!ok) { bad++; console.log('CROSSES  ', e.a, '-', e.b, JSON.stringify(hit)); }
  out.push({a: NODES[e.a], b: NODES[e.b], kind: e.kind, bad: !ok, cross: !!hit, na: e.a, nb: e.b});
}
let missing = 0;
for (const a of PORT_IDS) for (const b of PORT_IDS) if (a < b && path(a, b).length < 2) { missing++; console.log('NO PATH', a, b); }
console.log(`problems: ${bad}, missing pairs: ${missing}, nodes: ${Object.keys(NODES).length}, edges: ${EDGES.length}`);
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify({edges: out, nodes: NODES}));
