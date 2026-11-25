// Feats (achievements). Kept per profile, shared by every hero in it; also mirrored in
// S.feats for the running game. lore.js FEATS (story owner) may override name/desc by id.

import {S, emit, log, on, updateProfile, profileFeats} from '../state.js';
import {date} from './time.js';
import {BLESSING_IDS} from '../data/blessings.js';
import {ITEMS} from '../data/items.js';
import {RANKS} from '../data/ranks.js';
import {netWorth} from './fleet.js';
import {EXT} from './ext.js';

const st = () => S.stats;
const bankSum = () => Object.values(S.bank).reduce((a, b) => a + b, 0);

export const FEATS = [
  ['first_coin', 'First Coin', 'Sell goods for the first time.', () => st().sold > 0],
  ['fat_purse', 'Fat Purse', 'Make 10 000 s of trading profit.', () => st().profit >= 10000],
  ['silver_river', 'Silver River', 'Make 100 000 s of trading profit.', () => st().profit >= 100000],
  ['one_good_day', 'One Good Day', 'Make 10 000 s profit in a single sale.', () => st().bestSale >= 10000],
  ['well_heeled', 'Well-Heeled', 'Reach a net worth of 50 000 s.', () => netWorth() >= 50000],
  ['hoard_keeper', 'Hoard-Keeper', 'Reach a net worth of 250 000 s.', () => netWorth() >= 250000],
  ['dragons_bed', 'Dragon\'s Bed', 'Reach a net worth of 1 000 000 s.', () => netWorth() >= 1000000],
  ['four_prows', 'Four Prows', 'Command a fleet of four ships.', () => S.fleet.length >= 4],
  ['dragon_rider', 'Dragon Rider', 'Own a drekkar.', () => S.fleet.some((f) => f.type === 'drakkar')],
  ['wide_wake', 'Wide Wake', 'Drop anchor in 10 different ports.', () => st().visited.length >= 10],
  ['every_harbour', 'Every Harbour Knows Your Sail', 'Visit all twenty ports.', () => st().visited.length >= 20],
  ['golden_gate', 'Under the Golden Gate', 'Reach Miklagarðr.', () => st().visited.includes('miklagard')],
  ['smoke_bay', 'Smoke Bay', 'Make the long crossing to Ísland.', () => st().visited.includes('island')],
  ['midnight_sun', 'Midnight Sun', 'Be in Hálogaland in summer.', () => S.port === 'halogaland' && [5, 6, 7].includes(month())],
  ['blooded', 'Blooded', 'Win your first battle.', () => st().battlesWon >= 1],
  ['terror', 'Terror of the Whale Road', 'Win 25 battles.', () => st().battlesWon >= 25],
  ['storm_tossed', 'Storm-Tossed', 'Ride out 10 storms.', () => st().storms >= 10],
  ['quiet_cargo', 'Quiet Cargo', 'Sell contraband and get away with it.', () => !!S.flags.smuggled],
  ['red_handed', 'Red-Handed', 'Get caught smuggling. It happens to the best.', () => st().caught > 0],
  ['clean_slate', 'Clean Slate', 'Pay off every last silver you owe.', () => !!S.flags.debtRepaid],
  ['interest', 'Silver That Breeds', 'Keep 20 000 s in banks.', () => bankSum() >= 20000],
  ['favoured', 'Favoured of the Gods', 'Buy 10 blessings at altars.', () => st().blessings >= 10],
  ['pantheon', 'Whole Pantheon', 'Carry at least one of every blessing.', () => BLESSING_IDS.every((b) => (S.blessings[b] || 0) > 0)],
  ['rune_hung', 'Rune-Hung', 'Carry three rune-charms.', () => S.items.filter((i) => ITEMS[i] && !ITEMS[i].cursed).length >= 3],
  ['read_the_runes', 'Should Have Read the Runes', 'Carry a cursed charm.', () => S.items.some((i) => ITEMS[i] && ITEMS[i].cursed)],
  ['walls_fall', 'The Walls Fall', 'Free Jómsborg from its raiders.', () => !!S.flags.jomsborg_free],
  ['silk_north', 'Silk in the Snow', 'Sell silk in a Norse harbour.', () => !!S.flags.silkNorth],
  ['tusk_trader', 'Tusk Trader', 'Sell 100 walrus tusks.', () => (st().goodsSold.ivory || 0) >= 100],
  ['many_errands', 'Many Errands', 'Finish 10 tasks.', () => S.quests.done.length >= 10],
  ['saga_told', 'A Saga Told', 'Finish a hero\'s saga.', () => !!S.flags.sagaComplete],
  ['year_at_sea', 'A Year and a Day', 'Survive a year and a day.', () => S.day >= 367],
  ['sea_king', 'Sea-King', 'Reach the highest rank.', () => S.renown >= RANKS[RANKS.length - 1].at],
];

const month = () => date(S.day).month;

function loreText(id) {
  const L = EXT.lore.FEATS;
  if (!L) return null;
  return Array.isArray(L) ? L.find((f) => f && f.id === id) : L[id];
}

/** Award any newly earned feats. Returns [{id, name, desc}] of the new ones. */
export function check() {
  if (!S.fleet || !S.fleet.length) return [];
  const have = new Set([...S.feats, ...profileFeats()]);
  const got = [];
  for (const [id, name, desc, test] of FEATS) {
    let pass = false;
    try { pass = test(); } catch (e) { pass = false; }
    if (!pass) continue;
    if (!S.feats.includes(id)) S.feats.push(id);
    if (have.has(id)) continue;
    const t = loreText(id) || {};
    got.push({id, name: t.name || name, desc: t.desc || desc});
  }
  if (got.length) {
    updateProfile((p) => { p.feats = [...new Set([...(p.feats || []), ...got.map((f) => f.id)])]; });
    for (const f of got) { log(`Feat: ${f.name}!`); emit('feat', f); }
  }
  return got;
}

/** All feats with whether this profile has them. */
export function list() {
  const have = new Set([...S.feats, ...profileFeats()]);
  return FEATS.map(([id, name, desc]) => { const t = loreText(id) || {}; return {id, name: t.name || name, desc: t.desc || desc, got: have.has(id)}; });
}

// Check feats whenever something that could earn one changes.
for (const e of ['silver', 'fleet', 'quest', 'port']) on(e, () => { check(); });
