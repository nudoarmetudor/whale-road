// Building sheets: jarl's hall, mead hall, altar, rune-carver, guild, bank, moneylender,
// warehouse. Market and shipyard live in their own files. Every building first runs
// quests.act(port, building) so deliveries and visits resolve as you walk in.
import {h, add, sheet, stepper, meter, num, silver, sfx, toast, confirmDlg, result, empty, rnd, clamp} from './dom.js';
import {G, D, X, S, read, call, goodName, portName, itemOf, cap} from './adapters.js';
import {logLine} from './options.js';
import {flow, music, themeFor} from './ctx.js';
import {say} from './dialogue.js';
import {goodIcon, hudIcon} from './icons.js';
import {rewardText} from './sheets.js';
import {pickLine} from './port.js';
import {openMarket} from './market.js';
import {openShipyard} from './shipyard.js';

const CHRISTIAN = ['saxon', 'frank', 'byzantine', 'gael'];
export function npcFor(b, port) {
  const c = port?.culture;
  if (b === 'hall') return {slav: 'slav_prince', byzantine: 'byzantine_official', saxon: 'saxon_reeve', frank: 'frank_count', gael: 'gael_king', aesti: 'aesti_elder'}[c] || 'jarl';
  if (b === 'altar') return CHRISTIAN.includes(c) ? 'monk' : c === 'island' ? 'volva' : 'priest';
  return {market: 'merchant', meadhall: 'barkeep', shipyard: 'shipwright', runecarver: 'runecarver', guild: 'guildmaster',
    bank: 'banker', moneylender: 'moneylender', warehouse: 'warehouse'}[b] || 'townsman';
}

// Resolve any quest steps satisfiable here and play their lines. Returns how many fired.
export async function runActs(port, b) {
  return playActs(read('quests', 'act', [], port.id, b), port, b);
}
// Play quests.act()/winBattle() results: [{quest, title, step, kind, lines, done}].
// kind 'need' = right place, something missing (a hint); 'complete' = task finished.
export async function playActs(acts, port, b = null) {
  if (!Array.isArray(acts) || !acts.length) return 0;
  let fired = 0;
  for (const a of acts) {
    const q = typeof a.quest === 'object' ? a.quest : findQuest(a.quest);
    const title = a.title || q?.title || 'Task';
    const lines = (a.lines || []).filter(Boolean);
    if (a.kind === 'need' || a.done === false) {
      const hint = lines.map(l => typeof l === 'string' ? l : l.text).join(' ');
      if (hint) toast(`${title}: ${hint}`);
      continue;
    }
    fired++;
    const atGiver = q?.giver && (!b || q.giver.building === b) && q.giver.port === port?.id;
    const npc = (a.kind === 'complete' || atGiver) && q?.giver?.npc ? q.giver.npc : npcFor(b || 'hall', port);
    if (lines.length) await say(lines, {npc, npcName: atGiver || a.kind === 'complete' ? q?.npcName : undefined});
    if (a.kind === 'complete') {
      sfx('quest');
      toast(`Task done: ${title}`, 'good');
      if (q?.reward?.unlockPorts?.length) toast(`New port on the chart: ${q.reward.unlockPorts.map(portName).join(', ')}`, 'good');
    } else {
      sfx('page');
      if (!acts.some(x => x.kind === 'complete' && x.quest === a.quest)) toast(`${title}: step done`);
    }
  }
  if (fired) { read('feats', 'check', null); flow.refreshHud(); flow.afterQuest?.(); }
  return fired;
}
export function findQuest(id) { return X.questById?.(id) || null; }

let openNow = null;
export async function openBuilding(b) {
  const port = D.ports[S().port] || {id: S().port, name: portName(S().port), buildings: []};
  if (openNow && !openNow.closed) openNow.close();
  if (b === 'meadhall') music('tavern');
  const restore = () => { if (b === 'meadhall') music(themeFor(port.id)); };
  await runActs(port, b);
  const open = {market: openMarket, shipyard: openShipyard, hall: openHall, meadhall: openMeadhall, altar: openAltar,
    runecarver: openRunecarver, guild: openGuild, bank: openBank, moneylender: openMoneylender, warehouse: openWarehouse}[b];
  if (!open) { toast('That door is shut.'); restore(); return null; }
  openNow = open(port);
  if (openNow) { const prev = openNow.close; openNow.close = () => { prev(); restore(); }; }
  return openNow;
}

// ------------------------------------------------------------------ quest offers
function offersBlock(port, b, api, emptyText) {
  const list = read('quests', 'offers', [], port.id, b);
  if (!list.length) return emptyText ? empty(emptyText) : null;
  return h('ul.offers', list.map(q => h('li.offer-card' + (q.saga ? '.main' : '.side'),
    h('span.kind', q.saga ? '◆ Saga' : '◇ Task'),
    h('div.row-main', h('b', q.title), h('small', q.reward ? 'Reward: ' + rewardText(q.reward) : ''),
      q.timeLimit ? h('small.warn', `Must be done within ${q.timeLimit} days`) : null),
    h('button.btn.small', {type: 'button', onclick: () => hearOffer(q, port, b, api)}, 'Hear it'))));
}
async function hearOffer(q, port, b, api) {
  await say(q.offer || [{who: 'npc', text: q.steps?.[0]?.text || q.title}], {npc: q.giver?.npc || npcFor(b, port), npcName: q.npcName});
  if (await confirmDlg(q.steps?.[0]?.text || 'Take on this task?', {title: q.title, yes: 'Accept', no: 'Not now'})) {
    if (result(call('quests', 'accept', q.id), `New task: ${q.title}`, 'quest')) {
      await runActs(port, b);
      flow.refreshHud();
    }
  }
  api.refresh();
}
function reportBtn(port, b, api, label = 'Report on your tasks') {
  return h('button.btn.ghost', {type: 'button', onclick: async () => {
    const n = await runActs(port, b);
    if (!n) toast('Nothing to report here yet.');
    api.refresh();
  }}, label);
}

// ------------------------------------------------------------------ hall
function openHall(port) {
  const npc = npcFor('hall', port);
  return sheet({title: hallTitle(port), portrait: npc, greeting: rnd(['Speak, and be brief. The mead is getting warm.', 'Ah, a ship\'s master. Good. I have work.', 'Welcome to my hall. Mind the dogs, they bite merchants.']),
    cls: 'hall', build(body, api) {
      add(body, h('h4', 'Work offered'), offersBlock(port, 'hall', api, 'No work for you today. Come back when your name is better known.'),
        h('div.btn-row', reportBtn(port, 'hall', api)));
      const locked = Object.values(D.ports || {}).filter(p => !(S().unlockedPorts || []).includes(p.id)).length;
      if (locked && S().mode !== 'free') add(body, h('p.small', `${locked} ports are still closed to you. Rulers open their harbours to captains who do their tasks.`));
    }});
}
const hallTitle = port => ({slav: "Knyaz's hall", byzantine: 'Palace office', saxon: "Reeve's hall", frank: "Count's hall", gael: "King's hall", aesti: "Elders' house"}[port.culture] || "Jarl's hall");

// ------------------------------------------------------------------ mead hall
const tipped = new Map();
function openMeadhall(port) {
  const lore = X.lore || {};
  const greet = pickLine(lore.BARKEEP, port.culture, port.id);
  return sheet({title: 'Mead hall', portrait: 'barkeep', greeting: typeof greet === 'string' ? greet : greet?.text || 'Sit. Drink. Talk, if you must.', cls: 'meadhall', wide: true,
    build(body, api) {
      const key = port.id + ':' + S().day;
      add(body, h('div.mead-grid',
        h('section.parch-inset', h('h4', 'Rumours'), h('ul.rumours', rumours(port).map(r => h('li', r)))),
        h('section.parch-inset', h('h4', 'Price tip'),
          tipped.has(key) ? h('p', tipped.get(key)) : h('div', h('p.small', 'A trader by the fire knows the markets. Stand him a horn and he talks.'),
            h('button.btn.small', {type: 'button', onclick: () => { tipped.set(key, priceTip(port)); sfx('coin'); api.refresh(); }}, 'Pour him a horn'))),
        h('section.parch-inset.wide', h('h4', 'Odd jobs'), offersBlock(port, 'meadhall', api, 'Nobody here needs a hand tonight.'), reportBtn(port, 'meadhall', api, 'Ask around about your tasks')),
        h('section.parch-inset.wide', h('h4', 'By the hearth'), h('button.btn.ghost.small', {type: 'button', onclick: () => skald(port)}, 'Listen to the skald'))));
    }});
}
function rumours(port) {
  const lore = X.lore || {};
  const out = new Set();
  for (const r of read('economy', 'rumours', [])) { const t = typeof r === 'string' ? r : r?.text; if (t) out.add(t); if (out.size >= 3) break; }
  for (let i = 0; i < 6 && out.size < 2; i++) { const l = pickLine(lore.RUMOURS, port.culture, port.id); if (l) out.add(typeof l === 'string' ? l : l.text); }
  if (!out.size) ['They say the ice came late in the east this year, and the furs are thick for it.', 'A ship came in with a hold full of salt and a crew full of stories.'].forEach(x => out.add(x));
  return [...out];
}
function priceTip(port) {
  const simTip = read('economy', 'priceTip', null);
  if (simTip) return typeof simTip === 'string' ? simTip : simTip.text || String(simTip);
  const here = Object.fromEntries(read('economy', 'market', [], port.id).map(r => [r.good, r]));
  const others = (S().unlockedPorts || []).filter(p => p !== port.id);
  let best = null;
  for (const p of others.sort(() => Math.random() - 0.5).slice(0, 6)) {
    for (const r of read('economy', 'market', [], p)) {
      if (r.contraband) continue;
      const buyHere = here[r.good]?.buy;
      const gain = buyHere ? r.sell - buyHere : 0;
      if (!best || gain > best.gain) best = {port: p, good: r.good, price: r.sell, gain};
    }
  }
  if (!best) return 'Prices are prices. Buy cheap, sell dear. That is my whole wisdom.';
  const vars = {port: portName(best.port), good: goodName(best.good).toLowerCase(), price: silver(best.price)};
  const t = pickLine(X.lore?.PRICE_TIPS, port.culture, port.id);
  if (typeof t === 'function') { try { return t(vars); } catch { /* fall through */ } }
  const tpl = typeof t === 'string' ? t : t?.text;
  if (tpl && /\{(port|good|price)\}/.test(tpl)) return tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  return `In ${vars.port} they pay ${vars.price} for ${vars.good}${best.gain > 0 ? `, and you can buy it here for less` : ''}. You did not hear it from me.`;
}
async function skald(port) {
  const lore = X.lore || {};
  const line = pickLine(lore.SKALD || lore.VERSES, port.culture, port.id) || rnd([
    'The whale road is wide, the silver is thin; the wise man sails out and the rich man comes in.',
    'Three things never stay: the wind, the herring and a merchant\'s promise.',
    'A ship without cargo is a hall without mead: it floats, but nobody sings about it.']);
  await say([typeof line === 'string' ? {who: 'npc', text: line} : line], {npc: 'skald', npcName: 'The skald'});
}

// ------------------------------------------------------------------ altar
function openAltar(port) {
  const npc = npcFor('altar', port);
  return sheet({title: 'Altar', portrait: npc, greeting: rnd(['The gods are listening. They prefer it when you bring something.', 'Leave your gift on the stone. Not that stone. That one.']),
    cls: 'altar', build(body, api) {
      add(body, h('p.small', 'Give goods from your holds; the blessing is yours to call on in battle.'));
      for (const b of Object.keys(D.blessings || {})) {
        const B = D.blessings[b];
        const cost = read('altar', 'blessingCost', {good: B.good, qty: B.qty}, b);
        const max = read('altar', 'maxBlessing', 0, b);
        const st = stepper({value: Math.min(1, max), min: 0, max: () => read('altar', 'maxBlessing', 0, b), label: `Blessings of ${B.name}`});
        add(body, h('div.bless-card',
          h('span.bl-ico', {html: hudIcon('blessing')}),
          h('div.bc-main', h('b', B.name || cap(b)), h('small', B.desc || ''),
            h('small.cost', h('span', {html: goodIcon(cost.good)}), ` ${cost.qty} ${goodName(cost.good)} each · you have ${num(S().cargo?.[cost.good] || 0)}`)),
          h('div.bc-owned', h('small', 'held'), h('b', num(S().blessings?.[b] || 0))),
          st.el,
          h('button.btn.small.max', {type: 'button', onclick: () => { st.set(read('altar', 'maxBlessing', 0, b)); sfx('click'); }}, 'Max'),
          h('button.btn.small', {type: 'button', disabled: !max, onclick: async () => {
            const q = st.get(); if (!q) return;
            const r = call('altar', 'buyBlessing', b, q);
            if (result(r, `${B.name} ×${q}`, 'heal')) {
              logLine(`Offered ${q * cost.qty} ${goodName(cost.good)} at ${port.name} for ${B.name}.`);
              if (Array.isArray(r.quest)) await playActs(r.quest, port, 'altar'); else await runActs(port, 'altar');
              flow.refreshHud(); api.refresh();
            }
          }}, 'Offer')));
      }
    }});
}

// ------------------------------------------------------------------ rune-carver
function openRunecarver(port) {
  return sheet({title: 'Rune-carver', portrait: 'runecarver', greeting: rnd(['Every rune is cut by hand. Mostly mine.', 'Some charms help. Some help you regret. I sell both.']),
    cls: 'runecarver', build(body, api) {
      const shop = read('charms', 'shop', [], port.id);
      const mine = (S().items || []).filter(i => !String(i).startsWith('q_'));
      add(body, h('h4', 'On the bench'), shop.length ? h('ul.rows.charms', shop.map(c => {
        const owned = mine.includes(c.id);
        return h('li' + (c.cursed ? '.cursed' : ''), h('span.gi', {html: hudIcon('items')}),
          h('div.row-main', h('b', c.name), h('small', c.desc || ''), c.cursed ? h('small.warn', 'Cursed: the gift comes with a price.') : null),
          h('b.price', silver(c.price)),
          h('button.btn.small', {type: 'button', disabled: owned || S().silver < c.price, onclick: async () => {
            if (c.cursed && !(await confirmDlg(`${c.name} is cursed. ${c.desc} Buy it anyway?`, {yes: 'Buy it', danger: true}))) return;
            if (result(call('charms', 'buyCharm', c.id), `Bought ${c.name}`, 'buy')) { await runActs(port, 'runecarver'); flow.refreshHud(); api.refresh(); }
          }}, owned ? 'Owned' : 'Buy'));
      })) : empty('The bench is bare today.'));
      add(body, h('h4', 'Your charms'), mine.length ? h('ul.rows.charms', mine.map(id => {
        const it = itemOf(id);
        return h('li' + (it.cursed ? '.cursed' : ''), h('div.row-main', h('b', it.name), h('small', it.desc || '')),
          h('button.btn.ghost.small', {type: 'button', onclick: async () => {
            if (!(await confirmDlg(`Sell ${it.name} back to the carver?`, {yes: 'Sell'}))) return;
            if (result(call('charms', 'sellCharm', id), `Sold ${it.name}`, 'sell')) { logLine(`Sold ${it.name} in ${port.name}.`); flow.refreshHud(); api.refresh(); }
          }}, 'Sell'));
      })) : empty('You carry no charms.'));
    }});
}

// ------------------------------------------------------------------ guild
function openGuild(port) {
  return sheet({title: 'Craft guild', portrait: 'guildmaster', greeting: rnd(['The guild remembers who helps it. And who does not.', 'Smiths, weavers, tanners, all under one leaky roof.']),
    cls: 'guild', build(body, api) {
      const donate = G.guild?.donate;
      if (typeof donate === 'function') {
        const st = stepper({value: 100, min: 0, max: () => S().silver, label: 'Donation in silver'});
        add(body, h('section.parch-inset', h('h4', 'Donate'), h('p.small', 'A gift to the guild earns renown, and the masters start offering you their combination work.'),
          h('div.inline-form', st.el, h('button.btn.small', {type: 'button', onclick: async () => {
            const n = st.get(); if (!n) return;
            if (result(call('guild', 'donate', n), `Donated ${silver(n)}`, 'coin')) { logLine(`Gave ${silver(n)} to the guild in ${port.name}.`); await runActs(port, 'guild'); flow.refreshHud(); api.refresh(); }
          }}, 'Give'))));
      } else {
        add(body, h('p.small', 'The guild takes donations and gives combination work: bring the right goods together and the masters make something better from them.'));
      }
      add(body, h('h4', 'Guild work'), offersBlock(port, 'guild', api, 'No commissions today.'), h('div.btn-row', reportBtn(port, 'guild', api, 'Deliver or donate for your tasks')));
    }});
}

// ------------------------------------------------------------------ bank
function openBank(port) {
  return sheet({title: 'Bank', portrait: 'banker', greeting: 'Silver left with me stays here, grows a tenth each year, and no raider will ever touch it.',
    cls: 'bank', build(body, api) {
      const here = read('bank', 'bankHere', 0);
      const dep = stepper({value: 0, max: () => S().silver, label: 'Deposit'});
      const wd = stepper({value: 0, max: () => read('bank', 'bankHere', 0), label: 'Withdraw'});
      const act = (fn, st, msg) => { const n = st.get(); if (!n) return; if (result(call('bank', fn, n), msg(n), 'coin')) { logLine(msg(n) + ` (${port.name})`); flow.refreshHud(); api.refresh(); } };
      add(body, 
        h('div.big-figure', h('small', `In the ${port.name} bank`), h('b', silver(here))),
        h('div.money-row', h('b', 'Deposit'), dep.el, h('button.btn.small.max', {type: 'button', onclick: () => dep.set(S().silver)}, 'Max'),
          h('button.btn.small', {type: 'button', onclick: () => act('deposit', dep, n => `Deposited ${silver(n)}`)}, 'Deposit')),
        h('div.money-row', h('b', 'Withdraw'), wd.el, h('button.btn.small.max', {type: 'button', onclick: () => wd.set(read('bank', 'bankHere', 0))}, 'Max'),
          h('button.btn.small', {type: 'button', onclick: () => act('withdraw', wd, n => `Withdrew ${silver(n)}`)}, 'Withdraw')));
      const elsewhere = Object.entries(S().bank || {}).filter(([p, v]) => p !== port.id && v > 0);
      if (elsewhere.length) add(body, h('h4', 'Deposits in other towns'), h('ul.rows', elsewhere.map(([p, v]) => h('li', h('div.row-main', h('b', portName(p))), h('b', silver(v))))));
      add(body, h('p.small', 'Money in a bank can only be taken out in the town where it was left.'));
    }});
}

// ------------------------------------------------------------------ moneylender
function openMoneylender(port) {
  return sheet({title: 'Moneylender', portrait: 'moneylender', greeting: 'A tenth a month, my friend. Pay on time and we stay friends.',
    cls: 'lender', build(body, api) {
      const st = read('bank', 'loanStatus', {amount: S().debt?.amount || 0, due: S().debt?.due, overdue: false});
      const maxL = read('bank', 'loanMax', 0);
      const days = st.due != null ? st.due - (S().day || 0) : null;
      const bor = stepper({value: 0, max: () => read('bank', 'loanMax', 0), label: 'Borrow'});
      const rep = stepper({value: 0, max: () => Math.min(S().silver, read('bank', 'loanStatus', {amount: 0}).amount), label: 'Repay'});
      const act = (fn, s, msg) => { const n = s.get(); if (!n) return; if (result(call('bank', fn, n), msg(n), 'coin')) { if (fn === 'repay') logLine(msg(n) + '.'); flow.refreshHud(); api.refresh(); } };
      add(body, 
        h('div.big-figure' + (st.overdue ? '.bad' : ''), h('small', 'You owe'), h('b', st.amount ? silver(st.amount) : 'nothing'),
          st.amount ? h('small', st.overdue ? 'Overdue! His collectors are already at sea.' : days != null ? `Due in ${days} days` : '') : null),
        h('div.money-row', h('b', 'Borrow'), st.overdue ? h('small.warn', 'No new loans while you are late.') : [bor.el,
          h('button.btn.small.max', {type: 'button', onclick: () => bor.set(read('bank', 'loanMax', 0))}, 'Max'),
          h('button.btn.small', {type: 'button', disabled: !maxL, onclick: () => act('borrow', bor, n => `Borrowed ${silver(n)}`)}, 'Borrow')]),
        h('div.money-row', h('b', 'Repay'), rep.el, h('button.btn.small.max', {type: 'button', onclick: () => rep.set(Math.min(S().silver, st.amount))}, 'Max'),
          h('button.btn.small', {type: 'button', disabled: !st.amount, onclick: () => act('repay', rep, n => `Repaid ${silver(n)}`)}, 'Repay')),
        h('p.small', `He lends up to twice your worth. Today: ${silver(maxL)}.`));
    }});
}

// ------------------------------------------------------------------ warehouse
function openWarehouse(port) {
  return sheet({title: 'Warehouse', portrait: 'warehouse', greeting: 'Dry, locked and guarded by my brother-in-law, who is very large.',
    cls: 'warehouse', wide: true, build(body, api) {
      const stored = read('bank', 'warehouseHere', {});
      const aboard = S().cargo || {};
      const free = read('fleet', 'cargoCap', 0) - read('fleet', 'cargoUsed', 0);
      add(body, meter(1 - free / (read('fleet', 'cargoCap', 1) || 1), `Free room aboard: ${num(free)}`));
      const col = (title, src, fn, verb, max) => h('section.parch-inset', h('h4', title), Object.keys(src).filter(g => src[g] > 0).length
        ? h('div.trade-list', Object.entries(src).filter(([, q]) => q > 0).map(([g, q]) => {
          const st = stepper({value: q, max: () => max(g, q), label: `${verb} ${goodName(g)}`});
          return h('div.trade-row.wh-row', h('span.gi', {html: goodIcon(g)}), h('div.tr-name', h('b', goodName(g)), h('small', num(q))), st.el,
            h('button.btn.small', {type: 'button', onclick: () => { const n = st.get(); if (!n) return; if (result(call('bank', fn, g, n), `${verb === 'Store' ? 'Stored' : 'Took'} ${n} ${goodName(g)}`, 'page')) { flow.refreshHud(); api.refresh(); } }}, verb));
        })) : empty('Nothing.'));
      add(body, h('div.wh-grid',
        col('Aboard', aboard, 'storeGoods', 'Store', (g, q) => q),
        col(`Stored in ${port.name}`, stored, 'takeGoods', 'Take', (g, q) => clamp(q, 0, Math.max(0, free)))));
    }});
}

