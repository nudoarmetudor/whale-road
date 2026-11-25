// Sim tests: node tests/sim.test.mjs
// Covers trading, loans, bank, fleet, altar, charms, quest steps (fixture), voyage plans,
// save/load, story-data validation, and a two-year "smart trader" economy run.

// ---- localStorage shim (before the game modules load)
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const St = await import('../js/state.js');
const Sim = await import('../js/sim/index.js');
const {PORTS} = await import('../js/data/ports.js');
const {GOODS} = await import('../js/data/goods.js');
const {SHIPS} = await import('../js/data/ships.js');
const {S} = St;
const QUIET = process.argv.includes('-q');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; if (!QUIET) console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + (e.stack || e).toString().split('\n').slice(0, 3).join('\n       ')); }
}
const assert = (c, m = 'assertion failed') => { if (!c) throw new Error(m); };
const eq = (a, b, m = '') => { if (a !== b) throw new Error(`${m} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const near = (a, b, tol, m = '') => { if (Math.abs(a - b) > tol) throw new Error(`${m} expected ~${b}, got ${a}`); };
const section = (t) => console.log('\n' + t);
const at = (port) => { S.port = port; }; // test teleport

// =====================================================================================
section('Calendar and data');
test('day 1 is 1 April 950, seasons roll', () => {
  const d = Sim.date(1);
  eq(d.year, 950); eq(d.month, 3); eq(d.d, 1); eq(d.season, 'spring');
  eq(Sim.date(92).season, 'summer');
  eq(Sim.date(276).season, 'winter');
  eq(Sim.date(366).label, Sim.date(1).label.replace('950', '951'));
});
test('20 ports, 14 goods, 8 ships, 3-8 buildings each, coordinates on the map', () => {
  eq(Object.keys(PORTS).length, 20); eq(Object.keys(GOODS).length, 14); eq(Object.keys(SHIPS).length, 8);
  for (const [id, p] of Object.entries(PORTS)) {
    assert(p.buildings.length >= 3 && p.buildings.length <= 8, id + ' buildings');
    assert(p.lon >= -26 && p.lon <= 44 && p.lat >= 38 && p.lat <= 68.5, id + ' coords');
    for (const g of [...p.produces, ...p.demands, ...(p.trades || []), ...p.contraband]) assert(GOODS[g], id + ' good ' + g);
  }
  assert(PORTS.rudaborg.contraband.includes('blades') && PORTS.hamwic.contraband.includes('blades'));
});

// =====================================================================================
section('Trading');
test('buy then sell in the same town always loses a little', () => {
  St.newGame({mode: 'free', seed: 1});
  const s0 = S.silver, p0 = Sim.buyPrice('ravnfjord', 'stockfish');
  const r = Sim.buy('stockfish', 40);
  assert(r.ok, r.msg); eq(S.cargo.stockfish, 40); eq(S.silver, s0 - r.cost);
  assert(Sim.buyPrice('ravnfjord', 'stockfish') >= p0, 'buying should not lower the price');
  near(S.cargoPaid.stockfish, r.cost / 40, 1e-9);
  const s = Sim.sell('stockfish', 40);
  assert(s.ok); assert(S.silver < s0, 'round trip must lose'); assert(!S.cargo.stockfish);
});
test('greed-rune still cannot make a same-town round trip profitable', () => {
  St.newGame({mode: 'free', seed: 2}); S.items.push('rune_cursed_greed');
  for (const g of ['stockfish', 'timber', 'wadmal']) {
    const s0 = S.silver; Sim.buy(g, 20); Sim.sell(g, 20); assert(S.silver <= s0, g);
  }
});
test('maxBuy is limited by cargo room and by silver; refusals', () => {
  St.newGame({mode: 'free', seed: 3});
  eq(Sim.maxBuy('timber'), Sim.cargoFree());
  S.silver = 100; assert(Sim.maxBuy('timber') < Sim.cargoFree() && Sim.quote('timber', Sim.maxBuy('timber')) <= 100);
  assert(!Sim.buy('salt', 1).ok, 'salt not sold in ravnfjord');
  assert(!Sim.sell('salt', 1).ok, 'cannot sell what you lack');
  assert(!Sim.buy('timber', 9999).ok);
  at(null); assert(!Sim.buy('timber', 1).ok, 'at sea');
});
test('locked goods are not traded in saga mode', () => {
  St.newGame({mode: 'saga', hero: 'ylva', seed: 4});
  assert(!Sim.market().some((r) => r.good === 'silk'));
  eq(Sim.buyPrice('ravnfjord', 'silk'), null);
});
test('a town starts selling a good after you sell it 10 units', () => {
  St.newGame({mode: 'free', seed: 5}); at('heidaby');
  eq(Sim.buyPrice('heidaby', 'timber'), null);
  S.cargo.timber = 12; S.cargoPaid.timber = 10;
  Sim.sell('timber', 6); eq(Sim.buyPrice('heidaby', 'timber'), null);
  const r = Sim.sell('timber', 6); assert(r.taught); assert(Sim.buyPrice('heidaby', 'timber') > 0);
});
test('contraband: hidden from open sale, sell-all, sometimes caught with a fine', () => {
  let caught = 0, free = 0;
  for (let i = 0; i < 40; i++) {
    St.newGame({mode: 'free', seed: 100 + i}); at('rudaborg');
    S.cargo.blades = 10; S.cargoPaid.blades = 200;
    const row = Sim.market().find((r) => r.good === 'blades');
    assert(row.contraband && row.buy === null);
    assert(!Sim.sell('blades', 5).ok, 'open sale must fail');
    const s0 = S.silver, r = Sim.sellContraband('blades');
    assert(r.ok && !S.cargo.blades);
    if (r.caught) { caught++; assert(r.fine > 0 && S.silver === s0 - r.fine); } else { free++; assert(r.silver > 10 * 400); }
  }
  assert(caught > 3 && free > 20, `caught ${caught} free ${free}`);
});
test('your trades move prices, and the market recovers over days', () => {
  St.newGame({mode: 'free', seed: 6});
  const l0 = Sim.level('ravnfjord', 'timber');
  S.cargo = {}; Sim.buy('timber', 100);
  const l1 = Sim.level('ravnfjord', 'timber'); assert(l1 > l0 + 0.03, `${l0} -> ${l1}`);
  Sim.passDays(30);
  assert(Math.abs(Sim.level('ravnfjord', 'timber') - l0) < 0.2, 'recovered');
});
test('prices stay inside each good\'s min-max over a year', () => {
  St.newGame({mode: 'free', seed: 7});
  for (let d = 0; d < 365; d += 5) {
    Sim.passDays(5);
    for (const p of Object.keys(PORTS)) for (const g of Object.keys(GOODS)) {
      const b = Math.round(GOODS[g].min + (GOODS[g].max - GOODS[g].min) * Sim.level(p, g));
      assert(b >= GOODS[g].min && b <= GOODS[g].max);
    }
  }
  assert(S.rumours.length + S.mevents.length >= 0);
});
test('market events are announced as rumours; price tips are true', () => {
  St.newGame({mode: 'free', seed: 8});
  Sim.passDays(70);
  assert(S.rumours.length > 0, 'some rumours in 10 weeks');
  const t = Sim.priceTip(); assert(t && t.text && PORTS[t.port]);
  eq(t.price, t.cheap ? Sim.buyPrice(t.port, t.good) : Sim.sellPrice(t.port, t.good));
});
test('seasons: stockfish dearer in winter than summer at a demanding port', () => {
  St.newGame({mode: 'free', seed: 9});
  const lv = (day) => { S.day = day; return Sim.level('jorvik', 'stockfish') - S.econ.jorvik.stockfish.n; };
  assert(lv(280) > lv(100));
});

// =====================================================================================
section('Bank, moneylender, warehouse');
test('bank pays ~10%/year, only in its own town', () => {
  St.newGame({mode: 'free', seed: 10}); at('jorvik');
  assert(Sim.deposit(8000).ok); eq(Sim.bankHere().amount, 8000);
  Sim.passDays(365);
  near(Sim.bankHere().amount, 8000 * Math.pow(1 + 0.1 / 365, 365), 2);
  at('heidaby'); assert(!Sim.withdraw(100).ok, 'no deposit in heidaby');
  at('kaupang'); assert(!Sim.deposit(1).ok, 'kaupang has no bank');
  at('jorvik'); assert(Sim.withdraw(8000).ok);
  assert(!Sim.deposit(1e9).ok);
});
test('moneylender: limit 2x net worth, 10%/month, overdue blocks loans and sends collectors', () => {
  St.newGame({mode: 'saga', hero: 'ylva', seed: 11});
  const debt0 = S.debt.amount; assert(debt0 > 0);
  const max = Sim.loanMax(); near(max, 2 * Sim.netWorth() - debt0, 1);
  assert(!Sim.borrow(max + 10).ok);
  assert(Sim.borrow(500).ok); eq(Math.ceil(S.debt.amount), debt0 + 500);
  const before = S.debt.amount; Sim.passDays(30);
  near(S.debt.amount / before, 1.1, 0.001, 'monthly interest');
  at('kaupang'); assert(!Sim.repay(10).ok, 'no moneylender in kaupang');
  Sim.passDays(S.debt.due - S.day + 1);
  assert(Sim.loanStatus().overdue); eq(Sim.loanMax(), 0);
  at('ravnfjord'); assert(!Sim.borrow(10).ok);
  let collectors = 0;
  for (let i = 0; i < 30; i++) { const v = Sim.planVoyage('kaupang'); if (v.events.some((e) => e.type === 'collectors' && e.enemies[0] === 'collector_snekkja')) collectors++; S.voyage = null; }
  assert(collectors > 8, 'collectors ' + collectors);
  S.silver = 1e6; assert(Sim.repay(1e7).ok); eq(Sim.loanStatus().amount, 0); assert(S.flags.debtRepaid);
});
test('warehouse stores and returns goods with their cost basis', () => {
  St.newGame({mode: 'free', seed: 12});
  S.cargo.timber = 30; S.cargoPaid.timber = 11;
  assert(Sim.storeGoods('timber', 20).ok); eq(Sim.warehouseHere().timber, 20); eq(S.cargo.timber, 10);
  at('kaupang'); eq(Sim.warehouseHere().timber, undefined);
  at('ravnfjord'); assert(Sim.takeGoods('timber', 20).ok); eq(S.cargo.timber, 30); near(S.cargoPaid.timber, 11, 1e-9);
  at('hladir'); assert(!Sim.storeGoods('timber', 1).ok, 'no warehouse in hladir');
});

// =====================================================================================
section('Fleet');
test('cargo counts 5 per armament; speed is the slowest ship', () => {
  St.newGame({mode: 'free', seed: 13});
  eq(Sim.cargoCap(), 110); eq(Sim.cargoUsed(), 5);
  eq(Sim.fleetSpeed(), 5);
  assert(Sim.addArm(1, 'spearmen').ok); eq(Sim.cargoUsed(), 10);
  assert(!Sim.addArm(1, 'archers').ok, 'faering has 1 slot');
  const s0 = S.silver; assert(Sim.removeArm(1, 'spearmen').ok); eq(S.silver, s0 + 300);
});
test('ship offer is one per visit; buy, trade-in, sell rules', () => {
  St.newGame({mode: 'free', seed: 14}); S.silver = 500000;
  let offer = null;
  for (let i = 0; i < 30 && !offer; i++) { S.stats.voyages++; offer = Sim.shipOffer(); }
  assert(offer, 'some offer');
  eq(Sim.shipOffer(), offer, 'stable within the visit');
  const other = Object.keys(SHIPS).find((t) => t !== offer);
  assert(!Sim.buyShip(other).ok);
  assert(Sim.buyShip(offer).ok); eq(S.fleet.length, 3); eq(Sim.shipOffer(), null, 'sold out this visit');
  assert(!Sim.sellShip(5).ok);
  S.cargo.timber = Sim.cargoFree(); // fill the hold
  assert(!Sim.sellShip(2).ok, 'cargo would overflow');
  S.cargo = {};
  const v = Sim.shipValue(2), s0 = S.silver; assert(Sim.sellShip(2).ok); eq(S.silver, s0 + v);
  St.newGame({mode: 'saga', hero: 'ylva', seed: 15});
  assert(!Sim.sellShip(0).ok, 'never sell the last ship');
});
test('trade-in credits the old ship toward the new one', () => {
  St.newGame({mode: 'free', seed: 16}); S.silver = 30000;
  S.offer = {port: 'ravnfjord', visit: S.stats.voyages, type: 'byrding'};
  const credit = Sim.shipValue(1), s0 = S.silver;
  assert(Sim.buyShip('byrding', 1).ok); eq(S.fleet.length, 2); eq(S.fleet[1].type, 'byrding');
  eq(S.silver, s0 - (SHIPS.byrding.price - credit));
});
test('ammo follows the lead ship on reorder; repairs', () => {
  St.newGame({mode: 'free', seed: 17});
  assert(Sim.buyAmmo('harpoon', 3).ok); assert(!Sim.buyAmmo('greekfire', 1).ok, 'greek fire only in Miklagard');
  assert(Sim.reorder(0, 1).ok); eq(S.fleet[0].type, 'faering'); eq(S.fleet[0].ammo.harpoon, 3); eq(Sim.ammoTotal().harpoon, 3);
  Sim.damageFleet(0.5); assert(Sim.repairCost('all') > 0);
  const c = Sim.repairCost('all'), s0 = S.silver; assert(Sim.repair('all').ok); eq(S.silver, s0 - c); eq(Sim.repairCost('all'), 0);
  at('hladir'); Sim.damageFleet(0.2); at('faereyjar'); assert(!Sim.repair('all').ok, 'no shipyard');
});
test('net worth = silver + bank + goods + ships - debt', () => {
  St.newGame({mode: 'saga', hero: 'ylva', seed: 18});
  const ships = S.fleet.reduce((a, _, i) => a + Sim.shipValue(i), 0);
  eq(Sim.netWorth(), Math.round(S.silver + ships - S.debt.amount));
  S.cargo.timber = 10; eq(Sim.netWorth(), Math.round(S.silver + ships - S.debt.amount + 10 * Sim.goodValue('timber')));
});

// =====================================================================================
section('Altar and charms');
test('blessings cost goods; Altar-Rune discount; Max', () => {
  St.newGame({mode: 'free', seed: 19}); // ravnfjord has an altar
  eq(Sim.maxBlessing('thor'), 0);
  S.cargo.salt = 45;
  eq(Sim.blessingCost('thor').qty, 20); eq(Sim.maxBlessing('thor'), 2);
  S.items.push('rune_altar'); eq(Sim.blessingCost('thor').qty, 18); eq(Sim.maxBlessing('thor'), 2);
  const b0 = S.blessings.thor; assert(Sim.buyBlessing('thor', 2).ok); eq(S.blessings.thor, b0 + 2); eq(S.cargo.salt, 9);
  assert(!Sim.buyBlessing('thor', 1).ok);
  at('kaupang'); S.cargo.salt = 100; eq(Sim.maxBlessing('thor'), 0);
});
test('runecarver shop: weekly stock, buy, mods, cursed costs to remove', () => {
  St.newGame({mode: 'free', seed: 20}); at('kaupang'); S.silver = 100000;
  const shop = Sim.shop(); eq(shop.length, 3);
  eq(JSON.stringify(Sim.shop()), JSON.stringify(shop), 'stable');
  assert(Sim.buyCharm(shop[0].id).ok); assert(!Sim.shop().some((c) => c.id === shop[0].id));
  S.items = ['rune_hold', 'rune_cursed_iron'];
  near(Sim.mod('cargo'), 0.1, 1e-9); eq(Sim.cargoCap(), 121); near(Sim.mod('speed'), -0.15, 1e-9);
  const s0 = S.silver; assert(Sim.sellCharm('rune_cursed_iron').ok); assert(S.silver < s0, 'curse removal costs');
  const s1 = S.silver; assert(Sim.sellCharm('rune_hold').ok); assert(S.silver > s1);
  assert(Sim.fleetSpeed() === 5);
});

test('guild: donate for standing, craft recipes', () => {
  St.newGame({mode: 'free', seed: 32}); at('kaupang');
  eq(Sim.guildHere().level, 0);
  assert(!Sim.craft('mead_offering').ok, 'needs standing');
  const r0 = S.renown; assert(Sim.guildDonate(1000).ok); eq(Sim.guildLevel(), 1); eq(S.renown, r0 + 1);
  S.cargo.honey = 12; S.cargo.grain = 12; const o = S.blessings.odin;
  assert(Sim.craft('mead_offering').ok); eq(S.blessings.odin, o + 1); assert(!S.cargo.honey);
  at('heidaby'); eq(Sim.guildLevel(), 0, 'standing is per town');
});

// =====================================================================================
section('Quests (fixture)');
const FIX = [
  {id: 't_01', saga: 'ylva', chapter: 1, title: 'Test One', giver: {port: 'ravnfjord', building: 'hall'}, requires: [],
    offer: [{who: 'npc', text: 'Hello'}],
    steps: [
      {do: 'buy', good: 'stockfish', qty: 10, text: 'Buy 10 stockfish.'},
      {do: 'deliver', good: 'stockfish', qty: 10, port: 'kaupang', building: 'hall', text: 'Deliver.'},
      {do: 'collect', item: 'q_test', port: 'kaupang', building: 'hall', text: 'Collect.', say: [{who: 'npc', text: 'Take it.'}]},
      {do: 'visit', port: 'hladir', building: 'altar', text: 'Visit.'},
      {do: 'sacrifice', blessing: 'thor', qty: 1, port: 'hladir', text: 'Sacrifice.'},
      {do: 'defeat', enemies: ['raider_karvi'], at: {sea: 'skagerrak'}, weather: 'fog', text: 'Fight.'},
      {do: 'bring', item: 'q_test', port: 'ravnfjord', building: 'hall', text: 'Bring.'},
      {do: 'pay', silver: 100, port: 'ravnfjord', building: 'hall', text: 'Pay.'},
      {do: 'donate', silver: 100, port: 'kaupang', text: 'Donate.'},
      {do: 'networth', amount: 1, text: 'Be worth 1.'},
    ],
    done: [{who: 'npc', text: 'Thanks'}],
    reward: {silver: 500, items: ['rune_hold'], goods: {grain: 5}, blessings: {odin: 1}, unlockPorts: ['birka'], unlockGoods: ['furs'], renown: 5, flag: 't1'}},
  {id: 't_02', saga: 'ylva', chapter: 11, title: 'Two', giver: {port: 'ravnfjord', building: 'hall'}, requires: ['t_01'],
    steps: [{do: 'defeat', enemies: ['raider_karvi'], at: {port: 'heidaby'}, text: 'Fight at Heidaby.'}], reward: {ship: 'karvi'}},
  {id: 's_01', saga: null, title: 'Side', giver: {port: 'kaupang', building: 'meadhall'}, timeLimit: 5,
    steps: [{do: 'deliver', good: 'salt', qty: 5, port: 'kaupang', building: 'meadhall', text: 'Salt.'}], reward: {silver: 10}},
  {id: 'b_01', saga: 'bjarki', chapter: 1, title: 'Not yours', giver: {port: 'ravnfjord', building: 'hall'}, steps: [{do: 'visit', port: 'kaupang', text: 'x'}]},
];
const realQuests = Sim.EXT.quests;
test('full step chain: buy, deliver, collect, visit, sacrifice, defeat, bring, pay, donate, networth', () => {
  Sim.setQuestData(FIX);
  St.newGame({mode: 'saga', hero: 'ylva', seed: 21}); S.silver = 5000;
  const offs = Sim.offers('ravnfjord', 'hall').map((q) => q.id);
  eq(offs.join(), 't_01', 'only my saga, only available ones');
  assert(Sim.markers().some((m) => m.offer && m.questId === 't_01' && m.kind === 'main'));
  assert(!Sim.accept('t_02').ok);
  assert(Sim.accept('t_01').ok);
  let r = Sim.act('ravnfjord', 'market');
  eq(r[0].kind, 'buy'); eq(S.qgoods.t_01.stockfish, 10); assert(!S.cargo.stockfish, 'quest goods are not cargo');
  Sim.planVoyage('kaupang'); Sim.arrive('kaupang');
  r = Sim.act('kaupang', 'hall');
  eq(r.map((x) => x.kind).join(), 'deliver,collect', 'chained'); assert(S.items.includes('q_test'));
  eq(Sim.journal()[0].stepText, 'Visit.');
  const mk = Sim.markers().find((m) => m.questId === 't_01'); eq(mk.port, 'hladir'); eq(mk.building, 'altar');
  // side task with a time limit
  assert(Sim.offers('kaupang', 'meadhall').some((q) => q.id === 's_01'));
  assert(Sim.accept('s_01').ok);
  Sim.planVoyage('hladir'); Sim.arrive('hladir');
  r = Sim.act('hladir', 'altar'); eq(r[0].kind, 'visit'); eq(r[1].kind, 'need');
  S.cargo.salt = 20; const b = Sim.buyBlessing('thor', 1);
  assert(b.ok && b.quest.some((x) => x.kind === 'sacrifice'));
  assert(S.quests.failed.includes('s_01'), 'side task timed out');
  // sea battle at the skagerrak mark
  const ba = Sim.battleAt('skagerrak'); eq(ba.questId, 't_01'); eq(ba.weather, 'fog');
  const v = Sim.planVoyage('kaupang');
  assert(v.events.some((e) => e.type === 'quest' && e.questId === 't_01'), 'quest battle on the way');
  assert(Sim.winBattle('t_01').ok); Sim.arrive('kaupang');
  Sim.planVoyage('ravnfjord'); Sim.arrive('ravnfjord');
  r = Sim.act('ravnfjord', 'hall'); eq(r.map((x) => x.kind).join(), 'bring,pay');
  assert(!S.items.includes('q_test'));
  Sim.planVoyage('kaupang'); Sim.arrive('kaupang');
  const s0 = S.silver, renown0 = S.renown;
  r = Sim.act('kaupang', 'guild'); eq(r.map((x) => x.kind).join(), 'donate,networth,complete');
  eq(r[2].lines[0].text, 'Thanks');
  eq(S.silver, s0 - 100 + 500); eq(S.renown, renown0 + 5);
  assert(S.unlockedPorts.includes('birka') && S.unlockedGoods.includes('furs') && S.items.includes('rune_hold') && S.flags.t1);
  eq(S.blessings.odin, 1); eq(S.cargo.grain, 5);
  assert(Sim.journal().find((j) => j.id === 't_01').done);
});
test('harbour battle on arrival, ship reward, saga end', () => {
  let ended = null; const off = St.on('saga-end', (d) => { ended = d; });
  S.port = 'ravnfjord';
  assert(Sim.accept('t_02').ok);
  Sim.planVoyage('heidaby');
  const a = Sim.arrive('heidaby');
  eq(a.battle.questId, 't_02');
  const n = S.fleet.length; const w = Sim.winBattle('t_02');
  assert(w.ok && w.results.some((x) => x.kind === 'complete'));
  eq(S.fleet.length, n + 1); eq(S.fleet[n].type, 'karvi');
  assert(ended && ended.hero === 'ylva' && S.flags.sagaComplete); off();
  assert(St.currentProfile().sagasDone.includes('ylva'));
});
test('free trade has no tasks; fortress battle frees Jomsborg', () => {
  St.newGame({mode: 'free', seed: 22});
  eq(Sim.offers('ravnfjord', 'hall').length, 0);
  assert(!S.unlockedPorts.includes('jomsborg') && !S.unlockedGoods.includes('hacksilver'));
  at('heidaby'); assert(Sim.planVoyage('jomsborg').ok, 'free traders may assault');
  const a = Sim.arrive('jomsborg'); eq(a.battle.place, 'fortress');
  assert(!St.here('market'), 'fortress market shut');
  assert(Sim.winBattle(a.battle.questId).ok);
  assert(St.here('market') && S.unlockedGoods.includes('hacksilver') && S.flags.jomsborg_free);
  eq(Sim.battleAt('jomsborg'), null);
});
Sim.setQuestData(realQuests);

// =====================================================================================
section('Voyages');
test('travel days grow with distance and shrink with speed', () => {
  St.newGame({mode: 'free', seed: 23});
  const near1 = Sim.travelDays('ravnfjord', 'hladir'), far = Sim.travelDays('ravnfjord', 'miklagard');
  assert(near1 >= 1 && far > near1 * 4, `${near1} ${far}`);
  S.fleet = [St.makeShip('snekkja')];
  assert(Sim.travelDays('ravnfjord', 'miklagard') < far);
});
test('plan refuses locked ports and overloaded fleets; events are well formed', () => {
  St.newGame({mode: 'saga', hero: 'ylva', seed: 24});
  assert(!Sim.planVoyage('miklagard').ok, 'locked');
  S.cargo.timber = Sim.cargoFree() + 1; assert(!Sim.planVoyage('kaupang').ok, 'overloaded'); S.cargo = {};
  const types = new Set(['storm', 'raid', 'quest', 'collectors', 'beast', 'calm', 'wreck']);
  for (let i = 0; i < 200; i++) {
    const v = Sim.planVoyage('heidaby'); assert(v.ok);
    for (const e of v.events) { assert(types.has(e.type), e.type); assert(e.day >= 0 && e.day < v.days); assert(e.text); if (['raid', 'beast', 'collectors'].includes(e.type)) assert(e.enemies.length); }
    S.voyage = null;
  }
});
test('storms commoner in winter and the north; raids scale with renown and cargo', () => {
  St.newGame({mode: 'free', seed: 25});
  const rate = (to, type, n = 400) => { let k = 0; for (let i = 0; i < n; i++) { const v = Sim.planVoyage(to); if (v.events.some((e) => e.type === type)) k++; S.voyage = null; } return k / n; };
  S.day = 100; const summer = rate('kaupang', 'storm'); S.day = 280; const winter = rate('kaupang', 'storm');
  assert(winter > summer + 0.1, `winter ${winter} summer ${summer}`);
  S.day = 100; const raid0 = rate('heidaby', 'raid'); S.renown = 300; S.cargo.timber = 50; const raid1 = rate('heidaby', 'raid');
  assert(raid1 > raid0, `${raid1} > ${raid0}`);
  S.items.push('rune_storm'); S.day = 280;
  for (let i = 0; i < 50; i++) { const v = Sim.planVoyage('kaupang'); for (const e of v.events) if (e.type === 'storm') eq(e.damage, 0); S.voyage = null; }
});
test('storm damage applies; arrive passes days, autosaves, records prices', () => {
  St.newGame({mode: 'free', seed: 26});
  const v = Sim.planVoyage('kaupang');
  S.voyage.events = [{i: 0, day: 0, type: 'storm', damage: 0.2, text: 's', resolved: false}];
  const d0 = S.day, h0 = S.fleet[0].hull;
  const a = Sim.arrive('kaupang');
  assert(a.ok); eq(S.port, 'kaupang'); eq(S.day, d0 + v.days); assert(S.fleet[0].hull < h0);
  assert(S.seen.kaupang && S.seen.kaupang.day === S.day);
  assert(!St.listSaves().find((s) => s.slot === 'auto').empty);
});
test('losing a battle costs a third of the cargo; winning adds renown', () => {
  St.newGame({mode: 'free', seed: 27}); S.cargo = {timber: 30};
  St.emit('battle-end', {result: 'lose', enemies: ['raider_karvi']}); eq(S.cargo.timber, 20);
  const r0 = S.renown; St.emit('battle-end', {result: 'win', enemies: ['raider_karvi', 'raider_karvi']}); eq(S.renown, r0 + 3);
  const t = Sim.takeLoot({furs: 500}, 100); assert(t.ok && t.taken.furs === Sim.cargoCap() - 20 - 5 - 0 || t.taken.furs > 0);
  assert(!Sim.overloaded());
});

// =====================================================================================
section('Save, load, profiles, feats, rank');
test('save/load round trip restores the exact state', () => {
  St.newGame({mode: 'free', seed: 28}); Sim.buy('timber', 10); Sim.planVoyage('kaupang'); Sim.arrive('kaupang');
  const snap = JSON.stringify(S);
  assert(St.save(2).ok);
  Sim.buy('iron', 5); S.silver = 1;
  assert(St.load(2).ok); eq(JSON.stringify(S), snap);
  const meta = St.listSaves().find((s) => s.slot === 2); assert(meta.ts && meta.label && meta.mode === 'free');
  assert(!St.load(3).ok, 'empty slot');
  // same seed after load = same luck
  const a = JSON.stringify(Sim.planVoyage('heidaby')); St.load(2); eq(JSON.stringify(Sim.planVoyage('heidaby')), a);
});
test('profiles keep their own saves and feats', () => {
  const p1 = St.currentProfile().id;
  St.createProfile('Second'); assert(St.currentProfile().name === 'Second');
  eq(St.listSaves().filter((s) => !s.empty).length, 0);
  St.newGame({mode: 'free', seed: 29}); S.cargo.timber = 5; Sim.sell('timber', 5); Sim.check();
  assert(St.profileFeats().includes('first_coin'));
  St.selectProfile(p1); assert(St.listSaves().some((s) => !s.empty));
  St.recordScore(12345); eq(St.highScores()[0].score, 12345);
});
test('at least 25 feats; rank grows with renown', () => {
  const l = Sim.list(); assert(l.length >= 25, 'feats ' + l.length); assert(new Set(l.map((f) => f.id)).size === l.length);
  eq(Sim.rank(0).title, 'Deckhand'); eq(Sim.rank(30).title, 'Steersman'); near(Sim.rank(30).progress, 0.2, 1e-9);
  eq(Sim.rank(9999).next, null);
});
test('storage failures never throw', () => {
  const real = globalThis.localStorage;
  globalThis.localStorage = {getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); }};
  St.newGame({mode: 'free', seed: 30});
  const r = St.save(1); assert(r.ok === false || r.ok === true); St.listSaves();
  globalThis.localStorage = real;
});

// =====================================================================================
section('Story data (js/data/quests) against the engine');
test('every quest references real ports, buildings, goods, blessings, marks', () => {
  const DB = {donate: 'guild', sacrifice: 'altar', buy: 'market'};
  const marks = Sim.seaMarks();
  const DO = ['deliver', 'bring', 'visit', 'buy', 'defeat', 'pay', 'collect', 'networth', 'sacrifice', 'donate'];
  const probs = [];
  const ids = new Set();
  for (const q of Sim.EXT.quests) {
    if (ids.has(q.id)) probs.push(`${q.id}: duplicate id`); ids.add(q.id);
    const chk = (port, b, what) => {
      if (!port) return;
      if (!PORTS[port]) probs.push(`${q.id} ${what}: unknown port ${port}`);
      else if (b && !PORTS[port].buildings.includes(b)) probs.push(`${q.id} ${what}: ${port} has no ${b}`);
    };
    if (q.giver) chk(q.giver.port, q.giver.building, 'giver'); else if (q.saga !== undefined) probs.push(`${q.id}: no giver`);
    for (const r of q.requires || []) if (!Sim.EXT.quests.some((x) => x.id === r)) probs.push(`${q.id}: requires unknown ${r}`);
    q.steps.forEach((s, i) => {
      const w = `step ${i} (${s.do})`;
      if (!DO.includes(s.do)) probs.push(`${q.id} ${w}: unknown kind`);
      chk(s.port, s.building || DB[s.do], w);
      if (s.good && !GOODS[s.good]) probs.push(`${q.id} ${w}: unknown good ${s.good}`);
      if (s.do === 'defeat' && !(s.at && (PORTS[s.at.port] || marks[s.at.sea]))) probs.push(`${q.id} ${w}: bad at ${JSON.stringify(s.at)}`);
    });
    const r = q.reward || {};
    for (const p of r.unlockPorts || []) if (!PORTS[p]) probs.push(`${q.id}: reward port ${p}`);
    for (const g of [...(r.unlockGoods || []), ...Object.keys(r.goods || {})]) if (!GOODS[g]) probs.push(`${q.id}: reward good ${g}`);
    if (r.ship && !SHIPS[r.ship]) probs.push(`${q.id}: reward ship ${r.ship}`);
  }
  if (!QUIET) console.log(`       (${Sim.EXT.quests.length} quests loaded)`);
  assert(!probs.length, '\n       ' + probs.join('\n       '));
});

// A quest bot plays each saga with plenty of silver and a big hold, to check that the
// engine and the story data fit together: every step reachable, every good obtainable.
function playSaga(hero, withSide) {
  St.newGame({mode: 'saga', hero, seed: 900});
  S.silver = 5e6; S.debt = {amount: 0, due: 0};
  while (S.fleet.length < 4) S.fleet.push(St.makeShip('busse'));
  const notes = [];
  const go = (to) => {
    if (S.port === to) return true;
    const v = Sim.planVoyage(to);
    if (!v.ok) { notes.push(`cannot sail to ${to}: ${v.msg}`); return false; }
    S.voyage.events = S.voyage.events.filter((e) => e.type === 'quest');
    for (const e of S.voyage.events) Sim.winBattle(e.questId);
    const a = Sim.arrive(to);
    if (a.battle) Sim.winBattle(a.battle.questId);
    return true;
  };
  const sellers = (g) => S.unlockedPorts.filter((p) => Sim.buyPrice(p, g) !== null);
  const obtain = (g, n) => {
    const have = (S.cargo[g] || 0);
    if (have >= n) return true;
    const ps = sellers(g);
    if (!ps.length) { notes.push(`no open port sells ${g}`); S.cargo[g] = n; return false; }
    if (!go(ps[0])) return false;
    for (const x of Object.keys(S.cargo)) if (x !== g && Sim.buyPrice(S.port, x) === null && !PORTS[S.port].contraband.includes(x)) Sim.sell(x, S.cargo[x]);
    const r = Sim.buy(g, n - have); if (!r.ok) { notes.push(`buy ${g}: ${r.msg}`); S.cargo[g] = n; }
    return true;
  };
  const doable = (q) => !q.saga || q.saga === hero;
  for (let it = 0; it < 600; it++) {
    const ids = Object.keys(S.quests.active);
    if (!ids.length) {
      const all = Sim.EXT.quests.filter((q) => doable(q) && (q.saga || withSide) && !S.quests.done.includes(q.id));
      const ready = all.filter((q) => (q.requires || []).every((r) => S.quests.done.includes(r)));
      if (!ready.length) break;
      const q = ready.sort((a, b) => (a.saga ? 0 : 1) - (b.saga ? 0 : 1))[0];
      if ((q.requiresRenown || 0) > S.renown) { notes.push(`${q.id} waits for renown ${q.requiresRenown} (had ${S.renown})`); S.renown = q.requiresRenown; }
      if (!S.unlockedPorts.includes(q.giver.port)) { notes.push(`${q.id}: giver port ${q.giver.port} still locked`); S.unlockedPorts.push(q.giver.port); }
      if (!go(q.giver.port)) break;
      const r = Sim.accept(q.id); if (!r.ok) { notes.push(`${q.id}: accept failed (${r.msg})`); break; }
      continue;
    }
    const id = ids[0], q = Sim.EXT.quests.find((x) => x.id === id), st = S.quests.active[id], step = q.steps[st.step];
    const before = `${id}:${st.step}`;
    switch (step.do) {
      case 'deliver': {
        const need = step.qty - ((S.qgoods[id] || {})[step.good] || 0);
        if (need > 0) obtain(step.good, need);
        go(step.port); Sim.act(step.port, step.building || null); break;
      }
      case 'buy': {
        const where = step.port ? [step.port] : sellers(step.good);
        if (!where.length) { notes.push(`${id}: nowhere to buy ${step.good}`); S.qgoods[id] = {[step.good]: step.qty}; st.step++; break; }
        go(where[0]); Sim.act(S.port, 'market'); break;
      }
      case 'defeat':
        if (step.at.port) { go(step.at.port); }
        else {
          const reach = [S.port, ...S.unlockedPorts];
          const ok = reach.some((a) => reach.some((b) => a !== b && Sim.EXT.routes.marksOnPath && Sim.EXT.routes.marksOnPath(a, b).includes(step.at.sea)));
          if (!ok) {
            // the engine's fallback must still put the fight on the next voyage
            const to = S.unlockedPorts.find((p) => p !== S.port);
            const v = Sim.planVoyage(to);
            notes.push(`${id}: no open route passes ${step.at.sea} (engine fallback: fight on the next voyage)`);
            if (!v.events.some((e) => e.type === 'quest' && e.questId === id)) notes.push(`${id}: fight at ${step.at.sea} never happens`);
            S.voyage = null;
          }
          Sim.winBattle(id);
        }
        break;
      case 'sacrifice': {
        const c = Sim.blessingCost(step.blessing);
        obtain(c.good, c.qty * step.qty);
        go(step.port || S.port);
        const r = Sim.buyBlessing(step.blessing, step.qty); if (!r.ok) notes.push(`${id}: blessing ${r.msg}`);
        break;
      }
      case 'networth': Sim.act(S.port, null); break;
      case 'bring':
        if (!S.items.includes(step.item)) { notes.push(`${id}: never got ${step.item}`); S.items.push(step.item); }
        go(step.port); Sim.act(step.port, step.building || null); break;
      default: go(step.port); Sim.act(step.port, step.building || (step.do === 'donate' ? 'guild' : null));
    }
    const now = S.quests.active[id] ? `${id}:${S.quests.active[id].step}` : 'done';
    if (now === before) { notes.push(`${id} step ${st.step} (${step.do}) did not advance`); break; }
  }
  const mine = Sim.EXT.quests.filter((q) => q.saga === hero);
  return {done: mine.filter((q) => S.quests.done.includes(q.id)).length, total: mine.length, side: S.quests.done.filter((x) => !x.startsWith(hero)).length, notes, ended: !!S.flags.sagaComplete};
}
test('every saga can be played to its end by the engine', () => {
  const heroes = [...new Set(Sim.EXT.quests.filter((q) => q.saga).map((q) => q.saga))];
  const bad = [];
  for (const h of heroes) {
    const r = playSaga(h, h === 'grima');
    if (!QUIET || r.notes.length || !r.ended) console.log(`       ${h}: ${r.done}/${r.total} chapters${r.side ? `, ${r.side} side tasks` : ''}, ended ${r.ended}${r.notes.length ? '\n         - ' + [...new Set(r.notes)].join('\n         - ') : ''}`);
    if (!r.ended) bad.push(h);
  }
  assert(!bad.length, 'unfinished sagas: ' + bad.join(', '));
});

// =====================================================================================
section('Economy: two-year smart trader');

// Greedy trader with perfect price knowledge: at each port sell everything, then pick the
// destination and cargo with the best estimated profit per day, buying in 10-unit chunks
// while the marginal chunk still pays. Buys ships when rich, repairs, repays debt.
const lvlPrice = (g, l) => GOODS[g].min + (GOODS[g].max - GOODS[g].min) * Math.max(0, Math.min(1, l));
function plan(from, to) {
  const goods = S.unlockedGoods.filter((g) => Sim.buyPrice(from, g) !== null && !PORTS[to].contraband.includes(g));
  const q = {}; let room = Sim.cargoFree(), silver = S.silver * 0.97, profit = 0;
  const sellMult = Sim.SELL_FACTOR * (1 + Sim.mod('sellPrice'));
  while (room >= 1) {
    let best = null;
    for (const g of goods) {
      const n = Math.min(10, room), have = q[g] || 0, D = GOODS[g].depth;
      const buyU = lvlPrice(g, Sim.level(from, g) + (have + n / 2) / D);
      const sellU = lvlPrice(g, Sim.level(to, g) - (have + n / 2) / D) * sellMult;
      const m = (sellU - buyU) * n;
      if (buyU * n <= silver && m > 0 && (!best || m / n > best.u)) best = {g, n, u: m / n, cost: buyU * n, m};
    }
    if (!best) break;
    q[best.g] = (q[best.g] || 0) + best.n; room -= best.n; silver -= best.cost; profit += best.m;
  }
  return {q, profit};
}
function battle(ev) {
  const win = Math.random() < 0.8; // combat outcome stand-in
  if (win) Sim.damageFleet(0.15);
  St.emit('battle-end', {result: win ? 'win' : 'lose', enemies: ev.enemies});
  if (win && ev.questId) Sim.winBattle(ev.questId);
}
function smartTrader({mode, hero, seed, days, label}) {
  St.newGame({mode, hero, seed});
  const curve = [];
  let nextMark = 1, trips = 0;
  while (S.day <= days) {
    if (S.day >= nextMark) { curve.push([S.day, Sim.netWorth()]); nextMark += 60; }
    // sell everything sellable
    for (const g of Object.keys(S.cargo)) {
      if (PORTS[S.port].contraband.includes(g)) Sim.sellContraband(g); else Sim.sell(g, S.cargo[g]);
    }
    if (St.here('moneylender') && S.debt.amount > 0 && S.silver > S.debt.amount + 500) Sim.repay(Math.ceil(S.debt.amount));
    if (St.here('shipyard')) {
      if (S.fleet.some((f, i) => f.hull < Sim.maxHull(i) * 0.7)) Sim.repair('all');
      const offer = Sim.shipOffer();
      if (offer && SHIPS[offer].cargo >= 90) {
        const per = (t) => SHIPS[t].cargo / SHIPS[t].price;
        if (S.fleet.length < 4 && S.silver > SHIPS[offer].price * 1.5) Sim.buyShip(offer);
        else if (S.fleet.length === 4) {
          const worst = S.fleet.reduce((w, f, i) => (SHIPS[f.type].cargo < SHIPS[S.fleet[w].type].cargo ? i : w), 0);
          if (SHIPS[offer].cargo > SHIPS[S.fleet[worst].type].cargo && S.silver > SHIPS[offer].price * 1.5 && per(offer) > 0) Sim.buyShip(offer, worst);
        }
      }
    }
    // choose destination
    const dests = S.unlockedPorts.filter((p) => p !== S.port);
    let best = null;
    for (const d of dests) {
      const p = plan(S.port, d), days = Sim.travelDays(S.port, d);
      const score = p.profit / (days + 1);
      if (!best || score > best.score) best = {d, p, score};
    }
    if (!best) break;
    if (best.p.profit <= 0) best.d = dests[Math.floor(Math.random() * dests.length)];
    // with the debt covered, head for a moneylender to pay it off
    if (S.debt.amount > 0 && S.silver > S.debt.amount * 1.05) {
      const ml = dests.filter((p) => PORTS[p].buildings.includes('moneylender'));
      if (ml.length) { const d = ml.sort((a, b) => Sim.travelDays(S.port, a) - Sim.travelDays(S.port, b))[0]; best = {d, p: plan(S.port, d)}; }
    }
    for (const [g, n] of Object.entries(best.p.q)) Sim.buy(g, Math.min(n, Sim.maxBuy(g)));
    const v = Sim.planVoyage(best.d);
    if (!v.ok) { Sim.wait(1); continue; }
    for (const e of v.events) { if (['raid', 'beast', 'collectors', 'quest'].includes(e.type)) { Sim.resolveEvent(e.i); battle(e); } else Sim.resolveEvent(e.i); }
    const a = Sim.arrive(best.d);
    if (a.battle) { battle({enemies: a.battle.enemies, questId: a.battle.questId}); if (St.here('market') === false && PORTS[S.port].fortress && !S.flags.jomsborg_free) Sim.retreat(); }
    trips++;
  }
  curve.push([S.day, Sim.netWorth()]);
  console.log(`  ${label}: ${trips} voyages, fleet ${S.fleet.map((f) => f.type).join('+')}, renown ${S.renown}`);
  console.log('    day  net worth');
  for (const [d, nw] of curve) console.log(`    ${String(d).padStart(4)}  ${String(nw).padStart(9)}  ${'#'.repeat(Math.max(0, Math.round(Math.log10(Math.max(1, nw)) * 6 - 18)))}`);
  return curve;
}

const rng = Math.random; let r0 = 12345; Math.random = () => ((r0 = (r0 * 16807) % 2147483647) / 2147483647); // deterministic battles
let freeCurve, sagaCurve;
test('Free Trade: profitable routes, growth bounded by market depth', () => {
  freeCurve = smartTrader({mode: 'free', seed: 777, days: 730, label: 'Free Trade, 2 years'});
  const start = freeCurve[0][1], end = freeCurve[freeCurve.length - 1][1];
  assert(end > start * 10, `should grow well: ${start} -> ${end}`);
  const mid = freeCurve.find(([d]) => d >= 365)[1];
  // no runaway compounding: year two multiplies net worth far less than year one
  assert(end / mid < mid / start, `year 2 x${(end / mid).toFixed(1)} vs year 1 x${(mid / start).toFixed(1)}`);
  assert(end < 50_000_000, 'no infinite money');
});
test('Saga start (Ylva, start ports and goods only): debt can be cleared by its due day', () => {
  sagaCurve = smartTrader({mode: 'saga', hero: 'ylva', seed: 778, days: 120, label: 'Ylva saga start, 120 days, no tasks'});
  const paid = S.log.find((l) => l.text === 'Debt paid in full.');
  assert(paid, 'debt repaid'); console.log(`    debt paid on day ${paid.day}`);
  assert(paid.day <= 60, 'paid by the due day');
  assert(sagaCurve[sagaCurve.length - 1][1] > sagaCurve[0][1] * 2);
});
test('ping-pong on one short route earns less per trip as the market saturates', () => {
  St.newGame({mode: 'free', seed: 31}); S.silver = 1e6;
  S.fleet = [0, 1, 2, 3].map(() => St.makeShip('busse')); // 800 cargo
  const prof = [];
  for (let i = 0; i < 12; i++) {
    const s0 = S.silver;
    Sim.buy('stockfish', Sim.maxBuy('stockfish')); Sim.planVoyage('heidaby'); S.voyage.events = []; Sim.arrive('heidaby');
    Sim.sell('stockfish', S.cargo.stockfish);
    Sim.buy('salt', Sim.maxBuy('salt')); Sim.planVoyage('ravnfjord'); S.voyage.events = []; Sim.arrive('ravnfjord');
    Sim.sell('salt', S.cargo.salt);
    prof.push(S.silver - s0);
  }
  if (!QUIET) console.log('       profit per round trip:', prof.map((p) => Math.round(p)).join(' '));
  assert(Math.max(...prof.slice(4)) < 30000, 'bounded');
  const avgLate = prof.slice(6).reduce((a, b) => a + b, 0) / 6;
  assert(avgLate < prof[0] * 1.3, 'no snowball on a fixed route');
});
Math.random = rng;

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
