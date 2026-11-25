// Enemy kinds (ids fixed by docs/CONTRACT.md). Level 1 numbers; enemyStats() scales them.
//
// ai:      rush   - closes in and rams whenever its ram is ready (raiders)
//          ranged - holds water at bow range, rams only a crippled target
//          siphon - dromon: fire-siphon cone over a lane and its neighbours
//          serpent- coils between lanes, telegraphs and bites one lane
//          kraken - grabs a ship's oars (stun + squeeze)
//          crow   - flies, dives on a ship and climbs back
//          drain  - draugr: life-draining beam heals itself
//          static - fortress piece, never moves
// flags:   fly / swim / static -> cannot be rammed by the player
// weapons: [range, dmg, reload, acc] (dmg before PACE)
// ram:     same scale as js/data/ships.js ram
// art:     ship type for drawShip, or a beast/fortress id for drawEnemy

import {PACE} from './defaults.js';

export const ENEMIES = {
  raider_faering: {
    name: 'Raider faering', art: 'faering', sail: '#2b2622', sail2: '#9b2b22', shields: ['#8e2a22', '#2b2622'],
    hull: 35, mass: 35, ram: 6, speed: 9, ai: 'rush', homeX: 0.74,
    weapons: [['short', 3, 2.0, 0.85]],
    silver: [60, 120], drops: [['stockfish', 2, 6, 0.6], ['wadmal', 1, 4, 0.4]],
  },
  raider_karvi: {
    name: 'Raider karvi', art: 'karvi', sail: '#2b2622', sail2: '#9b2b22', shields: ['#8e2a22', '#d9c59a'],
    hull: 65, mass: 80, ram: 10, speed: 8, ai: 'rush', homeX: 0.76,
    weapons: [['short', 4, 2.0, 0.85], ['long', 3, 2.4, 0.78]],
    silver: [150, 260], drops: [['wadmal', 2, 6, 0.5], ['iron', 2, 5, 0.4], ['honey', 2, 5, 0.3]],
  },
  raider_snekkja: {
    name: 'Raider snekkja', art: 'snekkja', sail: '#1d1a16', sail2: '#b8452a', shields: ['#1d1a16', '#b8452a'],
    hull: 130, mass: 140, ram: 16, speed: 10, ai: 'rush', homeX: 0.76,
    weapons: [['short', 7, 1.9, 0.86], ['long', 4, 2.2, 0.8]],
    silver: [300, 520], drops: [['iron', 3, 8, 0.5], ['furs', 2, 5, 0.4], ['blades', 1, 3, 0.25]],
  },
  raider_drakkar: {
    name: 'Raider drakkar', art: 'drakkar', sail: '#1d1a16', sail2: '#8e2a22', shields: ['#8e2a22', '#1d1a16', '#c99a2e'],
    hull: 340, mass: 380, ram: 28, speed: 8, ai: 'rush', homeX: 0.78,
    weapons: [['short', 12, 1.8, 0.86], ['long', 8, 2.0, 0.8], ['long', 8, 2.2, 0.8]],
    silver: [900, 1400], drops: [['blades', 2, 6, 0.6], ['furs', 4, 10, 0.5], ['iron', 5, 12, 0.5]],
  },
  wend_longship: {
    name: 'Wendish longship', art: 'snekkja', sail: '#efe2c4', sail2: '#2f5d6e', shields: ['#2f5d6e', '#efe2c4'],
    hull: 160, mass: 150, ram: 18, speed: 9, ai: 'ranged', homeX: 0.8,
    weapons: [['long', 6, 2.0, 0.82], ['short', 8, 2.0, 0.86]],
    silver: [380, 600], drops: [['amber', 2, 6, 0.5], ['honey', 3, 8, 0.4], ['salt', 3, 8, 0.4]],
  },
  jomsviking_skeid: {
    name: 'Jómsviking skeid', art: 'skeid', sail: '#8e2a22', sail2: '#1d1a16', shields: ['#1d1a16', '#8e2a22', '#c99a2e'],
    hull: 280, mass: 270, ram: 24, speed: 9, ai: 'rush', homeX: 0.78,
    weapons: [['short', 12, 1.8, 0.9], ['long', 6, 2.0, 0.82], ['short', 8, 2.0, 0.88]],
    silver: [700, 1100], drops: [['blades', 2, 5, 0.5], ['iron', 4, 10, 0.5], ['furs', 3, 8, 0.4]],
  },
  collector_snekkja: {
    name: 'Debt collectors', art: 'snekkja', sail: '#6d6a60', sail2: '#c99a2e', shields: ['#6d6a60', '#c99a2e'],
    hull: 140, mass: 140, ram: 14, speed: 10, ai: 'rush', homeX: 0.77,
    weapons: [['short', 7, 2.0, 0.86], ['long', 5, 2.2, 0.8]],
    silver: [150, 300], drops: [['salt', 2, 6, 0.4], ['wadmal', 2, 5, 0.3]],
  },
  byzantine_dromon: {
    name: 'Imperial dromon', art: 'dromon', sail: '#efe2c4', sail2: '#6b2a6e',
    hull: 320, mass: 340, ram: 20, speed: 6, ai: 'siphon', homeX: 0.74,
    weapons: [['long', 8, 2.0, 0.84]],
    siphon: {dmg: 13, burn: 3, burnT: 4, every: 8, warn: 1.1},
    silver: [1000, 1500], drops: [['silk', 2, 5, 0.6], ['wine', 3, 8, 0.6]],
  },
  frankish_cog: {
    name: 'Frankish cog', art: 'cog', sail: '#efe2c4', sail2: '#3b5c8e',
    hull: 230, mass: 300, ram: 12, speed: 5, ai: 'ranged', homeX: 0.82,
    weapons: [['long', 7, 2.2, 0.84], ['long', 5, 2.0, 0.8]],
    silver: [500, 800], drops: [['wine', 3, 8, 0.6], ['grain', 4, 10, 0.5], ['blades', 1, 4, 0.3]],
  },
  draugr_ship: {
    name: 'Draugr ship', art: 'draugr', sail: '#8fa39a', sail2: '#3d4a44', shields: ['#4b5a52', '#8fa39a'],
    hull: 260, mass: 280, ram: 18, speed: 7, ai: 'drain', homeX: 0.78,
    weapons: [['long', 6, 2.4, 0.8]],
    drain: {dmg: 10, every: 6},
    silver: [600, 900], drops: [['amber', 3, 8, 0.5], ['ivory', 1, 4, 0.5]],
  },
  serpent: {
    name: 'Sea serpent', art: 'serpent', fx: 'swim',
    hull: 220, mass: 260, ram: 0, speed: 11, ai: 'serpent', homeX: 0.62, swim: true,
    weapons: [],
    bite: {dmg: 22, every: 5.5, warn: 1.3},
    silver: [120, 300], drops: [['ivory', 2, 6, 0.6]],
  },
  kraken: {
    name: 'Kraken', art: 'kraken', fx: 'swim',
    hull: 260, mass: 600, ram: 0, speed: 6, ai: 'kraken', homeX: 0.64, swim: true,
    weapons: [['short', 6, 2.2, 0.9]],
    grab: {stun: 4, squeeze: 4, every: 9},
    silver: [250, 500], drops: [['amber', 2, 6, 0.5], ['ivory', 1, 3, 0.4]],
  },
  storm_crow: {
    name: 'Storm crow', art: 'crow', fly: true,
    hull: 90, mass: 40, ram: 0, speed: 12, ai: 'crow', homeX: 0.76,
    weapons: [],
    dive: {dmg: 9, every: 4.5},
    silver: [60, 140], drops: [],
  },
  fortress_tower: {
    name: 'Fortress tower', art: 'tower', static: true,
    hull: 480, mass: 9999, ram: 0, speed: 0, ai: 'static', homeX: 0.86,
    weapons: [['long', 9, 2.2, 0.82], ['long', 9, 2.6, 0.82]],
    silver: [500, 800], drops: [['iron', 4, 10, 0.5]],
  },
  fortress_gate: {
    name: 'Fortress gate', art: 'gate', static: true,
    hull: 700, mass: 9999, ram: 0, speed: 0, ai: 'static', homeX: 0.88,
    weapons: [['long', 6, 2.0, 0.82], ['short', 10, 2.2, 0.9]],
    silver: [900, 1400], drops: [['hacksilver', 5, 12, 1], ['blades', 2, 5, 0.5]],
  },
};

export const ENEMY_KINDS = Object.keys(ENEMIES);


/** Scale factors per level (level 1 = table). */
export function levelScale(level = 1) {
  const l = Math.max(1, Math.min(20, Number(level) || 1));
  return {hull: 1 + 0.15 * (l - 1), dmg: 1 + 0.1 * (l - 1), silver: 1 + 0.25 * (l - 1)};
}

/** Stats for one enemy of `kind` at `level` (unknown kinds fall back to raider_karvi). */
export function enemyStats(kind, level = 1) {
  const base = ENEMIES[kind] || ENEMIES.raider_karvi;
  const k = levelScale(level);
  return {
    ...base,
    kind: ENEMIES[kind] ? kind : 'raider_karvi',
    level: Math.max(1, Math.min(20, Number(level) || 1)),
    hull: Math.round(base.hull * k.hull),
    weapons: base.weapons.map(([range, dmg, reload, acc]) => ({range, dmg: dmg * k.dmg * PACE, reload, acc})),
    dmgScale: k.dmg,
    atkScale: k.dmg * PACE,
    silverScale: k.silver,
    canBeRammed: !(base.fly || base.swim || base.static),
  };
}
