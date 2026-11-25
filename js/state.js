// Core game state, seeded RNG, event bus, profiles and save slots.
//
// S is one live object that is never replaced (newGame/load refill it in place), so every
// module can import it once. Non-core modules read it and change it only through js/sim/.

import {SHIPS} from './data/ships.js';
import {PORTS, SAGA_START_PORTS} from './data/ports.js';
import {GOODS, GOOD_IDS} from './data/goods.js';
import {START_BLESSINGS} from './data/blessings.js';
import {date} from './sim/time.js';
import {EXT} from './sim/ext.js';

export const S = {};
export const VERSION = 1;

// ---------------------------------------------------------------- results and helpers
export const ok = (extra = {}) => ({ok: true, ...extra});
export const fail = (msg) => ({ok: false, msg});
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/** Is building b usable where we are? (Nothing in a raider fortress until it falls.) */
export const here = (b) => !!(S.port && PORTS[S.port] && PORTS[S.port].buildings.includes(b) &&
  !(PORTS[S.port].fortress && !S.flags.jomsborg_free));

// ---------------------------------------------------------------- seeded RNG (mulberry32)
// The RNG state lives in S.rng, so a saved game replays the same luck after loading.
export function setSeed(n) { S.rng = (n >>> 0) || 1; }
export function rand() {
  if (S.rng === undefined) setSeed(Date.now());
  let t = (S.rng = (S.rng + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const randInt = (a, b) => a + Math.floor(rand() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(rand() * arr.length)];
// Stable hash for things that must not consume the RNG (weekly shop stock etc.).
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- event bus
const subs = {};
export function on(event, fn) {
  (subs[event] ||= []).push(fn);
  return () => { subs[event] = subs[event].filter((f) => f !== fn); };
}
export function emit(event, data) {
  for (const fn of subs[event] || []) { try { fn(data); } catch (e) { console.error(e); } }
}

// Ship's log: short lines the UI can list ("L" log screen).
export function log(text) {
  S.log.push({day: S.day, text});
  if (S.log.length > 200) S.log.shift();
  emit('log', {day: S.day, text});
}

// ---------------------------------------------------------------- ships
const SHIP_NAMES = ['Sea-Raven', 'Grey Gull', 'Wave-Steed', 'Fjord Elk', 'Long Serpent', 'Salt Mare',
  'Storm Goose', 'Whale-Wife', 'Red Otter', 'Brine Wolf', 'Swan of Sogn', 'Old Stubborn', 'Puffin',
  'Thrall of the Wind', 'Gold-Prow', 'Sea-Bear'];
export function makeShip(type, name) {
  const t = SHIPS[type];
  const used = new Set((S.fleet || []).map((f) => f.name));
  const free = SHIP_NAMES.filter((n) => !used.has(n));
  return {id: S.nextId++, type, name: name || (free.length ? pick(free) : t.name), hull: t.hull, arms: {}, ammo: {}};
}

// ---------------------------------------------------------------- new game
export const DEFAULT_HERO = {startPort: 'ravnfjord', startShip: 'knarr', startSilver: 3000, startDebt: 5000, debtDue: 60};

function blank() {
  return {
    version: VERSION, mode: 'saga', hero: 'ylva', name: '', look: null, easy: true,
    day: 1, port: 'ravnfjord', silver: 0, bank: {}, debt: {amount: 0, due: 0},
    fleet: [], cargo: {}, cargoPaid: {}, qgoods: {}, items: [], blessings: {...START_BLESSINGS},
    warehouse: {}, whPaid: {}, unlockedPorts: [], unlockedGoods: [],
    quests: {active: {}, done: [], failed: []}, renown: 0, feats: [], seen: {}, flags: {},
    stats: {bought: 0, sold: 0, profit: 0, voyages: 0, daysAtSea: 0, battlesWon: 0, battlesLost: 0,
      storms: 0, raids: 0, contraband: 0, caught: 0, blessings: 0, charms: 0, loans: 0,
      maxNetWorth: 0, visited: [], goodsSold: {}, bestSale: 0, renownProfit: 0},
    econ: null, stocked: {}, mevents: [], rumours: [], offer: null, voyage: null,
    log: [], nextId: 1, rng: undefined, profile: null, lastPort: null,
  };
}

function fill(src) {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, blank(), src);
  S.stats = {...blank().stats, ...(src.stats || {})};
}

/** Start a game. mode 'saga'|'free'; hero id; easy bool; seed optional (tests). */
export function newGame({mode = 'saga', hero = 'ylva', name, look = null, easy = true, seed} = {}) {
  fill({mode, hero, look, easy});
  setSeed(seed ?? Date.now());
  S.profile = currentProfile().id;
  const h = {...DEFAULT_HERO, ...(EXT.heroes[hero] || {})};
  S.name = name || h.name || 'Stranger';
  if (mode === 'free') {
    // Free Trade: everything open except the raider fortress and its hacksilver.
    // Start: Ravnfjord, a knarr with one crew of archers plus a færing, 10 000 silver, no debt.
    S.port = 'ravnfjord';
    S.silver = 10000;
    S.unlockedPorts = Object.keys(PORTS).filter((p) => !PORTS[p].fortress);
    S.unlockedGoods = GOOD_IDS.filter((g) => g !== 'hacksilver');
    S.fleet = [makeShip('knarr'), makeShip('faering')];
    S.fleet[0].arms = {archers: 1};
  } else {
    S.port = PORTS[h.startPort] ? h.startPort : 'ravnfjord';
    S.silver = h.startSilver;
    const debt = typeof h.startDebt === 'object' && h.startDebt ? h.startDebt : {amount: h.startDebt || 0, due: h.debtDue};
    S.debt = {amount: debt.amount || 0, due: debt.amount ? (debt.due || 60) : 0};
    // heroes.js may give startPorts / startGoods; otherwise the defaults below.
    S.unlockedPorts = [...new Set([S.port, ...(h.startPorts || SAGA_START_PORTS)])].filter((p) => PORTS[p] && !PORTS[p].fortress);
    S.unlockedGoods = (h.startGoods || GOOD_IDS.filter((g) => GOODS[g].tier <= 1)).filter((g) => GOODS[g]);
    const ship = SHIPS[h.startShip] ? h.startShip : 'knarr';
    S.fleet = [makeShip(ship, h.shipName)];
    S.fleet[0].arms = SHIPS[ship].slots >= 2 ? {archers: 1, spearmen: 1} : {archers: 1};
    if (h.startItems) S.items.push(...h.startItems);
  }
  S.stats.visited = [S.port];
  log(mode === 'free' ? 'A free trader sets out from ' + PORTS[S.port].name + '.' : S.name + ' begins a saga in ' + PORTS[S.port].name + '.');
  for (const e of ['silver', 'cargo', 'day', 'port', 'fleet', 'quest']) emit(e, S);
  return S;
}

export function setEasy(v) { S.easy = !!v; emit('quest', S); }

// ---------------------------------------------------------------- storage (never throws)
const mem = {};
function store() { try { return globalThis.localStorage || null; } catch (e) { return null; } }
function sget(k) {
  try { const s = store(); return s ? s.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return null; }
}
function sset(k, v) {
  try { const s = store(); if (s) s.setItem(k, v); else mem[k] = v; return true; } catch (e) { return false; }
}
function sdel(k) { try { const s = store(); if (s) s.removeItem(k); else delete mem[k]; } catch (e) { /* ignore */ } }
function sjson(k, dflt) { try { const v = sget(k); return v ? JSON.parse(v) : dflt; } catch (e) { return dflt; } }

// ---------------------------------------------------------------- profiles
// Each profile has its own saves, feats (shared by all its heroes), finished sagas and
// Free Trade high scores.
const PKEY = 'wr.profiles';
function profiles() {
  let p = sjson(PKEY, null);
  if (!p || !Array.isArray(p.list) || !p.list.length) {
    p = {current: 'p1', list: [{id: 'p1', name: 'Player', feats: [], sagasDone: [], scores: [], created: Date.now()}]};
    sset(PKEY, JSON.stringify(p));
  }
  return p;
}
function writeProfiles(p) { sset(PKEY, JSON.stringify(p)); }
export function listProfiles() { return profiles().list.map((x) => ({...x})); }
export function currentProfile() { const p = profiles(); return p.list.find((x) => x.id === p.current) || p.list[0]; }
export function createProfile(name) {
  const p = profiles();
  const id = 'p' + (Math.max(0, ...p.list.map((x) => +x.id.slice(1) || 0)) + 1);
  p.list.push({id, name: String(name || 'Player').slice(0, 24), feats: [], sagasDone: [], scores: [], created: Date.now()});
  p.current = id;
  writeProfiles(p);
  return ok({id});
}
export function selectProfile(id) {
  const p = profiles();
  if (!p.list.some((x) => x.id === id)) return fail('No such profile.');
  p.current = id; writeProfiles(p);
  return ok();
}
export function deleteProfile(id) {
  const p = profiles();
  if (p.list.length < 2) return fail('Keep at least one profile.');
  p.list = p.list.filter((x) => x.id !== id);
  if (p.current === id) p.current = p.list[0].id;
  writeProfiles(p);
  for (const s of [1, 2, 3, 'auto']) sdel(`wr.save.${id}.${s}`);
  return ok();
}
/** Change the current profile record (feats, sagasDone, scores). */
export function updateProfile(fn) {
  const p = profiles();
  const cur = p.list.find((x) => x.id === p.current) || p.list[0];
  fn(cur);
  writeProfiles(p);
  return cur;
}
export function profileFeats() { return currentProfile().feats || []; }
export function sagaDone(hero) {
  updateProfile((pr) => { pr.sagasDone = [...new Set([...(pr.sagasDone || []), hero])]; });
}
/** Free Trade score table (top 10 per profile). */
export function recordScore(score) {
  updateProfile((pr) => {
    pr.scores = [...(pr.scores || []), {score: Math.round(score), name: S.name, day: S.day, ts: Date.now()}]
      .sort((a, b) => b.score - a.score).slice(0, 10);
  });
}
export function highScores() { return currentProfile().scores || []; }

// ---------------------------------------------------------------- saves
// Slots 1, 2, 3 (manual) and 'auto' (written on every arrival), per profile.
const skey = (slot) => `wr.save.${currentProfile().id}.${slot}`;
const SLOTS = [1, 2, 3, 'auto'];
export function save(slot = 'auto') {
  if (!SLOTS.includes(slot)) return fail('No such slot.');
  if (!S.fleet || !S.fleet.length) return fail('No game to save.');
  const meta = {slot, ts: Date.now(), day: S.day, label: date(S.day).label, hero: S.hero, name: S.name,
    mode: S.mode, silver: Math.round(S.silver), port: S.port};
  return sset(skey(slot), JSON.stringify({meta, state: S})) ? ok({meta}) : fail('Could not save (storage full or blocked).');
}
export function load(slot = 'auto') {
  const d = sjson(skey(slot), null);
  if (!d || !d.state) return fail('That slot is empty.');
  fill(d.state);
  for (const e of ['silver', 'cargo', 'day', 'port', 'fleet', 'quest']) emit(e, S);
  return ok({meta: d.meta});
}
export function listSaves() {
  return SLOTS.map((slot) => { const d = sjson(skey(slot), null); return d && d.meta ? {...d.meta, slot} : {slot, empty: true}; });
}
export function deleteSave(slot) { sdel(skey(slot)); return ok(); }
export function hasContinue() { return listSaves().some((s) => !s.empty); }
/** Load the newest save of the current profile. */
export function continueGame() {
  const best = listSaves().filter((s) => !s.empty).sort((a, b) => b.ts - a.ts)[0];
  return best ? load(best.slot) : fail('Nothing to continue.');
}

fill({});
