// Shipyard sheet: repairs, the one ship for sale (buy or trade in), selling ships,
// armaments per ship, special ammunition, fleet order and renaming.
import {h, add, sheet, tabs, stepper, meter, num, silver, sfx, toast, confirmDlg, promptDlg, result, clamp} from './dom.js';
import {A, D, S, read, call, shipName, cap} from './adapters.js';
import {logLine} from './options.js';
import {flow} from './ctx.js';
import {runActs} from './buildings.js';

const GREET = ['Mind the tar, it is fresh.', 'Every hull has a story. Most of them end here.', 'Bring her round, I will see what the sea left of her.'];

export function openShipyard(port) {
  let tab = 'fleet';
  const offer = read('fleet', 'shipOffer', null, port.id);
  return sheet({title: 'Shipyard', portrait: 'shipwright', greeting: GREET[(S().day || 0) % GREET.length], wide: true, cls: 'shipyard',
    build(body, api) {
      add(body, tabs([['fleet', 'Repairs & order'], ['arms', 'Armaments'], ['buy', 'Ships'], ['ammo', 'Ammunition']], tab, id => { tab = id; api.refresh(); }));
      const done = (r, msg, snd = 'coin', log = true) => { if (result(r, msg, snd)) { if (msg && log) logLine(msg); flow.refreshHud(); runActs(port, 'shipyard'); api.refresh(); } };
      const s = S();

      if (tab === 'fleet') {
        const all = read('fleet', 'repairCost', 0, 'all');
        add(body, h('div.yard-top', h('span', all ? `Repairing the whole fleet costs ${silver(all)}.` : 'Every hull is sound.'),
          h('button.btn', {type: 'button', disabled: !all, onclick: () => done(call('fleet', 'repair', 'all'), `Fleet repaired for ${silver(all)}.`, 'hit')}, 'Repair all')));
        const list = h('ol.fleet-order', {'aria-label': 'Fleet order (front ship first)'});
        s.fleet.forEach((sh, i) => {
          const st = {...(D.ships?.[sh.type] || {})};
          st.hull = read('fleet', 'maxHull', st.hull, i) || st.hull;
          const cost = read('fleet', 'repairCost', 0, i);
          const li = h('li.yard-ship', {'data-i': i},
            h('span.drag', {title: 'Drag to reorder', 'aria-hidden': 'true'}, '⋮⋮'),
            h('div.ys-art', {html: safeShip(sh.type)}),
            h('div.ys-main', h('b', sh.name || shipName(sh.type)), h('small', `${shipName(sh.type)} · ${i === 0 ? 'leads the line' : 'position ' + (i + 1)}`),
              meter(sh.hull / (st.hull || 1), `Hull ${num(sh.hull)} / ${num(st.hull)}`, sh.hull / (st.hull || 1) < 0.35 ? 'bad' : '')),
            h('div.ys-btns',
              h('button.btn.small', {type: 'button', disabled: !cost, onclick: () => done(call('fleet', 'repair', i), `${sh.name} repaired for ${silver(cost)}.`, 'hit')}, cost ? `Repair ${silver(cost)}` : 'Sound'),
              h('button.icon-btn', {type: 'button', 'aria-label': 'Move up', disabled: i === 0, onclick: () => done(call('fleet', 'reorder', i, i - 1), null, 'click')}, '▲'),
              h('button.icon-btn', {type: 'button', 'aria-label': 'Move down', disabled: i === s.fleet.length - 1, onclick: () => done(call('fleet', 'reorder', i, i + 1), null, 'click')}, '▼'),
              h('button.icon-btn', {type: 'button', 'aria-label': 'Rename', title: 'Rename', onclick: async () => {
                const n = await promptDlg('A new name for her', sh.name || ''); if (n) done(call('fleet', 'rename', i, n), null, 'click');
              }}, '✎'),
              s.fleet.length > 1 ? h('button.btn.ghost.small', {type: 'button', onclick: async () => {
                const v = read('fleet', 'shipValue', 0, i);
                if (await confirmDlg(`Sell ${sh.name} for ${silver(v)}, armaments included?`, {yes: 'Sell'})) done(call('fleet', 'sellShip', i), `Sold ${sh.name} for ${silver(v)}.`, 'coin', false);
              }}, 'Sell') : null));
          add(list, li);
        });
        dragReorder(list, (from, to) => done(call('fleet', 'reorder', from, to), null, 'click'));
        add(body, h('p.small', 'In battle the first ship leads. Keep the toughest hull in the middle of the line, where the fighting is thickest.'), list);
      }

      if (tab === 'arms') {
        const arms = Object.keys(D.arms || {});
        const free = read('fleet', 'cargoCap', 0) - read('fleet', 'cargoUsed', 0);
        add(body, h('p.small', `Each armament takes one slot and 5 cargo. Free cargo: ${num(free)}. Removing one refunds it in full.`));
        s.fleet.forEach((sh, i) => {
          const st = D.ships?.[sh.type] || {};
          const used = Object.values(sh.arms || {}).reduce((a, b) => a + b, 0);
          add(body, h('section.arm-ship', h('header', h('b', sh.name || shipName(sh.type)), h('span.slots', `Slots ${used} / ${st.slots ?? '?'} · ${used * 5} cargo`)),
            h('div.arm-grid', arms.map(a => {
              const A_ = D.arms[a] || {};
              const n = sh.arms?.[a] || 0;
              return h('div.arm', h('div', h('b', A_.name || cap(a)), h('small', `${A_.range || ''} ${A_.tier || ''} · ${silver(read('fleet', 'armCost', 0, a))}`.trim())),
                h('div.mini-step',
                  h('button.step', {type: 'button', 'aria-label': `Remove ${A_.name || a}`, disabled: !n, onclick: () => done(call('fleet', 'removeArm', i, a), null, 'coin')}, '−'),
                  h('b.n', num(n)),
                  h('button.step', {type: 'button', 'aria-label': `Add ${A_.name || a}`, disabled: used >= (st.slots ?? 99), onclick: () => done(call('fleet', 'addArm', i, a), null, 'buy')}, '+')));
            }))));
        });
      }

      if (tab === 'buy') {
        if (offer && D.ships?.[offer]) {
          const st = D.ships[offer];
          const box = h('section.offer.parch-inset',
            h('div.offer-art', {html: safeShip(offer, 300)}),
            h('div', h('h3', `For sale: ${st.name || shipName(offer)}`),
              h('p.small', `Hull ${st.hull} · Cargo ${st.cargo} · Slots ${st.slots} · Speed ${st.speed} · Ram ${st.ram}`),
              h('p.price', silver(st.price)),
              h('div.btn-row',
                h('button.btn', {type: 'button', disabled: s.fleet.length >= 4 || s.silver < st.price, onclick: async () => {
                  if (await confirmDlg(`Buy the ${st.name || offer} for ${silver(st.price)}?`, {yes: 'Buy her'})) done(call('fleet', 'buyShip', offer), `Bought a ${st.name || offer}.`, 'buy', false);
                }}, s.fleet.length >= 4 ? 'Fleet full' : 'Buy'))));
          add(body, box);
          if (s.fleet.length) {
            add(body, h('h4', 'Or trade one in'));
            add(body, h('ul.rows', s.fleet.map((sh, i) => {
              const v = read('fleet', 'shipValue', 0, i);
              const net = st.price - v;
              return h('li', h('div.row-main', h('b', sh.name), h('small', `${shipName(sh.type)} · worth ${silver(v)} · you pay ${silver(Math.max(0, net))}${net < 0 ? `, get ${silver(-net)}` : ''}`)),
                h('button.btn.small', {type: 'button', disabled: s.silver + v < st.price, onclick: () => tradeIn(i, sh, v, st, api)}, 'Trade in'));
            })));
          }
        } else add(body, h('p.empty', 'No ship for sale this visit. Come back after your next voyage.'));
      }

      if (tab === 'ammo') {
        const ammo = Object.keys(D.ammo || {});
        add(body, h('p.small', 'Special shot is fired from the battle bar. It is shared by the whole fleet.'));
        const have = a => s.fleet.reduce((x, sh) => x + (sh.ammo?.[a] || 0), 0);
        for (const a of ammo) {
          const info = D.ammo[a] || {};
          const onlyAt = info.onlyAt || info.port || null;
          const here = !onlyAt || onlyAt === port.id;
          const price = read('fleet', 'ammoCost', 0, a);
          const st = stepper({value: 1, min: 1, max: () => Math.max(1, Math.floor(S().silver / (price || 1))), label: `Buy ${info.name || a}`});
          add(body, h('div.trade-row.ammo-row', h('div.tr-name', h('b', info.name || cap(a)), h('small', info.desc || '')),
            h('div.tr-price', h('small', 'each'), h('b', silver(price))), h('div.tr-held', h('small', 'held'), h('b', num(have(a)))),
            here ? st.el : h('small.note', 'Sold only in ' + (D.ports?.[onlyAt]?.name || onlyAt)),
            here ? h('button.btn.small', {type: 'button', onclick: () => done(call('fleet', 'buyAmmo', a, clamp(st.get(), 1, 999)), `Bought ${st.get()} ${info.name || a}.`, 'buy')}, 'Buy') : null));
        }
      }
    }});

  async function tradeIn(i, sh, v, st, api) {
    if (!(await confirmDlg(`Hand over ${sh.name} (worth ${silver(v)}) and take the ${st.name}?`, {yes: 'Trade'}))) return;
    const type = st.id || Object.keys(D.ships).find(k => D.ships[k] === st);
    if (result(call('fleet', 'buyShip', type, i), `Traded ${sh.name} for a ${st.name}`, 'buy')) { flow.refreshHud(); api.refresh(); }
  }
}

function safeShip(type, w = 160) { try { return A.shipSVG(type, {w, shields: true}); } catch { return ''; } }

// Pointer-drag reorder on the ⋮⋮ handle. Calls onMove(from, to) on drop.
function dragReorder(list, onMove) {
  list.addEventListener('pointerdown', e => {
    const handle = e.target.closest('.drag'); if (!handle) return;
    const li = handle.closest('li'); const items = [...list.children];
    const from = items.indexOf(li); if (from < 0) return;
    e.preventDefault();
    li.classList.add('dragging'); li.setPointerCapture?.(e.pointerId);
    const startY = e.clientY; const hgt = li.getBoundingClientRect().height;
    let to = from;
    const move = ev => {
      const dy = ev.clientY - startY; li.style.transform = `translateY(${dy}px)`;
      to = clamp(from + Math.round(dy / hgt), 0, items.length - 1);
      items.forEach((it, k) => it.classList.toggle('drop-here', k === to && k !== from));
    };
    const up = () => {
      li.removeEventListener('pointermove', move); li.removeEventListener('pointerup', up); li.removeEventListener('pointercancel', up);
      li.classList.remove('dragging'); li.style.transform = '';
      items.forEach(it => it.classList.remove('drop-here'));
      if (to !== from) onMove(from, to);
    };
    li.addEventListener('pointermove', move); li.addEventListener('pointerup', up); li.addEventListener('pointercancel', up);
  });
}
