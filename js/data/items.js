// Rune-charms and other magic items. mods are additive fractions read by charms.mod(key):
//   cargo +0.10 = +10% cargo; reload 0.30 = reload 30% faster; hull, speed, ram, loot,
//   sellPrice likewise; altar -0.10 = blessings 10% cheaper; raidChance 1.0 = raiders
//   twice as often; talent 0.30 = talent bar 30% faster; storm 1 = storms avoided;
//   winterVoyage -0.15 = voyages 15% shorter in winter; flee 1 = horn once per battle;
//   chart 30 = shows prices seen within 30 days.
// price: silver at a runecarver (sold back for half). questOnly: never in a shop.
// cursed: selling it costs half its price (the carver charges to lift the curse).
// where: optional list of cultures whose carvers stock it (default: everywhere).

export const ITEMS = {
  rune_hold: {name: 'Hold-Rune', price: 6000, mods: {cargo: 0.10},
    desc: 'Carved on the keelson: the hold swallows a tenth more than it should.'},
  rune_reload: {name: 'Quick-Hand Rune', price: 7000, mods: {reload: 0.30},
    desc: 'Your crews nock and throw 30% faster.'},
  rune_hull: {name: 'Oak-Heart Rune', price: 8000, mods: {hull: 0.20},
    desc: 'Planks hold together out of sheer stubbornness: +20% hull.'},
  rune_storm: {name: 'Storm-Ward', price: 9000, mods: {storm: 1},
    desc: 'Storms see this rune and go and bother someone else.'},
  rune_altar: {name: 'Altar-Rune', price: 4000, mods: {altar: -0.10},
    desc: 'The gods give you a regular-customer price: blessings cost 10% less.'},
  rune_luck: {name: 'Luck-Rune', price: 5000, mods: {loot: 0.35},
    desc: 'Beaten raiders drop a little more than they meant to.'},
  rune_speed: {name: 'Wind-Rune', price: 7500, mods: {speed: 0.10},
    desc: 'A small private breeze follows your sails: +10% speed.'},
  rune_ram: {name: 'Ram-Rune', price: 6500, mods: {ram: 0.50},
    desc: 'Carved on the prow: rams strike half again as hard.'},
  rune_cursed_greed: {name: 'Greed-Rune', price: 5000, cursed: true, mods: {sellPrice: 0.15, raidChance: 1.0},
    desc: 'Buyers pay 15% more. Raiders can smell it, and come twice as often.'},
  rune_cursed_iron: {name: 'Iron-Curse', price: 4500, cursed: true, mods: {hull: 0.25, speed: -0.15},
    desc: 'Hulls grow tough as anvils, and about as fast: +25% hull, -15% speed.'},
  horn_sea: {name: 'Sea-Horn', price: 5500, mods: {flee: 1},
    desc: 'Once per battle, a blast that may send enemies running.', where: ['norse', 'island', 'svear']},
  mead_skald: {name: 'Skald\'s Mead', price: 4000, mods: {talent: 0.30},
    desc: 'A horn of poetry mead: your talent bar fills 30% faster.'},
  chart_old: {name: 'Old Sea-Chart', price: 3500, mods: {chart: 30},
    desc: 'A sealskin chart that remembers every price you saw this month.'},
  compass_sun: {name: 'Sunstone', price: 6000, mods: {winterVoyage: -0.15},
    desc: 'Finds the sun behind fog: voyages 15% shorter in fog and winter.', where: ['island', 'norse']},
};
export const ITEM_IDS = Object.keys(ITEMS);
export const CHARMS_PER_SHOP = 3;
