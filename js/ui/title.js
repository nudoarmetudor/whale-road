// Title screen, main menu, "watch the sea", profiles, hero select and new-game options.
import {h, add, L, sfx, modal, confirmDlg, toast, portraitEl} from './dom.js';
import {A, D} from './adapters.js';
import {opts, setOpt, settleSVG, profile, profileList, createProfile, selectProfile, deleteProfile, heroUnlocked} from './options.js';
import {flow, music, initAudio} from './ctx.js';
import {hudIcon} from './icons.js';
import {saveSlotsSheet, latestSave} from './sheets.js';
import {openOptions, openHelp, openCredits} from './info.js';

export function showTitle() {
  const stage = L().stage;
  stage.innerHTML = '';
  let bg = '';
  try { bg = A.titleScene(); } catch (err) { console.warn('titleScene', err); }
  const scene = h('div.title-bg', {html: bg});
  const ships = h('div.title-ships', {'aria-hidden': 'true'});
  const menu = h('nav.menu', {'aria-label': 'Main menu'});
  const prof = h('button.profile-chip', {type: 'button', onclick: () => profilePicker().then(() => fill())});
  const fg = h('div.title-fg',
    h('div.logo-wrap', h('h1.logo', 'Whale Road'), h('p.tagline', 'A trading saga of the northern seas, around the year 950')),
    menu, prof);
  const screen = h('div.screen.title', scene, ships, fg);
  stage.appendChild(screen);
  settleSVG(screen);
  music('title');
  sailBy(ships, 3);

  function fill() {
    const p = profile();
    prof.innerHTML = '';
    add(prof, h('span', {html: hudIcon('renown')}), h('span', p ? `Skipper: ${p.name}` : 'Choose a skipper'));
    const last = latestSave();
    menu.innerHTML = '';
    const item = (label, fn, cls = '', disabled = false) =>
      h('button.menu-item' + cls, {type: 'button', disabled, onclick: () => { initAudio(); sfx('click'); fn(); }}, label);
    add(menu, ...[
      last ? item('Continue', () => flow.continueGame(last), '.primary') : null,
      item('Saga', () => needProfile(() => heroSelect('saga')), last ? '' : '.primary'),
      item('Free Trade', () => needProfile(() => heroSelect('free'))),
      item('Load', () => needProfile(() => saveSlotsSheet('load'))),
      item('Options', () => openOptions()),
      item('Help', () => openHelp()),
      item('Credits', () => openCredits()),
      item('Watch the sea', () => watch()),
    ].filter(Boolean));
  }
  function watch() {
    screen.classList.add('watching');
    sailBy(ships, 6);
    const back = h('button.watch-back', {type: 'button', 'aria-label': 'Show menu'}, 'Tap to return');
    const done = () => { screen.classList.remove('watching'); back.remove(); document.removeEventListener('keydown', key); };
    const key = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') done(); };
    back.addEventListener('click', done);
    document.addEventListener('keydown', key);
    screen.appendChild(back);
  }
  function needProfile(fn) {
    if (profile()) fn(); else profilePicker().then(p => { fill(); if (p) fn(); });
  }
  fill();
  if (!profileList().length) setTimeout(() => profilePicker().then(() => fill()), 400);
}

// Ships crossing the title sea. Each pass is a CSS animation on a wrapper; reschedules itself.
const SAILS = ['#8e2a22', '#efe2c4', '#2f5d6e', '#c99a2e', '#5f6b3a'];
function sailBy(layer, n) {
  const types = Object.keys(D.ships || {knarr: 1});
  for (let i = 0; i < n; i++) {
    const type = types[(Math.random() * types.length) | 0];
    let svg = '';
    try { svg = A.shipSVG(type, {w: 240, sail: SAILS[(Math.random() * SAILS.length) | 0], shields: true}); } catch { continue; }
    const dir = Math.random() < 0.5 ? 1 : -1;
    const el = h('div.sea-ship', {html: svg});
    const lane = Math.random();
    el.style.setProperty('--lane', lane.toFixed(3));
    el.style.setProperty('--dur', (26 + Math.random() * 30).toFixed(1) + 's');
    el.style.setProperty('--delay', (-Math.random() * 30).toFixed(1) + 's');
    el.style.setProperty('--scale', (0.45 + lane * 0.75).toFixed(2));
    el.style.zIndex = String(Math.round(lane * 10));
    if (dir < 0) el.classList.add('rtl');
    layer.appendChild(el);
  }
  while (layer.children.length > 9) layer.firstChild.remove();
}

// ------------------------------------------------------------------ profiles
export function profilePicker() {
  return modal(close => {
    const list = h('ul.rows.profiles');
    const inp = h('input.text', {placeholder: 'New skipper name', maxlength: 20, 'aria-label': 'New skipper name'});
    const make = () => {
      const name = inp.value.trim();
      if (!name) { inp.focus(); toast('Give your skipper a name'); return; }
      const p = createProfile(name); sfx('quest'); close(p);
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') make(); });
    const draw = () => {
      list.innerHTML = '';
      for (const p of profileList()) {
        const cur = profile()?.id === p.id;
        add(list, h('li' + (cur ? '.on' : ''),
          h('button.row-main', {type: 'button', onclick: () => { selectProfile(p.id); sfx('click'); close(p); }},
            h('b', p.name), h('small', `${(p.sagasDone || []).length} sagas finished, ${(p.feats || []).length} feats`)),
          h('button.icon-btn', {type: 'button', 'aria-label': `Delete ${p.name}`, title: 'Delete',
            onclick: async () => { if (await confirmDlg(`Delete skipper ${p.name} with all saves and feats?`, {yes: 'Delete', danger: true})) { const r = deleteProfile(p.id); if (r?.ok === false) toast(r.msg, 'bad'); draw(); } }}, '✕')));
      }
    };
    draw();
    return h('div.parch.profile-box', h('h3', 'Who holds the steering oar?'),
      profileList().length ? list : h('p', 'Make a skipper profile. Each keeps its own feats, log and unlocked heroes.'),
      h('div.inline-form', inp, h('button.btn', {type: 'button', onclick: make}, 'Create')),
      profileList().length ? h('div.btn-row', h('button.btn.ghost', {type: 'button', onclick: () => close(profile())}, 'Done')) : null);
  }, {dismiss: profileList().length > 0});
}

// ------------------------------------------------------------------ hero select
const LOOKS = {
  hair: [['fair', 'Fair'], ['red', 'Red'], ['dark', 'Dark'], ['grey', 'Grey']],
  skin: [['light', 'Light'], ['ruddy', 'Ruddy'], ['olive', 'Olive'], ['brown', 'Brown']],
  cloak: [['blood', 'Red'], ['sea', 'Blue'], ['moss', 'Green'], ['wood', 'Brown']],
  face: [['beard', 'Beard'], ['braids', 'Braids'], ['shaven', 'Clean'], ['scar', 'Scarred']],
};
export function heroSelect(mode) {
  const stage = L().stage;
  stage.innerHTML = '';
  const heroes = Object.values(D.heroes || {});
  let pick = heroes.find(x => heroUnlocked(x.id) && x.id !== 'custom')?.id || 'ylva';
  let easy = opts.easy;
  const look = {hair: 'fair', skin: 'light', cloak: 'blood', face: 'beard'};
  let customName = '';

  const cards = h('div.hero-cards', {role: 'listbox', 'aria-label': 'Heroes'});
  const detail = h('div.hero-detail.frame');
  const easyBtn = h('button.toggle', {type: 'button', role: 'switch'});
  const drawEasy = () => { easyBtn.setAttribute('aria-checked', String(easy)); easyBtn.innerHTML = `<i></i><span>Easy mode ${easy ? 'on' : 'off'}</span>`; };
  easyBtn.onclick = () => { easy = !easy; sfx('click'); drawEasy(); };
  drawEasy();
  const begin = h('button.btn.big', {type: 'button', onclick: start}, mode === 'free' ? 'Set out' : 'Begin the saga');
  const screen = h('div.screen.hero-select',
    h('header.hs-head', h('button.btn.ghost', {type: 'button', onclick: () => flow.toTitle()}, '‹ Back'),
      h('h2', mode === 'free' ? 'Free Trade: choose your skipper' : 'Saga: choose your hero')),
    h('div.hs-body', cards, detail),
    h('footer.hs-foot', h('div.hs-easy', easyBtn, h('small', 'Markers show where tasks lead. You can change this any time in Options.')), begin));
  stage.appendChild(screen);

  function drawCards() {
    cards.innerHTML = '';
    for (const x of heroes) {
      const locked = !heroUnlocked(x.id);
      add(cards, h('button.hero-card' + (x.id === pick ? '.on' : '') + (locked ? '.locked' : ''),
        {type: 'button', role: 'option', 'aria-selected': String(x.id === pick), 'aria-label': `${x.name} ${x.epithet || ''}${locked ? ', locked' : ''}`,
          onclick: () => { sfx(locked ? 'error' : 'click'); pick = x.id; drawCards(); drawDetail(); }},
        portraitEl(x.id, x.id === 'custom' ? {look} : {}),
        h('b', x.id === 'custom' && customName ? customName : x.name), h('small', x.epithet || ''),
        locked ? h('span.lock', {html: hudIcon('lock')}) : null));
    }
  }
  function drawDetail() {
    const x = D.heroes[pick];
    const locked = !heroUnlocked(pick);
    detail.innerHTML = '';
    begin.disabled = locked;
    add(detail, 
      h('div.hd-top', portraitEl(pick, pick === 'custom' ? {look} : {}),
        h('div', h('h3', x.id === 'custom' && customName ? customName : x.name), h('p.epithet', x.epithet || ''))),
      locked ? h('p.locked-note', 'Finish any saga with this skipper profile to unlock.') : h('p.bio', x.bio || ''),
      x.talent ? h('div.talent', h('b', `Talent: ${x.talent.name}`), h('p', x.talent.desc)) : null,
      !locked ? startLine(x) : null,
    );
    if (pick === 'custom' && !locked) add(detail, customBuilder());
  }
  function startLine(x) {
    const bits = [];
    if (x.startShip) bits.push(`Ship: ${D.ships[x.startShip]?.name || x.startShip}`);
    if (x.startSilver != null) bits.push(`Silver: ${x.startSilver}`);
    if (x.startDebt) bits.push(`Debt: ${x.startDebt}`);
    if (x.startPort) bits.push(`Home: ${D.ports[x.startPort]?.name || x.startPort}`);
    return bits.length ? h('p.start-line', bits.join(' · ')) : null;
  }
  function customBuilder() {
    const name = h('input.text', {value: customName, maxlength: 18, placeholder: 'Name your hero', 'aria-label': 'Hero name'});
    name.addEventListener('input', () => { customName = name.value.trim(); detail.querySelector('h3').textContent = customName || 'Your hero'; });
    const rows = Object.entries(LOOKS).map(([k, choices]) => h('div.look-row', h('span', k[0].toUpperCase() + k.slice(1)),
      h('div.chips', choices.map(([v, label]) => h('button.chip' + (look[k] === v ? '.on' : ''), {type: 'button',
        onclick: () => { look[k] = v; sfx('click'); drawCards(); drawDetail(); }}, label)))));
    return h('div.custom-builder', h('label', 'Name', name), rows);
  }
  async function start() {
    if (!heroUnlocked(pick)) return;
    if (pick === 'custom' && !customName) { toast('Give your hero a name'); return; }
    setOpt('easy', easy);
    sfx('horn');
    flow.newGame({mode, hero: pick, name: pick === 'custom' ? customName : D.heroes[pick].name, look: pick === 'custom' ? {...look} : null, easy});
  }
  drawCards(); drawDetail();
}

