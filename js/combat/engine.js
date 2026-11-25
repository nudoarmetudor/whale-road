// Pure battle logic. No DOM, no canvas, no globals: battle.js renders it, the tests
// drive it headless. Deterministic for a given seed.
//
// Geometry: x runs 0..1 from the player's side (left) to the enemy's (right).
// Lanes: each side's living ships sit on slots centred on 0 (… -1, 0, 1 …), so a
// player ship on slot 0.5 faces the enemy on slot 0.5. Short-range weapons reach the
// same or an adjacent lane, or two lanes when the ships are close in x.

import {
  SHIP_FALLBACK, ARM_COMBAT, CREW_WEAPON, AMMO, BLESSING_COMBAT, BLESSING_IDS, TALENTS,
  TALENT_NEED, WEATHER, itemMods, AMMO_IDS, PACE,
} from './defaults.js';
import {enemyStats} from './enemies.js';

export const DT = 1 / 30;
const PLAYER_HOME = 0.2;
const SHUFFLE_T = 1.2;
const SINK_T = 2.6;

// ---------------------------------------------------------------- rng

export function makeRng(seed = Date.now()) {
  let a = (seed >>> 0) || 0x9e3779b9;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rr = (b, lo, hi) => lo + (hi - lo) * b.rng();
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const num = (v, d = 0) => (v !== null && v !== undefined && v !== '' && Number.isFinite(+v) ? +v : d);
/** Copy the finite numeric fields `keys` of `o` (sim tables override our fallbacks). */
const pickNum = (o, keys) => Object.fromEntries(keys.filter((k) => o && Number.isFinite(+o[k]) && o[k] !== null).map((k) => [k, +o[k]]));

// ---------------------------------------------------------------- setup

/** Resolve a ship type's base stats from the sim table, falling back to ours. */
export function shipBase(type, ships) {
  const fromSim = ships && (Array.isArray(ships) ? ships.find((s) => s.id === type) : ships[type]);
  const fb = SHIP_FALLBACK[type] || SHIP_FALLBACK.karvi;
  const s = {...fb, ...pickNum(fromSim, ['hull', 'cargo', 'slots', 'speed', 'ram', 'price']), name: fromSim?.name || fb.name};
  return {
    name: s.name || fb.name, hull: num(s.hull, fb.hull), cargo: num(s.cargo, fb.cargo),
    slots: num(s.slots, fb.slots), speed: num(s.speed, fb.speed), ram: num(s.ram, fb.ram),
    price: num(s.price, fb.price),
  };
}

/** Max hull of a fleet ship after charms. */
export function maxHull(type, items, ships) {
  return Math.round(shipBase(type, ships).hull * itemMods(items).hull);
}

/**
 * Build a battle.
 * cfg: {fleet, enemies:[{kind, level?, name?, boss?}|'kind'], weather, place, level,
 *       talent, items, mod, blessings, seed,     (mod = js/sim/charms.js mod, optional)
 *       ships, arms, ammo, blessingData}  <- optional sim tables (js/data/ships.js SHIPS/ARMS/AMMO,
 *                                           js/data/blessings.js BLESSINGS); fallbacks in defaults.js
 */
export function createBattle(cfg = {}) {
  const items = cfg.items || [];
  const mods = itemMods(items, cfg.mod);
  const b = {
    t: 0, acc: 0, paused: true, speed: 1, rng: makeRng(cfg.seed ?? Date.now()),
    weather: WEATHER[cfg.weather] ? cfg.weather : 'clear', place: cfg.place === 'fortress' ? 'fortress' : 'sea',
    mods, units: [], projectiles: [], warns: [], events: [], focus: null,
    blessings: {...Object.fromEntries(BLESSING_IDS.map((k) => [k, 0])), ...(cfg.blessings || {})},
    cd: {}, fx: {njord: 0, odin: 0, shieldwall: 0, berserk: 0, seidr: 0, mockery: 0},
    talent: {id: TALENTS[cfg.talent] ? cfg.talent : 'shieldwall', charge: 0, need: TALENT_NEED},
    ammoStats: Object.fromEntries(AMMO_IDS.map((a) => [a, {...AMMO[a], ...pickNum(cfg.ammo?.[a], ['dmg'])}])),
    blessCd: Object.fromEntries(BLESSING_IDS.map((k) => [k, num(cfg.blessingData?.[k]?.cooldown, BLESSING_COMBAT[k].cooldown)])),
    shuffleT: 0, fleeCd: 0, fleeing: 0, hornUsed: !mods.horn, endT: 0, result: null,
    dealt: 0, taken: 0, flashT: 0, nextFlash: 4, uid: 0,
  };
  for (const k of BLESSING_IDS) b.blessings[k] = Math.max(0, Math.floor(num(b.blessings[k])));

  const fleet = (cfg.fleet || []).slice(0, 4);
  fleet.forEach((f, i) => {
    const base = shipBase(f.type, cfg.ships);
    const max = Math.round(base.hull * mods.hull);
    const hp = clamp(num(f.hull, max), 0, max);
    const weapons = [];
    for (const [arm, n] of Object.entries(f.arms || {})) {
      if (!ARM_COMBAT[arm]) continue;
      const w = {...ARM_COMBAT[arm], ...pickNum(cfg.arms?.[arm], ['dmg', 'reload'])};
      if (cfg.arms?.[arm]?.range === 'short' || cfg.arms?.[arm]?.range === 'long') w.range = cfg.arms[arm].range;
      for (let j = 0; j < Math.floor(num(n)); j++) weapons.push({...w, arm});
    }
    weapons.push({...CREW_WEAPON, arm: 'crew'});
    weapons.forEach((w) => { w.dmg *= PACE; w.reload *= mods.reload; w.timer = rr(b, 0.4, w.reload); });
    b.units.push({
      id: 'p' + i, side: 'p', fleetIndex: i, type: f.type, art: f.type, name: f.name || base.name,
      hp, maxHp: max, mass: base.hull, ram: base.ram, speed: base.speed * mods.speed,
      weapons, ammo: Object.fromEntries(AMMO_IDS.map((a) => [a, Math.max(0, Math.floor(num(f.ammo?.[a])))])),
      x: PLAYER_HOME - 0.05, homeX: PLAYER_HOME, slot: 0, slotTo: 0, order: i,
      state: hp > 0 ? 'idle' : 'gone', stateT: 0, selected: true, target: null,
      stun: 0, burn: null, ramCd: 0, sinkT: 0, flash: 0, sail: f.sail,
    });
  });

  // the bar takes longer to fill for a bigger fleet
  b.talent.need = TALENT_NEED + 0.35 * b.units.reduce((sum, u) => sum + u.maxHp, 0);

  const list = (cfg.enemies || []).slice(0, 6);
  list.forEach((e, i) => {
    const spec = typeof e === 'string' ? {kind: e} : e || {};
    const st = enemyStats(spec.kind, spec.level ?? cfg.level ?? 1);
    b.units.push({
      id: 'e' + i, side: 'e', kind: st.kind, art: st.art, name: spec.name || st.name, st,
      hp: st.hull, maxHp: st.hull, mass: st.mass, ram: st.ram * st.dmgScale, speed: st.speed,
      weapons: st.weapons.map((w) => ({...w, timer: rr(b, 0.8, w.reload + 1)})),
      x: st.homeX + 0.06, homeX: st.homeX, slot: 0, slotTo: 0, order: i,
      state: 'idle', stateT: 0, stun: 0, burn: null, ramCd: rr(b, 4, 7), sinkT: 0, flash: 0,
      aiT: rr(b, 2, 4), boss: !!spec.boss, fly: !!st.fly, swim: !!st.swim, static: !!st.static,
      canBeRammed: st.canBeRammed, grab: null,
    });
  });
  reflow(b, 'p', true);
  reflow(b, 'e', true);
  return b;
}

// ---------------------------------------------------------------- queries

export const alive = (u) => u.state !== 'sink' && u.state !== 'gone' && u.state !== 'fled';
export const side = (b, s) => b.units.filter((u) => u.side === s && alive(u));
export const players = (b) => side(b, 'p');
export const foes = (b) => side(b, 'e');
export const unit = (b, id) => b.units.find((u) => u.id === id) || null;
const laneDist = (a, c) => Math.abs(a.slot - c.slot);

export function canReach(a, t) {
  const ld = laneDist(a, t);
  return ld <= 1.05 || (Math.abs(a.x - t.x) < 0.3 && ld <= 2.05);
}

/** The enemy (or player) in front of `u`: nearest lane, then nearest x. */
function front(b, u, list, filter) {
  let best = null; let bs = Infinity;
  for (const t of list) {
    if (filter && !filter(t)) continue;
    const s = laneDist(u, t) * 10 + Math.abs(u.x - t.x);
    if (s < bs) { bs = s; best = t; }
  }
  return best;
}

export function fleetSpeed(b) {
  const p = players(b);
  return p.length ? Math.min(...p.map((u) => u.speed)) : 0;
}
export function enemySpeed(b) {
  const e = foes(b);
  return e.length ? Math.max(...e.map((u) => (u.static ? 0 : u.speed))) : 0;
}
export function fleeChance(b) {
  const es = enemySpeed(b);
  if (es === 0) return 0.95;
  return clamp(0.5 + 0.07 * (fleetSpeed(b) - es), 0.15, 0.9);
}
export function ammoCount(b, kind) {
  return players(b).reduce((s, u) => s + (u.ammo[kind] || 0), 0);
}
export function selectedShips(b) {
  const p = players(b).filter((u) => u.selected);
  return p.length ? p : players(b);
}
export function canBless(b, key) {
  if (b.result || b.fleeing) return {ok: false, msg: 'Battle over'};
  if (!(b.blessings[key] > 0)) return {ok: false, msg: 'None left'};
  if ((b.cd[key] || 0) > 0) return {ok: false, msg: 'Not ready'};
  if (!foes(b).length) return {ok: false, msg: 'No enemies'};
  return {ok: true};
}

function emit(b, ev) {
  b.events.push({...ev, at: b.t});
  if (b.events.length > 600) b.events.splice(0, b.events.length - 600);
}

// ---------------------------------------------------------------- lanes

function reflow(b, s, snap = false) {
  const list = b.units.filter((u) => u.side === s && alive(u)).sort((a, c) => a.order - c.order);
  const n = list.length;
  list.forEach((u, i) => {
    u.slotTo = i - (n - 1) / 2;
    if (snap) u.slot = u.slotTo;
  });
  if (!snap) b.shuffleT = SHUFFLE_T;
}

// ---------------------------------------------------------------- damage

function damage(b, src, t, amount, kind = 'weapon') {
  if (!alive(t) || !(amount > 0)) return 0;
  let a = amount;
  const fromPlayer = src === 'p' || src?.side === 'p';
  if (fromPlayer && b.fx.berserk > 0 && kind !== 'talent' && kind !== 'bless') a *= 3;
  if (t.side === 'p' && b.fx.shieldwall > 0) a *= 0.5;
  a = Math.max(1, Math.round(a));
  const dealt = Math.min(a, t.hp);
  t.hp -= a;
  t.flash = 0.25;
  if (fromPlayer && t.side === 'e') {
    b.dealt += dealt;
    if (kind !== 'talent') b.talent.charge = Math.min(1, b.talent.charge + (dealt / b.talent.need) * b.mods.talent);
  }
  if (t.side === 'p') b.taken += dealt;
  emit(b, {type: 'hit', id: t.id, dmg: a, kind});
  if (t.hp <= 0) sink(b, t);
  return a;
}

function sink(b, u) {
  u.hp = 0; u.state = 'sink'; u.sinkT = 0; u.stun = 0; u.burn = null;
  if (u.grab) { const g = unit(b, u.grab); if (g) g.stun = 0; u.grab = null; }
  emit(b, {type: 'sink', id: u.id});
  if (b.focus === u.id) b.focus = null;
  for (const o of b.units) if (o.target === u.id) o.target = null;
  b.warns = b.warns.filter((w) => w.from !== u.id);
  reflow(b, u.side);
}

function heal(b, u, amount) {
  if (!alive(u)) return 0;
  const h = Math.min(u.maxHp - u.hp, Math.round(amount));
  u.hp += h;
  return h;
}

// ---------------------------------------------------------------- shooting

function accuracy(b, w, shooter, t) {
  const W = WEATHER[b.weather];
  let a = w.acc - (w.range === 'long' ? W.long : W.short);
  if (t.fly && w.range === 'long') a -= 0.1;
  if (shooter.side === 'e' && b.fx.seidr > 0) a *= 0.3;
  return clamp(a, 0.04, 0.98);
}

function fire(b, shooter, t, w, opts = {}) {
  const hit = opts.sure || b.rng() < accuracy(b, w, shooter, t);
  let dmg = w.dmg * rr(b, 0.8, 1.2);
  if (shooter.side === 'p' && b.fx.odin > 0 && (w.range === 'long' || opts.ammo)) dmg *= BLESSING_COMBAT.odin.rangedMult;
  const T = opts.T ?? (w.range === 'long' ? rr(b, 0.65, 0.9) : 0.35);
  b.projectiles.push({
    id: ++b.uid, from: shooter.id, to: t.id, t: 0, T, hit, dmg, burn: opts.burn || 0, burnT: opts.burnT || 0,
    kind: opts.kind || (w.range === 'long' ? 'arrow' : (w.arm === 'crew' ? 'axe' : 'spear')),
    dmgKind: opts.dmgKind || (opts.ammo ? 'ammo' : 'weapon'), src: shooter.side,
    // jitter so volleys fan out
    j: rr(b, -1, 1),
  });
  emit(b, {type: 'shot', id: shooter.id, kind: opts.kind || (w.range === 'long' ? 'arrow' : 'spear')});
}

function chooseTarget(b, u, w) {
  const enemies = u.side === 'p' ? foes(b) : players(b);
  if (!enemies.length) return null;
  const want = u.side === 'p' && u.target ? unit(b, u.target) : null;
  const ok = (t) => alive(t) && (w.range === 'long' || canReach(u, t));
  if (want && ok(want)) return want;
  if (u.side === 'e' && w.range === 'long' && b.rng() < 0.2) return enemies[Math.floor(b.rng() * enemies.length)];
  return front(b, u, enemies, ok);
}

function tickWeapons(b, u, dt) {
  if (u.stun > 0 || u.state === 'sink' || u.state === 'flee') return;
  const slow = u.side === 'e' && b.fx.mockery > 0 ? 0.5 : 1;
  for (const w of u.weapons) {
    w.timer -= dt * slow;
    if (w.timer > 0) continue;
    const t = chooseTarget(b, u, w);
    if (!t) { w.timer = 0.25; continue; }
    fire(b, u, t, w);
    w.timer = w.reload * rr(b, 0.9, 1.1);
  }
}

function tickProjectiles(b, dt) {
  const keep = [];
  for (const p of b.projectiles) {
    p.t += dt;
    if (p.t < p.T) { keep.push(p); continue; }
    const t = unit(b, p.to);
    if (!t || !alive(t)) { emit(b, {type: 'miss', id: p.to}); continue; }
    if (p.hit) {
      damage(b, p.src, t, p.dmg, p.dmgKind);
      if (p.burn && alive(t)) setBurn(t, p.burn, p.burnT, p.src);
    } else emit(b, {type: 'miss', id: t.id});
  }
  b.projectiles = keep;
}

function setBurn(t, dps, dur, src) {
  if (!t.burn || t.burn.dps * t.burn.t < dps * dur) t.burn = {dps, t: dur, src};
}

// ---------------------------------------------------------------- ramming

export function ramDamage(a, t, mult = 1) {
  const r = a.mass / Math.max(1, t.mass);
  const toTarget = a.ram * 2.5 * clamp(Math.pow(r, 0.7), 0.35, 2.5) * mult;
  const toSelf = a.maxHp * 0.03 + (r < 1 ? t.ram * 0.75 * Math.pow(1 / r, 1.1) : t.ram * 0.4);
  return {toTarget, toSelf, ratio: r};
}

function impact(b, a, t) {
  let mult = 1;
  if (a.side === 'p') mult = b.mods.ram * (b.fx.njord > 0 ? BLESSING_COMBAT.njord.ramMult : 1);
  const d = ramDamage(a, t, mult);
  emit(b, {type: 'ram', id: a.id, target: t.id, dmg: Math.round(d.toTarget), self: Math.round(d.toSelf)});
  damage(b, a, t, d.toTarget, 'ram');
  damage(b, t, a, d.toSelf, 'ram');
}

function startCharge(b, u, t) {
  u.state = 'charge'; u.chargeTo = t.id; u.stateT = 0;
  emit(b, {type: 'charge', id: u.id, target: t.id});
}

function moveToward(u, x, slot, vx, vs, dt) {
  const dx = x - u.x; const ds = slot - u.slot;
  u.x += clamp(dx, -vx * dt, vx * dt);
  u.slot += clamp(ds, -vs * dt, vs * dt);
  return Math.abs(x - u.x) < 0.01 && Math.abs(slot - u.slot) < 0.05;
}

function tickMotion(b, u, dt) {
  u.flash = Math.max(0, u.flash - dt);
  if (u.state === 'sink') {
    u.sinkT += dt;
    if (u.sinkT > SINK_T) u.state = 'gone';
    return;
  }
  if (u.state === 'fled') { u.x += 0.3 * dt; return; }
  if (!alive(u)) return;
  if (u.burn) {
    u.burnAcc = (u.burnAcc || 0) + u.burn.dps * dt;
    if (u.burnAcc >= 1) { const d = Math.floor(u.burnAcc); u.burnAcc -= d; damage(b, u.burn.src, u, d, 'burn'); }
    if (u.burn) { u.burn.t -= dt; if (u.burn.t <= 0) u.burn = null; }
    if (!alive(u)) return;
  }
  if (u.ramCd > 0) u.ramCd -= dt;
  if (u.stun > 0) { u.stun -= dt; if (u.stun <= 0 && u.grabbedBy) u.grabbedBy = null; }

  const dir = u.side === 'p' ? -1 : 1;
  if (u.state === 'flee') { u.x -= 0.35 * dt; return; }
  if (u.state === 'charge' || u.state === 'dive') {
    const t = unit(b, u.chargeTo);
    if (!t || !alive(t) || u.stun > 0) { u.state = 'return'; return; }
    const tx = t.x + dir * (u.state === 'dive' ? 0.04 : 0.09);
    const v = u.state === 'dive' ? 1.6 : 0.75 + u.speed * 0.03;
    if (moveToward(u, tx, t.slot, v, 3.5, dt) || (u.stateT += dt) > 3) {
      if (u.state === 'dive') diveHit(b, u, t); else impact(b, u, t);
      if (alive(u)) { u.state = 'return'; u.ramCd = u.side === 'p' ? 6 : rr(b, 9, 13); }
    }
    return;
  }
  if (u.stun > 0) return;
  if (u.state === 'return') {
    if (moveToward(u, u.homeX, u.slotTo, 0.6, 2.5, dt)) u.state = 'idle';
    return;
  }
  // idle: drift home and slide along lanes during a shuffle
  const vx = u.static ? 0 : 0.25;
  moveToward(u, u.homeX, u.slotTo, vx, 1.6, dt);
}

function diveHit(b, crow, t) {
  emit(b, {type: 'dive', id: crow.id, target: t.id});
  damage(b, crow, t, crow.st.dive.dmg * crow.st.atkScale * rr(b, 0.85, 1.15), 'beast');
}

// ---------------------------------------------------------------- enemy AI

function tickAI(b, u, dt) {
  if (u.side !== 'e' || !alive(u) || u.stun > 0 || u.state !== 'idle') return;
  const ps = players(b);
  if (!ps.length) return;
  const st = u.st;
  u.aiT -= dt;
  const busy = b.shuffleT > 0;
  switch (st.ai) {
    case 'rush':
    case 'ranged': {
      if (u.ramCd > 0 || busy) break;
      const t = front(b, u, ps);
      if (!t) break;
      const r = u.mass / t.mass;
      const low = t.hp / t.maxHp;
      const go = st.ai === 'rush' ? (r >= 0.5 || low < 0.3) : (low < 0.25 && r >= 0.8);
      if (go) startCharge(b, u, t); else u.ramCd = rr(b, 2, 4);
      if (st.ai === 'rush' && u.homeX > 0.62) u.homeX -= 0.04; // creep in
      break;
    }
    case 'siphon': warnedAttack(b, u, 'siphon', st.siphon.every, st.siphon.warn, ps); break;
    case 'serpent': warnedAttack(b, u, 'bite', st.bite.every, st.bite.warn, ps); break;
    case 'kraken': {
      if (u.aiT > 0 || u.grab) break;
      const t = front(b, u, ps, (p) => p.stun <= 0);
      if (!t) break;
      t.stun = st.grab.stun; t.grabbedBy = u.id; u.grab = t.id; u.grabT = st.grab.stun;
      emit(b, {type: 'grab', id: u.id, target: t.id});
      emit(b, {type: 'msg', text: `The kraken seizes ${t.name}'s oars!`});
      u.aiT = st.grab.every;
      break;
    }
    case 'crow': {
      if (u.aiT > 0) break;
      const t = ps[Math.floor(b.rng() * ps.length)];
      u.state = 'dive'; u.chargeTo = t.id; u.stateT = 0;
      u.aiT = st.dive.every * rr(b, 0.85, 1.2);
      break;
    }
    case 'drain': {
      if (u.aiT > 0) break;
      const t = front(b, u, ps);
      const d = damage(b, u, t, st.drain.dmg * st.atkScale, 'beast');
      heal(b, u, d);
      emit(b, {type: 'drain', id: u.id, target: t.id, dmg: d});
      u.aiT = st.drain.every;
      if (u.ramCd <= 0 && !busy && t.hp / t.maxHp < 0.3) startCharge(b, u, t);
      break;
    }
    default: break;
  }
}

function warnedAttack(b, u, kind, every, warnT, ps) {
  if (u.aiT > 0 || b.warns.some((w) => w.from === u.id)) return;
  const t = kind === 'bite' ? ps[Math.floor(b.rng() * ps.length)] : front(b, u, ps);
  if (!t) return;
  if (kind === 'bite') u.slotTo = clamp(t.slot, -2.5, 2.5); // the serpent coils over
  b.warns.push({from: u.id, kind, lane: t.slot, t: warnT, T: warnT});
  emit(b, {type: 'warn', id: u.id, kind, lane: t.slot});
  u.aiT = every * rr(b, 0.9, 1.15);
}

function resolveWarn(b, w) {
  const u = unit(b, w.from);
  if (!u || !alive(u) || u.stun > 0) return;
  const st = u.st;
  if (w.kind === 'siphon') {
    const hit = players(b).filter((p) => Math.abs(p.slot - w.lane) <= 1.05);
    emit(b, {type: 'siphon', id: u.id, lane: w.lane});
    for (const p of hit) {
      damage(b, u, p, st.siphon.dmg * st.atkScale * rr(b, 0.85, 1.15), 'beast');
      if (alive(p)) setBurn(p, st.siphon.burn * st.atkScale, st.siphon.burnT, 'e');
    }
  } else if (w.kind === 'bite') {
    const t = players(b).find((p) => Math.abs(p.slot - w.lane) < 0.55);
    emit(b, {type: 'bite', id: u.id, lane: w.lane, target: t?.id || null});
    if (t) damage(b, u, t, st.bite.dmg * st.atkScale * rr(b, 0.85, 1.15), 'beast');
    else emit(b, {type: 'msg', text: 'The serpent bites empty water!'});
  }
}

// ---------------------------------------------------------------- main tick

export function tick(b, dt = DT) {
  if (b.result) return;
  b.t += dt;
  for (const k of Object.keys(b.fx)) if (b.fx[k] > 0) b.fx[k] = Math.max(0, b.fx[k] - dt);
  for (const k of Object.keys(b.cd)) if (b.cd[k] > 0) b.cd[k] = Math.max(0, b.cd[k] - dt);
  if (b.shuffleT > 0) b.shuffleT -= dt;
  if (b.fleeCd > 0) b.fleeCd -= dt;
  if (b.weather === 'storm') {
    b.nextFlash -= dt;
    if (b.nextFlash <= 0) { emit(b, {type: 'flash', x: b.rng()}); b.nextFlash = rr(b, 3, 8); }
  }

  if (b.fleeing > 0) {
    for (const u of b.units) tickMotion(b, u, dt);
    b.fleeing -= dt;
    if (b.fleeing <= 0) end(b, 'fled');
    return;
  }

  for (const u of b.units) tickMotion(b, u, dt);
  for (const u of b.units) if (alive(u)) tickAI(b, u, dt);
  for (const u of b.units) if (alive(u)) tickWeapons(b, u, dt);
  // kraken grip squeezes
  for (const u of b.units) {
    if (!u.grab || !alive(u)) continue;
    const g = unit(b, u.grab);
    u.grabT -= dt;
    if (!g || !alive(g) || u.grabT <= 0 || u.stun > 0) { if (g) { g.stun = 0; g.grabbedBy = null; } u.grab = null; continue; }
    u.sqAcc = (u.sqAcc || 0) + u.st.grab.squeeze * u.st.atkScale * dt;
    if (u.sqAcc >= 1) { const d = Math.floor(u.sqAcc); u.sqAcc -= d; damage(b, u, g, d, 'beast'); }
  }
  for (const w of b.warns) w.t -= dt;
  const due = b.warns.filter((w) => w.t <= 0);
  b.warns = b.warns.filter((w) => w.t > 0);
  for (const w of due) resolveWarn(b, w);
  tickProjectiles(b, dt);

  const busy = b.units.some((u) => u.state === 'sink');
  if (!players(b).length || !foes(b).length) {
    b.endT += dt;
    if (b.endT > 1.2 && (!busy || b.endT > 3)) end(b, players(b).length ? 'win' : 'lose');
  }
}

/** Advance real time (seconds) honouring pause and speed. */
export function step(b, realDt) {
  if (b.paused || b.result) return;
  b.acc += Math.min(0.25, realDt) * b.speed;
  while (b.acc >= DT) { b.acc -= DT; tick(b, DT); if (b.result) break; }
}

function end(b, result) {
  if (b.result) return;
  b.result = result;
  b.projectiles = [];
  emit(b, {type: 'end', result});
}

// ---------------------------------------------------------------- commands

export function setPaused(b, p) { b.paused = !!p; }
export function togglePause(b) { b.paused = !b.paused; return b.paused; }
export function setSpeed(b, s) { b.speed = s === 2 ? 2 : 1; }

export function toggleSelect(b, id) {
  const u = unit(b, id);
  if (u && u.side === 'p' && alive(u)) u.selected = !u.selected;
}
export function selectAll(b) {
  for (const u of players(b)) u.selected = true;
}

/** Focus fire: every selected ship now shoots `id`. Tapping the focused enemy again clears it. */
export function setTarget(b, id) {
  const t = unit(b, id);
  if (!t || t.side !== 'e' || !alive(t)) return;
  b.focus = b.focus === id ? null : id;
  for (const u of selectedShips(b)) u.target = b.focus;
}

export function cmdRam(b) {
  if (b.result || b.fleeing) return {ok: false, msg: 'Battle over'};
  const es = foes(b);
  const focus = b.focus ? unit(b, b.focus) : null;
  if (focus && !focus.canBeRammed) {
    const why = focus.fly ? 'cannot ram a flying foe' : focus.swim ? 'cannot ram what swims below' : 'cannot ram stone walls';
    emit(b, {type: 'msg', text: `You ${why}.`});
    return {ok: false, msg: why};
  }
  const rammable = es.filter((e) => e.canBeRammed);
  if (!rammable.length) { emit(b, {type: 'msg', text: 'Nothing here can be rammed.'}); return {ok: false, msg: 'Nothing to ram'}; }
  const ships = selectedShips(b).filter((u) => u.state === 'idle' && u.stun <= 0 && u.ramCd <= 0);
  if (!ships.length) { emit(b, {type: 'msg', text: 'Rowers need a breath.'}); return {ok: false, msg: 'Not ready'}; }
  for (const u of ships) startCharge(b, u, focus || front(b, u, rammable));
  return {ok: true, n: ships.length};
}

export function cmdBlessing(b, key) {
  const can = canBless(b, key);
  if (!can.ok) return can;
  const B = BLESSING_COMBAT[key];
  b.blessings[key] -= 1;
  b.cd[key] = b.blessCd[key];
  emit(b, {type: 'bless', key});
  const es = foes(b);
  if (key === 'thor') {
    emit(b, {type: 'thor', ids: es.map((e) => e.id)});
    for (const e of es) damage(b, 'p', e, B.dmg + B.pct * e.maxHp, 'bless');
  } else if (key === 'eir') {
    const ps = players(b);
    for (const u of ps) heal(b, u, u.maxHp * B.heal);
    emit(b, {type: 'heal', ids: ps.map((u) => u.id)});
  } else if (key === 'njord') b.fx.njord = B.dur;
  else if (key === 'odin') b.fx.odin = B.dur;
  else if (key === 'kari') {
    for (const e of es) {
      e.stun = Math.max(e.stun, B.dur);
      if (!e.static) e.x = Math.min(0.96, e.x + B.push);
      if (e.state === 'charge' || e.state === 'dive') e.state = 'return';
      if (e.grab) { const g = unit(b, e.grab); if (g) { g.stun = 0; g.grabbedBy = null; } e.grab = null; }
    }
    b.warns = [];
    emit(b, {type: 'gale', ids: es.map((e) => e.id)});
  }
  return {ok: true};
}

export function cmdAmmo(b, kind) {
  const A = b.ammoStats[kind];
  if (!A) return {ok: false, msg: 'Unknown ammo'};
  if (b.result || b.fleeing) return {ok: false, msg: 'Battle over'};
  const es = foes(b);
  if (!es.length) return {ok: false, msg: 'No enemies'};
  if ((b.cd['ammo_' + kind] || 0) > 0) return {ok: false, msg: 'Not ready'};
  // the stock is fleet-wide: a selected ship that carries it fires, else any ship that does
  const carriers = players(b).filter((u) => u.ammo[kind] > 0);
  if (!carriers.length) { emit(b, {type: 'msg', text: `No ${A.name.toLowerCase()} aboard.`}); return {ok: false, msg: 'None aboard'}; }
  const sel = selectedShips(b);
  const holder = carriers.find((u) => u.selected) || carriers[0];
  const shooter = sel.find((u) => u.stun <= 0) || holder;
  holder.ammo[kind] -= 1;
  b.cd['ammo_' + kind] = A.cooldown;
  const W = WEATHER[b.weather];
  if (A.target === 'one') {
    const t = (b.focus && unit(b, b.focus)) || front(b, shooter, es);
    fire(b, shooter, t, {dmg: A.dmg, range: 'long', acc: 0.97 - W.long / 2}, {kind, ammo: true, T: 0.55});
  } else {
    for (const t of es) {
      fire(b, shooter, t, {dmg: A.dmg, range: 'long', acc: 1}, {kind, ammo: true, sure: true, burn: A.burn, burnT: A.burnT, T: rr(b, 0.6, 0.85)});
    }
  }
  emit(b, {type: 'ammo', kind});
  return {ok: true, from: shooter.id};
}

export function cmdTalent(b) {
  if (b.result || b.fleeing) return {ok: false, msg: 'Battle over'};
  if (b.talent.charge < 1) return {ok: false, msg: 'Not ready'};
  const es = foes(b);
  if (!es.length) return {ok: false, msg: 'No enemies'};
  const id = b.talent.id;
  b.talent.charge = 0;
  const T = TALENTS[id];
  if (T.dur) b.fx[id] = T.dur;
  if (id === 'seaking') {
    for (const u of players(b)) for (const w of u.weapons) for (const t of es) {
      fire(b, u, t, w, {sure: true, dmgKind: 'talent', T: rr(b, 0.5, 0.9), kind: w.range === 'long' ? 'arrow' : 'spear'});
    }
  } else if (id === 'trollgrip') {
    const t = (b.focus && unit(b, b.focus)) || es.reduce((m, e) => (e.hp > m.hp ? e : m), es[0]);
    emit(b, {type: 'grip', target: t.id});
    damage(b, 'p', t, t.maxHp * 0.5, 'talent');
  }
  emit(b, {type: 'talent', talent: id});
  return {ok: true};
}

export function cmdFlee(b) {
  if (b.result || b.fleeing) return {ok: false, msg: 'Battle over'};
  if (b.fleeCd > 0) return {ok: false, msg: 'Not yet'};
  if (!foes(b).length) return {ok: false, msg: 'No enemies'};
  const p = fleeChance(b);
  if (b.rng() < p) {
    b.fleeing = 1.6;
    for (const u of players(b)) {
      const hurt = Math.round(u.maxHp * 0.08);
      u.hp = Math.max(1, u.hp - hurt);
      u.state = 'flee';
      emit(b, {type: 'hit', id: u.id, dmg: hurt, kind: 'flee'});
    }
    b.projectiles = [];
    emit(b, {type: 'msg', text: 'You slip away!'});
    emit(b, {type: 'flee', ok: true});
    return {ok: true, fled: true, chance: p};
  }
  b.fleeCd = 10;
  emit(b, {type: 'msg', text: 'Cut off! They loose everything at you.'});
  emit(b, {type: 'flee', ok: false});
  for (const e of foes(b)) {
    if (e.stun > 0) continue;
    for (const w of e.weapons) {
      const ps = players(b);
      if (!ps.length) break;
      fire(b, e, ps[Math.floor(b.rng() * ps.length)], w);
      w.timer = w.reload;
    }
    if (e.st.ai === 'crow' || e.st.ai === 'serpent' || e.st.ai === 'drain' || e.st.ai === 'kraken') e.aiT = 0;
  }
  return {ok: true, fled: false, chance: p};
}

/** horn_sea: once per battle, every non-boss, non-fortress enemy has a 35% chance to flee. */
export function cmdHorn(b) {
  if (b.hornUsed || b.result || b.fleeing) return {ok: false, msg: 'Not available'};
  b.hornUsed = true;
  let n = 0;
  for (const e of foes(b)) {
    if (e.boss || e.static) continue;
    if (b.rng() < 0.35) {
      e.state = 'fled'; e.fleeT = 0; n++;
      if (b.focus === e.id) b.focus = null;
    }
  }
  if (n) reflow(b, 'e');
  emit(b, {type: 'horn', n});
  emit(b, {type: 'msg', text: n ? `${n} foe${n > 1 ? 's' : ''} turn${n > 1 ? '' : 's'} tail!` : 'They laugh at your horn.'});
  return {ok: true, n};
}

// ---------------------------------------------------------------- outcome

/** Roll the loot for a won battle (only enemies actually sunk drop anything).
 *  The loot charm raises goods here and silver in applyOutcome / sim takeLoot. */
export function rollLoot(b, unlockedGoods) {
  const luck = b.mods.loot;
  let silver = 0;
  const goods = {};
  for (const u of b.units) {
    if (u.side !== 'e' || u.hp > 0) continue;
    const st = u.st;
    silver += rr(b, st.silver[0], st.silver[1]) * st.silverScale; // the loot charm is applied on stowing
    for (const [g, lo, hi, ch] of st.drops) {
      const allowed = !unlockedGoods || !unlockedGoods.length || unlockedGoods.includes(g) || (g === 'hacksilver' && st.static);
      if (!allowed || b.rng() > Math.min(1, ch * (luck > 1 ? 1.15 : 1))) continue;
      const q = Math.round(rr(b, lo, hi) * luck);
      if (q > 0) goods[g] = (goods[g] || 0) + q;
    }
  }
  return {silver: Math.round(silver), goods};
}

/**
 * Write the battle back into the game state `S` (mutates it).
 * Rules:
 *  - Surviving ships keep their damaged hull (min 1); ships that sank are removed.
 *  - Special ammo and blessing counts are written back.
 *  - Lose (every ship that fought went down): the hero escapes in the smallest ship of
 *    the fleet, which limps on at 20% hull with its armaments and no special ammo.
 *    Silver carried is kept. js/sim/voyage.js then takes a third of the cargo on
 *    'battle-end' (the winners help themselves).
 *  - If the remaining hulls cannot hold the cargo any more, the excess goes down with
 *    the ships (largest stacks first) and is reported as lostCargo.
 *  - Win: loot silver and goods. Goods go in only while there is free cargo; the rest is
 *    reported as `lost`. With opts.takeLoot (js/sim/fleet.js takeLoot) the sim stows it
 *    and applies the loot charm to silver; otherwise it is applied here.
 * opts: {ships, cargoCap(S)?, cargoUsed(S)?, takeLoot(goods, silver)?}
 * Returns {result, loot, lost, lostCargo, silver, sunk, enemies, applied:true}.
 */
export function applyOutcome(S, b, opts = {}) {
  const result = b.result || 'fled';
  const ships = opts.ships;
  const mods = b.mods;
  const sunk = [];
  const before = (S.fleet || []).slice();
  const keep = [];
  for (const u of b.units) {
    if (u.side !== 'p') continue;
    const f = before[u.fleetIndex];
    if (!f) continue;
    f.ammo = {...(f.ammo || {}), ...u.ammo};
    if (u.hp > 0) { f.hull = Math.max(1, Math.round(u.hp)); keep.push(f); } else sunk.push(f.name || f.type);
  }
  // ships beyond the 4 that fought stay untouched
  for (let i = 4; i < before.length; i++) keep.push(before[i]);
  if (!keep.length && before.length) {
    // the hero escapes in the smallest boat
    const fought = before.slice(0, 4);
    const small = fought.reduce((m, f) => (shipBase(f.type, ships).price < shipBase(m.type, ships).price ? f : m), fought[0]);
    small.hull = Math.max(1, Math.round(shipBase(small.type, ships).hull * mods.hull * 0.2));
    small.ammo = Object.fromEntries(AMMO_IDS.map((a) => [a, 0]));
    keep.push(small);
    const i = sunk.indexOf(small.name || small.type);
    if (i >= 0) sunk.splice(i, 1);
  }
  S.fleet = keep;
  S.blessings = {...(S.blessings || {}), ...b.blessings};
  S.cargo = S.cargo || {};

  const cap = () => (opts.cargoCap ? opts.cargoCap(S) : Math.floor(S.fleet.reduce((s, f) => s + shipBase(f.type, ships).cargo, 0) * mods.cargo));
  const used = () => (opts.cargoUsed ? opts.cargoUsed(S)
    : Object.values(S.cargo).reduce((s, q) => s + num(q), 0) + 5 * S.fleet.reduce((s, f) => s + Object.values(f.arms || {}).reduce((x, n) => x + num(n), 0), 0));

  const lostCargo = {};
  let over = used() - cap();
  while (over > 0) {
    const [g, q] = Object.entries(S.cargo).filter(([, n]) => n > 0).sort((a, c) => c[1] - a[1])[0] || [];
    if (!g) break;
    const d = Math.min(q, over);
    S.cargo[g] -= d; lostCargo[g] = (lostCargo[g] || 0) + d; over -= d;
    if (S.cargo[g] <= 0) { delete S.cargo[g]; if (S.cargoPaid) delete S.cargoPaid[g]; }
  }

  let silver = 0;
  const loot = {};
  const lost = {};
  if (result === 'win') {
    const roll = rollLoot(b, S.mode === 'saga' ? S.unlockedGoods : null);
    if (opts.takeLoot) {
      const r = opts.takeLoot(roll.goods, roll.silver) || {};
      Object.assign(loot, r.taken || {});
      silver = num(r.silver, roll.silver);
    } else {
      silver = Math.round(roll.silver * mods.loot);
      S.silver = num(S.silver) + silver;
      let free = Math.max(0, cap() - used());
      for (const [g, q] of Object.entries(roll.goods)) {
        const take = Math.min(q, free);
        if (take > 0) {
          const had = num(S.cargo[g]);
          if (S.cargoPaid) S.cargoPaid[g] = Math.round((num(S.cargoPaid[g]) * had) / (had + take));
          S.cargo[g] = had + take; loot[g] = take; free -= take;
        }
      }
    }
    for (const [g, q] of Object.entries(roll.goods)) if (q - (loot[g] || 0) > 0) lost[g] = q - (loot[g] || 0);
  }
  const enemies = b.units.filter((u) => u.side === 'e').map((u) => u.kind);
  return {result, loot, lost, lostCargo, silver, sunk, enemies, applied: true};
}
