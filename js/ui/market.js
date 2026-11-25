// Market sheet: Buy and Sell tabs, per-good rows with steppers and Max, a running total,
// Reset, Sell All, and a separate contraband "sell all" with its risk note.
import {h, add, sheet, tabs, stepper, meter, num, silver, sfx, toast, confirmDlg, result, empty} from './dom.js';
import {S, read, call, goodName} from './adapters.js';
import {goodIcon} from './icons.js';
import {logLine} from './options.js';
import {flow} from './ctx.js';
import {runActs} from './buildings.js';

const GREET = ['Fresh from the boats, mostly.', 'Prices are fair. Fair for me, anyway.', 'Look all you like. Looking is free; the rest is not.',
  'Weigh it yourself if you do not trust my scales. Nobody trusts my scales.'];
const STOCK = {plenty: 'plenty', some: 'some', scarce: 'scarce'};

export function openMarket(port) {
  let tab = 'buy';
  let basket = {};
  return sheet({title: 'Market', portrait: 'merchant', greeting: GREET[(S().day || 0) % GREET.length], wide: true, cls: 'market',
    build(body, api) {
      const s = S();
      const rows = read('economy', 'market', [], port.id);
      const byGood = Object.fromEntries(rows.map(r => [r.good, r]));
      const capN = read('fleet', 'cargoCap', 0);
      const usedNow = read('fleet', 'cargoUsed', 0);
      const list = h('div.trade-list', {role: 'list'});
      const foot = h('footer.trade-foot');
      const cargoBar = h('div.trade-cargo');
      add(body, tabs([['buy', 'Buy'], ['sell', 'Sell']], tab, id => { tab = id; basket = {}; api.refresh(); }), cargoBar, list, foot);

      const priceOf = g => tab === 'buy' ? byGood[g]?.buy : byGood[g]?.sell;
      const total = () => Object.entries(basket).reduce((a, [g, q]) => a + q * (priceOf(g) || 0), 0);
      const qtyAll = () => Object.values(basket).reduce((a, b) => a + b, 0);
      const maxFor = g => {
        if (tab === 'sell') return s.cargo?.[g] || 0;
        const p = byGood[g]?.buy; if (!p) return 0;
        const others = Object.entries(basket).filter(([k]) => k !== g);
        const room = capN - usedNow - others.reduce((a, [, q]) => a + q, 0);
        const money = s.silver - others.reduce((a, [k, q]) => a + q * (byGood[k]?.buy || 0), 0);
        const simMax = read('economy', 'maxBuy', Infinity, g);
        return Math.max(0, Math.min(room, Math.floor(money / p), simMax));
      };

      const goods = tab === 'buy'
        ? rows.filter(r => r.buy != null && !r.contraband)
        : rows.filter(r => !r.contraband && (s.cargo?.[r.good] || 0) > 0);
      if (!goods.length) add(list, empty(tab === 'buy' ? 'Nothing for sale here today.' : 'You have nothing this market will buy.'));
      for (const r of goods) {
        const held = s.cargo?.[r.good] || 0;
        const paid = s.cargoPaid?.[r.good];
        const st = stepper({value: basket[r.good] || 0, max: () => maxFor(r.good), label: `${tab === 'buy' ? 'Buy' : 'Sell'} ${r.name || goodName(r.good)}`,
          onChange: q => { if (q) basket[r.good] = q; else delete basket[r.good]; updateFoot(); }});
        const diff = tab === 'sell' && paid ? r.sell - paid : 0;
        add(list, h('div.trade-row', {role: 'listitem', 'data-good': r.good},
          h('span.gi', {html: goodIcon(r.good)}),
          h('div.tr-name', h('b', r.name || goodName(r.good)), r.stockNote ? h('small.stock.' + r.stockNote, STOCK[r.stockNote] || r.stockNote) : null),
          h('div.tr-price', h('small', tab === 'buy' ? 'price' : 'they pay'), h('b', silver(priceOf(r.good)))),
          h('div.tr-held', h('small', 'held'), h('b', num(held))),
          h('div.tr-paid', h('small', 'avg paid'), h('b' + (diff > 0 ? '.up' : diff < 0 ? '.down' : ''), paid ? silver(paid) : '·')),
          st.el,
          h('button.btn.small.max', {type: 'button', onclick: () => { st.set(maxFor(r.good)); sfx('click'); }}, 'Max')));
      }

      // Contraband: never listed; one "sell all" per good with a risk note.
      if (tab === 'sell') {
        const contra = rows.filter(r => r.contraband && (s.cargo?.[r.good] || 0) > 0);
        if (contra.length) {
          add(list, h('div.contra', h('h4', 'Under the counter'),
            h('p.small', 'Forbidden in this town. It goes all at once at a high price, but the reeve\'s men may seize it and fine you.'),
            contra.map(r => h('div.trade-row.contra-row', h('span.gi', {html: goodIcon(r.good)}),
              h('div.tr-name', h('b', r.name || goodName(r.good)), h('small', `${num(s.cargo[r.good])} aboard`)),
              h('div.tr-price', h('small', 'about'), h('b', silver(r.sell * s.cargo[r.good]))),
              h('button.btn.danger.small', {type: 'button', onclick: () => contraband(r)}, 'Sell all, quietly')))));
        }
      }

      function updateFoot() {
        const t = total(), q = qtyAll();
        const after = tab === 'buy' ? usedNow + q : usedNow - q;
        cargoBar.innerHTML = '';
        add(cargoBar, meter(after / (capN || 1), `Holds ${num(after)} / ${num(capN)}`, after > capN ? 'bad' : ''));
        foot.innerHTML = '';
        add(foot, 
          h('button.btn.ghost.small', {type: 'button', disabled: !q, onclick: () => { basket = {}; sfx('click'); api.refresh(); }}, 'Reset'),
          h('div.total', h('small', tab === 'buy' ? 'Cost' : 'You get'), h('b', silver(t)),
            h('small.after', `silver after: ${silver(tab === 'buy' ? s.silver - t : s.silver + t)}`)),
          tab === 'sell' ? h('button.btn.ghost.small', {type: 'button', disabled: !goods.length, onclick: sellAll}, 'Sell all') : null,
          h('button.btn', {type: 'button', disabled: !q, onclick: commit}, tab === 'buy' ? `Buy ${q ? num(q) : ''}` : `Sell ${q ? num(q) : ''}`));
      }
      updateFoot();

      function commit() {
        const fn = tab === 'buy' ? 'buy' : 'sell';
        let moved = 0, money = 0;
        for (const [g, q] of Object.entries(basket)) {
          const before = S().silver;
          const r = call('economy', fn, g, q);
          if (r?.ok === false) { toast(`${goodName(g)}: ${r.msg}`, 'bad'); sfx('error'); continue; }
          moved += q; money += Math.abs(S().silver - before);
          logLine(`${fn === 'buy' ? 'Bought' : 'Sold'} ${q} ${goodName(g)} in ${port.name} for ${silver(Math.abs(S().silver - before))}.`);
        }
        if (moved) { sfx(fn === 'buy' ? 'buy' : 'sell'); toast(`${fn === 'buy' ? 'Bought' : 'Sold'} ${num(moved)} for ${silver(money)}`, 'good'); }
        basket = {};
        afterTrade(api);
      }
      async function sellAll() {
        const lines = goods.map(r => [r.good, s.cargo[r.good]]);
        const est = lines.reduce((a, [g, q]) => a + q * (byGood[g]?.sell || 0), 0);
        if (!(await confirmDlg(`Sell everything this market buys, for about ${silver(est)}?`, {yes: 'Sell all'}))) return;
        basket = Object.fromEntries(lines);
        commit();
      }
      async function contraband(r) {
        if (!(await confirmDlg(`Sell all ${r.name || goodName(r.good)} under the counter? If the reeve's men catch you, they take the goods and fine you.`, {yes: 'Risk it', danger: true}))) return;
        const res = call('economy', 'sellContraband', r.good);
        if (res?.ok === false) { result(res); return; }
        if (res.caught) { sfx('error'); toast(`Caught! Goods seized${res.fine ? `, fined ${silver(res.fine)}` : ''}.`, 'bad'); }
        else { sfx('coin'); toast(`Sold quietly for ${silver(res.silver)}`, 'good'); logLine(`Sold ${goodName(r.good)} under the counter in ${port.name} for ${silver(res.silver)}.`); }
        afterTrade(api);
      }
    }});

  async function afterTrade(api) {
    read('feats', 'check', null);
    await runActs(port, 'market');
    flow.refreshHud();
    api.refresh();
  }
}
