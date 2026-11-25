// Craft-guild recipes. Donate silver to a town's guild to raise your standing there
// (level 1 at 1 000 s, 2 at 5 000 s, 3 at 20 000 s), then hand over goods for a crafted
// reward. gives: {goods:{}, items:[], blessings:{}, renown, repair (fraction of hull)}.
// once: an item recipe can be made once per game.

export const GUILD_LEVELS = [1000, 5000, 20000];

export const RECIPES = {
  mead_offering: {name: 'Mead for the Gods', level: 1, needs: {honey: 12, grain: 12}, gives: {blessings: {odin: 1}},
    desc: 'The brewers turn honey and barley into a mead strong enough to please Odin himself.'},
  tar_and_cloth: {name: 'Tar and Sailcloth', level: 1, needs: {wadmal: 15, timber: 10}, gives: {repair: 0.4},
    desc: 'Patched sails and fresh tar: the guild mends your fleet for the price of the stuff.'},
  salt_cod: {name: 'Salt Cod Barrels', level: 1, needs: {stockfish: 20, salt: 10}, gives: {blessings: {eir: 1}},
    desc: 'Packed provisions for a temple feast; Eir\'s priests are grateful.'},
  smith_blades: {name: 'Smithy Work', level: 2, needs: {iron: 15, timber: 5}, gives: {goods: {blades: 2}},
    desc: 'The guild smiths fold your iron into two pattern-welded blades.'},
  amber_amulet: {name: 'Amber Amulet', level: 2, needs: {amber: 8}, gives: {items: ['rune_luck']}, once: true,
    desc: 'An amber bead carved with a luck-rune.'},
  fur_gifts: {name: 'Gift Cloaks', level: 2, needs: {furs: 6, wadmal: 10}, gives: {renown: 4},
    desc: 'Fur-lined cloaks to hand out at the jarl\'s table. People remember a generous captain.'},
  ivory_game: {name: 'Ivory Game Set', level: 3, needs: {ivory: 4, amber: 2}, gives: {items: ['mead_skald']}, once: true,
    desc: 'A board game carved from tusk and amber; the skald who wins it pays you in poetry mead.'},
};
