// Rune-charms: the runecarver's shop and the modifiers every other module reads.

import {S, ok, fail, here, hash, emit, log} from '../state.js';
import {ITEMS, CHARMS_PER_SHOP} from '../data/items.js';
import {PORTS} from '../data/ports.js';
import {week} from './time.js';
import {EXT} from './ext.js';
import {clampHulls} from './fleet.js';

/**
 * Sum of a modifier over everything carried. Keys: cargo, reload, hull, speed, ram, loot,
 * altar, sellPrice, raidChance, talent, storm, winterVoyage, flee, chart.
 * Values are additive fractions: multiply by (1 + mod(key)). storm/flee are 0 or 1.
 * Quest items may carry mods too ({id, name, desc, mods}).
 */
export function mod(key) {
  let v = 0;
  for (const id of S.items || []) {
    const it = ITEMS[id] || EXT.questItems[id];
    if (it && it.mods && it.mods[key]) v = key === 'chart' ? Math.max(v, it.mods[key]) : v + it.mods[key];
  }
  return v;
}

export const itemInfo = (id) => {
  const it = ITEMS[id] || EXT.questItems[id];
  return it ? {id, name: it.name, desc: it.desc, cursed: !!it.cursed, quest: !ITEMS[id]} : {id, name: id, desc: '', quest: true};
};

/** This week's charms at a port's runecarver (the same all week, not owned ones). */
export function shop(port = S.port) {
  if (!port || !PORTS[port].buildings.includes('runecarver')) return [];
  const culture = PORTS[port].culture, w = week(S.day);
  return Object.entries(ITEMS)
    .filter(([id, it]) => !it.questOnly && (!it.where || it.where.includes(culture)) && !S.items.includes(id))
    .map(([id, it]) => ({id, it, r: hash(`${port}|${w}|${id}`)}))
    .sort((a, b) => a.r - b.r)
    .slice(0, CHARMS_PER_SHOP)
    .map(({id, it}) => ({id, name: it.name, desc: it.desc, cursed: !!it.cursed,
      price: Math.round((it.price * (0.9 + 0.2 * hash(`${port}|${id}`))) / 50) * 50}));
}

export function buyCharm(id) {
  if (!here('runecarver')) return fail('No runecarver here.');
  const offer = shop().find((c) => c.id === id);
  if (!offer) return fail('Not for sale here.');
  if (S.silver < offer.price) return fail('Not enough silver.');
  S.silver -= offer.price;
  S.items.push(id);
  S.stats.charms++;
  log(`Bought ${offer.name}.`);
  emit('silver', S.silver); emit('fleet', S.fleet);
  return ok({price: offer.price});
}

/** Sell a charm back for half its price. A cursed charm costs half its price to be rid of. */
export function sellCharm(id) {
  if (!here('runecarver')) return fail('No runecarver here.');
  const it = ITEMS[id];
  if (!it || !S.items.includes(id)) return fail('You have no such charm.');
  const amount = Math.round(it.price / 2);
  if (it.cursed && S.silver < amount) return fail(`Lifting the curse costs ${amount} s.`);
  S.silver += it.cursed ? -amount : amount;
  S.items.splice(S.items.indexOf(id), 1);
  clampHulls();
  emit('silver', S.silver); emit('fleet', S.fleet);
  return ok({silver: it.cursed ? -amount : amount});
}
