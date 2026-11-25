// Stand-ins used by adapters.js when another worker's module is missing or fails to load.
// They follow docs/CONTRACT.md closely enough for the UI to run end to end.
// The lead removes this file at integration once every real module is present.

export const GOOD_IDS = ['stockfish', 'salt', 'grain', 'timber', 'wadmal', 'honey', 'iron', 'furs',
  'amber', 'wine', 'ivory', 'blades', 'silk', 'hacksilver'];
const BASE = {stockfish: 14, salt: 22, grain: 18, timber: 30, wadmal: 40, honey: 55, iron: 70, furs: 110,
  amber: 150, wine: 180, ivory: 260, blades: 320, silk: 480, hacksilver: 700};
const GOOD_NAMES = {stockfish: 'Stockfish', salt: 'Salt', grain: 'Grain', timber: 'Timber', wadmal: 'Wadmal',
  honey: 'Honey', iron: 'Iron', furs: 'Furs', amber: 'Amber', wine: 'Wine', ivory: 'Walrus ivory',
  blades: 'Sword blades', silk: 'Silk', hacksilver: 'Hacksilver'};

const P = (id, name, lon, lat, culture, buildings, produces, demands, contraband = []) =>
  ({id, name, lon, lat, culture, buildings, produces, demands, contraband, blurb: `${name}, a ${culture} harbour.`});
const ALL = ['market', 'hall', 'meadhall', 'shipyard', 'altar', 'runecarver', 'guild', 'bank', 'moneylender', 'warehouse'];
export const PORTS = [
  P('ravnfjord', 'Ravnfjord', 5.5, 61.0, 'norse', ALL, ['stockfish', 'timber'], ['grain', 'wine']),
  P('kaupang', 'Kaupang', 10.0, 59.0, 'norse', ['market', 'hall', 'meadhall', 'shipyard', 'altar'], ['iron', 'timber'], ['salt']),
  P('hladir', 'Hlaðir', 10.4, 63.4, 'norse', ['market', 'hall', 'altar', 'meadhall', 'bank'], ['furs'], ['honey']),
  P('halogaland', 'Hálogaland', 14.5, 68.0, 'norse', ['market', 'hall', 'meadhall'], ['stockfish', 'ivory'], ['grain']),
  P('faereyjar', 'Færeyjar', -6.8, 62.0, 'island', ['market', 'hall', 'altar'], ['wadmal'], ['timber']),
  P('island', 'Ísland', -21.9, 64.1, 'island', ['market', 'hall', 'meadhall', 'altar'], ['wadmal', 'stockfish'], ['timber', 'iron']),
  P('orkney', 'Orkneyjar', -3.0, 59.0, 'norse', ['market', 'hall', 'meadhall', 'shipyard'], ['grain'], ['iron']),
  P('dyflin', 'Dyflin', -6.26, 53.35, 'gael', ['market', 'hall', 'meadhall', 'moneylender', 'runecarver'], ['honey'], ['furs']),
  P('jorvik', 'Jórvík', -1.08, 53.96, 'anglonorse', ['market', 'hall', 'guild', 'meadhall', 'warehouse', 'bank'], ['wadmal', 'grain'], ['amber']),
  P('hamwic', 'Hamwic', -1.4, 50.9, 'saxon', ['market', 'hall', 'shipyard', 'altar'], ['salt', 'wine'], ['furs'], ['blades']),
  P('rudaborg', 'Rúðuborg', 1.1, 49.44, 'frank', ['market', 'hall', 'guild', 'bank'], ['wine', 'blades'], ['furs'], ['blades']),
  P('heidaby', 'Heiðabýr', 9.57, 54.49, 'dane', ALL, ['salt', 'blades'], ['amber']),
  P('jomsborg', 'Jómsborg', 14.6, 53.9, 'wend', ['market', 'hall', 'shipyard'], ['iron'], ['wine']),
  P('truso', 'Truso', 19.4, 54.1, 'aesti', ['market', 'hall', 'altar'], ['amber'], ['salt']),
  P('gotland', 'Gotland', 18.3, 57.6, 'gotlander', ['market', 'hall', 'meadhall', 'warehouse'], ['grain'], ['silk']),
  P('birka', 'Birka', 17.5, 59.3, 'svear', ['market', 'hall', 'runecarver', 'meadhall', 'shipyard'], ['furs', 'iron'], ['wine']),
  P('aldeigja', 'Aldeigjuborg', 32.3, 60.0, 'slav', ['market', 'hall', 'meadhall'], ['furs'], ['blades']),
  P('holmgard', 'Hólmgarðr', 31.3, 58.5, 'slav', ['market', 'hall', 'guild', 'moneylender'], ['honey', 'furs'], ['amber']),
  P('kaenugard', 'Kænugarðr', 30.5, 50.45, 'slav', ['market', 'hall', 'altar'], ['grain', 'honey'], ['silk']),
  P('miklagard', 'Miklagarðr', 28.97, 41.0, 'byzantine', ['market', 'hall', 'shipyard', 'bank', 'runecarver', 'guild'], ['silk', 'wine'], ['furs', 'amber']),
];
export const GOODS = GOOD_IDS.map(id => ({id, name: GOOD_NAMES[id], min: Math.round(BASE[id] * 0.5), max: Math.round(BASE[id] * 2)}));
export const SHIPS = {
  faering: {name: 'Færing', hull: 40, cargo: 40, slots: 1, speed: 6, ram: 4, price: 1500},
  karvi: {name: 'Karvi', hull: 80, cargo: 80, slots: 2, speed: 6, ram: 8, price: 5000},
  knarr: {name: 'Knarr', hull: 120, cargo: 160, slots: 2, speed: 5, ram: 8, price: 9000},
  byrding: {name: 'Byrðingr', hull: 140, cargo: 120, slots: 3, speed: 6, ram: 10, price: 14000},
  snekkja: {name: 'Snekkja', hull: 160, cargo: 90, slots: 4, speed: 8, ram: 16, price: 20000},
  busse: {name: 'Búza', hull: 260, cargo: 240, slots: 4, speed: 5, ram: 14, price: 36000},
  skeid: {name: 'Skeið', hull: 300, cargo: 150, slots: 6, speed: 8, ram: 24, price: 55000},
  drakkar: {name: 'Drakkar', hull: 420, cargo: 200, slots: 8, speed: 9, ram: 34, price: 90000},
};
export const ARMS = {
  spearmen: {name: 'Spearmen', range: 'short', tier: 'standard', price: 300},
  huscarls: {name: 'Húskarlar', range: 'short', tier: 'premium', price: 800},
  archers: {name: 'Archers', range: 'long', tier: 'standard', price: 450},
  marksmen: {name: 'Marksmen', range: 'long', tier: 'premium', price: 1000},
};
export const AMMO = {
  harpoon: {name: 'Harpoons', desc: 'Heavy, one target', price: 60},
  firearrows: {name: 'Fire arrows', desc: 'Light, all targets', price: 80},
  greekfire: {name: 'Greek fire', desc: 'Heavy, all targets', price: 220, port: 'miklagard'},
};
export const BLESSINGS = {
  thor: {name: "Thor's Hammer", desc: 'Lightning strikes every enemy.', good: 'salt', qty: 20},
  eir: {name: "Eir's Mending", desc: 'Repairs a quarter of the fleet\'s hull.', good: 'stockfish', qty: 20},
  njord: {name: 'Njörðr\'s Swell', desc: 'Rams deal triple damage for 12 s.', good: 'grain', qty: 15},
  odin: {name: "Odin's Ravens", desc: 'Ranged damage +60% for 15 s.', good: 'wadmal', qty: 10},
  kari: {name: "Kári's Gale", desc: 'Stuns and pushes back every enemy for 5 s.', good: 'iron', qty: 10},
};
export const ITEMS = {
  rune_hold: {name: 'Hold-rune', desc: '+10% cargo room.', price: 4000},
  rune_reload: {name: 'Quick-hand rune', desc: 'Weapons reload 30% faster.', price: 6000},
  rune_hull: {name: 'Oak-heart rune', desc: '+20% hull.', price: 7000},
  rune_storm: {name: 'Storm-ward', desc: 'Storms pass you by.', price: 9000},
  rune_altar: {name: 'Altar-rune', desc: 'Blessings cost 10% less.', price: 3000},
  rune_luck: {name: 'Luck-rune', desc: 'Better loot.', price: 5000},
  rune_speed: {name: 'Wind-rune', desc: '+10% sailing speed.', price: 6500},
  rune_ram: {name: 'Ram-rune', desc: '+50% ram damage.', price: 5500},
  rune_cursed_greed: {name: 'Greed-rune', desc: '+15% sell prices, but raiders find you twice as often.', price: 4500, cursed: true},
  rune_cursed_iron: {name: 'Iron-rune', desc: '+25% hull, -15% speed.', price: 4000, cursed: true},
  horn_sea: {name: 'Sea-horn', desc: 'Once per battle: enemies may flee.', price: 5000},
  mead_skald: {name: 'Skald\'s mead', desc: 'Talent bar fills 30% faster.', price: 3500},
  chart_old: {name: 'Old chart', desc: 'Shows every price you have seen in 30 days.', price: 2500},
  compass_sun: {name: 'Sunstone', desc: 'Voyages 15% shorter in fog and winter.', price: 8000},
};
export const HEROES = [
  {id: 'ylva', name: 'Ylva', epithet: 'the Shield-Wall', bio: 'A trader\'s widow who kept the ship and the debt.', talent: {id: 'shieldwall', name: 'Shield-wall', desc: 'Fleet takes 50% less damage for 10 s.'}, startPort: 'ravnfjord', startShip: 'knarr', startSilver: 2000, startDebt: 3000},
  {id: 'bjarki', name: 'Bjarki', epithet: 'Bear-Shoulders', bio: 'Big, cheerful, very bad at haggling.', talent: {id: 'berserk', name: 'Berserk', desc: 'Fleet damage x3 for 6 s.'}, startPort: 'ravnfjord', startShip: 'karvi', startSilver: 1500, startDebt: 2000},
  {id: 'saeunn', name: 'Sæunn', epithet: 'Who Reads the Wind', bio: 'A seeress who would rather be a merchant.', talent: {id: 'seidr', name: 'Seiðr', desc: 'Enemies miss 70% for 8 s.'}, startPort: 'ravnfjord', startShip: 'knarr', startSilver: 2500, startDebt: 4000},
  {id: 'hrafn', name: 'Hrafn', epithet: 'Sharp-Tongue', bio: 'A skald whose verses start fights.', talent: {id: 'mockery', name: 'Mockery', desc: 'Enemy reload 2x slower for 10 s.'}, startPort: 'ravnfjord', startShip: 'karvi', startSilver: 1800, startDebt: 2500},
  {id: 'ketill', name: 'Ketill', epithet: 'Sea-King', bio: 'Old, rich, bored.', talent: {id: 'seaking', name: 'Sea-king', desc: 'Every ship fires a free volley.'}, startPort: 'ravnfjord', startShip: 'snekkja', startSilver: 5000, startDebt: 0},
  {id: 'grima', name: 'Gríma', epithet: 'Troll-Grip', bio: 'Does every chore anyone asks.', talent: {id: 'trollgrip', name: 'Troll-grip', desc: 'Crushes half an enemy ship.'}, startPort: 'ravnfjord', startShip: 'knarr', startSilver: 2000, startDebt: 0},
  {id: 'custom', name: 'Your hero', epithet: 'of No Saga Yet', bio: 'Name and face of your choosing.', talent: {id: 'shieldwall', name: 'Shield-wall', desc: 'Fleet takes 50% less damage for 10 s.'}, startPort: 'ravnfjord', startShip: 'knarr', startSilver: 2000, startDebt: 2000},
];

// ---------------------------------------------------------------------------------- state
export function makeState(D) {
  const S = {};
  const L = {};
  const on = (e, f) => { (L[e] ||= []).push(f); };
  const emit = (e, d) => { (L[e] || []).forEach(f => { try { f(d); } catch (err) { console.error(err); } }); };
  const jget = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const jput = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  // profiles (same calls as the real state.js)
  const PK = 'wr.stub.profiles';
  const profs = () => { let p = jget(PK, null); if (!p?.list?.length) { p = {current: 'p1', list: [{id: 'p1', name: 'Player', feats: [], sagasDone: [], scores: [], created: Date.now()}]}; jput(PK, p); } return p; };
  const listProfiles = () => profs().list.map(x => ({...x}));
  const currentProfile = () => { const p = profs(); return p.list.find(x => x.id === p.current) || p.list[0]; };
  function createProfile(name) {
    const p = profs(); const id = 'p' + (Math.max(0, ...p.list.map(x => +x.id.slice(1) || 0)) + 1);
    p.list.push({id, name: String(name || 'Player').slice(0, 24), feats: [], sagasDone: [], scores: [], created: Date.now()}); p.current = id; jput(PK, p); return {ok: true, id};
  }
  function selectProfile(id) { const p = profs(); p.current = id; jput(PK, p); return {ok: true}; }
  function deleteProfile(id) { const p = profs(); if (p.list.length < 2) return {ok: false, msg: 'Keep at least one profile.'}; p.list = p.list.filter(x => x.id !== id); if (p.current === id) p.current = p.list[0].id; jput(PK, p); return {ok: true}; }
  function updateProfile(fn) { const p = profs(); const c = p.list.find(x => x.id === p.current) || p.list[0]; fn(c); jput(PK, p); return c; }
  function recordScore(score) { updateProfile(pr => { pr.scores = [...(pr.scores || []), {score: Math.round(score), name: S.name, day: S.day, ts: Date.now()}].sort((a, b) => b.score - a.score).slice(0, 10); }); }
  function log(text) { (S.log ||= []).push({day: S.day, text}); if (S.log.length > 200) S.log.shift(); emit('log'); }
  function setEasy(v) { S.easy = !!v; emit('quest'); }

  function newGame({mode, hero, name, look, easy}) {
    const H = D.heroes[hero] || HEROES[0];
    for (const k of Object.keys(S)) delete S[k];
    const ship = D.ships[H.startShip] ? H.startShip : 'knarr';
    Object.assign(S, {
      mode, hero, name: name || H.name, look: look || null, easy: !!easy, day: 1, profile: currentProfile().id,
      port: H.startPort || 'ravnfjord', silver: H.startSilver ?? 2000,
      bank: {}, debt: {amount: H.startDebt || 0, due: 60},
      fleet: [{id: 's1', type: ship, name: 'Sea-Mare', hull: shipStat(D, ship, 'hull'), arms: {archers: 1}, ammo: {harpoon: 0, firearrows: 0, greekfire: 0}}],
      cargo: {stockfish: 10}, cargoPaid: {stockfish: 12}, items: [], blessings: {thor: 2, eir: 1, njord: 0, odin: 0, kari: 0},
      warehouse: {}, unlockedPorts: mode === 'free' ? PORTS.map(p => p.id) : ['ravnfjord', 'kaupang', 'heidaby', 'orkney'],
      unlockedGoods: mode === 'free' ? GOOD_IDS.slice(0, 13) : GOOD_IDS.slice(0, 8),
      quests: {active: {}, done: []}, renown: 0, feats: [], seen: {}, flags: {}, log: [], stats: {trades: 0, voyages: 0, battles: 0, profit: 0},
    });
    log(`${S.name} sets out.`);
    emit('port', S.port);
  }
  const SLOTS = [1, 2, 3, 'auto'];
  const key = slot => `wr.stub.save.${currentProfile().id}.${slot}`;
  function save(slot = 'auto') {
    if (!S.fleet?.length) return {ok: false, msg: 'No game to save.'};
    const meta = {slot, ts: Date.now(), day: S.day, hero: S.hero, name: S.name, mode: S.mode, port: S.port};
    return jput(key(slot), {meta, state: S}) ? {ok: true, meta} : {ok: false, msg: 'Could not save'};
  }
  function load(slot = 'auto') {
    const d = jget(key(slot), null); if (!d?.state) return {ok: false, msg: 'That slot is empty.'};
    for (const k of Object.keys(S)) delete S[k];
    Object.assign(S, d.state); emit('port', S.port); return {ok: true, meta: d.meta};
  }
  const listSaves = () => SLOTS.map(slot => { const d = jget(key(slot), null); return d?.meta ? {...d.meta, slot} : {slot, empty: true}; });
  const hasContinue = () => listSaves().some(x => !x.empty);
  function continueGame() { const b = listSaves().filter(x => !x.empty).sort((a, b) => b.ts - a.ts)[0]; return b ? load(b.slot) : {ok: false, msg: 'Nothing to continue.'}; }
  return {S, newGame, save, load, listSaves, hasContinue, continueGame, on, emit, log, setEasy,
    listProfiles, currentProfile, createProfile, selectProfile, deleteProfile, updateProfile, recordScore};
}
const shipStat = (D, type, k) => (D.ships[type] || SHIPS[type] || SHIPS.knarr)[k];

// ---------------------------------------------------------------------------------- sim
export function makeSim(D, state) {
  const {S, emit} = state;
  const ok = (x = {}) => ({ok: true, ...x});
  const no = msg => ({ok: false, msg});
  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const portOf = id => D.ports[id] || PORTS.find(p => p.id === id);

  const MONTHS = ['Snowmonth', 'Thorri', 'Góa', 'Seedmonth', 'Lambmonth', 'Sunmonth', 'Haymonth', 'Reapmonth', 'Harvestmonth', 'Slaughtermonth', 'Wintermonth', 'Yulemonth'];
  const time = {
    date(day = S.day) {
      const mi = 3 + Math.floor((day - 1) / 30);
      const month = mi % 12, year = 950 + Math.floor(mi / 12), d = ((day - 1) % 30) + 1;
      const season = [2, 3, 4].includes(month) ? 'spring' : [5, 6, 7].includes(month) ? 'summer' : [8, 9, 10].includes(month) ? 'autumn' : 'winter';
      return {d, month, monthName: MONTHS[month], year, season, label: `${d} ${MONTHS[month]} ${year}`};
    },
  };

  const price = (port, good) => {
    const p = portOf(port); const b = BASE[good] || 50;
    let f = 1;
    if (p?.produces?.includes(good)) f = 0.62;
    if (p?.demands?.includes(good)) f = 1.55;
    const wk = Math.floor(S.day / 7);
    f *= 0.85 + hash(port + good + wk) * 0.3;
    return Math.max(1, Math.round(b * f));
  };
  const economy = {
    market(port = S.port) {
      const p = portOf(port);
      return (S.unlockedGoods || GOOD_IDS).map(good => {
        const base = price(port, good);
        const contraband = !!p?.contraband?.includes(good);
        const sold = !contraband && (p?.produces?.includes(good) || hash(port + good) > 0.35);
        const r = hash(port + good + 's');
        return {good, name: D.goods[good]?.name || GOOD_NAMES[good], buy: sold ? Math.round(base * 1.06) : null,
          sell: contraband ? base * 2 : Math.round(base * 0.94), contraband, stockNote: r > 0.66 ? 'plenty' : r > 0.33 ? 'some' : 'scarce'};
      });
    },
    maxBuy(good) {
      const row = economy.market().find(r => r.good === good);
      if (!row || !row.buy) return 0;
      return Math.max(0, Math.min(Math.floor(S.silver / row.buy), fleet.cargoCap() - fleet.cargoUsed()));
    },
    buy(good, qty) {
      const row = economy.market().find(r => r.good === good);
      if (!row || !row.buy) return no('Not sold here');
      if (qty > economy.maxBuy(good)) return no('Not enough silver or room');
      const held = S.cargo[good] || 0;
      S.cargoPaid[good] = Math.round(((S.cargoPaid[good] || 0) * held + row.buy * qty) / (held + qty));
      S.cargo[good] = held + qty; S.silver -= row.buy * qty; S.stats.trades++;
      emit('silver'); emit('cargo'); return ok({cost: row.buy * qty});
    },
    sell(good, qty) {
      const row = economy.market().find(r => r.good === good);
      if (!row || row.contraband) return no('Cannot sell that here');
      if ((S.cargo[good] || 0) < qty) return no('You have not got that much');
      S.cargo[good] -= qty; if (!S.cargo[good]) { delete S.cargo[good]; delete S.cargoPaid[good]; }
      S.silver += row.sell * qty; S.stats.trades++;
      emit('silver'); emit('cargo'); return ok({silver: row.sell * qty});
    },
    sellContraband(good) {
      const row = economy.market().find(r => r.good === good);
      const qty = S.cargo[good] || 0;
      if (!row || !row.contraband || !qty) return no('Nothing to sell');
      delete S.cargo[good]; delete S.cargoPaid[good];
      if (Math.random() < 0.25) {
        const fine = Math.min(S.silver, 500); S.silver -= fine; emit('silver'); emit('cargo');
        return ok({caught: true, fine, silver: 0});
      }
      S.silver += row.sell * qty; emit('silver'); emit('cargo'); return ok({caught: false, fine: 0, silver: row.sell * qty});
    },
    tick() {},
  };

  const armCount = s => Object.values(s.arms || {}).reduce((a, b) => a + b, 0);
  const fleet = {
    cargoUsed() { return Object.values(S.cargo).reduce((a, b) => a + b, 0) + S.fleet.reduce((a, s) => a + armCount(s) * 5, 0); },
    cargoCap() { return S.fleet.reduce((a, s) => a + shipStat(D, s.type, 'cargo'), 0); },
    fleetSpeed() { return Math.min(...S.fleet.map(s => shipStat(D, s.type, 'speed'))); },
    netWorth() {
      const goods = Object.entries(S.cargo).reduce((a, [g, q]) => a + q * (BASE[g] || 0), 0);
      const bank = Object.values(S.bank).reduce((a, b) => a + b, 0);
      const ships = S.fleet.reduce((a, _s, i) => a + fleet.shipValue(i), 0);
      return S.silver + bank + goods + ships - (S.debt?.amount || 0);
    },
    repairCost(i) {
      if (i === 'all') return S.fleet.reduce((a, _s, j) => a + fleet.repairCost(j), 0);
      const s = S.fleet[i]; return Math.round((shipStat(D, s.type, 'hull') - s.hull) * 4);
    },
    repair(i) {
      const c = fleet.repairCost(i); if (!c) return no('Nothing to repair');
      if (c > S.silver) return no('Not enough silver');
      S.silver -= c; (i === 'all' ? S.fleet : [S.fleet[i]]).forEach(s => { s.hull = shipStat(D, s.type, 'hull'); });
      emit('silver'); emit('fleet'); return ok({cost: c});
    },
    shipOffer(port = S.port) {
      const types = Object.keys(SHIPS); return types[Math.floor(hash(port + Math.floor(S.day / 10)) * types.length)];
    },
    shipValue(i) {
      const s = S.fleet[i]; const st = D.ships[s.type] || SHIPS[s.type];
      const armV = Object.entries(s.arms || {}).reduce((a, [k, n]) => a + n * fleet.armCost(k), 0);
      return Math.round(st.price * 0.6 * (s.hull / st.hull) + armV);
    },
    buyShip(type, tradeIn = null) {
      const st = D.ships[type] || SHIPS[type];
      if (tradeIn != null) { const r = fleet.sellShip(tradeIn); if (!r.ok) return r; }
      if (S.fleet.length >= 4) return no('Your fleet is full (4 ships)');
      if (st.price > S.silver) return no('Not enough silver');
      S.silver -= st.price;
      S.fleet.push({id: 's' + Date.now(), type, name: st.name || type, hull: st.hull, arms: {}, ammo: {harpoon: 0, firearrows: 0, greekfire: 0}});
      emit('silver'); emit('fleet'); return ok();
    },
    sellShip(i) {
      if (S.fleet.length <= 1) return no('You cannot sell your last ship');
      const s = S.fleet[i]; const after = fleet.cargoCap() - shipStat(D, s.type, 'cargo');
      if (fleet.cargoUsed() - armCount(s) * 5 > after) return no('Your cargo would not fit');
      const v = fleet.shipValue(i); S.fleet.splice(i, 1); S.silver += v;
      emit('silver'); emit('fleet'); return ok({silver: v});
    },
    armCost(arm) { return (D.arms[arm] || ARMS[arm])?.price ?? 400; },
    addArm(i, arm) {
      const s = S.fleet[i]; if (armCount(s) >= shipStat(D, s.type, 'slots')) return no('No free slot');
      if (fleet.cargoCap() - fleet.cargoUsed() < 5) return no('Needs 5 free cargo');
      const c = fleet.armCost(arm); if (c > S.silver) return no('Not enough silver');
      S.silver -= c; s.arms[arm] = (s.arms[arm] || 0) + 1; emit('silver'); emit('fleet'); return ok();
    },
    removeArm(i, arm) {
      const s = S.fleet[i]; if (!s.arms[arm]) return no('None fitted');
      s.arms[arm]--; S.silver += fleet.armCost(arm); emit('silver'); emit('fleet'); return ok();
    },
    ammoCost(a) { return AMMO[a]?.price ?? 80; },
    buyAmmo(a, qty) {
      const c = fleet.ammoCost(a) * qty; if (c > S.silver) return no('Not enough silver');
      S.silver -= c; S.fleet[0].ammo[a] = (S.fleet[0].ammo[a] || 0) + qty; emit('silver'); emit('fleet'); return ok();
    },
    reorder(from, to) { const [s] = S.fleet.splice(from, 1); S.fleet.splice(to, 0, s); emit('fleet'); return ok(); },
    rename(i, name) { S.fleet[i].name = String(name).slice(0, 24); emit('fleet'); return ok(); },
  };

  const bank = {
    bankHere() { return S.bank[S.port] || 0; },
    deposit(n) { if (n > S.silver || n <= 0) return no('Not enough silver'); S.silver -= n; S.bank[S.port] = bank.bankHere() + n; emit('silver'); return ok(); },
    withdraw(n) { if (n > bank.bankHere() || n <= 0) return no('Not that much here'); S.bank[S.port] -= n; S.silver += n; emit('silver'); return ok(); },
    loanMax() { return Math.max(0, Math.round(fleet.netWorth() * 2) - (S.debt?.amount || 0)); },
    borrow(n) { if (n > bank.loanMax()) return no('The lender will not go that high'); S.debt.amount += n; S.debt.due = S.day + 30; S.silver += n; emit('silver'); return ok(); },
    repay(n) { n = Math.min(n, S.debt.amount); if (n > S.silver || n <= 0) return no('Not enough silver'); S.silver -= n; S.debt.amount -= n; emit('silver'); return ok(); },
    loanStatus() { return {amount: S.debt?.amount || 0, due: S.debt?.due || 0, overdue: S.debt?.amount > 0 && S.day > S.debt.due}; },
    warehouseHere() { return S.warehouse[S.port] || {}; },
    storeGoods(g, q) { if ((S.cargo[g] || 0) < q) return no('Not enough'); const w = (S.warehouse[S.port] ||= {}); w[g] = (w[g] || 0) + q; S.cargo[g] -= q; if (!S.cargo[g]) delete S.cargo[g]; emit('cargo'); return ok(); },
    takeGoods(g, q) { const w = bank.warehouseHere(); if ((w[g] || 0) < q) return no('Not enough stored'); if (fleet.cargoCap() - fleet.cargoUsed() < q) return no('No room aboard'); w[g] -= q; S.cargo[g] = (S.cargo[g] || 0) + q; emit('cargo'); return ok(); },
  };

  const altar = {
    blessingCost(b) { const x = D.blessings[b] || BLESSINGS[b]; return {good: x.good || BLESSINGS[b].good, qty: x.qty || BLESSINGS[b].qty}; },
    maxBlessing(b) { const c = altar.blessingCost(b); return Math.floor((S.cargo[c.good] || 0) / c.qty); },
    buyBlessing(b, qty) {
      const c = altar.blessingCost(b); if (qty > altar.maxBlessing(b) || qty < 1) return no(`Needs ${c.qty * qty} ${c.good}`);
      S.cargo[c.good] -= c.qty * qty; if (!S.cargo[c.good]) delete S.cargo[c.good];
      S.blessings[b] = (S.blessings[b] || 0) + qty; emit('cargo'); return ok();
    },
  };

  const charms = {
    shop(port = S.port) {
      const ids = Object.keys(ITEMS); const n = ids.length; const k = Math.floor(hash(port) * n);
      return [ids[k], ids[(k + 3) % n], ids[(k + 8) % n]].map(id => ({id, ...ITEMS[id], ...(D.items[id] || {}), price: ITEMS[id].price}));
    },
    buyCharm(id) {
      const it = charms.shop().find(x => x.id === id); if (!it) return no('Not for sale here');
      if (S.items.includes(id)) return no('You already have one');
      if (it.price > S.silver) return no('Not enough silver');
      S.silver -= it.price; S.items.push(id); emit('silver'); emit('fleet'); return ok();
    },
    sellCharm(id) {
      const i = S.items.indexOf(id); if (i < 0) return no('Not yours');
      S.items.splice(i, 1); S.silver += Math.round((ITEMS[id]?.price || 1000) / 2); emit('silver'); return ok();
    },
    mod() { return 0; },
  };

  const DEMO = {id: 'stub_01', saga: null, chapter: 0, title: 'Herring for the Hall', giver: {port: 'ravnfjord', building: 'hall', npc: 'jarl'},
    npcName: 'Jarl Hallvard', offer: [{who: 'npc', text: 'My hall is out of stockfish and my guests are getting ideas.'}, {who: 'hero', text: 'How many ideas?'}, {who: 'npc', text: 'Twenty barrels\' worth. Bring them and I will remember you.'}],
    steps: [{do: 'deliver', good: 'stockfish', qty: 20, port: 'ravnfjord', building: 'hall', text: 'Bring 20 stockfish to Jarl Hallvard.'}],
    done: [{who: 'npc', text: 'The guests are fed and the benches are safe. Take this.'}], reward: {silver: 800, renown: 5}};
  const quests = {
    offers(port, b) { return (port === DEMO.giver.port && b === DEMO.giver.building && !S.quests.active[DEMO.id] && !S.quests.done.includes(DEMO.id)) ? [DEMO] : []; },
    accept(id) { if (id !== DEMO.id) return no('Unknown task'); S.quests.active[id] = {step: 0, data: {}}; emit('quest'); return ok(); },
    act(port, b) {
      const q = S.quests.active[DEMO.id]; const st = DEMO.steps[0];
      if (!q || port !== st.port || b !== st.building || (S.cargo.stockfish || 0) < st.qty) return [];
      S.cargo.stockfish -= st.qty; if (!S.cargo.stockfish) delete S.cargo.stockfish;
      delete S.quests.active[DEMO.id]; S.quests.done.push(DEMO.id); S.silver += 800; S.renown += 5;
      emit('cargo'); emit('silver'); emit('quest');
      return [{quest: DEMO.id, title: DEMO.title, step: 0, kind: 'complete', lines: DEMO.done, done: true}];
    },
    journal() {
      return [...Object.keys(S.quests.active).map(id => ({id, title: DEMO.title, saga: null, chapter: 0, stepText: DEMO.steps[0].text, done: false})),
        ...S.quests.done.map(id => ({id, title: DEMO.title, saga: null, chapter: 0, stepText: 'Done.', done: true}))];
    },
    markers() {
      if (S.quests.done.includes(DEMO.id)) return [];
      return [{port: 'ravnfjord', building: 'hall', kind: 'side'}];
    },
    battleAt() { return null; },
    winBattle() { return ok(); },
  };

  let pending = null;
  const voyage = {
    travelDays(from, to) {
      const a = portOf(from), b = portOf(to); if (!a || !b) return 5;
      const d = Math.hypot((a.lon - b.lon) * Math.cos((a.lat + b.lat) / 2 * Math.PI / 180), a.lat - b.lat);
      return Math.max(1, Math.round(d / 1.6 * 6 / fleet.fleetSpeed()));
    },
    planVoyage(to) {
      const days = voyage.travelDays(S.port, to); const events = [];
      if (days > 2 && Math.random() < 0.5) events.push({day: 1 + Math.floor(Math.random() * (days - 1)), type: 'storm', text: 'A squall tears at the sails.'});
      if (days > 3 && Math.random() < 0.4) events.push({day: 2, type: 'raid', enemies: ['raider_karvi'], text: 'Raiders on the horizon!'});
      if (S.debt?.amount && S.day > S.debt.due) events.push({day: 1, type: 'collectors', enemies: ['collector_snekkja'], text: 'The moneylender\'s men have found you.'});
      events.forEach(e => { if (e.type === 'storm') S.fleet.forEach(s => { s.hull = Math.max(1, s.hull - 8); }); });
      pending = {to, days}; S.port = null; return {days, events};
    },
    arrive(to) {
      S.port = to; S.day += pending?.days || 1; S.stats.voyages++; pending = null;
      S.seen[to] = {day: S.day, prices: Object.fromEntries(economy.market(to).map(r => [r.good, r.buy ?? r.sell]))};
      state.save('auto'); emit('day'); emit('port', to); return ok();
    },
  };

  const FEATS = [{id: 'first_trade', name: 'First Haggle', desc: 'Make a trade.'}, {id: 'voyager', name: 'Salt in the Beard', desc: 'Finish five voyages.'}, {id: 'rich', name: 'Silver-Hoard', desc: 'Hold 20 000 s.'}];
  const feats = {
    check() {
      const got = [];
      if (S.stats.trades > 0) got.push('first_trade'); if (S.stats.voyages >= 5) got.push('voyager'); if (S.silver >= 20000) got.push('rich');
      got.forEach(id => { if (!S.feats.includes(id)) { S.feats.push(id); emit('feat', id); } });
    },
    list() { return FEATS.map(f => ({...f, got: S.feats.includes(f.id)})); },
  };
  const RANKS = [[0, 'Deckhand'], [20, 'Steersman'], [60, 'Shipmaster'], [150, 'Sea-Captain'], [300, 'Hersir'], [600, 'Sea-King']];
  const rank = {
    rank() {
      let i = 0; while (i + 1 < RANKS.length && S.renown >= RANKS[i + 1][0]) i++;
      const next = RANKS[i + 1]; const lo = RANKS[i][0];
      return {title: RANKS[i][1], next: next?.[1] || null, progress: next ? (S.renown - lo) / (next[0] - lo) : 1};
    },
  };
  return {time, economy, fleet, bank, altar, charms, quests, voyage, feats, rank};
}

// ---------------------------------------------------------------------------------- art
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
export function makeArt(D) {
  function portScene(portId, {time = 'day'} = {}) {
    const p = D.ports[portId] || PORTS[0];
    const sky = time === 'night' ? ['#1b2340', '#3a4a6a'] : time === 'dusk' ? ['#6b4a6a', '#e0a070'] : ['#8fb4c6', '#e8dcc0'];
    const blds = (p.buildings || []).map((b, i, a) => {
      const w = 1400 / a.length, x = 100 + i * w + w * 0.12, ww = w * 0.76, hh = 150 + ((i * 53) % 90), y = 640 - hh;
      return `<g class="bld" data-b="${b}"><rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="#6a4a30" stroke="#2a1a0c" stroke-width="4"/>
        <path d="M${x - 14},${y} L${x + ww / 2},${y - 70} L${x + ww + 14},${y}Z" fill="#3e2a18"/></g>
        <g class="bld-label" data-b="${b}" transform="translate(${x + ww / 2},${y - 90})"></g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#sk)"/>
      <path d="M0,520 L220,330 L420,470 L640,300 L900,480 L1150,320 L1400,460 L1600,360 L1600,640 L0,640Z" fill="#5a6a64" opacity=".7"/>
      <rect y="640" width="1600" height="260" fill="#2f5d6e"/>
      <text x="800" y="860" text-anchor="middle" font-family="serif" font-size="34" fill="#efe2c4" opacity=".6">${esc(p.name)} (placeholder scene)</text>
      ${blds}</svg>`;
  }
  function titleScene() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="ts" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a3550"/><stop offset=".6" stop-color="#c98a5a"/><stop offset="1" stop-color="#e8c890"/></linearGradient></defs>
      <rect width="1600" height="900" fill="url(#ts)"/><circle cx="1100" cy="520" r="90" fill="#f4d79a" opacity=".8"/>
      <path d="M0,560 L300,380 L520,520 L800,340 L1080,540 L1360,400 L1600,520 L1600,900 L0,900Z" fill="#2e3a44" opacity=".8"/>
      <rect y="600" width="1600" height="300" fill="#183a48"/></svg>`;
  }
  function seaScene({weather = 'clear'} = {}) {
    const top = weather === 'storm' ? '#2a3038' : weather === 'fog' ? '#9aa4a6' : '#7fa6b8';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="900" fill="${top}"/><rect y="420" width="1600" height="480" fill="#2f5d6e"/></svg>`;
  }
  function portrait(id, {size = 256} = {}) {
    const hue = [...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="${size}" height="${size}"><rect width="256" height="256" fill="hsl(${hue},30%,35%)"/>
      <circle cx="128" cy="104" r="54" fill="#d9b48c"/><path d="M40,256 C50,180 206,180 216,256Z" fill="hsl(${hue},40%,22%)"/>
      <text x="128" y="246" text-anchor="middle" font-family="serif" font-size="26" fill="#efe2c4">${esc(id)}</text></svg>`;
  }
  return {portScene, titleScene, seaScene, portrait};
}
export function shipSVG(type, {w = 240, sail = '#b33'} = {}) {
  const h = Math.round(w * 0.6);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 144" width="${w}" height="${h}"><path d="M10,100 Q120,140 230,100 L215,88 L25,88Z" fill="#5b3a22" stroke="#2a1a0c" stroke-width="3"/>
    <rect x="117" y="20" width="5" height="70" fill="#3a2414"/><path d="M70,28 L170,28 L162,84 L78,84Z" fill="${sail}" stroke="#2a1a0c" stroke-width="2"/></svg>`;
}

// ---------------------------------------------------------------------------------- audio
export const Music = {init() {}, play() {}, setVolume() {}, stop() {}};
export const Sfx = {play() {}, setVolume() {}};

// ---------------------------------------------------------------------------------- map
export function makeMap(D, G) {
  function openMap(root, {onSail, onClose}) {
    const el = document.createElement('div');
    el.className = 'stub-map';
    const S = G.state.S;
    const rows = (S.unlockedPorts || []).filter(id => id !== S.port).map(id => {
      const p = D.ports[id]; const days = G.voyage.travelDays(S.port, id);
      return `<li><span>${esc(p?.name || id)} <small>${days} days</small></span><button class="btn" data-sail="${id}">Sail</button></li>`;
    }).join('');
    el.innerHTML = `<div class="panel"><header class="panel-head"><h2>Sea chart (placeholder)</h2><button class="btn ghost" data-close>Close</button></header>
      <div class="panel-body"><ul class="rows">${rows}</ul></div></div>`;
    el.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.sail) { el.remove(); onSail?.(t.dataset.sail); }
      if ('close' in t.dataset) { el.remove(); onClose?.(); }
    });
    root.appendChild(el);
    return {close() { el.remove(); }};
  }
  async function playVoyage(root, {from, to, days, onEvent, onArrive}) {
    const el = document.createElement('div');
    el.className = 'stub-map voyage';
    el.innerHTML = `<div class="panel"><div class="panel-body"><h2>${esc(D.ports[from]?.name || from)} → ${esc(D.ports[to]?.name || to)}</h2>
      <div class="meter big"><i style="width:0"></i></div><p class="vday">Day 0 of ${days}</p></div></div>`;
    root.appendChild(el);
    const bar = el.querySelector('i'), lbl = el.querySelector('.vday');
    const step = Math.max(80, 500 / (G.speed?.() || 1));
    for (let d = 1; d <= days; d++) {
      await new Promise(r => setTimeout(r, step));
      bar.style.width = (d / days * 100) + '%'; lbl.textContent = `Day ${d} of ${days}`;
      await onEvent?.(d);
    }
    el.remove(); onArrive?.();
  }
  return {openMap, playVoyage};
}

// ---------------------------------------------------------------------------------- combat
export function makeCombat() {
  function startBattle(root, {enemies = [], onEnd}) {
    const el = document.createElement('div');
    el.className = 'stub-map battle';
    const list = enemies.map(e => `<li>${esc(typeof e === 'string' ? e : e.kind)}</li>`).join('');
    el.innerHTML = `<div class="panel"><header class="panel-head"><h2>Battle (placeholder)</h2></header><div class="panel-body">
      <p>Enemies:</p><ul class="rows">${list}</ul><div class="btn-row"><button class="btn" data-r="win">Fight and win</button>
      <button class="btn ghost" data-r="fled">Flee</button><button class="btn ghost" data-r="lose">Lose</button></div></div></div>`;
    el.addEventListener('click', e => {
      const r = e.target.closest('button')?.dataset.r; if (!r) return;
      el.remove(); onEnd?.({result: r, loot: r === 'win' ? {iron: 5} : {}, silver: r === 'win' ? 250 : 0});
    });
    root.appendChild(el);
  }
  return {startBattle};
}
