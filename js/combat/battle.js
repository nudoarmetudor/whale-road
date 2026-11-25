// Battle screen: DOM controls + canvas renderer over the pure engine.
//
//   startBattle(root, {enemies, weather, place, level, onEnd, state?, seed?, talent?})
//   -> {battle, destroy()}
//
// Reads S.fleet (first 4 ships fight), S.blessings, S.items, S.hero from js/state.js (or
// opts.state), writes hull, ammo, blessings and sunk ships back when the battle ends,
// stows loot through js/sim/fleet.js takeLoot when it is there, emits 'fleet', 'silver',
// 'cargo' and 'battle-end' ({result, enemies}) and finally calls
// onEnd({result, loot, lost, lostCargo, silver, sunk, enemies, applied:true}).
// `applied: true` means state is already updated: the caller must not add loot again.

import * as E from './engine.js';
import {Renderer} from './render.js';
import {BLESSING_IDS, BLESSING_COMBAT, TALENTS, HERO_TALENT, AMMO_IDS, AMMO} from './defaults.js';

// Optional modules: a missing file (other workers still building) must not break combat.
const opt = (p) => import(p).catch(() => null);
const [stateM, shipsM, blessM, heroesM, scenesM, sfxM, fleetM, charmsM] = await Promise.all([
  opt('../state.js'), opt('../data/ships.js'), opt('../data/blessings.js'), opt('../data/heroes.js'),
  opt('../art/scenes.js'), opt('../audio/sfx.js'), opt('../sim/fleet.js'), opt('../sim/charms.js'),
]);

const STYLE_ID = 'wrb-style';
const CSS = `
.wrb{position:absolute;inset:0;overflow:hidden;background:#183a48;color:#efe2c4;font-family:Alegreya,Georgia,serif;
  user-select:none;-webkit-user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent;z-index:50}
.wrb *{box-sizing:border-box}
.wrb-backdrop{position:absolute;inset:0}
.wrb-backdrop svg{width:100%;height:100%;display:block}
.wrb canvas{position:absolute;left:0;top:0;display:block}
.wrb button{font:inherit;color:inherit;cursor:pointer;-webkit-appearance:none;appearance:none}
.wrb-top{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:8px;padding:6px 8px;
  padding-top:max(6px,env(safe-area-inset-top));
  background:linear-gradient(#3a2414ee,#3a2414aa 70%,#3a241400);pointer-events:none}
.wrb-top>*{pointer-events:auto}
.wrb-btn{position:relative;min-width:44px;height:44px;border-radius:10px;border:2px solid #c99a2e;
  background:linear-gradient(#6b4526,#3a2414);box-shadow:0 2px 0 #1d1a16,inset 0 1px 0 #ffffff22;
  display:flex;align-items:center;justify-content:center;gap:4px;padding:0 8px;font-weight:700;font-size:14px;overflow:hidden}
.wrb-btn:active{transform:translateY(1px)}
.wrb-btn[disabled],.wrb-btn.off{opacity:.42;filter:grayscale(.6)}
.wrb-btn svg{width:26px;height:26px;flex:none}
.wrb-btn .n{position:absolute;right:2px;top:2px;min-width:18px;height:18px;border-radius:9px;background:#1d1a16;
  color:#f6d36a;font-size:12px;line-height:18px;text-align:center;padding:0 4px;border:1px solid #c99a2e}
.wrb-btn .cd{position:absolute;left:0;right:0;top:0;background:#000a;pointer-events:none}
.wrb-btn .lbl{font-size:11px;letter-spacing:.02em;white-space:nowrap}
.wrb-btn.on{border-color:#f6d36a;box-shadow:0 0 0 2px #f6d36a66,0 2px 0 #1d1a16}
.wrb-talent{flex:1;min-width:90px;max-width:340px;height:44px;border-radius:22px;border:2px solid #c99a2e;background:#1d1a16cc;
  position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;padding:0 10px}
.wrb-talent .fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#8e2a22,#c99a2e);transition:width .2s}
.wrb-talent span{position:relative;text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wrb-talent.ready{border-color:#f6d36a;animation:wrbPulse 1s infinite}
.wrb-talent.ready .fill{background:linear-gradient(90deg,#c99a2e,#f6d36a)}
@keyframes wrbPulse{50%{box-shadow:0 0 14px 3px #f6d36a99}}
.wrb-spacer{flex:1}
.wrb-bottom{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:center;align-items:flex-end;gap:14px;
  padding:8px;padding-bottom:max(8px,env(safe-area-inset-bottom));background:linear-gradient(#3a241400,#3a2414aa 30%,#3a2414ee);pointer-events:none}
.wrb-group{display:flex;gap:6px;pointer-events:auto}
.wrb-bottom .wrb-btn{width:64px;height:60px;flex-direction:column;padding:2px}
.wrb-ram{background:linear-gradient(#8e2a22,#4a1410)}
.wrb-tall .wrb-bottom{flex-direction:column;align-items:center;gap:6px}
.wrb-tall .wrb-bottom .wrb-btn{width:62px;height:54px}
.wrb-short .wrb-bottom{display:contents}
.wrb-short .wrb-group{position:absolute;flex-direction:column;top:52px;bottom:6px;justify-content:center;gap:5px;padding:0 6px}
.wrb-short .wrb-bless{left:0;padding-left:max(6px,env(safe-area-inset-left))}
.wrb-short .wrb-arms{right:0;padding-right:max(6px,env(safe-area-inset-right))}
.wrb-short .wrb-group .wrb-btn{width:52px;height:48px}
.wrb-short .wrb-btn .lbl,.wrb-tall .wrb-bless .lbl{display:none}
.wrb-short .wrb-top{padding-left:max(66px,env(safe-area-inset-left));padding-right:max(66px,env(safe-area-inset-right));padding-top:4px}
.wrb-start{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:120px;height:120px;border-radius:50%;
  border:4px solid #f6d36a;background:radial-gradient(#8e2a22,#4a1410);box-shadow:0 0 0 6px #1d1a1688,0 8px 30px #000a;
  display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Cinzel,Georgia,serif;font-weight:700;font-size:16px;color:#f6e7c1}
.wrb-start svg{width:46px;height:46px}
.wrb-short .wrb-start{width:96px;height:96px;font-size:13px}
.wrb-start.hide{display:none}
.wrb-hint{position:absolute;left:50%;transform:translateX(-50%);font-size:13px;color:#f6e7c1;text-align:center;
  background:#1d1a16bb;border-radius:8px;padding:4px 10px;pointer-events:none;max-width:90%}
.wrb-toast{position:absolute;left:50%;top:60px;transform:translateX(-50%);background:#efe2c4;color:#1d1a16;border:2px solid #5b3a22;
  border-radius:8px;padding:6px 14px;font-weight:700;font-size:14px;pointer-events:none;opacity:0;transition:opacity .25s;white-space:nowrap;max-width:94%;overflow:hidden;text-overflow:ellipsis}
.wrb-toast.show{opacity:1}
.wrb-end{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#0008;padding:16px}
.wrb-panel{background:#efe2c4;color:#1d1a16;border:6px solid #5b3a22;outline:2px solid #c99a2e;border-radius:12px;max-width:420px;width:100%;
  padding:18px 20px;box-shadow:0 12px 40px #000c;max-height:100%;overflow:auto}
.wrb-panel h2{font-family:Cinzel,Georgia,serif;margin:0 0 8px;font-size:26px;text-align:center;color:#5b3a22}
.wrb-panel p{margin:6px 0;font-size:16px}
.wrb-panel ul{margin:4px 0 8px;padding-left:20px}
.wrb-panel .go{display:block;margin:14px auto 0;min-height:48px;padding:0 28px;border-radius:10px;border:2px solid #c99a2e;
  background:linear-gradient(#6b4526,#3a2414);color:#f6e7c1;font-weight:700;font-size:17px}
`;

// ------------------------------------------------------------------ icons (24x24, drawn here)
const I = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  thor: I('<path d="M5 4h12l-2 5H7z" fill="#c9c9c9" stroke="#1d1a16"/><path d="M11 9v11" stroke="#c99a2e" stroke-width="3"/><path d="M18 3l-2 4h3l-3 5" stroke="#9fd0ff"/>'),
  eir: I('<path d="M12 21c-5-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-3 7-8 10z" fill="#5f9a4a" stroke="#d9f2c4"/><path d="M12 9v7M8.5 12.5h7" stroke="#fff"/>'),
  njord: I('<path d="M2 15c3 0 3-3 6-3s3 3 6 3 3-3 6-3" stroke="#7fd0e0"/><path d="M2 19c3 0 3-3 6-3s3 3 6 3 3-3 6-3" stroke="#3f9ab0"/><path d="M8 9c0-3 3-5 6-4-2 1-3 3-2 5" stroke="#efe2c4"/>'),
  odin: I('<path d="M3 13c3-1 5-4 9-4 3 0 4 2 6 2l3-2-1 4c-2 3-6 4-10 3l-4 3 1-4z" fill="#1d1a16" stroke="#9aa3c0"/><circle cx="15" cy="11" r="1" fill="#f6d36a" stroke="none"/>'),
  kari: I('<path d="M3 8h11a3 3 0 1 0-3-3" stroke="#e8f4ff"/><path d="M3 12h16a3 3 0 1 1-3 3" stroke="#e8f4ff"/><path d="M3 16h7" stroke="#e8f4ff"/>'),
  harpoon: I('<path d="M4 20L18 6" stroke="#c9a876" stroke-width="2.5"/><path d="M15 4l6-1-1 6-2-3z" fill="#d0d6dc" stroke="#d0d6dc"/><path d="M4 20c2 1 4 0 5-2" stroke="#efe2c4" stroke-width="1"/>'),
  firearrows: I('<path d="M4 20L17 7" stroke="#c9a876"/><path d="M17 7l3-3M14 4h6v6" stroke="#d0d6dc"/><path d="M6 12c-2 2 0 5 2 5 0-2 2-2 1-5-1 1-2 1-3 0z" fill="#ff9a2a" stroke="#ffd36a" stroke-width="1"/>'),
  greekfire: I('<path d="M8 10h8l1 9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#8a6a2a" stroke="#c99a2e"/><path d="M12 9c-3-2 0-5-1-7 3 2 5 4 2 7" fill="#ff8a2a" stroke="#ffd36a" stroke-width="1"/>'),
  ram: I('<path d="M2 15h12l6-4-2 6H3z" fill="#c99a2e" stroke="#f6e7c1"/><path d="M20 8l2-2M21 12h2M20 15l2 2" stroke="#fff"/>'),
  flee: I('<path d="M20 12H5M10 6l-6 6 6 6" stroke="#efe2c4"/>'),
  pause: I('<path d="M8 5v14M16 5v14" stroke-width="3.5"/>'),
  play: I('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  all: I('<path d="M3 16h7l-1 3H4zM13 16h7l-1 3h-5z" fill="currentColor"/><path d="M6 16V6l3 6M16 16V6l3 6"/>'),
  horn: I('<path d="M3 9c6 0 12-3 15-6l1 1c-1 6 0 11 2 15-4-2-11-4-18-4z" fill="#c9a876" stroke="#efe2c4" stroke-width="1.4"/>'),
};

const SHORT = {thor: 'Thor', eir: 'Eir', njord: 'Njörðr', odin: 'Odin', kari: 'Kári', harpoon: 'Harpoon', firearrows: 'Fire', greekfire: 'G. fire'};

// ------------------------------------------------------------------ helpers

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const fmt = (n) => Math.round(n).toLocaleString('en').replace(/,/g, ' ');

function sfx(name) {
  try { sfxM?.play?.(name); } catch { /* audio optional */ }
}

function talentFor(S, opts) {
  if (opts.talent && TALENTS[opts.talent]) return {id: opts.talent, name: TALENTS[opts.talent].name};
  const list = heroesM?.HEROES;
  const hero = heroesM?.HERO_BY_ID?.[S.hero] || (Array.isArray(list) ? list.find((x) => x.id === S.hero) : list?.[S.hero]);
  const id = hero?.talent?.id && TALENTS[hero.talent.id] ? hero.talent.id : (HERO_TALENT[S.hero] || 'shieldwall');
  return {id, name: hero?.talent?.name || TALENTS[id].name};
}

function goodName(g) {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

// ------------------------------------------------------------------ main

/**
 * Start a battle in `root` (it fills root; root should be positioned).
 * opts: {enemies:[{kind, level?, name?, boss?}|'kind'], weather:'clear'|'rain'|'fog'|'storm',
 *        place:'sea'|'fortress', level?, onEnd(result), state? (defaults to js/state.js S),
 *        seed?, talent? (override)}
 */
export function startBattle(root, opts = {}) {
  const S = opts.state || stateM?.S || {};
  if (!Array.isArray(S.fleet)) S.fleet = [];
  const talent = talentFor(S, opts);
  const blessData = blessM?.BLESSINGS || {};
  const b = E.createBattle({
    fleet: S.fleet,
    enemies: opts.enemies || [], weather: opts.weather, place: opts.place, level: opts.level,
    talent: talent.id, items: S.items || [], mod: !opts.state && charmsM?.mod ? charmsM.mod : null,
    blessings: S.blessings || {}, seed: opts.seed,
    ships: shipsM?.SHIPS, arms: shipsM?.ARMS, ammo: shipsM?.AMMO, blessingData: blessData,
  });

  if (!document.getElementById(STYLE_ID)) {
    const st = document.createElement('style'); st.id = STYLE_ID; st.textContent = CSS; document.head.appendChild(st);
  }
  if (getComputedStyle(root).position === 'static') root.style.position = 'relative';

  const wrap = h('div', 'wrb');
  const backdrop = h('div', 'wrb-backdrop');
  let hasBackdrop = false;
  if (typeof scenesM?.seaScene === 'function') {
    try {
      backdrop.innerHTML = scenesM.seaScene({weather: b.weather, time: 'day', width: 1600, height: 900});
      backdrop.querySelector('svg')?.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      hasBackdrop = !!backdrop.querySelector('svg');
    } catch { backdrop.innerHTML = ''; }
  }
  const canvas = h('canvas');
  canvas.setAttribute('aria-label', 'Battle');

  // top bar
  const top = h('div', 'wrb-top');
  const btnFlee = h('button', 'wrb-btn', `${ICON.flee}<span class="lbl">Flee</span>`);
  btnFlee.title = 'Flee';
  const tbar = h('button', 'wrb-talent', `<div class="fill"></div><span>${esc(talent.name)}</span>`);
  tbar.title = TALENTS[talent.id].desc;
  const btnAll = h('button', 'wrb-btn', ICON.all); btnAll.title = 'Select all ships';
  const btnSpeed = h('button', 'wrb-btn', '1x'); btnSpeed.title = 'Battle speed';
  const btnPause = h('button', 'wrb-btn', ICON.pause); btnPause.title = 'Pause';
  top.append(btnFlee, tbar, btnAll, btnSpeed, btnPause);

  // bottom: blessings | ram + ammo
  const bottom = h('div', 'wrb-bottom');
  const gBless = h('div', 'wrb-group wrb-bless');
  const gArms = h('div', 'wrb-group wrb-arms');
  const blessBtn = {};
  for (const k of BLESSING_IDS) {
    const nm = blessData[k]?.name || BLESSING_COMBAT[k].name;
    const btn = h('button', 'wrb-btn', `${ICON[k]}<span class="lbl">${esc(SHORT[k])}</span><span class="cd"></span><span class="n">0</span>`);
    btn.title = `${nm}: ${blessData[k]?.desc || ''}`;
    btn.addEventListener('click', () => act(() => E.cmdBlessing(b, k)));
    blessBtn[k] = btn; gBless.append(btn);
  }
  const btnRam = h('button', 'wrb-btn wrb-ram', `${ICON.ram}<span class="lbl">Ram</span><span class="cd"></span>`);
  btnRam.title = 'Ram: selected ships charge the target';
  btnRam.addEventListener('click', () => act(() => E.cmdRam(b)));
  gArms.append(btnRam);
  const ammoBtn = {};
  for (const a of AMMO_IDS) {
    const nm = shipsM?.AMMO?.[a]?.name || AMMO[a].name;
    const btn = h('button', 'wrb-btn', `${ICON[a]}<span class="lbl">${esc(SHORT[a])}</span><span class="cd"></span><span class="n">0</span>`);
    btn.title = nm;
    btn.addEventListener('click', () => act(() => E.cmdAmmo(b, a)));
    ammoBtn[a] = btn; gArms.append(btn);
  }
  let btnHorn = null;
  if (!b.hornUsed) {
    btnHorn = h('button', 'wrb-btn', `${ICON.horn}<span class="lbl">Horn</span>`);
    btnHorn.title = 'Sea-Horn: once per battle, frighten foes away';
    btnHorn.addEventListener('click', () => act(() => E.cmdHorn(b)));
    gArms.append(btnHorn);
  }
  bottom.append(gBless, gArms);

  const startBtn = h('button', 'wrb-start', `${ICON.play}<span>Start</span>`);
  const hint = h('div', 'wrb-hint', 'Tap a foe to focus fire · tap your ships to choose who obeys');
  const toast = h('div', 'wrb-toast');
  wrap.append(backdrop, canvas, top, bottom, startBtn, hint, toast);
  root.appendChild(wrap);

  let toastT = 0;
  const showToast = (text) => { toast.textContent = text; toast.classList.add('show'); toastT = 2.2; };
  const R = new Renderer(canvas, b, {sfx, hasBackdrop, onToast: showToast});
  R.talentName = talent.name;

  function act(fn) {
    if (ended) return;
    const r = fn();
    if (r && !r.ok && r.msg && !b.events.some((e) => e.type === 'msg')) showToast(r.msg);
    else if (r?.ok) sfx('click');
    updateHud(true);
  }

  // ---- pause / speed
  const setPaused = (p) => {
    E.setPaused(b, p);
    startBtn.classList.toggle('hide', !p);
    startBtn.querySelector('span').textContent = b.t > 0 ? 'Resume' : 'Start';
    hint.style.display = p && b.t === 0 ? '' : 'none';
    btnPause.innerHTML = p ? ICON.play : ICON.pause;
  };
  startBtn.addEventListener('click', () => { setPaused(false); sfx('horn'); });
  btnPause.addEventListener('click', () => setPaused(!b.paused));
  btnSpeed.addEventListener('click', () => { E.setSpeed(b, b.speed === 1 ? 2 : 1); btnSpeed.textContent = b.speed + 'x'; btnSpeed.classList.toggle('on', b.speed === 2); });
  btnAll.addEventListener('click', () => { E.selectAll(b); sfx('click'); });
  tbar.addEventListener('click', () => act(() => E.cmdTalent(b)));
  btnFlee.addEventListener('click', () => act(() => E.cmdFlee(b)));

  // ---- canvas taps
  canvas.addEventListener('pointerdown', (ev) => {
    if (ended) return;
    const r = canvas.getBoundingClientRect();
    const u = R.hit(ev.clientX - r.left, ev.clientY - r.top);
    if (!u) return;
    if (u.side === 'p') E.toggleSelect(b, u.id); else E.setTarget(b, u.id);
    sfx('click');
  });
  const onKey = (ev) => {
    if (ended || ev.target?.tagName === 'INPUT') return;
    if (ev.code === 'Space') { ev.preventDefault(); setPaused(!b.paused); }
    const i = '12345'.indexOf(ev.key);
    if (i >= 0) act(() => E.cmdBlessing(b, BLESSING_IDS[i]));
  };
  window.addEventListener('keydown', onKey);

  // ---- layout
  function layout() {
    const W = wrap.clientWidth; const H = wrap.clientHeight;
    if (!W || !H) return;
    const mode = H < 520 && W > H ? 'short' : W < 700 ? 'tall' : 'wide';
    wrap.classList.remove('wrb-short', 'wrb-tall', 'wrb-wide');
    wrap.classList.add('wrb-' + mode);
    const topH = top.offsetHeight;
    let left = 6; let right = 6; let bottomY = H;
    if (mode === 'short') { left = gBless.offsetWidth + 4; right = gArms.offsetWidth + 4; bottomY = H - 4; } else bottomY = H - bottom.offsetHeight + 6;
    // ships in tight, staggered lanes stand taller than their lane: leave room above the top one
    const nameRoom = mode === 'short' ? 22 + 0.3 * ((bottomY - topH) / R.lanes) : 30;
    const field = {x: left, y: topH + nameRoom, w: W - left - right, h: Math.max(80, bottomY - topH - nameRoom - 4)};
    // keep lanes from getting absurdly tall on a portrait phone
    const maxH = R.lanes * Math.max(60, field.w * 0.3);
    if (field.h > maxH) { field.y += (field.h - maxH) / 2; field.h = maxH; }
    R.resize(W, H, field);
    hint.style.top = Math.round(H / 2 + (mode === 'short' ? 58 : 72)) + 'px';
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(layout) : null;
  ro?.observe(wrap);
  window.addEventListener('resize', layout);
  layout();

  // ---- HUD refresh
  let hudT = 0;
  function updateHud(force) {
    if (!force && hudT > 0) return;
    hudT = 0.1;
    const any = E.foes(b).length > 0 && !b.result && !b.fleeing;
    for (const k of BLESSING_IDS) {
      const btn = blessBtn[k];
      const n = b.blessings[k] || 0;
      btn.querySelector('.n').textContent = n;
      const cd = b.cd[k] || 0;
      btn.querySelector('.cd').style.height = (cd > 0 ? (cd / b.blessCd[k]) * 100 : 0) + '%';
      btn.classList.toggle('off', !(n > 0 && any && cd <= 0));
    }
    for (const a of AMMO_IDS) {
      const btn = ammoBtn[a];
      const n = E.ammoCount(b, a);
      btn.querySelector('.n').textContent = n;
      const cd = b.cd['ammo_' + a] || 0;
      btn.querySelector('.cd').style.height = (cd > 0 ? (cd / (b.ammoStats[a].cooldown || 1)) * 100 : 0) + '%';
      btn.classList.toggle('off', !(n > 0 && any && cd <= 0));
    }
    const sel = E.selectedShips(b);
    const ramCd = sel.length ? Math.min(...sel.map((u) => Math.max(0, u.ramCd))) : 0;
    btnRam.querySelector('.cd').style.height = (ramCd / 6) * 100 + '%';
    const rammable = E.foes(b).some((e) => e.canBeRammed);
    btnRam.classList.toggle('off', !(any && rammable && ramCd <= 0));
    const tf = Math.min(1, b.talent.charge);
    tbar.querySelector('.fill').style.width = tf * 100 + '%';
    tbar.classList.toggle('ready', tf >= 1 && any);
    btnFlee.querySelector('.lbl').textContent = b.fleeCd > 0 ? `Flee ${Math.ceil(b.fleeCd)}s` : `Flee ${Math.round(E.fleeChance(b) * 100)}%`;
    btnFlee.classList.toggle('off', !any || b.fleeCd > 0);
    if (btnHorn) btnHorn.classList.toggle('off', b.hornUsed || !any);
  }

  // ---- loop
  let last = performance.now();
  let raf = 0;
  let ended = false;
  let endWait = 0;
  let destroyed = false;
  function loop(now) {
    if (destroyed) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    E.step(b, dt);
    R.frame(dt * (b.paused ? 1 : b.speed));
    hudT -= dt;
    updateHud();
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) toast.classList.remove('show'); }
    if (b.result && !ended) { endWait += dt; if (endWait > 0.9) finish(); }
    raf = requestAnimationFrame(loop);
  }
  setPaused(true);
  raf = requestAnimationFrame(loop);

  // ---- end
  function finish() {
    ended = true;
    const out = E.applyOutcome(S, b, {
      ships: shipsM?.SHIPS,
      cargoCap: !opts.state && fleetM?.cargoCap ? () => fleetM.cargoCap() : null,
      cargoUsed: !opts.state && fleetM?.cargoUsed ? () => fleetM.cargoUsed() : null,
      takeLoot: !opts.state && fleetM?.takeLoot ? (goods, silver) => {
        const r = fleetM.takeLoot(goods, silver);
        return r?.ok ? {taken: r.taken, silver: r.silver} : null;
      } : null,
    });
    try {
      if (!opts.state && stateM?.emit) {
        stateM.emit('fleet', S.fleet);
        stateM.emit('battle-end', {result: out.result, enemies: out.enemies});
        stateM.emit('silver', S.silver);
        stateM.emit('cargo', S.cargo);
      }
    } catch (e) { console.error(e); }
    showEnd(out);
  }

  function list(obj) {
    const items = Object.entries(obj || {}).filter(([, q]) => q > 0);
    return items.length ? `<ul>${items.map(([g, q]) => `<li>${q} ${esc(goodName(g))}</li>`).join('')}</ul>` : '';
  }

  function showEnd(out) {
    const panel = h('div', 'wrb-end');
    let body = '';
    if (out.result === 'win') {
      body += '<h2>Victory!</h2>';
      body += `<p>Silver taken: <b>${fmt(out.silver)} s</b></p>`;
      const got = list(out.loot);
      body += got ? `<p>Crates hauled aboard:</p>${got}` : '<p>No crates worth keeping.</p>';
      const lost = list(out.lost);
      if (lost) body += `<p>No room in the hold, left to the fish:</p>${lost}`;
    } else if (out.result === 'lose') {
      const ship = S.fleet[0];
      body += '<h2>Defeat</h2>';
      body += `<p>Your fleet is broken. You escape in <b>${esc(ship?.name || 'a small boat')}</b>, bailing hard.</p>`;
      body += '<p>The victors help themselves to part of your cargo.</p>';
    } else {
      body += '<h2>Escaped</h2><p>You slip away with scraped hulls and no plunder.</p>';
    }
    if (out.sunk.length) body += `<p>Sunk: ${out.sunk.map(esc).join(', ')}</p>`;
    const lc = list(out.lostCargo);
    if (lc) body += `<p>Went down with the ships:</p>${lc}`;
    panel.innerHTML = `<div class="wrb-panel" role="dialog" aria-label="Battle result">${body}<button class="go">Continue</button></div>`;
    panel.querySelector('.go').addEventListener('click', () => {
      sfx('click');
      destroy();
      try { opts.onEnd?.(out); } catch (e) { console.error(e); }
    });
    wrap.appendChild(panel);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(raf);
    ro?.disconnect();
    window.removeEventListener('resize', layout);
    window.removeEventListener('keydown', onKey);
    wrap.remove();
  }

  return {battle: b, destroy};
}
