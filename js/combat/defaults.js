// Combat tuning tables and fallbacks.
// Ship base stats come from js/data/ships.js (sim owner) when it exists; the tables
// here are the fallback used for development and by the headless tests. Weapon
// damage, reload, accuracy, blessing and talent numbers are combat-owned and live
// only here.

/** Fallback ship stats (mirrors the contract shape {hull, cargo, slots, speed, ram, price}). */
export const SHIP_FALLBACK = {
  faering: {name: 'Færing', hull: 40, cargo: 20, slots: 1, speed: 6, ram: 4, price: 1500},
  karvi: {name: 'Karvi', hull: 80, cargo: 45, slots: 2, speed: 7, ram: 8, price: 5000},
  knarr: {name: 'Knarr', hull: 110, cargo: 90, slots: 2, speed: 5, ram: 6, price: 9000},
  byrding: {name: 'Byrðingr', hull: 140, cargo: 130, slots: 3, speed: 5, ram: 8, price: 16000},
  snekkja: {name: 'Snekkja', hull: 150, cargo: 60, slots: 4, speed: 9, ram: 16, price: 22000},
  busse: {name: 'Búza', hull: 260, cargo: 200, slots: 5, speed: 6, ram: 14, price: 45000},
  skeid: {name: 'Skeið', hull: 320, cargo: 140, slots: 7, speed: 8, ram: 22, price: 70000},
  drakkar: {name: 'Drekkar', hull: 450, cargo: 180, slots: 9, speed: 8, ram: 30, price: 120000},
};

/** Global battle pace: every weapon and beast attack's damage is multiplied by this
 *  (rams, blessings, special ammo and talents are not), so fights last 20-70 s. */
export const PACE = 0.6;

export const SHIP_TYPES = Object.keys(SHIP_FALLBACK);

/** Combat stats per armament (fallback for js/data/ships.js ARMS; dmg before PACE).
 *  range: 'short' = same/adjacent lane or close; 'long' = any target. acc is combat-only. */
export const ARM_COMBAT = {
  spearmen: {name: 'Spearmen', range: 'short', dmg: 6, reload: 2.0, acc: 0.9},
  huscarls: {name: 'Huscarls', range: 'short', dmg: 11, reload: 2.0, acc: 0.92},
  archers: {name: 'Archers', range: 'long', dmg: 4, reload: 2.5, acc: 0.82},
  marksmen: {name: 'Marksmen', range: 'long', dmg: 8, reload: 2.5, acc: 0.86},
};
/** Every ship's own crew throws axes and stones at close quarters, armed or not. */
export const CREW_WEAPON = {name: 'Crew', range: 'short', dmg: 2, reload: 2.5, acc: 0.9};

/** Special ammo (fallback for js/data/ships.js AMMO). The stock is fleet-wide: each press
 *  spends one round, fired by a selected ship that carries it. burn = damage/s for burnT s. */
export const AMMO = {
  harpoon: {name: 'Harpoons', kind: 'heavy', target: 'one', dmg: 30, cooldown: 1.5},
  firearrows: {name: 'Fire Arrows', kind: 'light', target: 'all', dmg: 6, burn: 2, burnT: 4, cooldown: 1.5},
  greekfire: {name: 'Greek Fire', kind: 'heavy', target: 'all', dmg: 25, burn: 4, burnT: 5, cooldown: 2},
};
export const AMMO_IDS = Object.keys(AMMO);

/** Blessing effects in battle. cooldown is the fallback; js/data/blessings.js wins. */
export const BLESSING_COMBAT = {
  thor: {name: "Thor's Hammer", cooldown: 30, dmg: 30, pct: 0.10},
  eir: {name: "Eir's Mending", cooldown: 40, heal: 0.25},
  njord: {name: "Njörðr's Swell", cooldown: 30, dur: 12, ramMult: 3},
  odin: {name: "Odin's Ravens", cooldown: 35, dur: 15, rangedMult: 1.6},
  kari: {name: "Kári's Gale", cooldown: 45, dur: 5, push: 0.08},
};
export const BLESSING_IDS = ['thor', 'eir', 'njord', 'odin', 'kari'];

/** Hero talents. need = damage dealt to fill the bar. */
export const TALENTS = {
  shieldwall: {name: 'Shield Wall', desc: 'Fleet takes 50% less damage for 10 s.', dur: 10},
  berserk: {name: 'Berserk', desc: 'Fleet deals triple damage for 6 s.', dur: 6},
  seidr: {name: 'Seiðr', desc: 'Enemies miss 70% of shots for 8 s.', dur: 8},
  mockery: {name: 'Mockery', desc: 'Enemies reload twice as slowly for 10 s.', dur: 10},
  seaking: {name: 'Sea-King', desc: 'Every ship fires a free volley at every enemy.'},
  trollgrip: {name: 'Troll-Grip', desc: 'Crushes half of one enemy ship\'s hull.'},
};
/** Base damage to fill the talent bar; the engine adds 0.35 x the fleet's total max hull. */
export const TALENT_NEED = 40;

/** Fallback hero -> talent id (story owner's heroes.js wins when present). */
export const HERO_TALENT = {
  ylva: 'shieldwall', bjarki: 'berserk', saeunn: 'seidr', hrafn: 'mockery',
  ketill: 'seaking', grima: 'trollgrip', custom: 'shieldwall',
};

/** Weather: accuracy penalty for long and short shots, and fog/visibility level for the renderer. */
export const WEATHER = {
  clear: {long: 0, short: 0, vis: 1},
  rain: {long: 0.12, short: 0.05, vis: 0.85},
  fog: {long: 0.25, short: 0.06, vis: 0.6},
  storm: {long: 0.15, short: 0.08, vis: 0.8},
};

/** Fallback blessing counts if the state has none. */
export const BLESSINGS_FALLBACK = {thor: 0, eir: 0, njord: 0, odin: 0, kari: 0};

/**
 * Item multipliers for battle. With `mod` (js/sim/charms.js mod: additive fractions over
 * every carried item, quest items included) those numbers are used; otherwise the
 * contract's charm list is read straight from `items`.
 */
export function itemMods(items = [], mod = null) {
  const has = (id) => items.includes(id);
  const m = mod || ((key) => {
    const T = {
      hull: (has('rune_hull') ? 0.2 : 0) + (has('rune_cursed_iron') ? 0.25 : 0), cargo: has('rune_hold') ? 0.1 : 0,
      reload: has('rune_reload') ? 0.3 : 0, ram: has('rune_ram') ? 0.5 : 0, loot: has('rune_luck') ? 0.35 : 0,
      talent: has('mead_skald') ? 0.3 : 0, speed: (has('rune_speed') ? 0.1 : 0) - (has('rune_cursed_iron') ? 0.15 : 0),
      flee: has('horn_sea') ? 1 : 0,
    };
    return T[key] || 0;
  });
  const v = (k) => { const x = Number(m(k)); return Number.isFinite(x) ? x : 0; };
  return {
    hull: 1 + v('hull'),
    cargo: 1 + v('cargo'),
    reload: 1 / (1 + Math.max(0, v('reload'))), // multiplier on reload time (+30% -> x0.77)
    ram: 1 + v('ram'),
    loot: 1 + v('loot'),
    talent: 1 + v('talent'),
    speed: 1 + v('speed'),
    horn: v('flee') > 0,
  };
}
