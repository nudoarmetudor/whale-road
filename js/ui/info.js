// Options, Help and Credits sheets.
import {h, add, sheet, sfx} from './dom.js';
import {opts, setOpt, SAIL_SPEEDS, DIALOGUE_SPEEDS} from './options.js';
import {flow} from './ctx.js';

export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.({navigationUI: 'hide'})?.catch?.(() => {});
  } catch { /* not allowed here */ }
}

function toggle(label, value, onFlip) {
  const b = h('button.toggle', {type: 'button', role: 'switch', 'aria-checked': String(!!value), 'aria-label': label},
    h('i'), h('span', value ? 'On' : 'Off'));
  b.onclick = () => { sfx('click'); onFlip(!value); };
  return b;
}
function choice(list, value, onPick) {
  return h('div.chips', list.map(([v, label]) => h('button.chip' + (v === value ? '.on' : ''),
    {type: 'button', 'aria-pressed': String(v === value), onclick: () => { sfx('click'); onPick(v); }}, label)));
}
function slider(label, value, onInput) {
  const s = h('input.range', {type: 'range', min: 0, max: 100, step: 5, value: Math.round(value * 100), 'aria-label': label});
  const out = h('output', Math.round(value * 100) + '%');
  s.addEventListener('input', () => { out.textContent = s.value + '%'; onInput(s.value / 100); });
  s.addEventListener('change', () => sfx('coin'));
  return h('div.slider', s, out);
}
const row = (label, ctrl, note) => h('div.opt-row', h('div.opt-label', h('b', label), note ? h('small', note) : null), ctrl);

export function openOptions() {
  return sheet({title: 'Options', cls: 'options', build(body, api) {
    add(body, 
      row('Music', slider('Music volume', opts.music, v => setOpt('music', v))),
      row('Effects', slider('Effects volume', opts.sfx, v => setOpt('sfx', v))),
      row('Fullscreen', toggle('Fullscreen', !!document.fullscreenElement, () => { toggleFullscreen(); setTimeout(() => api.refresh(), 300); }), 'Key F'),
      row('Graphic detail', choice([['low', 'Low'], ['high', 'High']], opts.detail, v => { setOpt('detail', v); api.refresh(); }), 'Low drops painted filters and animation, kinder to old phones.'),
      row('Sailing speed', choice(SAIL_SPEEDS, opts.sailSpeed, v => { setOpt('sailSpeed', v); api.refresh(); })),
      row('Dialogue speed', choice(DIALOGUE_SPEEDS, opts.dialogueSpeed, v => { setOpt('dialogueSpeed', v); api.refresh(); })),
      row('Tutorial hints', toggle('Tutorial hints', opts.tutorial, v => { setOpt('tutorial', v); api.refresh(); }), 'Key H shows the next hint.'),
      row('Easy mode', toggle('Easy mode', opts.easy, v => { setOpt('easy', v); api.refresh(); flow.refreshHud(); }), '"?" markers on the building and sea mark where your tasks lead.'),
    );
  }});
}

const HELP = [
  ['The aim', `You own a ship, a little silver and usually a debt. Buy goods where they are cheap,
    carry them where they are wanted, and sell. In a Saga your hero has a story of eleven chapters; new
    ports and goods open as the jarls come to trust you. In Free Trade every port is open and the score is
    your net worth: silver, bank deposits, goods and ships, minus what you owe.`],
  ['In port', `Tap a building in the picture, or use the row of building buttons. The bar at the top
    shows silver, money in this port's bank, debt, the date and season, how full your holds are and your
    renown. The dock at the bottom opens the sea chart and your books.`],
  ['The market', `Choose Buy or Sell, set amounts with − and +, or tap Max. The running total shows what
    the trade will cost or bring before you confirm. Each row shows the price, what you hold and what you
    paid on average. Prices rise as you buy and fall as you sell, and drift with the seasons. Some goods are
    forbidden in some towns: you can still sell them all at once, at a fine price, if the reeve looks away.`],
  ['Sailing', `Tap Set Sail, pick a port on the chart, then Sail. The slowest ship sets the pace. You
    cannot leave with more cargo than the holds can take. Storms can damage the hull, raiders may close in,
    and an unpaid loan sends the moneylender's men after you.`],
  ['Battle', `Battles start paused. Press the big button to fight or pause. Weapons fire by themselves
    when reloaded. Tap an enemy to focus fire. Ram when you are close, but not beasts that swim or fly.
    Blessings, special ammunition and your hero's talent each have a button. Fleeing is never certain.`],
  ['Gods and runes', `At an altar, give goods for blessings you call on in battle. The rune-carver sells
    charms that help in trade, sailing or fighting. Read the cursed ones twice.`],
  ['Money', `A bank keeps silver safe at ten in the hundred a year, but only in its own town. The
    moneylender lends up to twice your worth; if you are late, his collectors come to find you. A warehouse
    keeps goods in one port while you sail light.`],
  ['Tasks', `Jarls give the saga's tasks; the mead hall has rumours, price tips and odd jobs. The Journal
    lists every task and its next step. With Easy mode on, gold "?" marks the main task and blue marks the
    optional ones.`],
  ['Keys', `I items · S ships · C cargo · T tasks · L log · F fullscreen · H next hint · Esc menu or close.`],
];
export function openHelp() {
  return sheet({title: 'How to play', cls: 'help', build(body) {
    for (const [t, p] of HELP) add(body, h('section.help-sec', h('h3', t), h('p', p.replace(/\s+/g, ' '))));
  }});
}

export function openCredits() {
  return sheet({title: 'Credits', cls: 'credits', build(body) {
    add(body, 
      h('div.credits-hero', h('h3.logo.small', 'Whale Road'), h('p', 'Game by Tudor Lapp')),
      h('p', 'Built with Claude, by Anthropic.'),
      h('p', 'Coastlines from Natural Earth (naturalearthdata.com), public domain.'),
      h('p', 'Type: Cinzel and Alegreya, SIL Open Font License.'),
      h('p', 'Every picture is drawn in code, and the music and sounds are played live by your browser.'),
      h('p.small', 'Names, story and characters are invented. Real places are as they were called around the year 950, more or less.'),
    );
  }});
}
