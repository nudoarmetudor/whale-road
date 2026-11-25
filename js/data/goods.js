// Goods: the 14 trade goods of Whale Road.
//
// min/max   the market price range in silver. Every quoted market price stays inside it.
// depth     market depth: how many units it takes to push a town's price across the whole
//           range. Cheap bulk goods are deep, luxuries are shallow, so a big fleet dumping
//           silk in one town ruins its own price (the anti-exploit brake).
// season    price-level offsets [spring, summer, autumn, winter], added to the 0..1 level.
//           Stockfish is dear in Lent and winter, grain cheap after harvest, wine cheap
//           when the new vintage arrives in autumn, furs dear when the cold comes.
// tier      saga unlock tier: 1 open from the start, 2-4 unlocked by the story,
//           5 = hacksilver, only after a raider fortress falls.

export const GOODS = {
  stockfish: {name: 'Stockfish', min: 8, max: 42, depth: 3000, season: [0.10, -0.08, -0.05, 0.06], tier: 1,
    desc: 'Cod dried hard on northern racks. Keeps for years, tastes like a boot, feeds everyone.'},
  salt: {name: 'Salt', min: 6, max: 32, depth: 3000, season: [0, -0.05, 0.12, 0], tier: 1,
    desc: 'Grey sea salt from the southern pans. Every autumn slaughter needs it.'},
  grain: {name: 'Grain', min: 6, max: 34, depth: 3200, season: [0.10, 0.02, -0.15, 0.08], tier: 1,
    desc: 'Barley and rye by the sack. Cheap where the fields are wide, precious where they are not.'},
  timber: {name: 'Timber', min: 10, max: 48, depth: 2400, season: [-0.04, -0.08, 0.02, 0.10], tier: 1,
    desc: 'Pine and oak, trimmed for keels and halls. Treeless islands pay well for it.'},
  wadmal: {name: 'Wadmal', min: 14, max: 58, depth: 2000, season: [-0.05, -0.08, 0.05, 0.10], tier: 1,
    desc: 'Coarse homespun wool cloth, so standard that islanders count debts in ells of it.'},
  honey: {name: 'Honey', min: 18, max: 76, depth: 1800, season: [0.05, 0, -0.10, 0.06], tier: 1,
    desc: 'Forest honey in sealed crocks. Where there is honey, there will soon be mead.'},
  iron: {name: 'Iron', min: 26, max: 104, depth: 1600, season: [0.08, 0.04, -0.04, -0.06], tier: 1,
    desc: 'Bog-iron blooms from Svealand. Nails, axes, rivets: no ship without it.'},
  furs: {name: 'Furs', min: 50, max: 240, depth: 1400, season: [-0.05, -0.12, 0.05, 0.14], tier: 2,
    desc: 'Sable, marten and beaver from the northern forests. Southern lords wear them in summer to show off.'},
  amber: {name: 'Amber', min: 60, max: 260, depth: 1200, season: [0, 0.05, 0, -0.04], tier: 2,
    desc: 'Sea-gold from the Aesti shore. Warm to the touch, light as a promise.'},
  wine: {name: 'Wine', min: 45, max: 190, depth: 1300, season: [-0.04, 0.06, -0.08, 0.08], tier: 3,
    desc: 'Rhenish and Frankish wine in casks. Cheapest when the new vintage rolls in.'},
  ivory: {name: 'Walrus Ivory', min: 110, max: 440, depth: 900, season: [0, 0, 0.04, -0.02], tier: 3,
    desc: 'Tusks from the far north. Carvers in the south turn them into chess kings and saints.'},
  blades: {name: 'Sword Blades', min: 140, max: 480, depth: 840, season: [0.08, 0.05, -0.04, -0.06], tier: 3,
    desc: 'Frankish pattern-welded blades. The Franks forbid their sale abroad, which only raises the price.'},
  silk: {name: 'Silk', min: 220, max: 820, depth: 800, season: [0, 0.04, 0, 0.06], tier: 4,
    desc: 'Purple and gold silk from the Emperor\'s workshops. One bolt buys a farm up north.'},
  hacksilver: {name: 'Hacksilver', min: 260, max: 900, depth: 700, season: [0, 0, 0, 0], tier: 5,
    desc: 'Chopped arm-rings, coins and brooches, traded by weight. Raider hoards are full of it.'},
};

export const GOOD_IDS = Object.keys(GOODS);
