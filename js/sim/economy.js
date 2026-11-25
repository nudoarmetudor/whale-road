// Markets. Every price is min + (max - min) * level, with level in 0..1 built from:
//   base     where the town stands in the trade: producers ~0.12; demanders 0.72-0.96 and
//            neutral towns 0.35-0.80, dearer the farther the nearest producer is (so the
//            long routes pay more)
//   season   the good's season curve
//   noise    a weekly random target the price drifts toward each day
//   pressure your own trades (buying raises it, selling lowers it), decaying 10%/day
//   events   famines, feasts, gluts and wars, announced as rumours in mead halls
// A town pays 86% of its asking price when you sell, so buying and selling in the same
// town always loses a little (even with the Greed-Rune), and a town's price only recovers
// slowly from what you did to it: no infinite loop between two ports.

import {S, ok, fail, clamp, rand, randInt, pick, emit, log, here} from '../state.js';
import {GOODS, GOOD_IDS} from '../data/goods.js';
import {PORTS, PORT_IDS} from '../data/ports.js';
import {seasonIndex} from './time.js';
import {distance} from './geo.js';
import {mod} from './charms.js';
import {cargoFree} from './fleet.js';
import {EXT} from './ext.js';

export const SELL_FACTOR = 0.86;
export const DECAY = 0.9;          // pressure kept per day
export const TEACH_QTY = 10;       // sell this many and the town starts selling the good
export const CATCH_CHANCE = 0.25;  // contraband: chance the reeve's men catch you

// ---------------------------------------------------------------- base levels (static)
// Producers sit at 0.12. Elsewhere the level rises with the sailing distance D to the
// nearest producer (routes.distance: river legs and portages count extra), slightly
// faster than linearly, so a short hop barely pays and the long hauls pay best, even per
// day: level = 0.14 + 0.78 * min(1, D / 600)^1.2, plus 0.15 where the good is in demand.
export const LEVEL = {producer: 0.12, near: 0.14, span: 0.78, exp: 1.2, dref: 600, demand: 0.15};
const BASE = {};
for (const p of PORT_IDS) {
  BASE[p] = {};
  for (const g of GOOD_IDS) {
    const P = PORTS[p];
    if (P.produces.includes(g)) { BASE[p][g] = LEVEL.producer; continue; }
    const producers = PORT_IDS.filter((q) => q !== p && PORTS[q].produces.includes(g));
    const d = producers.length ? Math.min(...producers.map((q) => distance(q, p))) : LEVEL.dref;
    const f = Math.pow(clamp(d / LEVEL.dref, 0, 1), LEVEL.exp);
    BASE[p][g] = clamp(LEVEL.near + LEVEL.span * f + (P.demands.includes(g) ? LEVEL.demand : 0), 0, 0.96);
  }
}
export const baseLevel = (port, good) => BASE[port][good];

// ---------------------------------------------------------------- dynamic state
function econ() {
  if (!S.econ) {
    S.econ = {};
    for (const p of PORT_IDS) {
      S.econ[p] = {};
      for (const g of GOOD_IDS) { const t = (rand() - 0.5) * 0.16; S.econ[p][g] = {n: t, t, p: 0, sold: 0}; }
    }
    S.econDay = 0;
  }
  return S.econ;
}

const eventShift = (port, good) => S.mevents.filter((e) => e.port === port && e.good === good)
  .reduce((a, e) => a + e.shift, 0);

/** The 0..1 price level of a good in a town right now. */
export function level(port, good) {
  const e = econ()[port][good];
  return clamp(BASE[port][good] + GOODS[good].season[seasonIndex(S.day)] + e.n + e.p + eventShift(port, good), 0.02, 0.98);
}
const priceAt = (good, lvl) => GOODS[good].min + (GOODS[good].max - GOODS[good].min) * clamp(lvl, 0, 1);
const sellMult = () => SELL_FACTOR * (1 + mod('sellPrice'));

/** Does this town sell (offer to you) this good? */
export function sellsHere(port, good) {
  const P = PORTS[port];
  return P.produces.includes(good) || (P.trades || []).includes(good) || (S.stocked[port] || []).includes(good);
}
const isContraband = (port, good) => PORTS[port].contraband.includes(good);
const known = (good) => S.unlockedGoods.includes(good);

/** Asking price (what you pay) or null if not sold here. */
export function buyPrice(port, good) {
  if (!known(good) || isContraband(port, good) || !sellsHere(port, good)) return null;
  return Math.round(priceAt(good, level(port, good)));
}
/** What the town pays you per unit (contraband: the smugglers' price). */
export function sellPrice(port, good) {
  if (isContraband(port, good)) return Math.floor(priceAt(good, 0.98 + econ()[port][good].p) * (1 + mod('sellPrice')));
  return Math.max(1, Math.floor(priceAt(good, level(port, good)) * sellMult()));
}

/** Total silver for trading qty units, with the price moving as you trade. */
export function quote(good, qty, side = 'buy', port = S.port) {
  const depth = GOODS[good].depth, L = level(port, good);
  const chunks = Math.min(qty, 10);
  let total = 0, done = 0;
  for (let c = 0; c < chunks; c++) {
    const n = Math.round(((c + 1) * qty) / chunks) - done;
    const mid = side === 'buy' ? L + (done + n / 2) / depth : L - (done + n / 2) / depth;
    total += n * (side === 'buy' ? priceAt(good, mid) : Math.max(1, priceAt(good, mid) * sellMult()));
    done += n;
  }
  return side === 'buy' ? Math.ceil(total) : Math.floor(total);
}

const stockNote = (lvl) => (lvl < 0.35 ? 'plenty' : lvl < 0.65 ? 'some' : 'scarce');

/** Market screen rows for a port (default: where we are). */
export function market(port = S.port) {
  if (!port) return [];
  const rows = [];
  for (const g of GOOD_IDS) {
    const held = S.cargo[g] || 0;
    if (!known(g) && !held) continue;
    const contraband = isContraband(port, g);
    rows.push({good: g, name: GOODS[g].name, buy: contraband ? null : buyPrice(port, g), sell: sellPrice(port, g),
      contraband, stockNote: stockNote(level(port, g)), held, paid: S.cargoPaid[g] || 0});
  }
  return rows;
}

function needMarket() {
  if (!S.port) return 'You are at sea.';
  if (!here('market')) return 'There is no market here.';
  return null;
}

/** Most units of a good you can buy now (cargo room and silver). */
export function maxBuy(good) {
  if (needMarket() || buyPrice(S.port, good) === null) return 0;
  let lo = 0, hi = Math.max(0, cargoFree());
  while (lo < hi) { const m = Math.ceil((lo + hi) / 2); if (quote(good, m) <= S.silver) lo = m; else hi = m - 1; }
  return lo;
}

export function buy(good, qty) {
  qty = Math.floor(qty);
  const why = needMarket(); if (why) return fail(why);
  if (!(qty > 0)) return fail('Choose an amount.');
  if (buyPrice(S.port, good) === null) return fail('Not sold here.');
  if (qty > cargoFree()) return fail('Not enough cargo room.');
  const cost = quote(good, qty);
  if (cost > S.silver) return fail('Not enough silver.');
  const have = S.cargo[good] || 0;
  S.cargoPaid[good] = ((S.cargoPaid[good] || 0) * have + cost) / (have + qty);
  S.cargo[good] = have + qty;
  S.silver -= cost;
  econ()[S.port][good].p += qty / GOODS[good].depth;
  S.stats.bought += cost;
  emit('silver', S.silver); emit('cargo', S.cargo);
  return ok({cost, qty});
}

function gainRenownFromProfit(profit) {
  if (profit <= 0) return;
  S.stats.renownProfit += profit;
  while (S.stats.renownProfit >= 4000) { S.stats.renownProfit -= 4000; S.renown += 1; }
}

function removeCargo(good, qty) {
  S.cargo[good] -= qty;
  if (S.cargo[good] <= 0) { delete S.cargo[good]; delete S.cargoPaid[good]; }
}

export function sell(good, qty) {
  qty = Math.floor(qty);
  const why = needMarket(); if (why) return fail(why);
  if (!(qty > 0)) return fail('Choose an amount.');
  if ((S.cargo[good] || 0) < qty) return fail('You do not have that many.');
  if (isContraband(S.port, good)) return fail('Forbidden here. Only a quiet "sell all" will do.');
  const silver = quote(good, qty, 'sell');
  const profit = silver - Math.round((S.cargoPaid[good] || 0) * qty);
  removeCargo(good, qty);
  S.silver += silver;
  const e = econ()[S.port][good];
  e.p -= qty / GOODS[good].depth;
  e.sold += qty;
  let taught = false;
  if (e.sold >= TEACH_QTY && !sellsHere(S.port, good) && !isContraband(S.port, good)) {
    (S.stocked[S.port] ||= []).push(good); taught = true;
    log(`${PORTS[S.port].name} has started selling ${GOODS[good].name.toLowerCase()}.`);
  }
  S.stats.sold += silver; S.stats.profit += profit;
  S.stats.goodsSold[good] = (S.stats.goodsSold[good] || 0) + qty;
  S.stats.bestSale = Math.max(S.stats.bestSale, profit);
  gainRenownFromProfit(profit);
  if (good === 'silk' && PORTS[S.port].culture === 'norse') S.flags.silkNorth = true;
  emit('silver', S.silver); emit('cargo', S.cargo);
  return ok({silver, qty, profit, taught});
}

/** Contraband: sell every unit at once. Maybe caught: goods confiscated and a fine. */
export function sellContraband(good) {
  const why = needMarket(); if (why) return fail(why);
  if (!isContraband(S.port, good)) return fail('That is not forbidden here; sell it openly.');
  const qty = S.cargo[good] || 0;
  if (!qty) return fail('You have none.');
  // Smugglers pay near the top of the range, less as you flood them (pressure applies).
  const e = econ()[S.port][good];
  const value = Math.floor(qty * priceAt(good, 0.98 + e.p - qty / (2 * GOODS[good].depth)) * (1 + mod('sellPrice')));
  e.p -= qty / GOODS[good].depth;
  const paid = Math.round((S.cargoPaid[good] || 0) * qty);
  removeCargo(good, qty);
  S.stats.contraband += qty;
  if (rand() < CATCH_CHANCE) {
    const fine = Math.min(Math.round(S.silver), Math.max(200, Math.round(value * 0.3)));
    S.silver -= fine; S.stats.caught++;
    log(`Caught selling ${GOODS[good].name.toLowerCase()} in ${PORTS[S.port].name}: goods seized, ${fine} s fine.`);
    emit('silver', S.silver); emit('cargo', S.cargo);
    return ok({caught: true, fine, silver: 0, qty});
  }
  S.silver += value; S.stats.sold += value; S.stats.profit += value - paid;
  S.flags.smuggled = true;
  gainRenownFromProfit(value - paid);
  emit('silver', S.silver); emit('cargo', S.cargo);
  return ok({caught: false, fine: 0, silver: value, qty});
}

// ---------------------------------------------------------------- market events and rumours
const EVENT_KINDS = [
  {kind: 'famine', goods: ['grain', 'stockfish'], shift: 0.35, days: [14, 28], where: 'not-producer',
    text: (p, g) => `Hunger in ${p}: they will pay anything for ${g}.`},
  {kind: 'feast', goods: ['honey', 'wine', 'stockfish', 'silk'], shift: 0.3, days: [10, 20], where: 'any',
    text: (p, g) => `A great feast is planned in ${p}; ${g} is wanted.`},
  {kind: 'war', goods: ['iron', 'blades', 'timber'], shift: 0.3, days: [14, 30], where: 'not-producer',
    text: (p, g) => `War-talk in ${p}: ${g} prices are climbing.`},
  {kind: 'glut', goods: GOOD_IDS, shift: -0.25, days: [10, 21], where: 'producer',
    text: (p, g) => `A glut of ${g} in ${p}; it is going for a song.`},
];

function newMarketEvent() {
  const k = pick(EVENT_KINDS);
  const good = pick(k.goods.filter((g) => g !== 'hacksilver' || known(g)));
  const ports = PORT_IDS.filter((p) => {
    const prod = PORTS[p].produces.includes(good);
    return k.where === 'any' || (k.where === 'producer' ? prod : !prod);
  });
  if (!ports.length) return;
  const port = pick(ports);
  const until = S.day + randInt(k.days[0], k.days[1]);
  S.mevents.push({kind: k.kind, port, good, shift: k.shift, until});
  S.rumours.push({day: S.day, until, port, good, kind: k.kind,
    text: k.text(PORTS[port].name, GOODS[good].name.toLowerCase())});
}

/** Rumours still true (mead halls tell them). */
export function rumours() { return S.rumours.filter((r) => r.until >= S.day); }

/** A true price tip about a good you can trade: where it is cheapest or dearest now. */
export function priceTip() {
  const goods = S.unlockedGoods.filter((g) => GOODS[g]);
  const ports = S.unlockedPorts.filter((p) => p !== S.port);
  if (!goods.length || !ports.length) return null;
  const good = pick(goods);
  const cheap = rand() < 0.5;
  const list = ports.map((p) => ({p, b: buyPrice(p, good), s: sellPrice(p, good)}))
    .filter((x) => (cheap ? x.b !== null : !PORTS[x.p].contraband.includes(good)));
  if (!list.length) return null;
  list.sort((a, b) => (cheap ? a.b - b.b : b.s - a.s));
  const {p, b, s} = list[0];
  const tpl = (EXT.lore.PRICE_TIPS || []).filter((t) => typeof t === 'string');
  const name = GOODS[good].name.toLowerCase(), port = PORTS[p].name, price = cheap ? b : s;
  const text = tpl.length
    ? pick(tpl).replace(/\{good\}/g, name).replace(/\{port\}/g, port).replace(/\{price\}/g, price).replace(/\{dir\}/g, cheap ? 'cheap' : 'dear')
    : cheap ? `They say ${name} is cheap in ${port} just now, about ${price} s.` : `Word is ${port} pays ${price} s for ${name}.`;
  return {good, port: p, price, cheap, text};
}

// ---------------------------------------------------------------- time
/** Advance the markets by `days`: daily drift and pressure decay, weekly refresh + events. */
export function tick(days = 1) {
  const E = econ();
  for (let i = 0; i < days; i++) {
    S.econDay = (S.econDay || 0) + 1;
    const weekly = S.econDay % 7 === 0;
    for (const p of PORT_IDS) {
      for (const g of GOOD_IDS) {
        const e = E[p][g];
        if (weekly) e.t = (rand() - 0.5) * 0.16;
        e.n += (e.t - e.n) * 0.3 + (rand() - 0.5) * 0.02;
        e.p *= DECAY;
        if (Math.abs(e.p) < 0.001) e.p = 0;
      }
    }
    if (weekly && rand() < 0.6) newMarketEvent();
    S.mevents = S.mevents.filter((e) => e.until >= S.day);
    S.rumours = S.rumours.filter((r) => r.until >= S.day - 7);
  }
}

/** Remember this town's prices (map card, Old Sea-Chart). */
export function recordSeen(port = S.port) {
  if (!port) return;
  const prices = {}, buys = {};
  for (const g of GOOD_IDS) {
    if (!known(g)) continue;
    prices[g] = sellPrice(port, g);
    buys[g] = buyPrice(port, g);
  }
  S.seen[port] = {day: S.day, prices, buy: buys};
}

/** Prices you have seen, filtered to the last `days` days (default: the chart charm or all). */
export function seenPrices(days) {
  const lim = days ?? (mod('chart') || Infinity);
  return Object.fromEntries(Object.entries(S.seen).filter(([, v]) => S.day - v.day <= lim));
}

/** Conservative unit value of a good for net worth (independent of where you are). */
export const goodValue = (good) => Math.round(GOODS[good].min + 0.35 * (GOODS[good].max - GOODS[good].min));

/** Move a town's price as if `units` were bought (negative: sold). Used by quest purchases. */
export function nudge(port, good, units) { econ()[port][good].p += units / GOODS[good].depth; }
