// Ships, armaments and special ammunition.
//
// Ships: hull (max hit points), cargo (units of goods), slots (armaments it can carry;
// each armament also takes 5 cargo), speed (sailing speed; the fleet sails at its slowest
// ship), ram (ram damage), price (silver at a shipyard), tier (when shipyards start to
// offer it: 1 always, 2 at renown 20, 3 at 60, 4 at 120).

export const SHIPS = {
  faering: {name: 'Færing', hull: 40, cargo: 20, slots: 1, speed: 6, ram: 4, price: 1500, tier: 1,
    desc: 'Four oars and a hopeful sail. Quick to buy, quick to leave.'},
  karvi: {name: 'Karvi', hull: 80, cargo: 45, slots: 2, speed: 7, ram: 8, price: 5000, tier: 1,
    desc: 'A sturdy coastal boat; a chieftain\'s errand-runner.'},
  knarr: {name: 'Knarr', hull: 110, cargo: 90, slots: 2, speed: 5, ram: 6, price: 9000, tier: 1,
    desc: 'Broad-bellied ocean trader. Slow, patient, and full of cargo.'},
  byrding: {name: 'Byrðingr', hull: 140, cargo: 130, slots: 3, speed: 5, ram: 8, price: 16000, tier: 2,
    desc: 'A coaster built for burden. Sails like a barn, carries like one too.'},
  snekkja: {name: 'Snekkja', hull: 150, cargo: 60, slots: 4, speed: 9, ram: 16, price: 22000, tier: 2,
    desc: 'A lean warship that cuts the water like a knife through skyr.'},
  busse: {name: 'Búza', hull: 260, cargo: 200, slots: 5, speed: 6, ram: 14, price: 45000, tier: 3,
    desc: 'A great merchant-warship with a deep hold and high sides.'},
  skeid: {name: 'Skeið', hull: 320, cargo: 140, slots: 7, speed: 8, ram: 22, price: 70000, tier: 3,
    desc: 'A long fighting ship, thirty benches of oars and as many opinions.'},
  drakkar: {name: 'Drekkar', hull: 450, cargo: 180, slots: 9, speed: 8, ram: 30, price: 120000, tier: 4,
    desc: 'The dragon ship. Harbours go quiet when its head comes round the point.'},
};

export const SHIP_IDS = Object.keys(SHIPS);
export const MAX_FLEET = 4;
export const ARM_CARGO = 5; // cargo units each armament occupies

// Armaments (crews). range short|long, dmg per shot, reload seconds, price silver.
export const ARMS = {
  spearmen: {name: 'Spearmen', range: 'short', grade: 'standard', dmg: 6, reload: 2.0, price: 400,
    desc: 'Farm lads with spears and shields. Best when the hulls touch.'},
  huscarls: {name: 'Húskarlar', range: 'short', grade: 'premium', dmg: 11, reload: 2.0, price: 1200,
    desc: 'Sworn household warriors in mail. They do not like being asked twice.'},
  archers: {name: 'Archers', range: 'long', grade: 'standard', dmg: 4, reload: 2.5, price: 600,
    desc: 'Hunters with yew bows. They hit what they see, mostly.'},
  marksmen: {name: 'Marksmen', range: 'long', grade: 'premium', dmg: 8, reload: 2.5, price: 1800,
    desc: 'Finnish bowmen who can split a gull feather at a hundred paces.'},
};
export const ARM_IDS = Object.keys(ARMS);
export const ARM_RESALE = 0.75; // fraction refunded when an armament is removed or its ship sold

// Special ammunition (a fleet-wide stock, kept on the lead ship).
// kind heavy|light, target one|all, dmg per hit, price per shot, onlyAt port id or null.
export const AMMO = {
  harpoon: {name: 'Harpoons', kind: 'heavy', target: 'one', dmg: 30, price: 60, onlyAt: null,
    desc: 'Whaling irons on ropes. One target, very sorry.'},
  firearrows: {name: 'Fire Arrows', kind: 'light', target: 'all', dmg: 6, price: 40, onlyAt: null,
    desc: 'Tarred arrows that set every enemy sail smoking.'},
  greekfire: {name: 'Greek Fire', kind: 'heavy', target: 'all', dmg: 25, price: 250, onlyAt: 'miklagard',
    desc: 'The Emperor\'s secret: fire that burns on water. Sold only in the Great City, with a frown.'},
};
export const AMMO_IDS = Object.keys(AMMO);

export const SHIP_RESALE = 0.6;   // ship resale = price * 0.6 * hull fraction (+ arms resale)
export const REPAIR_PER_HP = 3;   // silver per hull point at a shipyard
