// Blessings: bought at an altar with goods, used in battle (combat owner implements effects).
// cost {good, qty} per blessing before charm discounts; cooldown seconds in battle.

export const BLESSINGS = {
  thor: {name: 'Thor\'s Hammer', good: 'salt', qty: 20, cooldown: 30, max: 20,
    desc: 'Lightning strikes every enemy ship.'},
  eir: {name: 'Eir\'s Mending', good: 'stockfish', qty: 20, cooldown: 40, max: 20,
    desc: 'Repairs a quarter of your fleet\'s hull.'},
  njord: {name: 'Njörðr\'s Swell', good: 'grain', qty: 15, cooldown: 30, max: 20,
    desc: 'For 12 seconds your rams strike with triple force.'},
  odin: {name: 'Odin\'s Ravens', good: 'wadmal', qty: 10, cooldown: 35, max: 20,
    desc: 'For 15 seconds your bows and spears hit 60% harder.'},
  kari: {name: 'Kári\'s Gale', good: 'iron', qty: 10, cooldown: 45, max: 20,
    desc: 'A gale stuns every enemy for 5 seconds and throws them back.'},
};
export const BLESSING_IDS = Object.keys(BLESSINGS);
export const START_BLESSINGS = {thor: 2, eir: 1, njord: 0, odin: 0, kari: 0};
