// Port view: painted scene with tappable buildings and labels, building chips for phones,
// quest markers (Easy mode), Talk, top bar (HUD) and bottom dock. Also tutorial hints.
import {h, add, L, sfx, toast, num, silver, meter, rnd} from './dom.js';
import {A, D, X, S, read, call, portName} from './adapters.js';
import {opts, settleSVG, profile, updateProfile} from './options.js';
import {flow, music, themeFor} from './ctx.js';
import {bldIcon, hudIcon, BLD_NAMES} from './icons.js';
import {say} from './dialogue.js';
import {journalSheet, fleetSheet, cargoSheet, itemsSheet} from './sheets.js';

let view = null; // {screen, hud, tags, layout()}

export function showPort() {
  const s = S();
  const port = D.ports[s.port] || {id: s.port, name: portName(s.port), buildings: []};
  const stage = L().stage;
  stage.innerHTML = '';
  const date = read('time', 'date', {season: 'summer', label: ''}, s.day);
  const time = ['day', 'day', 'dusk', 'day', 'night', 'day'][(s.day || 0) % 6];
  let svg = '';
  try { svg = A.portScene(port.id, {time, season: date.season === 'winter' ? 'winter' : 'summer', width: 1600, height: 900}); }
  catch (err) { console.warn('portScene', err); }

  const sceneBox = h('div.scene-box', {html: svg});
  const tagLayer = h('div.tag-layer');
  sceneBox.appendChild(tagLayer);
  const sceneStage = h('div.scene-stage', {'data-time': time}, sceneBox);
  const hud = h('header.hud');
  const chips = h('nav.chip-row', {'aria-label': 'Buildings'});
  const talk = h('button.talk-btn', {type: 'button', onclick: () => talkTown(port), title: 'Talk to townsfolk'}, h('span', {html: hudIcon('talk')}), h('b', 'Talk'));
  const plaque = h('div.port-plaque', h('h2', port.name), h('small', cultureName(port.culture)));
  const dock = h('nav.dock', {'aria-label': 'Actions'},
    dockBtn('sail', 'Set Sail', () => flow.setSail(), '.primary.sail'),
    dockBtn('journal', 'Journal', () => journalSheet('tasks'), '', 'T'),
    dockBtn('fleet', 'Fleet', () => fleetSheet(), '', 'S'),
    dockBtn('cargo', 'Cargo', () => cargoSheet(), '', 'C'),
    dockBtn('items', 'Items', () => itemsSheet(), '', 'I'),
    dockBtn('log', 'Log', () => journalSheet('log'), '', 'L'),
    dockBtn('menu', 'Menu', () => flow.openMenu(), '.menu-btn', 'Esc'));
  const screen = h('div.screen.port', {'data-culture': port.culture || ''}, hud, h('div.port-mid', sceneStage, plaque, talk), chips, dock);
  stage.appendChild(screen);
  settleSVG(screen);

  // Make every drawn building tappable.
  sceneBox.querySelectorAll('g.bld[data-b]').forEach(g => {
    g.setAttribute('tabindex', '-1');
    g.addEventListener('click', () => enter(g.dataset.b));
  });
  view = {screen, hud, chips, tagLayer, sceneBox, sceneStage, port, layout: () => layout(sceneStage, sceneBox)};
  buildChips();
  placeTags();
  refreshHud();
  view.layout();
  requestAnimationFrame(() => view?.layout());
  music(themeFor(port.id));
  setTimeout(() => maybeTutorial(), 600);
}

const CULTURES = {norse: 'Norse', dane: 'Danish', svear: 'Svear', gotlander: 'Gotlandic', slav: 'Slavic', byzantine: 'Roman (Byzantine)',
  saxon: 'Saxon', frank: 'Frankish', anglonorse: 'Anglo-Norse', gael: 'Norse-Gaelic', island: 'Island folk', aesti: 'Aesti', wend: 'Wendish'};
const cultureName = c => CULTURES[c] || '';

function dockBtn(icon, label, fn, cls = '', key = '') {
  return h('button.dock-btn' + cls, {type: 'button', onclick: () => { sfx('click'); fn(); }, title: key ? `${label} (${key})` : label, 'data-act': icon},
    h('span.di', {html: hudIcon(icon)}), h('span.dl', label));
}

function enter(b) { sfx('click'); flow.openBuilding(b); }

function buildChips() {
  const {chips, port} = view;
  chips.innerHTML = '';
  for (const b of port.buildings || []) {
    add(chips, h('button.chip-b', {type: 'button', 'data-b': b, onclick: () => enter(b)}, h('span', {html: bldIcon(b)}), h('b', BLD_NAMES[b] || b), h('i.mk')));
  }
}

// Labels sit at each building's g.bld-label anchor (viewBox units -> % of the scene box).
function anchorOf(b) {
  const box = view.sceneBox;
  const a = box.querySelector(`g.bld-label[data-b="${b}"]`);
  const tr = a?.getAttribute('transform') || '';
  const m = tr.match(/translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const g = box.querySelector(`g.bld[data-b="${b}"]`);
  if (g?.getBBox) { try { const bb = g.getBBox(); if (bb.width) return [bb.x + bb.width / 2, bb.y - 10]; } catch { /* not rendered */ } }
  return null;
}
function placeTags() {
  const {tagLayer, port} = view;
  tagLayer.innerHTML = '';
  for (const b of port.buildings || []) {
    const at = anchorOf(b);
    if (!at) continue;
    add(tagLayer, h('button.bld-tag', {type: 'button', 'data-b': b, style: {left: (at[0] / 16) + '%', top: (at[1] / 9) + '%'}, onclick: () => enter(b)},
      h('span', {html: bldIcon(b)}), h('b', BLD_NAMES[b] || b), h('i.mk')));
  }
  markQuests();
}
export function markQuests() {
  if (!view) return;
  const here = opts.easy ? read('quests', 'markers', []).filter(m => m.port === S().port) : [];
  const kindOf = b => { const ms = here.filter(m => m.building === b || (!m.building && b === 'hall')); return ms.some(m => m.kind === 'main') ? 'main' : ms.length ? 'side' : ''; };
  view.screen.querySelectorAll('[data-b]').forEach(el => {
    const k = kindOf(el.dataset.b);
    const mk = el.querySelector('.mk'); if (mk) { mk.className = 'mk' + (k ? ' ' + k : ''); mk.textContent = k ? '?' : ''; }
    el.classList.toggle('has-quest', !!k);
  });
}

function layout(stageEl, box) {
  const W = stageEl.clientWidth, H = stageEl.clientHeight;
  if (!W || !H) return;
  const portrait = H > W;
  let sc = Math.max(W / 1600, H / 900);
  if (portrait) sc = Math.max(W / 1600, Math.min(H / 900, W * 2.3 / 1600));
  const bw = Math.round(1600 * sc), bh = Math.round(900 * sc);
  box.style.width = bw + 'px'; box.style.height = bh + 'px';
  box.style.top = Math.max(0, Math.round((H - bh) / 2)) + 'px';
  const left = Math.round((bw - W) / 2);
  if (!stageEl.dataset.scrolled) { stageEl.scrollLeft = left; stageEl.scrollTop = Math.max(0, Math.round((bh - H) / 2)); stageEl.dataset.scrolled = '1'; }
  stageEl.classList.toggle('pannable', bw > W + 4);
}
export function relayout() { if (view?.screen.isConnected) { delete view.sceneStage.dataset.scrolled; view.layout(); } }

// ------------------------------------------------------------------ HUD
export function refreshHud() {
  if (!view?.screen.isConnected) return;
  const s = S();
  const date = read('time', 'date', {label: `Day ${s.day}`, season: ''}, s.day);
  const used = read('fleet', 'cargoUsed', 0), capN = read('fleet', 'cargoCap', 1);
  const bankHere = read('bank', 'bankHere', 0);
  const bankAll = Object.values(s.bank || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const loan = read('bank', 'loanStatus', {amount: s.debt?.amount || 0, overdue: false});
  const r = read('rank', 'rank', {title: '', progress: 0});
  const stat = (icon, label, value, cls = '', title = '') => h('div.stat' + cls, {title: title || label},
    h('span.si', {html: hudIcon(icon)}), h('span.sv', h('small', label), h('b', value)));
  view.hud.innerHTML = '';
  add(view.hud, 
    stat('silver', 'Silver', silver(s.silver), '.silver'),
    stat('bank', 'Bank here', silver(bankHere), '.bank', bankAll > bankHere ? `All banks: ${silver(bankAll)}` : 'Deposited in this town'),
    stat('debt', 'Debt', loan.amount ? silver(loan.amount) : 'none', loan.overdue ? '.debt.bad' : '.debt', loan.overdue ? 'Overdue! Collectors are coming.' : ''),
    stat('date', date.season ? date.season[0].toUpperCase() + date.season.slice(1) : 'Date', date.label, '.date'),
    h('div.stat.cargo', {title: 'Cargo'}, h('span.si', {html: hudIcon('cargo')}),
      h('span.sv', h('small', 'Holds'), meter(used / capN, `${num(used)}/${num(capN)}`, used > capN ? 'bad' : ''))),
    stat('renown', r.title || 'Renown', num(s.renown || 0), '.renown', r.next ? `Next rank: ${r.next}` : ''),
  );
  const sail = view.screen.querySelector('.dock-btn.sail');
  if (sail) sail.classList.toggle('blocked', used > capN);
  markQuests();
}

// ------------------------------------------------------------------ talk
async function talkTown(port) {
  sfx('click');
  const lore = X.lore || {};
  const acts = read('quests', 'act', [], port.id, 'talk');
  if (acts.length) { for (const a of acts) await say(a.lines, {npc: a.npc || 'townsman'}); flow.refreshHud(); return; }
  const line = pickLine(lore.TOWNSFOLK, port.culture) || rnd(FALLBACK_TALK);
  const who = Math.random() < 0.5 ? 'townsman' : 'townswoman';
  await say([typeof line === 'string' ? {who: 'npc', text: line} : line], {npc: line.who && line.who !== 'npc' ? line.who : who, npcName: who === 'townsman' ? 'A townsman' : 'A townswoman'});
}
// Lore tables may be arrays or keyed by culture/port; pick something sensible.
export function pickLine(table, culture, portId) {
  if (!table) return null;
  if (Array.isArray(table)) return table.length ? rnd(table) : null;
  const pool = [...(table[portId] || []), ...(table[culture] || []), ...(table.any || table.all || table.common || table.default || [])];
  if (pool.length) return rnd(pool);
  const all = Object.values(table).flat().filter(Boolean);
  return all.length ? rnd(all) : null;
}
const FALLBACK_TALK = [
  'The herring were so thick last spring you could walk to the next island. My cousin tried. He swims well now.',
  'If you sail east, take salt. Everyone east of here is always out of salt.',
  'The jarl is in a mood. Bring him something and the mood improves.',
  'They say the moneylender counts his silver twice a day and his friends once a year.',
];

// ------------------------------------------------------------------ tutorial
const HINTS = [
  {sel: '.chip-row, .tag-layer', text: 'Welcome ashore. Tap a building in the picture, or use the buttons under it, to go inside.'},
  {sel: '[data-b="market"]', text: 'The market is where fortunes start. Buy what is cheap here and carry it where it is wanted.'},
  {sel: '.hud', text: 'Up top: silver in hand, money in this town\'s bank, your debt, the date, how full the holds are, and renown.'},
  {sel: '.dock-btn.sail', text: 'With the holds full, tap Set Sail and choose a port on the chart.'},
  {sel: '[data-act="journal"]', text: 'The Journal keeps your tasks. With Easy mode on, a "?" marks where the next one leads.'},
];
let hintAt = 0;
function maybeTutorial() {
  if (!opts.tutorial || profile()?.tutorialDone || !view?.screen.isConnected) return;
  hintAt = 0; showHint();
}
export function nextHint() {
  if (!view?.screen.isConnected) return;
  if (hintAt >= HINTS.length) hintAt = 0;
  showHint();
}
function showHint() {
  view.screen.querySelector('.hint')?.remove();
  view.screen.querySelectorAll('.hint-target').forEach(e => e.classList.remove('hint-target'));
  const hint = HINTS[hintAt];
  if (!hint) return;
  const target = view.screen.querySelector(hint.sel);
  target?.classList.add('hint-target');
  const last = hintAt === HINTS.length - 1;
  const box = h('div.hint.parch', {role: 'note'},
    h('p', hint.text),
    h('div.btn-row',
      h('button.btn.ghost.small', {type: 'button', onclick: () => { done(); }}, 'Hide hints'),
      h('button.btn.small', {type: 'button', onclick: () => { hintAt++; if (last) done(); else showHint(); }}, last ? 'Got it' : 'Next')),
    h('small.hint-count', `${hintAt + 1} / ${HINTS.length}`));
  const done = () => { box.remove(); target?.classList.remove('hint-target'); updateProfile(p => { p.tutorialDone = true; }); hintAt = HINTS.length; };
  view.screen.querySelector('.port-mid').appendChild(box);
}

export const portView = () => view;
export {call, toast};
