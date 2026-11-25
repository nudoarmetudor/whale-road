// Sea-lane graph tests (map owner). Run: node --test tests/routes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {path, distance, route, pathInfo, marksOnPath, SEA_MARKS, LANES, EDGES, NODES, PORT_IDS, PORT_LL, project} from '../js/data/routes.js';
import {onLand, crossesCoast} from '../tools/coastgeo.mjs';
import {MAP_W, MAP_H} from '../js/data/coast.js';

const CONTRACT_PORTS = ['ravnfjord', 'kaupang', 'hladir', 'halogaland', 'faereyjar', 'island', 'orkney',
  'dyflin', 'jorvik', 'hamwic', 'rudaborg', 'heidaby', 'jomsborg', 'truso', 'gotland', 'birka',
  'aldeigja', 'holmgard', 'kaenugard', 'miklagard'];
const CONTRACT_MARKS = ['skagerrak', 'kattegat', 'north_sea', 'norwegian_sea', 'iceland_sea', 'pentland',
  'irish_sea', 'channel', 'baltic_south', 'baltic_east', 'gulf_finland', 'dnieper_rapids', 'black_sea'];

test('every contract port is a graph node inside the map', () => {
  assert.deepEqual([...PORT_IDS].sort(), [...CONTRACT_PORTS].sort());
  for (const id of CONTRACT_PORTS) {
    const [x, y] = NODES[id];
    assert.ok(x >= 0 && x <= MAP_W && y >= 0 && y <= MAP_H, `${id} at ${x},${y}`);
    const [px, py] = project(...PORT_LL[id]);
    assert.ok(Math.hypot(px - x, py - y) < 4, `${id} quay is near the town`);
  }
});

test('quays sit near the towns in js/data/ports.js (when present)', async () => {
  const mod = await import('../js/data/ports.js').catch(() => null);
  if (!mod || !mod.PORTS) return;
  for (const id of CONTRACT_PORTS) {
    const p = mod.PORTS[id];
    assert.ok(p, `ports.js has ${id}`);
    const [x, y] = project(p.lon, p.lat);
    assert.ok(Math.hypot(x - NODES[id][0], y - NODES[id][1]) < 5, `${id} quay within 5 units of ports.js position`);
  }
});

test('all 190 port pairs have a path, both ways, with matching distance', () => {
  let pairs = 0;
  for (let i = 0; i < CONTRACT_PORTS.length; i++) for (let j = i + 1; j < CONTRACT_PORTS.length; j++) {
    const a = CONTRACT_PORTS[i], b = CONTRACT_PORTS[j];
    const p = path(a, b), q = path(b, a);
    assert.ok(p.length >= 2, `${a} -> ${b}`);
    assert.deepEqual(p[0], NODES[a]);
    assert.deepEqual(p[p.length - 1], NODES[b]);
    assert.ok(q.length >= 2, `${b} -> ${a}`);
    const d = distance(a, b);
    assert.ok(Number.isFinite(d) && d > 0, `${a}-${b} distance`);
    assert.ok(Math.abs(d - distance(b, a)) < 1e-6, 'symmetric');
    // the weighted distance is never shorter than the drawn length
    let len = 0;
    for (let k = 1; k < p.length; k++) len += Math.hypot(p[k][0] - p[k - 1][0], p[k][1] - p[k - 1][1]);
    assert.ok(d >= len - 1e-6);
    pairs++;
  }
  assert.equal(pairs, 190);
  assert.deepEqual(path('birka', 'birka'), [NODES.birka]);
  assert.equal(distance('birka', 'birka'), 0);
  assert.deepEqual(path('nowhere', 'birka'), []);
});

test('no sea edge crosses land; only river and portage legs may', () => {
  const kinds = new Set(EDGES.map((e) => e.kind));
  assert.deepEqual([...kinds].sort(), ['portage', 'river', 'sea']);
  const bad = [];
  for (const e of EDGES) {
    if (e.kind !== 'sea') continue;
    for (const id of [e.a, e.b]) if (onLand(...NODES[id])) bad.push(`${id} is on land`);
    if (crossesCoast(NODES[e.a], NODES[e.b])) bad.push(`${e.a}-${e.b} crosses the coast`);
  }
  assert.deepEqual(bad, []);
});

test('every path is made only of graph edges', () => {
  const key = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const known = new Set(EDGES.map((e) => key(e.a, e.b)));
  for (const a of CONTRACT_PORTS) for (const b of CONTRACT_PORTS) {
    const ids = route(a, b);
    for (let k = 1; k < ids.length; k++) assert.ok(known.has(key(ids[k - 1], ids[k])), `${ids[k - 1]}-${ids[k]}`);
  }
});

test('river road and portage reach the east', () => {
  const info = pathInfo('birka', 'miklagard');
  assert.ok(info.kinds.includes('river'));
  assert.ok(info.kinds.includes('portage'));
  assert.ok(route('holmgard', 'kaenugard').includes('gnezdovo'));
  assert.ok(route('kaenugard', 'miklagard').includes('rapids'));
  assert.ok(marksOnPath('kaenugard', 'miklagard').includes('dnieper_rapids'));
});

test('sea marks match the contract and sit on lanes', () => {
  assert.deepEqual(Object.keys(SEA_MARKS).sort(), [...CONTRACT_MARKS].sort());
  const onLane = new Set(EDGES.flatMap((e) => [e.a, e.b]));
  for (const [id, m] of Object.entries(SEA_MARKS)) {
    assert.equal(typeof m.name, 'string');
    assert.ok(Number.isFinite(m.x) && Number.isFinite(m.y), id);
    assert.ok(onLane.has(m.node), id);
  }
  assert.ok(LANES.length > 10 && LANES.every((l) => l.points.length >= 2));
});
