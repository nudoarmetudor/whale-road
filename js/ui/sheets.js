// Books and menus: Journal (tasks, feats, log, stats), Fleet, Cargo, Items, in-game menu,
// save/load slots.
import {h, add, sheet, tabs, meter, num, silver, empty, sfx, confirmDlg, result} from './dom.js';
import {D, X, A, S, read, call, goodName, portName, itemOf, shipName, cap} from './adapters.js';
import {profile, readLog} from './options.js';
import {flow} from './ctx.js';
import {goodIcon, hudIcon} from './icons.js';
import {openOptions, openHelp} from './info.js';

// ------------------------------------------------------------------ saves
// state.js keeps saves per profile in slots 1, 2, 3 (manual) and 'auto' (each arrival).
export function normalizeSaves() {
  let raw = read('state', 'listSaves', []);
  if (raw && !Array.isArray(raw)) raw = Object.entries(raw).map(([slot, v]) => ({slot, ...(v || {})}));
  return (raw || []).filter(x => x && !x.empty).map(x => {
    const time = x.ts ?? x.time ?? x.t ?? x.saved ?? 0;
    return {...x, time: typeof time === 'string' ? Date.parse(time) || 0 : time};
  });
}
export function latestSave() {
  return normalizeSaves().sort((a, b) => b.time - a.time)[0] || null;
}
const when = t => t ? new Date(t).toLocaleString(undefined, {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) : '';
function saveLabel(s) {
  const bits = [];
  const hero = s.name || D.heroes?.[s.hero]?.name; if (hero) bits.push(hero);
  const lbl = s.label || (s.day != null ? read('time', 'date', null, s.day)?.label : '');
  if (lbl) bits.push(lbl);
  if (s.port) bits.push(portName(s.port));
  if (s.mode) bits.push(s.mode === 'free' ? 'Free Trade' : 'Saga');
  return bits.join(' · ') || 'Saved game';
}
export function saveSlotsSheet(mode = 'save') {
  return sheet({title: mode === 'save' ? 'Save game' : 'Load game', cls: 'saves', build(body, api) {
    const all = normalizeSaves();
    const list = h('ul.rows.slots');
    const row = (slot, label) => {
      const meta = all.find(x => String(x.slot) === String(slot));
      add(list, h('li', h('div.row-main', h('b', label), h('small', meta ? `${saveLabel(meta)} · ${when(meta.time)}` : 'Empty')),
        mode === 'save'
          ? h('button.btn', {type: 'button', onclick: async () => {
            if (meta && !(await confirmDlg(`Write over ${label.toLowerCase()}?`))) return;
            if (result(call('state', 'save', slot), `Saved in ${label.toLowerCase()}`, 'page')) api.refresh();
          }}, 'Save')
          : h('button.btn', {type: 'button', disabled: !meta, onclick: () => { api.close(); flow.continueGame({slot}); }}, 'Load')));
    };
    [1, 2, 3].forEach(n => row(n, `Slot ${n}`));
    if (mode === 'load') row('auto', 'Autosave');
    add(body, list, h('p.small', `Saves belong to the skipper profile ${profile()?.name ? '"' + profile().name + '"' : ''}. The game also saves by itself each time you reach a port.`));
  }});
}

// ------------------------------------------------------------------ in-game menu
export function gameMenu() {
  return sheet({title: 'Menu', cls: 'game-menu', build(body, api) {
    const b = (label, fn, cls = '') => h('button.menu-item' + cls, {type: 'button', onclick: () => { sfx('click'); fn(); }}, label);
    add(body, h('nav.menu.in-game',
      b('Resume', () => api.close(), '.primary'),
      b('Save', () => saveSlotsSheet('save')),
      b('Load', () => saveSlotsSheet('load')),
      b('Options', () => openOptions()),
      b('Help', () => openHelp()),
      b('Quit to title', async () => { if (await confirmDlg('Quit to the title screen? Anything since your last save stays behind.', {yes: 'Quit'})) { api.close(); flow.quit(); } }),
    ));
  }});
}

// ------------------------------------------------------------------ journal
export function journalSheet(tab = 'tasks') {
  let cur = tab, sel = null;
  return sheet({title: 'Journal', cls: 'journal', wide: true, build(body, api) {
    add(body, tabs([['tasks', 'Tasks'], ['feats', 'Feats'], ['log', 'Log'], ['stats', 'Stats']], cur, id => { cur = id; api.refresh(); }));
    if (cur === 'tasks') add(body, tasksPane());
    if (cur === 'feats') add(body, featsPane());
    if (cur === 'log') add(body, logPane());
    if (cur === 'stats') add(body, statsPane());
    function tasksPane() {
      const list = read('quests', 'journal', []);
      if (!list.length) return empty('No tasks yet. Jarls and mead halls have work for willing hands.');
      const open = list.filter(q => !q.done), done = list.filter(q => q.done);
      sel ||= open[0]?.id || list[0].id;
      const q = list.find(x => x.id === sel) || list[0];
      const item = x => h('li' + (x.id === sel ? '.on' : '') + (x.done ? '.done' : ''),
        h('button.row-main', {type: 'button', onclick: () => { sel = x.id; sfx('page'); api.refresh(); }},
          h('span.kind' + (x.saga ? '.main' : '.side'), x.saga ? '◆' : '◇'), h('b', x.title), h('small', x.done ? 'Done' : x.stepText || '')));
      return h('div.split',
        h('div.split-list', open.length ? h('h4', 'Under way') : null, h('ul.rows.tasks', open.map(item)),
          done.length ? h('h4', 'Finished') : null, h('ul.rows.tasks', done.map(item))),
        h('div.split-detail.parch-inset', taskDetail(q)));
    }
    function taskDetail(q) {
      const def = X.questById?.(q.id) || null;
      const npcName = q.npcName || def?.npcName, giver = q.giver || def?.giver;
      return h('div',
        h('h3', q.title),
        h('p.tag', q.saga ? `${D.heroes?.[q.saga]?.name || cap(q.saga)}'s saga · chapter ${q.chapter}` : 'Optional task'),
        npcName ? h('p.small', `Given by ${npcName}${giver?.port ? ' in ' + portName(giver.port) : ''}`) : null,
        h('p', q.done ? 'This task is done.' : (q.stepText || '')),
        q.progress ? h('p.small', `Progress: ${q.progress}`) : null,
        !q.done && q.steps ? meter((q.step || 0) / q.steps, `Step ${(q.step || 0) + 1} of ${q.steps}`, 'gold') : null,
        q.daysLeft != null && !q.done ? h('p.warn', `${q.daysLeft} days left`) : null,
        def?.reward && !q.done ? h('p.small', 'Reward: ' + rewardText(def.reward)) : null);
    }
    function featsPane() {
      const list = read('feats', 'list', []);
      if (!list.length) return empty('No feats recorded.');
      const got = list.filter(f => f.got).length;
      return h('div', h('p.small', `${got} of ${list.length} feats`), h('ul.feats', list.map(f => h('li' + (f.got ? '.got' : ''),
        h('span.feat-mark', {html: hudIcon('renown')}), h('div', h('b', f.name), h('small', f.desc))))));
    }
    function logPane() {
      const log = readLog();
      if (!log.length) return empty('The log is empty.');
      return h('ul.log', log.map(l => h('li', h('small', l.t), h('span', l.text))));
    }
    function statsPane() {
      const s = S(); const r = read('rank', 'rank', {title: '', progress: 0});
      const worth = read('fleet', 'netWorth', 0);
      const rows = [['Rank', r.title], ['Renown', num(s.renown || 0)], ['Net worth', silver(worth)],
        ['Day', num(s.day || 1)], ['Ships', num(s.fleet?.length || 0)], ['Feats', num(s.feats?.length || 0)]];
      for (const [k, v] of Object.entries(s.stats || {})) if (typeof v === 'number') rows.push([cap(k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()), num(v)]);
      const scores = read('state', 'highScores', null) || profile()?.scores || [];
      return h('div',
        h('div.rank-box', h('b', r.title), meter(r.progress, r.next ? `toward ${r.next}` : 'highest rank', 'gold')),
        h('dl.stats', rows.map(([k, v]) => [h('dt', k), h('dd', v)])),
        scores.length ? h('div', h('h4', 'Free Trade best'), h('ol.scores', scores.map(x => h('li', h('b', silver(x.score ?? x.worth)), h('small', ` ${x.name} · day ${x.day}`))))) : null);
    }
  }});
}
export function rewardText(r = {}) {
  const bits = [];
  if (r.silver) bits.push(silver(r.silver));
  for (const [g, q] of Object.entries(r.goods || {})) bits.push(`${q} ${goodName(g)}`);
  for (const i of r.items || []) bits.push(itemOf(i).name);
  for (const [b, q] of Object.entries(r.blessings || {})) bits.push(`${q}× ${D.blessings?.[b]?.name || b}`);
  if (r.ship) bits.push(`a ${shipName(r.ship)}`);
  if (r.renown) bits.push(`${r.renown} renown`);
  if (r.unlockPorts?.length) bits.push('opens ' + r.unlockPorts.map(portName).join(', '));
  return bits.join(', ') || 'gratitude';
}

// ------------------------------------------------------------------ fleet
export function fleetSheet() {
  return sheet({title: 'Fleet', cls: 'fleet', wide: true, build(body) {
    const s = S();
    const used = read('fleet', 'cargoUsed', 0), cap_ = read('fleet', 'cargoCap', 1);
    add(body, h('div.fleet-sum', meter(used / cap_, `Cargo ${num(used)} / ${num(cap_)}`),
      h('span', `Speed ${read('fleet', 'fleetSpeed', '?')}`), h('span', `Ships ${s.fleet.length} / 4`)));
    add(body, h('div.ship-cards', s.fleet.map((sh) => shipCard(sh))));
  }});
}
export function shipCard(sh, extra) {
  const st = {...(D.ships?.[sh.type] || {})};
  const i = (S().fleet || []).indexOf(sh);
  if (i >= 0) st.hull = read('fleet', 'maxHull', st.hull, i) || st.hull;
  let art = '';
  try { art = A.shipSVG(sh.type, {w: 240, shields: true}); } catch { /* none */ }
  const arms = Object.entries(sh.arms || {}).filter(([, n]) => n).map(([a, n]) => `${n}× ${D.arms?.[a]?.name || cap(a)}`).join(', ') || 'No armaments';
  const ammo = Object.entries(sh.ammo || {}).filter(([, n]) => n).map(([a, n]) => `${n} ${D.ammo?.[a]?.name || cap(a)}`).join(', ');
  return h('article.ship-card',
    h('div.ship-art', {html: art}),
    h('div.ship-info',
      h('h3', sh.name || shipName(sh.type)), h('p.tag', shipName(sh.type)),
      meter((sh.hull || 0) / (st.hull || sh.hull || 1), `Hull ${num(sh.hull)} / ${num(st.hull || sh.hull)}`, (sh.hull / (st.hull || 1)) < 0.35 ? 'bad' : ''),
      h('p.small', `Cargo ${st.cargo ?? '?'} · Slots ${st.slots ?? '?'} · Speed ${st.speed ?? '?'} · Ram ${st.ram ?? '?'}`),
      h('p.small', arms), ammo ? h('p.small', 'Ammo: ' + ammo) : null,
      extra || null));
}

// ------------------------------------------------------------------ cargo
export function cargoSheet() {
  return sheet({title: 'Cargo', cls: 'cargo', build(body) {
    const s = S();
    const used = read('fleet', 'cargoUsed', 0), cap_ = read('fleet', 'cargoCap', 1);
    add(body, meter(used / cap_, `Holds ${num(used)} / ${num(cap_)}`, used > cap_ ? 'bad' : ''));
    const goods = Object.entries(s.cargo || {}).filter(([, q]) => q > 0);
    const armsLoad = s.fleet.reduce((a, sh) => a + Object.values(sh.arms || {}).reduce((x, y) => x + y, 0) * 5, 0);
    add(body, goods.length ? h('ul.rows.goods', goods.map(([g, q]) => h('li', h('span.gi', {html: goodIcon(g)}),
      h('div.row-main', h('b', goodName(g)), h('small', s.cargoPaid?.[g] ? `avg paid ${silver(s.cargoPaid[g])}` : '')), h('b.qty-big', num(q)))))
      : empty('The holds are empty.'));
    if (armsLoad) add(body, h('p.small', `Armaments take ${num(armsLoad)} of that room.`));
    const qg = s.questGoods || s.qgoods;
    if (qg && Object.keys(qg).length) add(body, h('h4', 'Task goods (not in the holds)'), h('ul.rows.goods', Object.entries(qg).map(([g, q]) =>
      h('li', h('span.gi', {html: goodIcon(g)}), h('div.row-main', h('b', goodName(g))), h('b.qty-big', num(q))))));
    const wh = Object.entries(s.warehouse || {}).filter(([, w]) => Object.values(w || {}).some(q => q > 0));
    if (wh.length) add(body, h('h4', 'In warehouses'), h('ul.rows', wh.map(([p, w]) => h('li', h('div.row-main', h('b', portName(p)),
      h('small', Object.entries(w).filter(([, q]) => q).map(([g, q]) => `${q} ${goodName(g)}`).join(', ')))))));
  }});
}

// ------------------------------------------------------------------ items
export function itemsSheet() {
  return sheet({title: 'Items and blessings', cls: 'items', build(body) {
    const s = S();
    const charms = (s.items || []).filter(i => !String(i).startsWith('q_'));
    const qitems = (s.items || []).filter(i => String(i).startsWith('q_'));
    add(body, h('h4', 'Blessings'), h('ul.bless-row', Object.keys(D.blessings || {}).map(b => h('li',
      h('span.bl-ico', {html: hudIcon('blessing')}), h('b', D.blessings[b].name || cap(b)), h('span.count', '× ' + (s.blessings?.[b] || 0))))));
    add(body, h('h4', 'Rune-charms'), charms.length ? h('ul.rows.charms', charms.map(id => {
      const it = itemOf(id);
      return h('li' + (it.cursed || /cursed/.test(id) ? '.cursed' : ''), h('span.gi', {html: hudIcon('items')}),
        h('div.row-main', h('b', it.name), h('small', it.desc || '')), it.cursed || /cursed/.test(id) ? h('span.tag.bad', 'cursed') : null);
    })) : empty('No charms yet. Rune-carvers sell them.'));
    if (qitems.length) add(body, h('h4', 'Things you carry for others'), h('ul.rows', qitems.map(id => {
      const it = itemOf(id); return h('li', h('div.row-main', h('b', it.name), h('small', it.desc || '')));
    })));
  }});
}

