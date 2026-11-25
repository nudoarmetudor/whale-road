// Fleet: cargo room, speed, hulls, shipyard trade (ships, armaments, ammo), net worth.
// Special ammo is a fleet-wide stock kept on the lead ship (S.fleet[0].ammo).

import {S, ok, fail, here, emit, log, makeShip, pick, rand} from '../state.js';
import {SHIPS, ARMS, AMMO, MAX_FLEET, ARM_CARGO, ARM_RESALE, SHIP_RESALE, REPAIR_PER_HP} from '../data/ships.js';
import {PORTS} from '../data/ports.js';
import {mod} from './charms.js';
import {goodValue} from './economy.js';

const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------- capacity and speed
export const maxHull = (i) => Math.round(SHIPS[S.fleet[i].type].hull * (1 + mod('hull')));
export const armsOn = (i) => sum(S.fleet[i].arms);
export const armsCount = () => S.fleet.reduce((a, _, i) => a + armsOn(i), 0);
export const goodsCount = () => sum(S.cargo);
/** Total hold, with the Hold-Rune. Armaments take ARM_CARGO each out of it. */
export const cargoCap = () => Math.floor(S.fleet.reduce((a, f) => a + SHIPS[f.type].cargo, 0) * (1 + mod('cargo')));
/** Hold used: goods plus 5 per armament. Quest goods take no room. */
export const cargoUsed = () => goodsCount() + ARM_CARGO * armsCount();
export const cargoFree = () => cargoCap() - cargoUsed();
export const overloaded = () => cargoUsed() > cargoCap();
/** Fleet speed = slowest ship, with charms. */
export const fleetSpeed = () => Math.min(...S.fleet.map((f) => SHIPS[f.type].speed)) * (1 + mod('speed'));
export const ammoTotal = () => {
  const t = {};
  for (const f of S.fleet) for (const [k, v] of Object.entries(f.ammo || {})) t[k] = (t[k] || 0) + v;
  return t;
};

// ---------------------------------------------------------------- value
const armsValue = (f) => Object.entries(f.arms).reduce((a, [k, n]) => a + ARMS[k].price * ARM_RESALE * n, 0);
/** What a shipyard pays for ship i, armaments included. */
export function shipValue(i) {
  const f = S.fleet[i];
  if (!f) return 0;
  return Math.round(SHIPS[f.type].price * SHIP_RESALE * (f.hull / maxHull(i)) + armsValue(f));
}
/** Score: silver + bank + goods (cargo, warehouses, quest goods) + ships - debt. */
export function netWorth() {
  let goods = 0;
  const add = (o) => { for (const [g, n] of Object.entries(o || {})) goods += goodValue(g) * n; };
  add(S.cargo);
  Object.values(S.warehouse).forEach(add);
  Object.values(S.qgoods).forEach(add);
  const ships = S.fleet.reduce((a, _, i) => a + shipValue(i), 0);
  return Math.round(S.silver + sum(S.bank) + goods + ships - (S.debt.amount || 0));
}

// ---------------------------------------------------------------- hulls
export function clampHulls() { S.fleet.forEach((f, i) => { f.hull = Math.min(f.hull, maxHull(i)); }); }
/** Damage every ship by a fraction of its max hull (storms). Never sinks: min 1. */
export function damageFleet(frac) {
  let total = 0;
  S.fleet.forEach((f, i) => { const d = Math.min(f.hull - 1, Math.round(maxHull(i) * frac)); f.hull -= d; total += d; });
  emit('fleet', S.fleet);
  return total;
}
export function repairCost(i = 'all') {
  const idx = i === 'all' ? S.fleet.map((_, k) => k) : [i];
  return idx.reduce((a, k) => a + (S.fleet[k] ? Math.max(0, maxHull(k) - S.fleet[k].hull) * REPAIR_PER_HP : 0), 0);
}
export function repair(i = 'all') {
  if (!here('shipyard')) return fail('No shipyard here.');
  const cost = repairCost(i);
  if (!cost) return fail('Nothing to repair.');
  if (cost > S.silver) return fail('Not enough silver.');
  S.silver -= cost;
  (i === 'all' ? S.fleet.map((_, k) => k) : [i]).forEach((k) => { S.fleet[k].hull = maxHull(k); });
  emit('silver', S.silver); emit('fleet', S.fleet);
  return ok({cost});
}

// ---------------------------------------------------------------- ships for sale
const tierCap = () => (S.renown >= 120 ? 4 : S.renown >= 60 ? 3 : S.renown >= 20 || S.mode === 'free' ? 2 : 1);

/** The one ship on the slipway this visit (or null). Stable for the whole visit. */
export function shipOffer(port = S.port) {
  if (!port || port !== S.port || !here('shipyard')) return null;
  const visit = S.stats.voyages;
  if (!S.offer || S.offer.port !== port || S.offer.visit !== visit) {
    const types = Object.keys(SHIPS).filter((t) => SHIPS[t].tier <= tierCap());
    S.offer = {port, visit, type: rand() < 0.15 ? null : pick(types)};
  }
  return S.offer.type;
}

/** Buy the offered ship, optionally trading in ship tradeIn (its value goes toward the price). */
export function buyShip(type, tradeIn = null) {
  if (!here('shipyard')) return fail('No shipyard here.');
  if (shipOffer() !== type) return fail('That ship is not for sale here.');
  const ti = tradeIn === null || tradeIn === undefined ? null : tradeIn;
  if (ti !== null && !S.fleet[ti]) return fail('No such ship to trade in.');
  if (ti === null && S.fleet.length >= MAX_FLEET) return fail(`A fleet holds at most ${MAX_FLEET} ships.`);
  const credit = ti === null ? 0 : shipValue(ti);
  const cost = SHIPS[type].price - credit;
  if (cost > S.silver) return fail('Not enough silver.');
  if (ti !== null) {
    const after = cargoCap() - SHIPS[S.fleet[ti].type].cargo * (1 + mod('cargo')) + SHIPS[type].cargo * (1 + mod('cargo'));
    if (cargoUsed() - ARM_CARGO * armsOn(ti) > after) return fail('Your cargo would not fit.');
  }
  S.silver -= cost;
  const ship = makeShip(type);
  if (ti !== null) {
    const old = S.fleet[ti];
    S.fleet[ti] = ship;
    moveAmmo(old);
  } else S.fleet.push(ship);
  S.offer.type = null;
  log(`Bought the ${SHIPS[type].name} "${ship.name}".`);
  emit('silver', S.silver); emit('fleet', S.fleet); emit('cargo', S.cargo);
  return ok({cost, ship});
}

function moveAmmo(oldShip) {
  const lead = S.fleet[0];
  for (const [k, v] of Object.entries(oldShip.ammo || {})) if (v && lead !== oldShip) lead.ammo[k] = (lead.ammo[k] || 0) + v;
}

export function sellShip(i) {
  if (!here('shipyard')) return fail('No shipyard here.');
  const f = S.fleet[i];
  if (!f) return fail('No such ship.');
  if (S.fleet.length < 2) return fail('You cannot sell your last ship.');
  const capAfter = Math.floor((S.fleet.reduce((a, s) => a + SHIPS[s.type].cargo, 0) - SHIPS[f.type].cargo) * (1 + mod('cargo')));
  if (cargoUsed() - ARM_CARGO * armsOn(i) > capAfter) return fail('Your cargo would not fit in the other ships.');
  const value = shipValue(i);
  S.fleet.splice(i, 1);
  moveAmmo(f);
  S.silver += value;
  log(`Sold "${f.name}" for ${value} s.`);
  emit('silver', S.silver); emit('fleet', S.fleet); emit('cargo', S.cargo);
  return ok({silver: value});
}

// ---------------------------------------------------------------- armaments and ammo
export const armCost = (arm) => ARMS[arm].price;
export function addArm(i, arm) {
  if (!here('shipyard')) return fail('No shipyard here.');
  const f = S.fleet[i];
  if (!f || !ARMS[arm]) return fail('No such ship or crew.');
  if (armsOn(i) >= SHIPS[f.type].slots) return fail('No free slot on that ship.');
  if (cargoFree() < ARM_CARGO) return fail(`Each crew needs ${ARM_CARGO} cargo room.`);
  if (S.silver < ARMS[arm].price) return fail('Not enough silver.');
  S.silver -= ARMS[arm].price;
  f.arms[arm] = (f.arms[arm] || 0) + 1;
  emit('silver', S.silver); emit('fleet', S.fleet); emit('cargo', S.cargo);
  return ok({cost: ARMS[arm].price});
}
export function removeArm(i, arm) {
  if (!here('shipyard')) return fail('No shipyard here.');
  const f = S.fleet[i];
  if (!f || !f.arms[arm]) return fail('No such crew on that ship.');
  const refund = Math.round(ARMS[arm].price * ARM_RESALE);
  if (--f.arms[arm] <= 0) delete f.arms[arm];
  S.silver += refund;
  emit('silver', S.silver); emit('fleet', S.fleet); emit('cargo', S.cargo);
  return ok({silver: refund});
}
export const ammoCost = (ammo) => AMMO[ammo].price;
export function buyAmmo(ammo, qty = 1) {
  qty = Math.floor(qty);
  if (!here('shipyard')) return fail('No shipyard here.');
  const a = AMMO[ammo];
  if (!a) return fail('No such ammunition.');
  if (a.onlyAt && a.onlyAt !== S.port) return fail(`Only sold in ${PORTS[a.onlyAt].name}.`);
  if (!(qty > 0)) return fail('Choose an amount.');
  if (a.price * qty > S.silver) return fail('Not enough silver.');
  S.silver -= a.price * qty;
  S.fleet[0].ammo[ammo] = (S.fleet[0].ammo[ammo] || 0) + qty;
  emit('silver', S.silver); emit('fleet', S.fleet);
  return ok({cost: a.price * qty});
}

/** Fleet order matters in battle. Ammo follows the lead ship. */
export function reorder(from, to) {
  if (!S.fleet[from] || to < 0 || to >= S.fleet.length) return fail('No such position.');
  const ammo = ammoTotal();
  const [s] = S.fleet.splice(from, 1);
  S.fleet.splice(to, 0, s);
  S.fleet.forEach((f) => { f.ammo = {}; });
  S.fleet[0].ammo = ammo;
  emit('fleet', S.fleet);
  return ok();
}
export function rename(i, name) {
  const n = String(name || '').trim().slice(0, 24);
  if (!S.fleet[i] || !n) return fail('Give the ship a name.');
  S.fleet[i].name = n;
  emit('fleet', S.fleet);
  return ok();
}

/** Battle loot: goods go in while there is room; silver always. Returns what was taken. */
export function takeLoot(loot = {}, silver = 0) {
  const taken = {};
  for (const [g, n] of Object.entries(loot)) {
    const q = Math.max(0, Math.min(n, cargoFree()));
    if (!q) continue;
    S.cargo[g] = (S.cargo[g] || 0) + q;
    S.cargoPaid[g] = ((S.cargoPaid[g] || 0) * (S.cargo[g] - q)) / S.cargo[g]; // loot is free
    taken[g] = q;
  }
  S.silver += Math.round(silver * (1 + mod('loot')));
  emit('silver', S.silver); emit('cargo', S.cargo);
  return ok({taken, silver: Math.round(silver * (1 + mod('loot')))});
}
