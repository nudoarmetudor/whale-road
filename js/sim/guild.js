// Craft guild: donate for standing, then craft recipes (FEATURES: "donate, then combination
// tasks that give a free crafted good/item"). Standing is per town.

import {S, ok, fail, here, emit, log} from '../state.js';
import {RECIPES, GUILD_LEVELS} from '../data/recipes.js';
import {maxHull} from './fleet.js';

const standing = (port) => ((S.flags.guild || {})[port] || 0);
export const guildLevel = (port = S.port) => GUILD_LEVELS.filter((x) => standing(port) >= x).length;

/** {port, has, donated, level, next, recipes:[{id, name, desc, needs, gives, level, can, why}]} */
export function guildHere() {
  const port = S.port, lvl = guildLevel(port);
  const recipes = Object.entries(RECIPES).map(([id, r]) => {
    const why = !here('guild') ? 'No guild here.' : lvl < r.level ? `Needs guild standing ${r.level}.`
      : r.once && (S.flags.crafted || []).includes(id) ? 'Already made.'
      : Object.entries(r.needs).find(([g, n]) => (S.cargo[g] || 0) < n) ? 'Missing goods.' : null;
    return {id, name: r.name, desc: r.desc, needs: r.needs, gives: r.gives, level: r.level, can: !why, why};
  });
  return {port, has: here('guild'), donated: standing(port), level: lvl, next: GUILD_LEVELS[lvl] || null, recipes};
}

/** Donate silver to this town's guild (+1 renown per 1 000 s). */
export function guildDonate(n) {
  n = Math.floor(n);
  if (!here('guild')) return fail('No guild here.');
  if (!(n > 0)) return fail('Choose an amount.');
  if (n > S.silver) return fail('You do not carry that much.');
  const g = (S.flags.guild ||= {});
  const before = Math.floor((g[S.port] || 0) / 1000);
  g[S.port] = (g[S.port] || 0) + n;
  S.silver -= n;
  S.renown += Math.floor(g[S.port] / 1000) - before;
  emit('silver', S.silver);
  return ok({donated: g[S.port], level: guildLevel()});
}

export function craft(id) {
  const r = RECIPES[id], row = guildHere().recipes.find((x) => x.id === id);
  if (!r) return fail('No such recipe.');
  if (!row.can) return fail(row.why);
  for (const [g, n] of Object.entries(r.needs)) { S.cargo[g] -= n; if (!S.cargo[g]) { delete S.cargo[g]; delete S.cargoPaid[g]; } }
  const gv = r.gives;
  for (const [g, n] of Object.entries(gv.goods || {})) S.cargo[g] = (S.cargo[g] || 0) + n;
  for (const it of gv.items || []) if (!S.items.includes(it)) S.items.push(it);
  for (const [b, n] of Object.entries(gv.blessings || {})) S.blessings[b] = (S.blessings[b] || 0) + n;
  if (gv.renown) S.renown += gv.renown;
  if (gv.repair) S.fleet.forEach((f, i) => { f.hull = Math.min(maxHull(i), f.hull + Math.round(maxHull(i) * gv.repair)); });
  if (r.once) (S.flags.crafted ||= []).push(id);
  log(`The guild made ${r.name}.`);
  emit('cargo', S.cargo); emit('fleet', S.fleet);
  return ok({gives: gv});
}

/** Alias used by the UI. */
export const donate = guildDonate;
