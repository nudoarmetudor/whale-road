// One place where the UI reaches every other worker's module.
// Each module is imported dynamically; if it is missing or throws, a stub from stubs.js
// takes its place so the game still runs. `report()` lists what is stubbed.
// At integration the lead can drop stubs.js and the fallbacks below.

export const G = {};      // sim + state namespaces: G.state, G.time, G.economy, ...
export const D = {};      // data maps by id: D.ports, D.goods, D.ships, D.arms, D.ammo, D.blessings, D.items, D.heroes
export const A = {};      // art: portScene, titleScene, seaScene, portrait, shipSVG
export const Au = {};     // audio: Music, Sfx
export const X = {};      // other screens: openMap, playVoyage, startBattle, lore, sagas
const stubbed = [];
let stubs = null;

async function tryImport(path) {
  try { return await import(path); } catch (err) {
    if (!/Failed to fetch|Importing a module script failed|error loading|404/i.test(String(err))) console.warn('[adapters]', path, err);
    return null;
  }
}
async function getStubs() { return stubs ||= await import('./stubs.js'); }

// Pick an export by likely names, else the first object/array export.
function pick(mod, names) {
  if (!mod) return null;
  for (const n of names) if (mod[n] != null) return mod[n];
  for (const v of Object.values(mod)) if (v && typeof v === 'object') return v;
  return null;
}
// Array of {id,...} or {id:{...}} -> {id:{id,...}}
function byId(x) {
  if (!x) return null;
  if (Array.isArray(x)) return Object.fromEntries(x.filter(Boolean).map(o => [o.id, o]));
  return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, (v && typeof v === 'object') ? {id: k, ...v} : {id: k, value: v}]));
}

export async function loadAll() {
  const S = await getStubs();
  const [portsM, goodsM, shipsM, blessM, itemsM, heroesM, qitemsM, loreM, sagasM, sideM] = await Promise.all([
    tryImport('../data/ports.js'), tryImport('../data/goods.js'), tryImport('../data/ships.js'),
    tryImport('../data/blessings.js'), tryImport('../data/items.js'), tryImport('../data/heroes.js'),
    tryImport('../data/quests/items.js'), tryImport('../data/lore.js'), tryImport('../data/quests/sagas.js'),
    tryImport('../data/quests/side.js'),
  ]);
  const data = (key, mod, names, fallback) => {
    const v = byId(pick(mod, names));
    if (v && Object.keys(v).length) D[key] = v; else { D[key] = byId(fallback); stubbed.push('data/' + key); }
  };
  data('ports', portsM, ['PORTS', 'ports'], S.PORTS);
  data('goods', goodsM, ['GOODS', 'goods'], S.GOODS);
  data('ships', shipsM, ['SHIPS', 'ships'], S.SHIPS);
  D.arms = byId(shipsM?.ARMS) || byId(S.ARMS);
  D.ammo = byId(shipsM?.AMMO || shipsM?.SPECIAL_AMMO || shipsM?.SPECIALS) || byId(S.AMMO);
  data('blessings', blessM, ['BLESSINGS', 'blessings'], S.BLESSINGS);
  data('items', itemsM, ['ITEMS', 'CHARMS', 'items'], S.ITEMS);
  data('heroes', heroesM, ['HEROES', 'heroes'], S.HEROES);
  const qi = byId(qitemsM?.QUEST_ITEMS);
  if (qi) Object.assign(D.items, qi);
  D.goodIds = S.GOOD_IDS.filter(id => D.goods[id]).concat(Object.keys(D.goods).filter(id => !S.GOOD_IDS.includes(id)));
  X.lore = loreM || {};
  if (!loreM) stubbed.push('data/lore');
  X.sagas = sagasM?.SAGAS || [];
  X.side = sideM?.SIDE || [];

  // state + sim
  const stateM = await tryImport('../state.js');
  let state;
  if (stateM?.S && stateM.newGame) state = stateM;
  else { state = S.makeState(D); stubbed.push('state'); }
  G.state = state;
  const simNames = ['time', 'economy', 'fleet', 'bank', 'altar', 'charms', 'quests', 'voyage', 'feats', 'rank'];
  const simMods = await Promise.all(simNames.map(n => tryImport(`../sim/${n}.js`)));
  const stubSim = S.makeSim(D, state);
  simNames.forEach((n, i) => {
    // A real sim module only makes sense with the real state it writes to.
    if (simMods[i] && state === stateM) G[n] = {...stubSim[n], ...simMods[i]};
    else { G[n] = stubSim[n]; stubbed.push('sim/' + n); }
  });
  const guildM = await tryImport('../sim/guild.js');
  G.guild = guildM || null;
  // The sim's loader for story data (quest lookup, lore) when it exists.
  const extM = state === stateM ? await tryImport('../sim/ext.js') : null;
  X.questById = extM?.questById || (id => [...flatQuests(X.sagas), ...flatQuests(X.side)].find(q => q.id === id) || null);
  if (!loreM && extM?.EXT?.lore && Object.keys(extM.EXT.lore).length) X.lore = extM.EXT.lore;

  // art
  const [scenesM, portraitsM, shipsArtM] = await Promise.all([
    tryImport('../art/scenes.js'), tryImport('../art/portraits.js'), tryImport('../art/ships.js')]);
  const stubArt = S.makeArt(D);
  // A real art function that throws (work in progress) falls back to the stub for that call.
  const safe = (real, stub, name) => {
    if (!real) { stubbed.push('art/' + name); return stub; }
    return (...a) => { try { return real(...a); } catch (err) { console.warn(`[art] ${name} failed, using stand-in:`, err?.message); return stub(...a); } };
  };
  A.portScene = safe(scenesM?.portScene, stubArt.portScene, 'portScene');
  A.titleScene = safe(scenesM?.titleScene, stubArt.titleScene, 'titleScene');
  A.seaScene = safe(scenesM?.seaScene, stubArt.seaScene, 'seaScene');
  A.portrait = safe(portraitsM?.portrait, stubArt.portrait, 'portrait');
  A.shipSVG = safe(shipsArtM?.shipSVG, S.shipSVG, 'shipSVG');

  // audio
  const [musicM, sfxM] = await Promise.all([tryImport('../audio/music.js'), tryImport('../audio/sfx.js')]);
  Au.Music = musicM?.play ? musicM : (stubbed.push('audio/music'), S.Music);
  Au.Sfx = sfxM?.play ? sfxM : (stubbed.push('audio/sfx'), S.Sfx);

  // map + combat
  const [mapM, battleM] = await Promise.all([tryImport('./map.js'), tryImport('../combat/battle.js')]);
  const stubMap = S.makeMap(D, G);
  X.openMap = mapM?.openMap || (stubbed.push('ui/map.openMap'), stubMap.openMap);
  X.playVoyage = mapM?.playVoyage || (stubbed.push('ui/map.playVoyage'), stubMap.playVoyage);
  X.startBattle = battleM?.startBattle || (stubbed.push('combat/battle'), S.makeCombat().startBattle);
  return report();
}

// Every object with an id and steps, from arrays or nested objects (sagas may be keyed by hero).
function flatQuests(src) {
  const out = [];
  const walk = v => {
    if (!v || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (Array.isArray(v.steps) && v.id) { out.push(v); return; }
    Object.values(v).forEach(walk);
  };
  walk(src);
  return out;
}
export const allQuests = () => [...flatQuests(X.sagas), ...flatQuests(X.side)];

export function report() { return stubbed.slice(); }

// Safe call: a sim function that throws becomes {ok:false}.
export function call(ns, fn, ...args) {
  try {
    const f = G[ns]?.[fn];
    if (typeof f !== 'function') return {ok: false, msg: `${ns}.${fn} is missing`};
    const r = f(...args);
    return r === undefined ? {ok: true} : r;
  } catch (err) {
    console.error(`[sim] ${ns}.${fn}`, err);
    return {ok: false, msg: err?.message || 'Something went wrong'};
  }
}
// Safe read: returns fallback on error.
export function read(ns, fn, fallback, ...args) {
  try {
    const f = G[ns]?.[fn];
    if (typeof f !== 'function') return fallback;
    const r = f(...args);
    return r ?? fallback;
  } catch (err) { console.error(`[sim] ${ns}.${fn}`, err); return fallback; }
}

export const S = () => G.state.S;
export const goodName = id => D.goods?.[id]?.name || cap(id);
export const portName = id => D.ports?.[id]?.name || cap(id);
export const itemOf = id => D.items?.[id] || {id, name: cap(String(id).replace(/^q_/, '').replace(/_/g, ' ')), desc: ''};
export const shipName = t => D.ships?.[t]?.name || cap(t);
export function cap(s) { s = String(s ?? ''); return s.charAt(0).toUpperCase() + s.slice(1); }
