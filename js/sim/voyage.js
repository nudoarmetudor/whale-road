// Voyages: travel time, the events rolled for a crossing, arrival.
//
// Flow for the UI: r = planVoyage(to) -> play r.days on the map; for each r.events[i]
// call resolveEvent(i) (storm damage, flotsam) or start a battle for raid / beast /
// collectors / quest events (then winBattle(ev.questId) for quest wins) -> arrive(to).
// arrive() resolves any non-battle event the UI skipped, passes the days, autosaves and
// returns {battle} if a fight waits in the harbour (quest step or the Jómsborg fortress).

import {S, ok, fail, emit, log, rand, randInt, pick, clamp, save, on} from '../state.js';
import {PORTS} from '../data/ports.js';
import {GOODS} from '../data/goods.js';
import {distance, marksBetween, seaMarks} from './geo.js';
import {fleetSpeed, overloaded, cargoFree, damageFleet, netWorth} from './fleet.js';
import {mod} from './charms.js';
import {loanStatus} from './bank.js';
import {battleAt, act, questTargets} from './quests.js';
import {recordSeen, goodValue} from './economy.js';
import {passDays} from './clock.js';
import {date} from './time.js';
import {check as checkFeats} from './feats.js';

export const UNITS_PER_SPEED_DAY = 8; // map units a speed-1 fleet covers in a day
export const WINTER_SLOW = 1.15;

/** Days from one port to another for the current fleet (min 1). */
export function travelDays(from = S.port, to) {
  if (!from || !to || from === to) return 0;
  let d = distance(from, to) / (fleetSpeed() * UNITS_PER_SPEED_DAY);
  if (date(S.day).season === 'winter') d *= WINTER_SLOW * (1 + mod('winterVoyage'));
  return Math.max(1, Math.round(d));
}

/** Why the fleet cannot sail there now, or null. */
export function canSail(to) {
  if (!S.port) return 'Already at sea.';
  if (!PORTS[to]) return 'No such port.';
  if (to === S.port) return 'You are already here.';
  const open = S.unlockedPorts.includes(to) || questTargets().includes(to) ||
    (to === 'jomsborg' && (S.mode === 'free' || S.renown >= 150));
  if (!open) return 'You do not know the way there yet.';
  if (overloaded()) return 'The fleet is overloaded.';
  return null;
}

const cargoValue = () => Object.entries(S.cargo).reduce((a, [g, n]) => a + goodValue(g) * n, 0);

function raiders(marks) {
  const power = S.renown + cargoValue() / 1500 + S.fleet.length * 8;
  let e;
  if (power < 25) e = rand() < 0.5 ? ['raider_faering', 'raider_karvi'] : ['raider_karvi'];
  else if (power < 70) e = ['raider_karvi', 'raider_karvi', 'raider_snekkja'];
  else if (power < 150) e = ['raider_snekkja', 'raider_karvi', 'raider_snekkja', ...(rand() < 0.4 ? ['raider_drakkar'] : [])];
  else e = ['raider_drakkar', 'raider_snekkja', 'raider_snekkja', ...(rand() < 0.5 ? ['raider_drakkar'] : [])];
  if (marks.includes('baltic_south') && !S.flags.jomsborg_free) e[0] = power > 100 ? 'jomsviking_skeid' : 'wend_longship';
  if (marks.includes('channel') && rand() < 0.3) e[e.length - 1] = 'frankish_cog';
  if (marks.includes('black_sea') && rand() < 0.3) e[e.length - 1] = 'byzantine_dromon';
  if (S.easy && e.length > 1) e.pop();
  return e;
}

function beasts(north, winter) {
  if (winter && rand() < 0.3) return ['draugr_ship'];
  if (north) return rand() < 0.5 ? ['serpent'] : ['kraken'];
  return rand() < 0.6 ? ['storm_crow', 'storm_crow'] : ['serpent'];
}

const TEXT = {
  storm: ['Black clouds pile up in the west. Lash everything down!', 'A gale howls out of nowhere and the sea stands up.'],
  ward: ['A storm gathers, takes one look at your Storm-Ward, and wanders off.'],
  calm: ['The wind dies. The crew rows, grumbles, and rows some more.', 'Flat calm. Somebody whistles for wind and gets told off.'],
  wreck: ['Barrels bob in the swell: flotsam from some luckless ship.', 'A wrecked hull on a skerry, still holding cargo.'],
  raid: ['Sails on the horizon, striped and hungry. Raiders!', 'A war-horn from behind the headland: raiders want your cargo.'],
  beast: ['Something vast moves under the hull.', 'The lookout goes pale and points. That is no whale.'],
  collectors: ['A sleek ship flies the moneylender\'s pennant. They have come to collect.'],
};

/** Plan a crossing. Returns {ok, from, to, days, events:[{i, day, type, enemies?, text, ...}]}. */
export function planVoyage(to) {
  const why = canSail(to); if (why) return fail(why);
  const from = S.port, season = date(S.day).season, winter = season === 'winter';
  let days = travelDays(from, to);
  const events = [];
  const at = () => randInt(0, Math.max(0, days - 1));
  const north = Math.max(PORTS[from].lat, PORTS[to].lat) > 60;
  const onPath = marksBetween(from, to);
  const marks = onPath.map((m) => m.id);

  if (rand() < 0.08) { days += 1; events.push({day: at(), type: 'calm', text: pick(TEXT.calm)}); }
  const pStorm = clamp(0.05 + days * 0.012 + (winter ? 0.18 : season === 'autumn' ? 0.06 : 0) + (north ? 0.06 : 0), 0, 0.75);
  if (rand() < pStorm) {
    const warded = mod('storm') > 0;
    events.push({day: at(), type: 'storm', warded, damage: warded ? 0 : +(0.06 + rand() * 0.12).toFixed(2), text: pick(warded ? TEXT.ward : TEXT.storm)});
  }
  const loan = loanStatus();
  if (loan.overdue && rand() < 0.6) {
    const n = clamp(1 + Math.floor(loan.amount / 20000), 1, 3);
    events.push({day: at(), type: 'collectors', enemies: Array(n).fill('collector_snekkja'), text: TEXT.collectors[0]});
  }
  const seenQ = new Set();
  for (const m of onPath) {
    const b = battleAt(m.id);
    if (b && !seenQ.has(b.questId)) {
      seenQ.add(b.questId);
      events.push({day: Math.floor(m.at * Math.max(0, days - 1)), type: 'quest', questId: b.questId, sea: m.id,
        enemies: b.enemies, weather: b.weather, text: b.text || 'The foe you were sent to find is here.'});
    }
  }
  // Fallback: a sea fight no open route passes still happens, on any voyage ("the foe finds you").
  for (const id of Object.keys(S.quests.active)) {
    const b = seaFightFor(id);
    if (b && !seenQ.has(id) && !markReachable(b.sea)) {
      seenQ.add(id);
      events.push({day: Math.floor(days / 2), type: 'quest', questId: id, sea: b.sea, enemies: b.enemies, weather: b.weather,
        text: b.text || 'The foe you were sent to find has found you instead.'});
    }
  }
  const pRaid = clamp((0.05 + days * 0.01 + S.renown / 1500 + cargoValue() / 300000) * (1 + mod('raidChance')) * (S.easy ? 0.75 : 1), 0, 0.6);
  if (rand() < pRaid) events.push({day: at(), type: 'raid', enemies: raiders(marks), text: pick(TEXT.raid)});
  const pBeast = 0.03 + (north ? 0.04 : 0) + (days > 10 ? 0.04 : 0);
  if (rand() < pBeast) events.push({day: at(), type: 'beast', enemies: beasts(north, winter), text: pick(TEXT.beast)});
  if (rand() < 0.07) {
    const g = pick(S.unlockedGoods.filter((x) => GOODS[x] && GOODS[x].tier <= 3));
    events.push({day: at(), type: 'wreck', good: g, qty: randInt(3, 12), text: pick(TEXT.wreck)});
  }
  events.sort((a, b) => a.day - b.day).forEach((e, i) => { e.i = i; e.resolved = false; e.weather ||= winter ? pick(['clear', 'rain', 'fog']) : pick(['clear', 'clear', 'rain', 'fog']); });
  S.voyage = {from, to, days, events, start: S.day};
  return ok({from, to, days, events});
}

// The current step of quest id, if it is a fight at a sea mark: {sea, enemies, weather, text}.
function seaFightFor(id) {
  for (const m of Object.keys(seaMarks())) {
    const r = battleAt(m);
    if (r && r.questId === id) return {sea: m, ...r};
  }
  return null;
}
// Does any voyage between two open ports pass this sea mark?
function markReachable(mark) {
  const open = S.unlockedPorts;
  for (const a of open) for (const b of open) if (a < b && marksBetween(a, b).some((m) => m.id === mark)) return true;
  return false;
}

const BATTLE = ['raid', 'beast', 'collectors', 'quest'];

/** Apply a planned event: storm damage, flotsam. Battle events are only marked (UI fights them). */
export function resolveEvent(i) {
  const ev = S.voyage && S.voyage.events[i];
  if (!ev) return fail('No such event.');
  if (ev.resolved) return fail('Already resolved.');
  ev.resolved = true;
  if (ev.type === 'storm') {
    if (ev.warded) return ok({ev, damage: 0});
    S.stats.storms++;
    const damage = damageFleet(ev.damage);
    log(`Storm at sea: ${damage} hull damage.`);
    return ok({ev, damage});
  }
  if (ev.type === 'wreck') {
    const q = Math.max(0, Math.min(ev.qty, cargoFree()));
    if (q) {
      const have = S.cargo[ev.good] || 0;
      S.cargoPaid[ev.good] = ((S.cargoPaid[ev.good] || 0) * have) / (have + q);
      S.cargo[ev.good] = have + q;
      emit('cargo', S.cargo);
      log(`Fished ${q} ${GOODS[ev.good].name.toLowerCase()} out of the sea.`);
    }
    return ok({ev, taken: q});
  }
  if (ev.type === 'raid') S.stats.raids++;
  return ok({ev});
}

/** Arrive at `to` (the planned voyage's port). Passes the days, autosaves, records prices. */
export function arrive(to = S.voyage && S.voyage.to) {
  const v = S.voyage && S.voyage.to === to ? S.voyage : null;
  if (!v) { const why = canSail(to); if (why) return fail(why); }
  if (v) v.events.forEach((e, i) => { if (!e.resolved && !BATTLE.includes(e.type)) resolveEvent(i); });
  const days = v ? v.days : travelDays(S.port, to);
  S.lastPort = v ? v.from : S.port;
  S.port = null;
  passDays(days);
  S.port = to;
  S.voyage = null;
  S.stats.voyages++;
  S.stats.daysAtSea += days;
  if (!S.stats.visited.includes(to)) S.stats.visited.push(to);
  recordSeen(to);
  S.stats.maxNetWorth = Math.max(S.stats.maxNetWorth, netWorth());
  const quest = act(to, null);
  const feats = checkFeats();
  save('auto');
  emit('port', to);
  return ok({port: to, days, battle: battleAt(to), quest, feats});
}

/** Pull back to the port you came from (after losing or fleeing a harbour fight). */
export function retreat() {
  const back = S.lastPort && S.lastPort !== S.port ? S.lastPort : 'ravnfjord';
  const days = travelDays(S.port, back);
  S.port = null;
  passDays(days);
  S.port = back;
  recordSeen(back);
  log(`Fell back to ${PORTS[back].name}.`);
  emit('port', back);
  return ok({port: back, days});
}

// Battle bookkeeping. Combat (or the UI) emits 'battle-end' once per battle with
// {result:'win'|'lose'|'fled', enemies:[kinds]}. Loot is applied by fleet.takeLoot().
// Losing costs a third of every good in the hold (the winners help themselves).
on('battle-end', (d = {}) => {
  if (!S.fleet || !S.fleet.length) return;
  if (d.result === 'win') {
    S.stats.battlesWon++;
    S.renown += 1 + Math.min(6, (d.enemies || []).length);
  } else if (d.result === 'lose') {
    S.stats.battlesLost++;
    for (const g of Object.keys(S.cargo)) {
      S.cargo[g] -= Math.floor(S.cargo[g] / 3);
      if (!S.cargo[g]) { delete S.cargo[g]; delete S.cargoPaid[g]; }
    }
    log('Beaten! The victors took a third of your cargo.');
    emit('cargo', S.cargo);
  }
});
