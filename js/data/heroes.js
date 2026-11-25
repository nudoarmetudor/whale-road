// Heroes of Whale Road (story owner). See docs/STORY.md.
// Fields per CONTRACT.md, plus two additive fields the sim's newGame() should read in Saga mode:
//   startPorts: ports open at the start of this hero's saga (Free Trade opens everything)
//   startGoods: goods tradeable at the start of this hero's saga

export const ALL_PORTS = ['ravnfjord', 'kaupang', 'hladir', 'halogaland', 'faereyjar', 'island',
  'orkney', 'dyflin', 'jorvik', 'hamwic', 'rudaborg', 'heidaby', 'jomsborg', 'truso', 'gotland',
  'birka', 'aldeigja', 'holmgard', 'kaenugard', 'miklagard'];

export const ALL_GOODS = ['stockfish', 'salt', 'grain', 'timber', 'wadmal', 'honey', 'iron', 'furs',
  'amber', 'wine', 'ivory', 'blades', 'silk', 'hacksilver'];

// Every saga starts with the six everyday goods; the rest unlock through the chapters.
export const SAGA_START_GOODS = ['stockfish', 'salt', 'grain', 'timber', 'wadmal', 'honey'];

export const HEROES = [
  {
    id: 'ylva', name: 'Ylva', epithet: 'Steadyhand',
    bio: 'A fisherman\'s widow from Ravnfjord with a sharp eye for a crooked scale. Her husband Orm left her a sturdy knarr, a goat that hates her, and a debt to the moneylender. She means to pay it, and then never owe anyone again.',
    talent: {id: 'shieldwall', name: 'Shield Wall', desc: 'Your fleet locks shields: it takes 50% less damage for 10 seconds.'},
    startPort: 'ravnfjord', startShip: 'knarr', startSilver: 1200, startDebt: 3000, portrait: 'ylva',
    startPorts: ['ravnfjord', 'kaupang', 'hladir', 'heidaby'], startGoods: SAGA_START_GOODS,
  },
  {
    id: 'bjarki', name: 'Bjarki', epithet: 'Bear-Shoulder',
    bio: 'A huge, gentle Dane from Heiðabýr who joined the Jómsvikings for the adventure and quit when they started paying in cold grey silver and loading the dice. He cannot count past twenty without taking his boots off, but he never forgets a friend.',
    talent: {id: 'berserk', name: 'Bear Rage', desc: 'Your crews roar like bears: fleet damage x3 for 6 seconds.'},
    startPort: 'heidaby', startShip: 'karvi', startSilver: 1200, startDebt: 0, portrait: 'bjarki',
    startPorts: ['heidaby', 'kaupang', 'birka', 'gotland'], startGoods: SAGA_START_GOODS,
  },
  {
    id: 'saeunn', name: 'Sæunn', epithet: 'Mist-Eye',
    bio: 'A young völva from Hlaðir, apprenticed to a seeress who drinks too much tea. Sæunn dreams what the sea dreams, and lately it dreams of grey ships rowed by the drowned. Someone has tangled Rán\'s net, and Sæunn means to mend it.',
    talent: {id: 'seidr', name: 'Seiðr Mist', desc: 'A spell of mist: enemies miss 70% of their shots for 8 seconds.'},
    startPort: 'hladir', startShip: 'karvi', startSilver: 1500, startDebt: 0, portrait: 'saeunn',
    startPorts: ['hladir', 'ravnfjord', 'kaupang', 'halogaland'], startGoods: SAGA_START_GOODS,
  },
  {
    id: 'hrafn', name: 'Hrafn', epithet: 'Half-Rhyme',
    bio: 'A skald from Jórvík famous for never finishing a verse. Kings love his openings and hate his endings. He owes the moneylender for a harp and three feasts, and he is sure the greatest saga of the age is out there, waiting for its last line.',
    talent: {id: 'mockery', name: 'Cutting Verse', desc: 'A verse so rude the enemy fumbles: their reload is twice as slow for 10 seconds.'},
    startPort: 'jorvik', startShip: 'knarr', startSilver: 800, startDebt: 2000, portrait: 'hrafn',
    startPorts: ['jorvik', 'dyflin', 'orkney', 'hamwic'], startGoods: SAGA_START_GOODS,
  },
  {
    id: 'ketill', name: 'Ketill', epithet: 'Grey-Keel',
    bio: 'A retired sea-king with creaking knees and a laugh that carries across fjords. Thirty years ago he hired a clever purser named Svartkell and never once checked his sums. Now Svartkell is buying up the Whale Road, and Ketill feels the debt is his.',
    talent: {id: 'seaking', name: 'Sea-King\'s Call', desc: 'Every ship in your fleet fires a free volley at every enemy.'},
    startPort: 'birka', startShip: 'snekkja', startSilver: 6000, startDebt: 0, portrait: 'ketill',
    startPorts: ['birka', 'gotland', 'heidaby', 'aldeigja'], startGoods: SAGA_START_GOODS,
  },
  {
    id: 'grima', name: 'Gríma', epithet: 'Knotgrip',
    bio: 'Half troll, all heart. Gríma rows a byrding out of Hálogaland and once lifted a cow out of a bog without waking it. She promised her troll grandmother to do every errand anyone on the Whale Road asks of her, and a troll\'s word is stone.',
    talent: {id: 'trollgrip', name: 'Troll Grip', desc: 'Gríma grabs one enemy ship and squeezes: it loses 50% of its max hull.'},
    startPort: 'halogaland', startShip: 'byrding', startSilver: 2500, startDebt: 0, portrait: 'grima',
    // Gríma's saga is the optional tasks, so the world is open from the start, except the fortress.
    startPorts: ALL_PORTS.filter((p) => p !== 'jomsborg'),
    startGoods: ALL_GOODS.filter((g) => g !== 'hacksilver'),
  },
  {
    id: 'custom', name: 'Your Name', epithet: 'the Newcomer',
    bio: 'A newcomer to Ravnfjord with a borrowed knarr and big plans. Nobody on the Whale Road knows your name yet. Give it a few voyages.',
    talent: {id: 'shieldwall', name: 'Shield Wall', desc: 'Your fleet locks shields: it takes 50% less damage for 10 seconds.'},
    startPort: 'ravnfjord', startShip: 'knarr', startSilver: 2000, startDebt: 0, portrait: 'custom',
    // The custom hero has no saga of its own. In Saga mode it plays an open world: every port but
    // the raider fortress, every good but hacksilver, and the shared side tasks (decided by the lead).
    get startPorts() { return ALL_PORTS.filter((p) => p !== 'jomsborg'); },
    get startGoods() { return ALL_GOODS.filter((g) => g !== 'hacksilver'); },
  },
];

export const HERO_BY_ID = Object.fromEntries(HEROES.map((h) => [h.id, h]));

// Heroes open at first launch; the rest unlock after finishing any saga.
export const STARTING_HEROES = ['ylva', 'bjarki', 'saeunn', 'hrafn'];
export const UNLOCKABLE_HEROES = ['ketill', 'grima', 'custom'];
