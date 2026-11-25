// Headless battle simulation: node --test tests/combat.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBattle, tick, DT, players, foes, cmdRam, cmdBlessing, cmdTalent, cmdAmmo, cmdFlee,
  setTarget, canBless, ramDamage, applyOutcome, fleeChance, unit, toggleSelect, selectAll,
} from '../js/combat/engine.js';
import {ENEMY_KINDS, enemyStats} from '../js/combat/enemies.js';
import {shipSVG} from '../js/art/ships.js';
import {SHIP_TYPES} from '../js/combat/defaults.js';

// The saga start (js/state.js newGame): a knarr with one crew of archers and one of spearmen.
const starter = () => [{id: 1, type: 'knarr', name: 'Sea-Otter', hull: 110, arms: {archers: 1, spearmen: 1}, ammo: {harpoon: 2, firearrows: 1, greekfire: 0}}];

// Use the sim's real tables when they exist (they do once the sim worker has landed).
let SIM = {};
try {
  const m = await import('../js/data/ships.js');
  SIM = {ships: m.SHIPS, arms: m.ARMS, ammo: m.AMMO};
} catch { /* fallback tables in js/combat/defaults.js */ }
try { SIM.blessingData = (await import('../js/data/blessings.js')).BLESSINGS; } catch { /* fallback */ }
const make = (cfg) => createBattle({...SIM, ...cfg});

function run(b, maxT = 240, each) {
  b.paused = false;
  let t = 0;
  while (!b.result && t < maxT) { tick(b, DT); t += DT; if (each) each(b, t); }
  return b;
}

function noNaN(b) {
  for (const u of b.units) {
    for (const k of ['hp', 'maxHp', 'x', 'slot', 'slotTo', 'mass', 'ram', 'speed']) {
      assert.ok(Number.isFinite(u[k]), `${u.id}.${k} = ${u[k]}`);
    }
    for (const w of u.weapons) assert.ok(Number.isFinite(w.timer) && Number.isFinite(w.dmg), `${u.id} weapon`);
  }
  assert.ok(Number.isFinite(b.talent.charge));
}

test('starting knarr beats one raider faering (most seeds)', () => {
  let wins = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const b = run(make({fleet: starter(), enemies: ['raider_faering'], seed}));
    noNaN(b);
    if (b.result === 'win') wins++;
  }
  assert.ok(wins >= 29, `wins ${wins}/30`);
});

test('starting knarr beats two raider faerings (most seeds)', () => {
  let wins = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const b = run(make({fleet: starter(), enemies: ['raider_faering', 'raider_faering'], seed}));
    noNaN(b);
    if (b.result === 'win') wins++;
  }
  assert.ok(wins >= 25, `wins ${wins}/30`);
});

test('starting knarr loses to a raider drakkar', () => {
  let losses = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const b = run(make({fleet: starter(), enemies: ['raider_drakkar'], seed}));
    noNaN(b);
    if (b.result === 'lose') losses++;
  }
  assert.equal(losses, 20);
});

test('every enemy kind fights at levels 1 and 8 without NaN and the battle ends', () => {
  const big = [
    {type: 'drakkar', name: 'Wave-Wolf', arms: {huscarls: 2, marksmen: 2, archers: 2}},
    {type: 'skeid', name: 'Long Serpent', arms: {huscarls: 2, marksmen: 3}},
    {type: 'busse', name: 'Fat Goose', arms: {spearmen: 2, archers: 2}},
    {type: 'snekkja', name: 'Swift', arms: {spearmen: 1, archers: 2}},
  ];
  for (const level of [1, 8]) {
    for (const kind of ENEMY_KINDS) {
      const b = run(make({fleet: big.map((f) => ({...f})), enemies: [{kind, level}, {kind, level}], seed: 7}), 400);
      noNaN(b);
      assert.ok(b.result, `${kind} L${level} ended`);
    }
  }
});

test('level scales enemy hull and damage', () => {
  const a = enemyStats('raider_karvi', 1); const c = enemyStats('raider_karvi', 5);
  assert.ok(c.hull > a.hull && c.weapons[0].dmg > a.weapons[0].dmg && c.silverScale > a.silverScale);
});

test('ramming: bigger hurts the rammer, cannot ram flyers, swimmers or forts', () => {
  const small = {mass: 90, ram: 4, maxHp: 90}; const huge = {mass: 380, ram: 14, maxHp: 380};
  const d1 = ramDamage(small, huge); const d2 = ramDamage(huge, small);
  assert.ok(d1.toSelf > d1.toTarget * 3, 'small into big hurts itself');
  assert.ok(d2.toTarget > d2.toSelf * 5, 'big into small crushes it');

  for (const kind of ['storm_crow', 'serpent', 'kraken', 'fortress_tower', 'fortress_gate']) {
    const b = make({fleet: starter(), enemies: [kind], seed: 3});
    b.paused = false;
    setTarget(b, 'e0');
    const r = cmdRam(b);
    assert.equal(r.ok, false, kind);
    assert.equal(unit(b, 'p0').state, 'idle');
  }
  const b = make({fleet: starter(), enemies: ['raider_karvi'], seed: 3});
  setTarget(b, 'e0');
  assert.equal(cmdRam(b).ok, true);
  assert.equal(unit(b, 'p0').state, 'charge');
  const hp0 = unit(b, 'e0').hp;
  for (let i = 0; i < 90 && unit(b, 'p0').state === 'charge'; i++) tick(b);
  assert.ok(unit(b, 'e0').hp < hp0, 'ram landed');
  assert.ok(unit(b, 'p0').ramCd > 0, 'ram cooldown');
});

test("njord triples ram damage and rune_ram adds half", () => {
  const ramHit = (opts) => {
    const b = make({fleet: [{type: 'snekkja', name: 'S', arms: {}}], enemies: [{kind: 'fortress_tower'}, {kind: 'raider_drakkar'}], seed: 5, ...opts});
    // silence weapons so only the ram counts
    for (const u of b.units) for (const w of u.weapons) w.timer = 999;
    if (opts.njord) cmdBlessing(b, 'njord');
    setTarget(b, 'e1');
    const before = unit(b, 'e1').hp;
    cmdRam(b);
    for (let i = 0; i < 120 && unit(b, 'p0').state === 'charge'; i++) tick(b);
    return before - unit(b, 'e1').hp;
  };
  const base = ramHit({});
  const nj = ramHit({njord: true, blessings: {njord: 1}});
  const rune = ramHit({items: ['rune_ram']});
  assert.ok(Math.abs(nj / base - 3) < 0.15, `njord ${nj} vs ${base}`);
  assert.ok(Math.abs(rune / base - 1.5) < 0.15, `rune ${rune} vs ${base}`);
});

test('blessings: counts, cooldowns, only while enemies remain', () => {
  const b = make({fleet: starter(), enemies: ['raider_karvi', 'raider_karvi'], blessings: {thor: 2, eir: 1}, seed: 4});
  const hp = foes(b).map((e) => e.hp);
  assert.equal(cmdBlessing(b, 'thor').ok, true);
  foes(b).forEach((e, i) => assert.ok(e.hp < hp[i], 'thor hit all'));
  assert.equal(b.blessings.thor, 1);
  assert.equal(cmdBlessing(b, 'thor').ok, false, 'cooldown');
  for (const u of b.units) { u.ramCd = 1e9; for (const w of u.weapons) w.timer = 1e9; }
  for (let i = 0; i < b.blessCd.thor / DT + 2; i++) tick(b);
  assert.equal(canBless(b, 'thor').ok, true);
  assert.equal(cmdBlessing(b, 'odin').ok, false, 'none owned');
  const p = unit(b, 'p0'); p.hp = 10;
  cmdBlessing(b, 'eir');
  assert.equal(p.hp, 10 + Math.round(p.maxHp * 0.25));
  // kari stuns and pushes back
  const c = make({fleet: starter(), enemies: ['raider_karvi'], blessings: {kari: 1}, seed: 2});
  const x0 = unit(c, 'e0').x;
  cmdBlessing(c, 'kari');
  assert.ok(unit(c, 'e0').stun > 4 && unit(c, 'e0').x > x0);
  // no enemies -> unusable
  const d = make({fleet: starter(), enemies: ['raider_faering'], blessings: {thor: 3}, seed: 2});
  unit(d, 'e0').hp = 1; cmdBlessing(d, 'thor');
  assert.equal(foes(d).length, 0);
  assert.equal(canBless(d, 'thor').ok, false);
});

test('talent bar fills with damage and each talent fires', () => {
  for (const talent of ['shieldwall', 'berserk', 'seidr', 'mockery', 'seaking', 'trollgrip']) {
    const b = make({fleet: starter(), enemies: ['raider_drakkar', 'raider_karvi'], talent, seed: 9});
    assert.equal(cmdTalent(b).ok, false, 'empty bar');
    run(b, 60, (bb) => { if (bb.talent.charge >= 1) bb.paused = true; });
    if (b.result) continue;
    assert.ok(b.talent.charge >= 1, `${talent} bar filled`);
    const hp = foes(b).map((e) => e.hp);
    assert.equal(cmdTalent(b).ok, true);
    assert.equal(b.talent.charge, 0);
    if (talent === 'trollgrip') assert.ok(foes(b).some((e, i) => e.hp <= hp[i] - e.maxHp * 0.49) || foes(b).length < hp.length);
    else if (talent === 'seaking') { for (let i = 0; i < 40; i++) tick(b); assert.ok(b.dealt > 0); }
    else assert.ok(b.fx[talent] > 0, `${talent} active`);
  }
  // shieldwall halves damage taken
  const b = make({fleet: starter(), enemies: ['raider_karvi'], talent: 'shieldwall', seed: 1});
  b.talent.charge = 1; cmdTalent(b);
  const p = unit(b, 'p0'); const h = p.hp;
  b.projectiles.push({id: 1, from: 'e0', to: 'p0', t: 0, T: 0, hit: true, dmg: 20, src: 'e', dmgKind: 'weapon'});
  tick(b);
  assert.equal(h - p.hp, 10);
});

test('special ammo is consumed and hurts', () => {
  const b = make({fleet: starter(), enemies: ['raider_karvi', 'raider_faering'], seed: 11});
  for (const u of b.units) for (const w of u.weapons) w.timer = 999;
  const total = () => foes(b).reduce((s, e) => s + e.hp, 0);
  const t0 = total();
  assert.equal(cmdAmmo(b, 'firearrows').ok, true);
  assert.equal(unit(b, 'p0').ammo.firearrows, 0);
  for (let i = 0; i < 40; i++) tick(b);
  assert.ok(total() < t0);
  assert.equal(cmdAmmo(b, 'greekfire').ok, false, 'none aboard');
});

test('focus fire and selection', () => {
  const fleet = [...starter(), {type: 'knarr', name: 'Cow', arms: {archers: 2}}];
  const b = make({fleet, enemies: ['raider_karvi', 'raider_karvi'], seed: 1});
  toggleSelect(b, 'p1');
  setTarget(b, 'e1');
  assert.equal(unit(b, 'p0').target, 'e1');
  assert.equal(unit(b, 'p1').target, null);
  selectAll(b);
  assert.ok(players(b).every((u) => u.selected));
});

test('lanes shuffle to the middle after a sinking', () => {
  const b = make({fleet: starter(), enemies: ['raider_faering', 'raider_faering', 'raider_faering'], seed: 1});
  const top = unit(b, 'e0');
  assert.equal(unit(b, 'e2').slotTo, 1);
  top.hp = 1;
  b.projectiles.push({id: 1, from: 'p0', to: 'e0', t: 0, T: 0, hit: true, dmg: 5, src: 'p', dmgKind: 'weapon'});
  tick(b);
  assert.equal(top.state, 'sink');
  assert.equal(unit(b, 'e2').slotTo, 0.5);
  assert.ok(b.shuffleT > 0, 'enemies may not ram while shuffling');
});

test('flee chance depends on speed; failure gives a free volley', () => {
  const slow = make({fleet: [{type: 'knarr', name: 'K', arms: {}}], enemies: ['raider_snekkja'], seed: 1});
  const fast = make({fleet: [{type: 'snekkja', name: 'S', arms: {}}], enemies: ['frankish_cog'], seed: 1});
  assert.ok(fleeChance(fast) > fleeChance(slow));
  let ok = 0; let fail = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const b = make({fleet: starter(), enemies: ['raider_karvi'], seed});
    const r = cmdFlee(b);
    if (r.fled) { ok++; run(b, 5); assert.equal(b.result, 'fled'); assert.ok(unit(b, 'p0').hp < unit(b, 'p0').maxHp); } else { fail++; assert.ok(b.projectiles.length > 0); }
  }
  assert.ok(ok > 0 && fail > 0);
});

test('outcome: win stows loot that fits, lose keeps the smallest boat', () => {
  const S = {mode: 'free', silver: 1000, items: [], blessings: {thor: 2, eir: 1}, cargo: {stockfish: 76},
    fleet: starter(), stats: {}};
  const b = run(make({fleet: S.fleet, enemies: ['raider_faering', 'raider_faering'], blessings: S.blessings, seed: 3}));
  assert.equal(b.result, 'win');
  const out = applyOutcome(S, b, SIM);
  assert.ok(out.silver > 0 && S.silver === 1000 + out.silver);
  assert.deepEqual(out.enemies, ['raider_faering', 'raider_faering']);
  const cap = 90 - 10; // knarr cargo minus two armaments
  const used = Object.values(S.cargo).reduce((s, q) => s + q, 0);
  assert.ok(used <= cap, `cargo ${used} <= ${cap}`);
  const dropped = Object.values(out.loot).reduce((s, q) => s + q, 0) + Object.values(out.lost).reduce((s, q) => s + q, 0);
  if (dropped > 4) assert.ok(Object.keys(out.lost).length > 0, 'what did not fit is listed as lost');
  assert.ok(S.fleet[0].hull >= 1 && S.fleet[0].hull <= 110);
  assert.equal(S.blessings.thor, 2);

  const L = {mode: 'free', silver: 1001, items: [], blessings: {thor: 0}, cargo: {furs: 10},
    fleet: [{type: 'knarr', name: 'Cow', arms: {}}, {type: 'faering', name: 'Duck', arms: {}}]};
  const lb = run(make({fleet: L.fleet, enemies: ['raider_drakkar', 'raider_drakkar'], seed: 3}));
  assert.equal(lb.result, 'lose');
  const lo = applyOutcome(L, lb, SIM);
  assert.equal(L.fleet.length, 1);
  assert.equal(L.fleet[0].type, 'faering');
  assert.equal(L.fleet[0].hull, 8);
  assert.deepEqual(L.cargo, {furs: 10}, 'faering holds 20; the sim takes its third on battle-end');
  assert.equal(L.silver, 1001);
  assert.equal(lo.silver, 0);
  assert.deepEqual(lo.sunk, ['Cow']);

  // a sinking that leaves too little hold: excess cargo goes down
  const O = {mode: 'free', silver: 0, items: [], blessings: {}, cargo: {furs: 70, salt: 30},
    fleet: [{type: 'knarr', name: 'Cow', arms: {}}, {type: 'karvi', name: 'Kid', arms: {}}]};
  const ob = make({fleet: O.fleet, enemies: ['raider_faering'], seed: 1});
  unit(ob, 'p1').hp = 0; unit(ob, 'p1').state = 'gone';
  unit(ob, 'e0').hp = 0; unit(ob, 'e0').state = 'gone'; ob.result = 'win';
  const oo = applyOutcome(O, ob, SIM);
  assert.equal(O.fleet.length, 1);
  assert.equal(O.cargo.furs + O.cargo.salt + Object.values(oo.loot).reduce((s, q) => s + q, 0), 90);
  assert.ok(oo.lostCargo.furs > 0);
});

test('shipSVG draws all 8 types', () => {
  for (const t of SHIP_TYPES) {
    const s = shipSVG(t, {w: 240});
    assert.ok(s.startsWith('<svg') && s.includes('</svg>') && !s.includes('NaN'), t);
  }
});
