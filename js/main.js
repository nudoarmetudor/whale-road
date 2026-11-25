// Whale Road: boot and flow glue. Title -> new game -> intro -> port -> map -> voyage
// (storms, raids, beasts, collectors, quest battles) -> arrival -> port, plus game over
// and saga endings, hotkeys, autosave notice and the service worker.
import {loadAll, G, D, A, X, Au, S, read, call, portName, goodName} from './ui/adapters.js';
import {h, add, initLayers, L, toast, sfx, silver, num, closeAllSheets, topSheet, sheetsOpen, alertDlg, $} from './ui/dom.js';
import {opts, applyOptions, profile, updateProfile, logLine, addScore} from './ui/options.js';
import {flow, music, themeFor, initAudio} from './ui/ctx.js';
import {showTitle} from './ui/title.js';
import {showPort, refreshHud, relayout, nextHint, portView} from './ui/port.js';
import {openBuilding, playActs} from './ui/buildings.js';
import {gameMenu, journalSheet, fleetSheet, cargoSheet, itemsSheet} from './ui/sheets.js';
import {say, talking} from './ui/dialogue.js';
import {toggleFullscreen} from './ui/info.js';

const BEAST_TEXT = {serpent: 'A sea serpent rises beside the ship!', kraken: 'Arms as thick as masts come up out of the deep!', storm_crow: 'A raven the size of a sail drops out of the clouds!'};

async function boot() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="boot"><h1 class="logo">Whale Road</h1><p>Loading the longships…</p></div>';
  let stubbed = [];
  try { stubbed = await loadAll(); } catch (err) { console.error(err); app.innerHTML = '<div class="boot"><p>Could not load the game. Try reloading.</p></div>'; return; }
  initLayers(app);
  if (stubbed.length) console.info('[Whale Road] using stand-ins for:', stubbed.join(', '));
  window.WR = {G, D, A, X, Au, flow, opts, stubbed, S, debug: {voyage, seaEvent: e => seaEvent(e, L().stage), battle, gameOver, checkEnd}};
  applyOptions();
  wireEvents();
  wireKeys();
  addEventListener('resize', () => relayout());
  addEventListener('orientationchange', () => setTimeout(relayout, 250));
  const gesture = () => { initAudio(); applyOptions(); removeEventListener('pointerdown', gesture, true); removeEventListener('keydown', gesture, true); };
  addEventListener('pointerdown', gesture, true);
  addEventListener('keydown', gesture, true);
  registerSW();
  showTitle();
}

// ------------------------------------------------------------------ flow
Object.assign(flow, {
  toTitle() { closeAllSheets(); showTitle(); },
  toPort() { closeAllSheets(); showPort(); },
  refreshHud,
  openBuilding,
  openMenu() { if (!topSheet()?.el.classList.contains('game-menu')) gameMenu(); },
  async newGame(o) {
    closeAllSheets();
    const r = call('state', 'newGame', {...o, profile: profile()?.id});
    if (r?.ok === false) { toast(r.msg, 'bad'); return; }
    ending.shown = false;
    showPort();
    const intro = X.lore?.INTRO?.[o.hero] || X.lore?.INTRO?.default;
    if (intro) await say(lines(intro), {npc: 'skald', npcName: 'The skald'});
    refreshHud();
  },
  async continueGame(meta) {
    closeAllSheets();
    const r = call('state', 'load', meta.slot);
    if (r === false || r?.ok === false) { toast(r?.msg || 'That save would not load', 'bad'); return; }
    ending.shown = S().mode !== 'saga' || sagaDone();
    applyOptions();
    if (S().port) showPort(); else { toast('You wake in the nearest harbour.'); showPort(); }
    toast('Game loaded', 'good');
  },
  quit() { recordScore(); closeAllSheets(); showTitle(); },
  setSail,
  afterQuest() { checkEnd(); },
});
const lines = x => Array.isArray(x) ? x : typeof x === 'string' ? x.split(/\n\s*\n/).map(t => ({who: 'npc', text: t.trim()})) : x?.lines || [];

// ------------------------------------------------------------------ sailing
function setSail() {
  const used = read('fleet', 'cargoUsed', 0), capN = read('fleet', 'cargoCap', 1);
  if (used > capN) { sfx('error'); toast(`The holds are over-full (${num(used)}/${num(capN)}). Sell or store some cargo first.`, 'bad'); return; }
  closeAllSheets();
  const layer = h('div.map-layer');
  L().stage.appendChild(layer);
  music('sea');
  try {
    X.openMap(layer, {
      onSail(to) { layer.remove(); voyage(to); },
      onClose() { layer.remove(); music(themeFor(S().port)); },
    });
  } catch (err) { console.error(err); layer.remove(); toast('The chart is torn. Try again.', 'bad'); }
}

async function voyage(to) {
  const from = S().port;
  const plan = call('voyage', 'planVoyage', to);
  if (!plan || plan.ok === false || !plan.days) { toast(plan?.msg || 'You cannot sail there.', 'bad'); showPort(); return; }
  sfx('sail');
  logLine(`Set sail from ${portName(from)} for ${portName(to)}: ${plan.days} days.`);
  const stage = L().stage;
  stage.innerHTML = '';
  const root = h('div.voyage-layer');
  stage.appendChild(root);
  music('sea');
  const events = (plan.events || []).map((e, i) => ({...e, i: e.i ?? i}));
  const handled = new Set();
  let lost = false;
  // Days in the plan may be 0-based; whatever index the map reports, fire every event due by then.
  const due = async day => {
    for (const e of events) {
      if (lost || handled.has(e.i) || e.day > day) continue;
      handled.add(e.i);
      if (!(await seaEvent(e, root))) lost = true;
    }
  };
  try {
    await new Promise((resolve, reject) => {
      const p = X.playVoyage(root, {from, to, days: plan.days, onEvent: day => due(day), onArrive: () => resolve()});
      if (p?.catch) p.catch(reject);
    });
    await due(Infinity);
  } catch (err) { console.error('voyage', err); }
  if (lost) return gameOver();
  await arrive(to);
}

// Returns false if the fleet is lost.
async function seaEvent(e, root) {
  const text = e.text || '';
  switch (e.type) {
    case 'storm': {
      const r = call('voyage', 'resolveEvent', e.i);
      if (!e.warded) { music('storm'); sfx('thunder'); }
      toast(`${text || 'A storm batters the fleet!'}${r?.damage ? ` Hull damage: ${r.damage}.` : ''}`, e.warded ? 'good' : 'bad');
      refreshHud();
      await wait(1100);
      music('sea');
      return fleetAlive();
    }
    case 'calm': case 'wreck': {
      const r = call('voyage', 'resolveEvent', e.i);
      const extra = e.type === 'wreck' ? (r?.taken ? ` You haul in ${r.taken} ${goodName(e.good)}.` : ' No room in the hold to take any.') : '';
      toast((text || (e.type === 'calm' ? 'The wind dies. The oars come out.' : 'Wreckage drifts past.')) + extra, r?.taken ? 'good' : '');
      if (e.type === 'calm') logLine(text || 'Becalmed.');
      return true;
    }
    case 'raid': case 'collectors': case 'beast': case 'quest': {
      call('voyage', 'resolveEvent', e.i);
      const enemies = (e.enemies || []).map(x => typeof x === 'string' ? {kind: x} : x);
      const first = enemies[0]?.kind;
      sfx('horn');
      await alertDlg(text || BEAST_TEXT[first] || (e.type === 'collectors' ? 'The moneylender\'s collectors bear down on you.' : 'Ships on the horizon, and they are not traders.'),
        {title: e.type === 'beast' ? 'From the deep' : e.type === 'collectors' ? 'Collectors' : e.type === 'quest' ? 'The foe you seek' : 'To arms!', ok: 'Into battle'});
      const r = await battle({enemies, weather: e.weather, place: 'sea'}, root);
      if (r.result === 'win' && e.questId) {
        const w = call('quests', 'winBattle', e.questId);
        if (Array.isArray(w?.results)) await playActs(w.results, null, null);
      }
      return afterBattle(r, e.type);
    }
    default:
      if (text) toast(text);
      return true;
  }
}

// Runs the combat screen. Emits 'battle-end' and applies loot if combat did not.
function battle({enemies, weather, place = 'sea'}, root) {
  return new Promise(resolve => {
    const layer = h('div.battle-layer');
    (root || L().stage).appendChild(layer);
    music('battle');
    let done = false, combatEmitted = false;
    const off = G.state.on?.('battle-end', () => { combatEmitted = true; });
    const finish = r => {
      if (done) return; done = true;
      r = r || {result: 'fled'};
      setTimeout(() => {
        layer.remove();
        if (typeof off === 'function') off();
        if (!combatEmitted) {
          if (r.result === 'win' && !r.applied && !r.lootApplied && (r.loot || r.silver)) {
            const t = call('fleet', 'takeLoot', r.loot || {}, r.silver || 0);
            if (t?.ok !== false && t?.taken) r = {...r, loot: t.taken, silver: t.silver ?? r.silver};
          }
          try { G.state.emit?.('battle-end', {result: r.result, enemies: enemies.map(e => e.kind)}); } catch (err) { console.warn(err); }
        }
        resolve(r);
      }, 0);
    };
    try {
      X.startBattle(layer, {enemies, weather: weather || 'clear', place, onEnd: finish});
    } catch (err) { console.error('battle', err); finish({result: 'fled'}); }
  });
}

async function afterBattle(r, why) {
  const loot = Object.entries(r.loot || {}).filter(([, q]) => q > 0);
  if (r.result === 'win') {
    music('victory'); sfx('levelup');
    const bits = [r.silver ? silver(r.silver) : null, ...loot.map(([g, q]) => `${q} ${goodName(g)}`)].filter(Boolean);
    toast(bits.length ? `Victory! Taken: ${bits.join(', ')}` : 'Victory!', 'good');
    logLine(`Won a fight${bits.length ? ' and took ' + bits.join(', ') : ''}.`);
  } else if (r.result === 'fled') {
    toast(defeatLine('fled') || 'You got away, bruised.'); logLine('Fled from a fight.');
  } else {
    music('defeat'); sfx('sink');
    if (!fleetAlive()) return false;
    toast(defeatLine(why === 'collectors' ? 'collectors' : 'battle') || 'Beaten, but still afloat.', 'bad');
  }
  read('feats', 'check', null);
  refreshHud();
  await wait(800);
  music('sea');
  return fleetAlive();
}
function defeatLine(k) {
  const t = X.lore?.DEFEAT?.[k];
  const l = Array.isArray(t) ? t[Math.floor(Math.random() * t.length)] : t;
  return typeof l === 'string' ? l : l?.text || '';
}
const fleetAlive = () => (S().fleet || []).some(s => (s.hull ?? 1) > 0);
const wait = ms => new Promise(r => setTimeout(r, ms));

async function arrive(to) {
  const r = call('voyage', 'arrive', to);
  if (r?.ok === false) toast(r.msg, 'bad');
  logLine(`Arrived in ${portName(to)}.`);
  showPort();
  saveNotice();
  // A battle waiting in the harbour (a quest step or the raider fortress) comes first.
  const fight = r?.battle !== undefined ? r.battle : read('quests', 'battleAt', null, to);
  if (fight?.enemies?.length) {
    const port = D.ports[to];
    await alertDlg(fight.text || `Enemies hold ${port?.name || to}. There is no slipping past them.`, {title: 'Battle', ok: 'Attack'});
    const enemies = fight.enemies.map(x => typeof x === 'string' ? {kind: x} : x);
    const place = fight.place || (enemies.some(e => /^fortress_/.test(e.kind)) ? 'fortress' : 'sea');
    const res = await battle({enemies, weather: fight.weather, place});
    if (!(await afterBattle(res, 'quest'))) return gameOver();
    if (res.result === 'win') {
      const w = call('quests', 'winBattle', fight.questId);
      showPort();
      if (Array.isArray(w?.results)) await playActs(w.results, D.ports[to], null);
    } else {
      const back = call('voyage', 'retreat');
      toast(back?.port ? `You fall back to ${portName(back.port)}.` : 'You fall back.', 'bad');
      showPort();
      return;
    }
  }
  if (Array.isArray(r?.quest)) await playActs(r.quest, D.ports[to], null);
  read('feats', 'check', null);
  refreshHud();
  checkEnd();
}
function saveNotice() {
  const n = h('div.save-notice', {role: 'status'}, h('span.spin'), 'Saved');
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('out'), 1400);
  setTimeout(() => n.remove(), 1900);
}

// ------------------------------------------------------------------ endings
const ending = {shown: false};
function sagaDone() {
  const s = S();
  if (s.mode !== 'saga') return false;
  const f = s.flags || {};
  if (f.sagaDone || f.saga_done || f.sagaComplete || f.ending || f[`${s.hero}_done`]) return true;
  const mine = (X.sagas || []).filter(q => q.saga === s.hero);
  if (!mine.length) return false;
  const last = mine.reduce((a, b) => ((b.chapter || 0) >= (a.chapter || 0) ? b : a));
  return (s.quests?.done || []).includes(last.id);
}
async function checkEnd() {
  if (ending.shown || !sagaDone()) return;
  ending.shown = true;
  const s = S();
  updateProfile(p => { p.sagasDone = [...new Set([...(p.sagasDone || []), s.hero])]; });
  music('victory'); sfx('levelup');
  const end = X.lore?.ENDINGS?.[s.hero] || X.lore?.ENDINGS?.default;
  if (end) await say(lines(end), {npc: 'skald', npcName: 'The skald'});
  endScreen({title: 'The saga is sung', text: `${s.name}'s tale will be told in every hall from ${portName('island')} to ${portName('miklagard')}. New heroes now wait on the title screen.`, win: true});
}
function gameOver() {
  recordScore();
  music('defeat');
  endScreen({title: 'The sea keeps what it takes', text: defeatLine('sunk') || 'Your last ship is gone. The skalds will make something heroic of it, eventually.', win: false});
}
function endScreen({title, text, win}) {
  closeAllSheets();
  const s = S();
  const worth = read('fleet', 'netWorth', 0);
  const r = read('rank', 'rank', {title: ''});
  const stage = L().stage;
  stage.innerHTML = '';
  let bg = '';
  try { bg = win ? A.titleScene() : A.seaScene({weather: 'storm', time: 'dusk'}); } catch { /* none */ }
  stage.appendChild(h('div.screen.end-screen' + (win ? '.win' : '.lose'), h('div.title-bg', {html: bg}),
    h('div.end-card.frame', h('div.parch',
      h('h2.logo.small', title), h('p', text),
      h('dl.stats', h('dt', 'Net worth'), h('dd', silver(worth)), h('dt', 'Rank'), h('dd', r.title || ''), h('dt', 'Renown'), h('dd', num(s.renown || 0)), h('dt', 'Days'), h('dd', num(s.day || 0))),
      h('div.btn-row',
        win ? h('button.btn', {type: 'button', onclick: () => showPort()}, 'Keep sailing') : null,
        h('button.btn' + (win ? '.ghost' : ''), {type: 'button', onclick: () => flow.toTitle()}, 'To the title'))))));
}
function recordScore() {
  const s = S();
  if (s?.mode !== 'free' || !s.fleet) return;
  addScore(read('fleet', 'netWorth', 0));
}

// ------------------------------------------------------------------ events
function wireEvents() {
  const on = (ev, fn) => { try { G.state.on?.(ev, fn); } catch (err) { console.warn('on', ev, err); } };
  for (const ev of ['silver', 'cargo', 'day', 'fleet', 'quest', 'port']) on(ev, () => queueHud());
  on('feat', id => {
    const f = id?.name ? id : read('feats', 'list', []).find(x => x.id === (id?.id || id));
    sfx('levelup');
    toast(`Feat: ${f?.name || id}`, 'good');
    updateProfile(p => { const k = f?.id || id?.id || id; p.feats = [...new Set([...(p.feats || []), k])]; });
  });
  on('saga-end', () => setTimeout(() => checkEnd(), 300));
  on('battle-end', () => queueHud());
}
let hudQueued = false;
function queueHud() { if (hudQueued) return; hudQueued = true; requestAnimationFrame(() => { hudQueued = false; refreshHud(); }); }

function wireKeys() {
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (talking() || $('#modal-layer')?.children.length) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { if (e.key === 'Escape') document.activeElement.blur(); return; }
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      if (sheetsOpen()) { topSheet().close(); e.preventDefault(); return; }
      if (portView()?.screen.isConnected) { gameMenu(); e.preventDefault(); }
      return;
    }
    if (k === 'f') { toggleFullscreen(); return; }
    if (!portView()?.screen.isConnected || $('.map-layer') || $('.battle-layer')) return;
    const act = {i: itemsSheet, s: fleetSheet, c: cargoSheet, t: () => journalSheet('tasks'), l: () => journalSheet('log'), h: () => { closeAllSheets(); nextHint(); }}[k];
    if (act) { e.preventDefault(); closeAllSheets(); act(); }
  });
}

function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  if (/^(localhost|127\.)/.test(location.hostname) && !/sw=1/.test(location.search)) return; // keep local dev uncached
  navigator.serviceWorker.register('./sw.js').catch(err => console.warn('sw', err));
}

boot();
