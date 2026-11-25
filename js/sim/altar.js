// Altar: sacrifice goods from the hold for blessings (used in battle).

import {S, ok, fail, here, emit} from '../state.js';
import {BLESSINGS} from '../data/blessings.js';
import {mod} from './charms.js';
import {onSacrifice} from './quests.js';

/** Cost of one blessing, after the Altar-Rune. */
export function blessingCost(b) {
  const B = BLESSINGS[b];
  return B ? {good: B.good, qty: Math.max(1, Math.ceil(B.qty * (1 + mod('altar'))))} : null;
}
/** Most of blessing b you can buy here now (goods in the hold, cap per blessing). */
export function maxBlessing(b) {
  if (!here('altar') || !BLESSINGS[b]) return 0;
  const c = blessingCost(b);
  return Math.max(0, Math.min(Math.floor((S.cargo[c.good] || 0) / c.qty), BLESSINGS[b].max - (S.blessings[b] || 0)));
}
export function buyBlessing(b, qty = 1) {
  qty = Math.floor(qty);
  if (!here('altar')) return fail('No altar here.');
  if (!BLESSINGS[b]) return fail('No such blessing.');
  if (!(qty > 0)) return fail('Choose an amount.');
  if (qty > maxBlessing(b)) {
    return fail((S.blessings[b] || 0) >= BLESSINGS[b].max ? 'The gods think you have plenty.' : `Not enough ${blessingCost(b).good} in the hold.`);
  }
  const c = blessingCost(b);
  S.cargo[c.good] -= c.qty * qty;
  if (!S.cargo[c.good]) { delete S.cargo[c.good]; delete S.cargoPaid[c.good]; }
  S.blessings[b] = (S.blessings[b] || 0) + qty;
  S.stats.blessings += qty;
  S.flags.lastOffering = S.day; // keeps the gods content (see voyage.js godsAngry)
  emit('cargo', S.cargo); emit('fleet', S.fleet);
  return ok({spent: {[c.good]: c.qty * qty}, have: S.blessings[b], quest: onSacrifice(b, qty, S.port)});
}
