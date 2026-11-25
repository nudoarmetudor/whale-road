// Quest engine: implements the quest schema in docs/CONTRACT.md.
// Data: js/data/quests/sagas.js (SAGAS) and side.js (SIDE), loaded by ext.js.
//
// Robustness rules (so a story can never strand the player):
// - when a step becomes current, the ports it needs are unlocked ("the jarl tells you
//   the way") and so are the goods it asks for; Jómsborg stays a fortress until beaten.
// - Free Trade has no tasks.

import {S, ok, fail, emit, log, makeShip, sagaDone} from '../state.js';
import {EXT, questById} from './ext.js';
import {PORTS} from '../data/ports.js';
import {GOODS} from '../data/goods.js';
import {SHIPS, MAX_FLEET} from '../data/ships.js';
import {BLESSINGS} from '../data/blessings.js';
import {netWorth} from './fleet.js';
import {buyPrice, quote, nudge} from './economy.js';

const DEFAULT_BUILDING = {donate: 'guild', sacrifice: 'altar', buy: 'market'};
export const FORTRESS_ENEMIES = ['fortress_tower', 'fortress_gate', 'fortress_tower', 'jomsviking_skeid', 'wend_longship'];

export const allQuests = () => EXT.quests;
const isDone = (id) => S.quests.done.includes(id);
const cur = (id) => { const q = questById(id), st = S.quests.active[id]; return q && st ? q.steps[st.step] : null; };
const gname = (g) => (GOODS[g] ? GOODS[g].name.toLowerCase() : g);
const pname = (p) => (PORTS[p] ? PORTS[p].name : p);

function eligible(q) {
  if (S.mode !== 'saga') return false;
  if (q.saga && q.saga !== S.hero) return false;
  if (S.quests.active[q.id] || isDone(q.id)) return false;
  if ((q.requires || []).some((r) => !isDone(r))) return false;
  if ((q.requiresRenown || 0) > S.renown) return false;
  if (q.requiresFlag && !S.flags[q.requiresFlag]) return false;
  return true;
}

/** Quests offered at this building of this port. */
export function offers(port = S.port, building) {
  return allQuests().filter((q) => eligible(q) && q.giver && q.giver.port === port && (!building || q.giver.building === building));
}

function unlockFor(step) {
  if (!step) return;
  for (const p of [step.port, step.at && step.at.port]) {
    if (p && PORTS[p] && !PORTS[p].fortress && !S.unlockedPorts.includes(p)) {
      S.unlockedPorts.push(p); log(`The way to ${pname(p)} is open to you now.`);
    }
  }
  if (step.good && GOODS[step.good] && !S.unlockedGoods.includes(step.good)) S.unlockedGoods.push(step.good);
}

export function accept(id) {
  const q = questById(id);
  if (!q) return fail('No such task.');
  if (!eligible(q)) return fail('That task is not on offer.');
  if (q.giver && q.giver.port !== S.port) return fail('You must be where the task is given.');
  S.quests.active[id] = {step: 0, data: {}, started: S.day};
  unlockFor(q.steps[0]);
  log(`Task taken: ${q.title}.`);
  emit('quest', {id, accepted: true});
  return ok({quest: q});
}

/** Abandon an active task (it can be taken again later). Quest goods go to the hold. */
export function abandon(id) {
  if (!S.quests.active[id]) return fail('Not an active task.');
  dropQuest(id);
  emit('quest', {id, abandoned: true});
  return ok();
}
function dropQuest(id) {
  delete S.quests.active[id];
  for (const [g, n] of Object.entries(S.qgoods[id] || {})) S.cargo[g] = (S.cargo[g] || 0) + n;
  delete S.qgoods[id];
}

function stepAt(step, port, building) {
  if (!step || step.do === 'defeat') return false;
  if (step.do === 'networth') return true;
  if (step.port && step.port !== port) return false;
  if (!port) return false;
  const b = step.building || DEFAULT_BUILDING[step.do];
  return b ? building === b : true;
}

// Try to perform step; returns {done, lines}.
function perform(id, st, step) {
  const say = step.say || [];
  const need = (t) => ({done: false, lines: [t]});
  const qg = (S.qgoods[id] ||= {});
  switch (step.do) {
    case 'deliver': {
      const have = (qg[step.good] || 0) + (S.cargo[step.good] || 0);
      if (have < step.qty) return need(`You still need ${step.qty - have} ${gname(step.good)}.`);
      let left = step.qty;
      const fromQ = Math.min(qg[step.good] || 0, left); qg[step.good] = (qg[step.good] || 0) - fromQ; left -= fromQ;
      if (!qg[step.good]) delete qg[step.good];
      if (left) { S.cargo[step.good] -= left; if (!S.cargo[step.good]) { delete S.cargo[step.good]; delete S.cargoPaid[step.good]; } }
      emit('cargo', S.cargo);
      return {done: true, lines: say};
    }
    case 'bring': {
      const i = S.items.indexOf(step.item);
      if (i < 0) return need('You do not have it yet.');
      S.items.splice(i, 1);
      return {done: true, lines: say};
    }
    case 'visit': return {done: true, lines: say};
    case 'collect': S.items.push(step.item); return {done: true, lines: say};
    case 'buy': {
      if (buyPrice(S.port, step.good) === null) return need(`${pname(S.port)} does not sell ${gname(step.good)}.`);
      const cost = quote(step.good, step.qty);
      if (cost > S.silver) return need(`That costs ${cost} s.`);
      S.silver -= cost; nudge(S.port, step.good, step.qty);
      qg[step.good] = (qg[step.good] || 0) + step.qty;
      emit('silver', S.silver);
      return {done: true, lines: say.length ? say : [`Bought ${step.qty} ${gname(step.good)} for ${cost} s (kept apart for the task).`]};
    }
    case 'pay': case 'donate': {
      if (S.silver < step.silver) return need(`You need ${step.silver} s.`);
      S.silver -= step.silver; emit('silver', S.silver);
      return {done: true, lines: say};
    }
    case 'networth':
      return netWorth() >= step.amount ? {done: true, lines: say} : need(`Your worth must reach ${step.amount} s.`);
    case 'sacrifice':
      return (st.data.sacrificed || 0) >= step.qty ? {done: true, lines: say}
        : need(`Buy ${step.qty - (st.data.sacrificed || 0)} more ${BLESSINGS[step.blessing] ? BLESSINGS[step.blessing].name : step.blessing} here.`);
    default: return need('');
  }
}

function giveReward(q) {
  const r = q.reward || {};
  const got = [];
  if (r.silver) { S.silver += r.silver; got.push(`${r.silver} s`); }
  for (const it of r.items || []) if (!S.items.includes(it)) { S.items.push(it); got.push(it); }
  for (const [g, n] of Object.entries(r.goods || {})) { S.cargo[g] = (S.cargo[g] || 0) + n; got.push(`${n} ${gname(g)}`); }
  for (const [b, n] of Object.entries(r.blessings || {})) S.blessings[b] = (S.blessings[b] || 0) + n;
  if (r.renown) S.renown += r.renown;
  for (const g of r.unlockGoods || []) if (!S.unlockedGoods.includes(g)) { S.unlockedGoods.push(g); log(`You can now trade ${gname(g)}.`); }
  for (const p of r.unlockPorts || []) {
    if (p === 'jomsborg') freeFortress(false);
    else if (!S.unlockedPorts.includes(p)) { S.unlockedPorts.push(p); log(`${pname(p)} is open to you now.`); }
  }
  for (const f of [].concat(r.flag || [])) S.flags[f] = true;
  if (r.ship && SHIPS[r.ship]) {
    if (S.fleet.length < MAX_FLEET) { S.fleet.push(makeShip(r.ship)); emit('fleet', S.fleet); }
    else { S.silver += Math.round(SHIPS[r.ship].price * 0.6); log(`No room for the ${SHIPS[r.ship].name}; you sold it on the spot.`); }
  }
  emit('silver', S.silver); emit('cargo', S.cargo);
  return got;
}

// The last chapter of a saga: flagged final, or the highest chapter written for that hero.
function isFinal(q) {
  if (!q.saga) return false;
  if (q.final) return true;
  const top = Math.max(...allQuests().filter((x) => x.saga === q.saga).map((x) => x.chapter || 0));
  return (q.chapter || 0) >= top;
}

function complete(id) {
  const q = questById(id);
  dropQuest(id);
  S.quests.done.push(id);
  const got = giveReward(q);
  log(`Task done: ${q.title}${got.length ? ' (' + got.join(', ') + ')' : ''}.`);
  if (isFinal(q)) {
    S.flags.sagaComplete = true;
    sagaDone(S.hero);
    emit('saga-end', {hero: S.hero, quest: id});
  }
  emit('quest', {id, done: true});
  return q.done || [];
}

// Advance a quest one step; returns the 'complete' result when it finishes.
function advance(id) {
  const st = S.quests.active[id], q = questById(id);
  st.step++; st.data = {};
  if (st.step >= q.steps.length) return {quest: id, title: q.title, step: st.step, kind: 'complete', lines: complete(id)};
  unlockFor(q.steps[st.step]);
  emit('quest', {id, step: st.step});
  return null;
}

/**
 * Perform every step that can be done at this building of this port (chained: a task may
 * finish several steps in one visit). Returns [{quest, title, step, kind, lines, done}].
 * kind is the step's `do`, or 'complete'; done:false entries ('need') mean "right place,
 * missing something" and carry a hint line.
 */
export function act(port = S.port, building = null) {
  const out = [];
  for (const id of Object.keys(S.quests.active)) {
    let guard = 0;
    while (S.quests.active[id] && guard++ < 50) {
      const q = questById(id), st = S.quests.active[id], step = q && q.steps[st.step];
      if (!stepAt(step, port, building)) break;
      const r = perform(id, st, step);
      if (!r.done) {
        if (step.do !== 'networth' || building) out.push({quest: id, title: q.title, step: st.step, kind: 'need', lines: r.lines, done: false});
        break;
      }
      out.push({quest: id, title: q.title, step: st.step, kind: step.do, lines: r.lines, done: true});
      const fin = advance(id);
      if (fin) { out.push({...fin, done: true}); break; }
    }
  }
  return out;
}

/** Altar hook: count blessings bought toward sacrifice steps. */
export function onSacrifice(blessing, qty, port) {
  for (const id of Object.keys(S.quests.active)) {
    const step = cur(id), st = S.quests.active[id];
    if (step && step.do === 'sacrifice' && step.blessing === blessing && (!step.port || step.port === port)) {
      st.data.sacrificed = (st.data.sacrificed || 0) + qty;
    }
  }
  return act(port, 'altar');
}

/** Fail quests whose time limit has passed (called daily). */
export function checkTimeouts() {
  for (const [id, st] of Object.entries(S.quests.active)) {
    const q = questById(id);
    if (q && q.timeLimit && S.day > st.started + q.timeLimit) {
      dropQuest(id);
      S.quests.failed.push(id);
      log(`Too late: "${q.title}" has failed. Perhaps the offer will come again.`);
      emit('quest', {id, failed: true});
    }
  }
}

// ---------------------------------------------------------------- battles
const placeOf = (enemies) => (enemies.some((e) => String(e).startsWith('fortress_')) ? 'fortress' : 'sea');

/** A quest (or fortress) battle waiting at a port id or a sea-mark id, or null. */
export function battleAt(where) {
  for (const id of Object.keys(S.quests.active)) {
    const step = cur(id);
    if (step && step.do === 'defeat' && step.at && (step.at.port === where || step.at.sea === where)) {
      return {questId: id, enemies: step.enemies, weather: step.weather || 'clear', place: placeOf(step.enemies), text: step.text};
    }
  }
  if (where === 'jomsborg' && !S.flags.jomsborg_free) {
    return {questId: 'fortress:jomsborg', enemies: FORTRESS_ENEMIES, weather: 'clear', place: 'fortress',
      text: 'The walls of Jómsborg bristle with spears. The harbour gate is shut.'};
  }
  return null;
}

/** Free the raider fortress: the port and hacksilver open. */
export function freeFortress(announce = true) {
  if (S.flags.jomsborg_free) return;
  S.flags.jomsborg_free = true;
  if (!S.unlockedPorts.includes('jomsborg')) S.unlockedPorts.push('jomsborg');
  if (!S.unlockedGoods.includes('hacksilver')) S.unlockedGoods.push('hacksilver');
  if (announce) S.renown += 25;
  log('Jómsborg has fallen! Its harbour, and its hacksilver, are open to honest traders.');
  emit('port', S.port);
}

/** Call after the player wins a quest battle (or the fortress). */
export function winBattle(questId) {
  if (questId === 'fortress:jomsborg') { freeFortress(true); return ok({freed: 'jomsborg', results: []}); }
  const step = cur(questId);
  if (!step || step.do !== 'defeat') return fail('No such battle.');
  if (step.at && step.at.port === 'jomsborg' && placeOf(step.enemies) === 'fortress') freeFortress(false);
  const q = questById(questId);
  const results = [{quest: questId, title: q.title, step: S.quests.active[questId].step, kind: 'defeat', lines: step.say || [], done: true}];
  const fin = advance(questId);
  if (fin) results.push({...fin, done: true});
  else if (S.port) results.push(...act(S.port, null));
  return ok({results});
}

// ---------------------------------------------------------------- journal and markers
export function journal() {
  const rows = [];
  for (const [id, st] of Object.entries(S.quests.active)) {
    const q = questById(id); if (!q) continue;
    const step = q.steps[st.step];
    rows.push({id, title: q.title, saga: q.saga || null, chapter: q.chapter || null, stepText: step ? step.text : '',
      step: st.step, steps: q.steps.length, done: false, npcName: q.npcName, giver: q.giver,
      daysLeft: q.timeLimit ? st.started + q.timeLimit - S.day : null,
      progress: step && step.do === 'sacrifice' ? `${st.data.sacrificed || 0}/${step.qty}` : null});
  }
  for (const id of S.quests.done) {
    const q = questById(id); if (!q) continue;
    rows.push({id, title: q.title, saga: q.saga || null, chapter: q.chapter || null, stepText: '', done: true,
      step: q.steps.length, steps: q.steps.length, npcName: q.npcName, giver: q.giver});
  }
  return rows;
}

/**
 * Map and town markers. Current steps: {port, building, kind, questId, text} or
 * {sea, kind, questId, text}. Tasks on offer: same with offer:true (at the giver).
 * kind 'main' (saga) or 'side'.
 */
export function markers() {
  const out = [];
  for (const id of Object.keys(S.quests.active)) {
    const q = questById(id), step = cur(id);
    if (!step) continue;
    const kind = q.saga ? 'main' : 'side';
    if (step.do === 'defeat' && step.at) {
      if (step.at.sea) out.push({sea: step.at.sea, building: null, kind, questId: id, text: step.text});
      else out.push({port: step.at.port, building: null, kind, questId: id, text: step.text});
    } else if (step.port) {
      out.push({port: step.port, building: step.building || DEFAULT_BUILDING[step.do] || null, kind, questId: id, text: step.text});
    }
  }
  for (const q of allQuests()) {
    if (q.giver && eligible(q)) out.push({port: q.giver.port, building: q.giver.building, kind: q.saga ? 'main' : 'side', questId: q.id, offer: true, text: q.title});
  }
  return out;
}

/** Ports the player may sail to besides unlocked ones (a quest fight at a locked fortress). */
export function questTargets() {
  return Object.keys(S.quests.active).map((id) => cur(id)).filter((s) => s && s.do === 'defeat' && s.at && s.at.port).map((s) => s.at.port);
}
