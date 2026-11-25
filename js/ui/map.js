// Whale Road: the sea chart screen and the voyage animation (map owner).
//
//   openMap(root, {onSail(portId), onClose(), focus}) -> {close(), refresh(), select(id), ready}
//   playVoyage(root, {from, to, days, onEvent(day), onArrive()}) -> {done, stop(), setSpeed(n)}
//
// Other modules are loaded lazily and every one is optional, so the chart works before
// the rest of the game exists: state.js, data/ports.js, data/goods.js, sim/voyage.js,
// sim/fleet.js, sim/quests.js, sim/time.js, art/ships.js.

import {MAP_W, MAP_H} from '../data/coast.js';
import {pathInfo, distance, project, PORT_LL, PORT_IDS, SEA_MARKS, COST} from '../data/routes.js';
import {
  chartSVG, VIEW, paperTexture, portMedallion, buildingIcon, BUILDING_NAMES, CULTURE_NAMES,
  questBadge, seaMarkBadge, longshipPaths, UNITS_PER_DAY,
} from '../art/mapart.js';

// ------------------------------------------------------------------ optional modules
const opt = (p) => import(p).catch(() => null);
let depsP = null;
function loadDeps() {
  return (depsP ||= Promise.all([
    opt('../state.js'), opt('../data/ports.js'), opt('../data/goods.js'), opt('../sim/voyage.js'),
    opt('../sim/fleet.js'), opt('../sim/quests.js'), opt('../sim/time.js'), opt('../art/ships.js'),
  ]).then(([state, ports, goods, voyage, fleet, quests, time, ships]) => ({state, ports, goods, voyage, fleet, quests, time, ships})));
}
const tryCall = (fn, ...a) => { try { return typeof fn === 'function' ? fn(...a) : undefined; } catch (e) { return undefined; } };

const FALLBACK = {
  ravnfjord: ['Ravnfjord', 'norse'], kaupang: ['Kaupang', 'norse'], hladir: ['Hlaðir', 'norse'],
  halogaland: ['Hálogaland', 'norse'], faereyjar: ['Færeyjar', 'island'], island: ['Ísland', 'island'],
  orkney: ['Orkneyjar', 'norse'], dyflin: ['Dyflin', 'gael'], jorvik: ['Jórvík', 'anglonorse'],
  hamwic: ['Hamwic', 'saxon'], rudaborg: ['Rúðuborg', 'frank'], heidaby: ['Heiðabýr', 'dane'],
  jomsborg: ['Jómsborg', 'wend'], truso: ['Truso', 'aesti'], gotland: ['Gotland', 'gotlander'],
  birka: ['Birka', 'svear'], aldeigja: ['Aldeigjuborg', 'slav'], holmgard: ['Hólmgarðr', 'slav'],
  kaenugard: ['Kænugarðr', 'slav'], miklagard: ['Miklagarðr', 'byzantine'],
};

function portList(D) {
  const src = D.ports && (D.ports.PORTS || D.ports.default);
  const arr = Array.isArray(src) ? src : src && typeof src === 'object' ? Object.entries(src).map(([id, p]) => ({id, ...p})) : [];
  const byId = {};
  for (const p of arr) if (p && p.id) byId[p.id] = p;
  return PORT_IDS.map((id) => {
    const p = byId[id] || {};
    const ll = Number.isFinite(p.lon) && Number.isFinite(p.lat) ? [p.lon, p.lat] : PORT_LL[id];
    const [x, y] = project(ll[0], ll[1]);
    return {
      id, x, y, name: p.name || FALLBACK[id][0], culture: p.culture || FALLBACK[id][1],
      buildings: p.buildings || [], produces: p.produces || [], demands: p.demands || [],
      contraband: p.contraband || [], blurb: p.blurb || '',
    };
  });
}
const stateOf = (D) => (D.state && D.state.S) || {};
function isLocked(S, id, D) {
  if (!S || S.mode === 'free') return false;
  const u = S.unlockedPorts;
  if (!Array.isArray(u) || !u.length || u.includes(id)) return false;
  // quest targets and other special cases the sim allows are not locked
  return !(D && D.voyage && typeof D.voyage.canSail === 'function' && tryCall(D.voyage.canSail, id) === null);
}
function questMarks(D, override) {
  const ports = {}, seas = {}, list = override || tryCall(D.quests && D.quests.markers) || [];
  for (const m of Array.isArray(list) ? list : []) {
    if (!m) continue;
    const bucket = m.port ? ports : m.sea ? seas : null, key = m.port || m.sea;
    if (!bucket) continue;
    (bucket[key] ||= []).push(m);
  }
  const top = (ms) => (ms.some((m) => m.kind === 'main') ? 'main' : 'side');
  return {ports, seas, top};
}
function goodName(D, id) {
  const G = D.goods && (D.goods.GOODS || D.goods.default);
  const g = Array.isArray(G) ? G.find((x) => x && x.id === id) : G && G[id];
  return (g && g.name) || id.charAt(0).toUpperCase() + id.slice(1);
}
const silver = (n) => `${Math.round(n).toLocaleString('en-US').replace(/,/g, ' ')} s`;
function travelDays(D, from, to) {
  const t = tryCall(D.voyage && D.voyage.travelDays, from, to);
  if (Number.isFinite(t) && t > 0) return Math.round(t);
  return Math.max(1, Math.round(distance(from, to) / UNITS_PER_DAY));
}
function overloaded(D) {
  const used = tryCall(D.fleet && D.fleet.cargoUsed), cap = tryCall(D.fleet && D.fleet.cargoCap);
  return Number.isFinite(used) && Number.isFinite(cap) && used > cap;
}
const dateLabel = (D, day) => { const d = tryCall(D.time && D.time.date, day); return d && d.label ? d.label : ''; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

// ------------------------------------------------------------------ styles
const CSS = `
.wr-map{position:absolute;inset:0;overflow:hidden;color:#1d1a16;font-family:Alegreya,Georgia,serif;
 -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;
 background:radial-gradient(ellipse at 50% 40%,#6a4528 0%,#3a2414 70%,#24160b 100%)}
.wr-map::before{content:"";position:absolute;inset:0;opacity:.35;pointer-events:none;
 background:repeating-linear-gradient(93deg,rgba(0,0,0,.18) 0 2px,transparent 2px 9px,rgba(255,220,170,.05) 9px 11px,transparent 11px 23px)}
.wr-map-vp{position:absolute;inset:0;overflow:hidden;touch-action:none;cursor:grab}
.wr-map-vp:active{cursor:grabbing}
.wr-map-world{position:absolute;left:0;top:0;transform-origin:0 0;box-shadow:0 10px 40px rgba(0,0,0,.6)}
.wr-map.moving .wr-map-world{will-change:transform}
.wr-map-world>svg{display:block;width:100%;height:100%}
.wr-map-paper{position:absolute;inset:0;mix-blend-mode:multiply;opacity:.5;pointer-events:none;background-size:160px 160px}
.wr-map-ov{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.wr-map-pins{position:absolute;inset:0;pointer-events:none}
.wr-pin{position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;padding:0;border:0;background:none;
 pointer-events:auto;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;font:inherit;color:inherit}
.wr-pin>svg{filter:drop-shadow(0 2px 1.5px rgba(40,22,8,.5));transition:transform .15s}
.wr-pin.sel>svg{transform:scale(1.18)}
.wr-pin:focus-visible{outline:2px solid #c99a2e;border-radius:50%}
.wr-pin-label{position:absolute;white-space:nowrap;font:700 12px/1 Cinzel,Georgia,serif;letter-spacing:.04em;color:#2a1a0e;
 padding:3px 6px 3px;background:rgba(243,233,207,.93);border:1px solid rgba(91,58,34,.55);border-radius:2px;
 box-shadow:0 1px 2px rgba(0,0,0,.25);pointer-events:none}
.wr-pin-label.b{top:39px;left:50%;transform:translateX(-50%)}
.wr-pin-label.a{bottom:39px;left:50%;transform:translateX(-50%)}
.wr-pin-label.r{left:39px;top:50%;transform:translateY(-50%)}
.wr-pin-label.l{right:39px;top:50%;transform:translateY(-50%)}
.wr-pin-label.h{display:none}
.wr-pin.cur .wr-pin-label{background:#3a2414;color:#f3e7cb;border-color:#c99a2e}
.wr-pin-q{position:absolute;right:-1px;top:-5px;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(0,0,0,.4))}
.wr-pin.easy::before,.wr-seamark.easy::before{content:"";position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;
 border-radius:50%;border:3px solid #e8bd4a;box-shadow:0 0 12px 4px rgba(232,189,74,.65);animation:wr-pulse 1.6s ease-out infinite;pointer-events:none}
.wr-pin.easy.side::before,.wr-seamark.easy.side::before{border-color:#5d97d6;box-shadow:0 0 12px 4px rgba(93,151,214,.6)}
@keyframes wr-pulse{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.7);opacity:0}}
.wr-seamark{position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;pointer-events:auto;display:flex;align-items:center;justify-content:center;border:0;background:none;padding:0}
.wr-fleet{position:absolute;left:0;top:0;width:40px;height:30px;margin:-38px 0 0 -52px;pointer-events:none;animation:wr-bob 2.4s ease-in-out infinite}
@keyframes wr-bob{0%,100%{translate:0 0;rotate:-2deg}50%{translate:0 -2px;rotate:2deg}}
.wr-map-ui{position:absolute;inset:0;pointer-events:none}
.wr-mbtn{pointer-events:auto;min-width:44px;height:44px;border-radius:8px;border:2px solid #3a2414;cursor:pointer;
 background:linear-gradient(#f3e7cb,#d9c59a);color:#3a2414;font:700 18px/1 Cinzel,Georgia,serif;display:flex;align-items:center;justify-content:center;
 box-shadow:inset 0 0 0 2px rgba(255,248,230,.5),0 2px 6px rgba(0,0,0,.5);padding:0 10px}
.wr-mbtn:active{transform:translateY(1px)}
.wr-mbtn[disabled]{opacity:.55;cursor:not-allowed}
.wr-map-tl{position:absolute;left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));display:flex;gap:8px;align-items:center}
.wr-map-tr{position:absolute;right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));display:flex;flex-direction:column;gap:8px}
.wr-map-plate{pointer-events:none;padding:6px 12px;border-radius:6px;background:rgba(36,22,11,.78);color:#f3e7cb;border:1px solid #c99a2e;
 font:600 13px/1.2 Cinzel,Georgia,serif;letter-spacing:.05em;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.wr-map-plate small{display:block;font:italic 12px/1.2 Alegreya,Georgia,serif;letter-spacing:0;color:#e5d3a6}
.wr-card{position:absolute;pointer-events:auto;display:flex;flex-direction:column;color:#1d1a16;
 background:#efe2c4;border:5px solid #5b3a22;border-radius:10px;box-shadow:inset 0 0 0 2px #c99a2e,inset 0 0 30px rgba(120,80,40,.25),0 8px 30px rgba(0,0,0,.6);
 left:8px;right:8px;bottom:8px;max-height:56%;animation:wr-up .2s ease-out}
.wr-map.land .wr-card{left:auto;top:8px;bottom:8px;right:8px;width:min(350px,46%);max-height:none}
@keyframes wr-up{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
.wr-card-head{display:flex;align-items:center;gap:10px;padding:10px 10px 6px 12px;border-bottom:1px solid rgba(91,58,34,.35)}
.wr-card-head h2{margin:0;font:700 21px/1.1 Cinzel,Georgia,serif;color:#3a2414}
.wr-card-head .cult{font-style:italic;font-size:14px;color:#5b3a22}
.wr-card-head .x{margin-left:auto}
.wr-card-body{overflow:auto;padding:8px 12px;flex:1;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.wr-card-body h3{margin:10px 0 5px;font:700 12px/1 Cinzel,Georgia,serif;letter-spacing:.12em;color:#8e2a22;text-transform:uppercase}
.wr-card-body p{margin:4px 0;font-size:15px;line-height:1.3}
.wr-chips{display:flex;flex-wrap:wrap;gap:5px}
.wr-chip{display:flex;align-items:center;gap:4px;padding:3px 7px 3px 4px;border-radius:14px;background:rgba(255,250,235,.7);border:1px solid rgba(91,58,34,.35);font-size:13.5px}
.wr-goods{width:100%;border-collapse:collapse;font-size:15px}
.wr-goods td{padding:3px 2px;border-bottom:1px dotted rgba(91,58,34,.35)}
.wr-goods td.p{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
.wr-tag{font-size:11.5px;font-style:italic;padding:0 5px;border-radius:8px;margin-left:4px;white-space:nowrap}
.wr-tag.loc{background:#dfe6c6;color:#3d4a1c}.wr-tag.want{background:#f0d9b0;color:#6b3c10}.wr-tag.bad{background:#8e2a22;color:#fff3e0}
.wr-q{display:flex;align-items:center;gap:6px;font-size:15px;margin:3px 0}
.wr-card-foot{padding:8px 12px 10px;border-top:1px solid rgba(91,58,34,.35);display:flex;align-items:center;gap:10px}
.wr-card-foot .why{font-size:13.5px;font-style:italic;color:#5b3a22;flex:1;line-height:1.2}
.wr-sail{background:linear-gradient(#a8382c,#7a2018);color:#fff3dc;border-color:#3a2414;font-size:17px;padding:0 20px;letter-spacing:.08em}
.wr-voy-hud{position:absolute;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);text-align:center;pointer-events:none;
 padding:7px 18px 8px;border-radius:8px;background:rgba(36,22,11,.82);color:#f3e7cb;border:1px solid #c99a2e;box-shadow:0 3px 10px rgba(0,0,0,.5);white-space:nowrap}
.wr-voy-hud b{display:block;font:700 18px/1.15 Cinzel,Georgia,serif;letter-spacing:.06em}
.wr-voy-hud span{font:italic 13.5px/1.2 Alegreya,Georgia,serif;color:#e5d3a6}
.wr-voy-hud i{display:block;height:4px;margin-top:6px;border-radius:2px;background:rgba(243,231,203,.25);overflow:hidden}
.wr-voy-hud i>u{display:block;height:100%;width:0;background:#c99a2e}
.wr-voy-speed{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));font-size:17px;min-width:60px}
.wr-voy-ship{position:absolute;left:0;top:0;pointer-events:none;width:64px;height:48px;margin:-40px 0 0 -32px}
.wr-voy-ship>div{width:100%;height:100%;animation:wr-bob 1.6s ease-in-out infinite}
.wr-voy-ship svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 3px 2px rgba(20,30,40,.45))}
.wr-voy-ship.flip>div{transform:scaleX(-1)}
@media (prefers-reduced-motion: reduce){.wr-pin.easy::before,.wr-seamark.easy::before,.wr-fleet,.wr-voy-ship>div{animation:none}}
`;
function injectStyle() {
  if (typeof document === 'undefined' || document.getElementById('wr-map-style')) return;
  const st = document.createElement('style');
  st.id = 'wr-map-style';
  st.textContent = CSS;
  document.head.appendChild(st);
}

// ------------------------------------------------------------------ chart view + camera
let chartCache = null;
const chart = () => (chartCache ||= chartSVG());

function makeView(root) {
  injectStyle();
  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'wr-map';
  el.innerHTML = `<div class="wr-map-vp"><div class="wr-map-world" style="width:${VIEW.w}px;height:${VIEW.h}px">${chart()}<div class="wr-map-paper"></div></div>
<svg class="wr-map-ov" xmlns="http://www.w3.org/2000/svg"></svg><div class="wr-map-pins"></div></div><div class="wr-map-ui"></div>`;
  root.appendChild(el);
  const vp = el.querySelector('.wr-map-vp'), world = el.querySelector('.wr-map-world');
  const paper = paperTexture();
  if (paper) el.querySelector('.wr-map-paper').style.backgroundImage = `url(${paper})`;
  const cam = {s: 1, tx: 0, ty: 0}, inset = {r: 0, b: 0};
  const listeners = [];
  const size = () => [vp.clientWidth || window.innerWidth, vp.clientHeight || window.innerHeight];
  function limits() {
    const [w, h] = size();
    const sMin = Math.min(w / VIEW.w, h / VIEW.h), sCover = Math.max(w / MAP_W, h / MAP_H);
    return {sMin, sCover, sMax: Math.max(sCover * 4.5, 3)};
  }
  function clamp() {
    const [w, h] = size(), L = limits();
    cam.s = Math.min(L.sMax, Math.max(L.sMin, cam.s));
    // an open card is an inset: the chart may slide under it so its edge ports stay reachable
    const cw = VIEW.w * cam.s, ch = VIEW.h * cam.s, aw = w - inset.r, ah = h - inset.b;
    cam.tx = cw <= aw ? (aw - cw) / 2 : Math.min(0, Math.max(aw - cw, cam.tx));
    cam.ty = ch <= ah ? (ah - ch) / 2 : Math.min(0, Math.max(ah - ch, cam.ty));
  }
  const toScreen = (x, y) => [cam.tx + (x - VIEW.x) * cam.s, cam.ty + (y - VIEW.y) * cam.s];
  const toMap = (sx, sy) => [(sx - cam.tx) / cam.s + VIEW.x, (sy - cam.ty) / cam.s + VIEW.y];
  function apply() {
    clamp();
    world.style.transform = `translate(${cam.tx}px,${cam.ty}px) scale(${cam.s})`;
    const [w, h] = size();
    el.classList.toggle('land', w > h * 1.1);
    for (const fn of listeners) fn();
  }
  function centerOn(x, y, s = cam.s) {
    const [w, h] = size();
    cam.s = s;
    cam.tx = w / 2 - (x - VIEW.x) * s;
    cam.ty = h / 2 - (y - VIEW.y) * s;
    apply();
  }
  function zoomAt(sx, sy, factor) {
    const [mx, my] = toMap(sx, sy), L = limits();
    cam.s = Math.min(L.sMax, Math.max(L.sMin, cam.s * factor));
    cam.tx = sx - (mx - VIEW.x) * cam.s;
    cam.ty = sy - (my - VIEW.y) * cam.s;
    apply();
  }
  let settle = 0;
  function moving() {
    el.classList.add('moving');
    clearTimeout(settle);
    settle = setTimeout(() => el.classList.remove('moving'), 180);
  }
  let anim = 0;
  function flyTo(x, y, s = cam.s, ms = 450) {
    cancelAnimationFrame(anim);
    const [w, h] = size();
    const [x0, y0] = toMap(w / 2, h / 2), s0 = cam.s, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      moving();
      centerOn(x0 + (x - x0) * e, y0 + (y - y0) * e, s0 + (s - s0) * e);
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => apply()) : null;
  if (ro) ro.observe(vp);
  return {
    el, vp, world, cam, inset, size, limits, clamp, apply, centerOn, zoomAt, flyTo, toScreen, toMap, moving,
    ov: el.querySelector('.wr-map-ov'), pins: el.querySelector('.wr-map-pins'), ui: el.querySelector('.wr-map-ui'),
    onUpdate: (fn) => listeners.push(fn),
    destroy() { if (ro) ro.disconnect(); cancelAnimationFrame(anim); clearTimeout(settle); },
  };
}

/** Pan with one finger or the mouse, pinch with two, wheel to zoom. Returns a drag flag getter. */
function attachGestures(v) {
  const pts = new Map();
  let base = null, dragged = false;
  const rel = (e) => { const r = v.vp.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function baseline() {
    const list = [...pts.values()];
    if (!list.length) { base = null; return; }
    const cx = list.reduce((a, p) => a + p[0], 0) / list.length, cy = list.reduce((a, p) => a + p[1], 0) / list.length;
    const d = list.length > 1 ? Math.hypot(list[0][0] - list[1][0], list[0][1] - list[1][1]) : 0;
    base = {cx, cy, d, s: v.cam.s, map: v.toMap(cx, cy), start: [cx, cy]};
  }
  const move = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, rel(e));
    const list = [...pts.values()];
    const cx = list.reduce((a, p) => a + p[0], 0) / list.length, cy = list.reduce((a, p) => a + p[1], 0) / list.length;
    if (!dragged && Math.hypot(cx - base.start[0], cy - base.start[1]) < 7 && list.length < 2) return;
    dragged = true;
    v.moving();
    if (list.length > 1 && base.d > 0) {
      const d = Math.hypot(list[0][0] - list[1][0], list[0][1] - list[1][1]), L = v.limits();
      v.cam.s = Math.min(L.sMax, Math.max(L.sMin, (base.s * d) / base.d));
    }
    v.cam.tx = cx - (base.map[0] - VIEW.x) * v.cam.s;
    v.cam.ty = cy - (base.map[1] - VIEW.y) * v.cam.s;
    v.apply();
  };
  const up = (e) => {
    if (!pts.delete(e.pointerId)) return;
    baseline();
    if (!pts.size) { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); }
  };
  v.vp.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    if (!pts.size) {
      dragged = false;
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    }
    pts.set(e.pointerId, rel(e));
    baseline();
  });
  v.vp.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [sx, sy] = rel(e);
    v.moving();
    v.zoomAt(sx, sy, Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0016)));
  }, {passive: false});
  v.vp.addEventListener('dblclick', (e) => { const [sx, sy] = rel(e); v.moving(); v.zoomAt(sx, sy, 1.7); });
  // swallow the click that ends a drag, so panning never opens a port card
  v.vp.addEventListener('click', (e) => { if (dragged) { e.stopPropagation(); e.preventDefault(); } }, true);
  return () => dragged;
}

const svgIcon = {
  close: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M4,4L16,16M16,4L4,16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M10,3V17M3,10H17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  minus: '<svg viewBox="0 0 20 20" width="18" height="18"><path d="M3,10H17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  ship: `<svg viewBox="-30 -30 60 44" width="30" height="22">${longshipPaths()}</svg>`,
};

// ------------------------------------------------------------------ openMap
/**
 * Full-screen sea chart. opts: {onSail(portId), onClose(), focus: portId, markers: [..] (optional
 * override for quests.markers(), e.g. for a tutorial)}
 * Returns {close(), refresh(), select(portId|null), ready: Promise}.
 */
export function openMap(root, opts = {}) {
  const {onSail, onClose} = opts;
  const v = makeView(root);
  const isDragging = attachGestures(v);
  let D = {}, ports = [], selected = null, closed = false;
  const pinEls = {};
  let seaEls = [], lastS = -1;

  v.ui.innerHTML = `<div class="wr-map-tl"><button class="wr-mbtn wr-map-close" aria-label="Close the chart">${svgIcon.close}</button><div class="wr-map-plate"></div></div>
<div class="wr-map-tr"><button class="wr-mbtn" data-z="in" aria-label="Zoom in">${svgIcon.plus}</button><button class="wr-mbtn" data-z="out" aria-label="Zoom out">${svgIcon.minus}</button><button class="wr-mbtn" data-z="me" aria-label="Show my fleet">${svgIcon.ship}</button></div>`;
  v.ui.querySelector('.wr-map-close').addEventListener('click', () => { ctl.close(); if (onClose) onClose(); });
  v.ui.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
    const [w, h] = v.size(), z = b.dataset.z;
    if (z === 'me') { const p = here(); if (p) v.flyTo(p.x, p.y, Math.max(v.cam.s, v.limits().sCover)); return; }
    v.moving();
    v.zoomAt(w / 2, h / 2, z === 'in' ? 1.5 : 1 / 1.5);
  }));
  v.vp.addEventListener('click', (e) => { if (!e.target.closest('.wr-pin,.wr-seamark')) select(null); });

  const S = () => stateOf(D);
  const here = () => ports.find((p) => p.id === (S().port || (selected ? null : 'ravnfjord'))) || null;

  function build() {
    const st = S(), q = questMarks(D, opts.markers), cur = st.port;
    v.pins.innerHTML = '';
    for (const k of Object.keys(pinEls)) delete pinEls[k];
    for (const p of ports) {
      const locked = isLocked(st, p.id, D), mk = locked ? null : q.ports[p.id], kind = mk ? q.top(mk) : null;
      const b = document.createElement('button');
      b.className = 'wr-pin' + (p.id === cur ? ' cur' : '') + (locked ? ' locked' : '') + (st.easy && kind === 'main' ? ' easy main' : '');
      b.setAttribute('aria-label', locked ? 'Unknown port' : p.name);
      b.innerHTML = portMedallion(p.culture, {locked, current: p.id === cur, size: 34})
        + (kind ? `<span class="wr-pin-q">${questBadge(kind, 15)}</span>` : '')
        + (locked ? '' : `<span class="wr-pin-label b">${esc(p.name)}</span>`);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (!isDragging()) select(p.id); });
      v.pins.appendChild(b);
      pinEls[p.id] = {el: b, label: b.querySelector('.wr-pin-label'), p, locked, kind, w: 0};
    }
    seaEls = [];
    for (const [id, ms] of Object.entries(q.seas)) {
      const m = SEA_MARKS[id];
      if (!m) continue;
      const kind = q.top(ms), b = document.createElement('div');
      b.className = 'wr-seamark' + (st.easy ? ` easy ${kind}` : '');
      b.title = m.name;
      b.innerHTML = seaMarkBadge(kind, 28);
      v.pins.appendChild(b);
      seaEls.push({el: b, x: m.x, y: m.y});
    }
    const hp = ports.find((p) => p.id === cur);
    if (hp) {
      const f = document.createElement('div');
      f.className = 'wr-fleet';
      f.innerHTML = `<svg viewBox="-30 -30 60 44" width="40" height="30">${longshipPaths()}</svg>`;
      v.pins.appendChild(f);
      seaEls.push({el: f, x: hp.x, y: hp.y});
    }
    // measure label widths once
    for (const k in pinEls) if (pinEls[k].label) pinEls[k].w = pinEls[k].label.offsetWidth || pinEls[k].p.name.length * 8 + 14;
    const d = dateLabel(D, st.day || 1);
    v.ui.querySelector('.wr-map-plate').innerHTML = `Sea chart${d ? `<small>${esc(d)}</small>` : ''}`;
    lastS = -1;
    update();
  }

  function declutter() {
    const st = S();
    const items = Object.values(pinEls).map((it) => ({it, pos: v.toScreen(it.p.x, it.p.y)}));
    const k = pinK(), m = 15 * k;
    const boxes = items.map(({pos}) => [pos[0] - m, pos[1] - m, pos[0] + m, pos[1] + m]);
    for (const se of seaEls) { const [x, y] = v.toScreen(se.x, se.y); boxes.push([x - m, y - m, x + m, y + m]); }
    const hit = (b) => boxes.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    const rank = ({it}) => (it.p.id === st.port ? 0 : it.p.id === selected ? 1 : it.kind === 'main' ? 2 : it.kind ? 3 : 4);
    items.sort((a, b) => rank(a) - rank(b));
    for (const {it, pos} of items) {
      if (!it.label) continue;
      const w = it.w * k, h = 20 * k, g = 17 * k, [x, y] = pos;
      const cands = [['b', [x - w / 2, y + g, x + w / 2, y + g + h]], ['a', [x - w / 2, y - g - h, x + w / 2, y - g]],
        ['r', [x + g, y - h / 2, x + g + w, y + h / 2]], ['l', [x - g - w, y - h / 2, x - g, y + h / 2]]];
      const force = it.p.id === st.port || it.p.id === selected;
      let pick = cands.find(([, b]) => !hit(b));
      if (!pick && force) pick = cands[0];
      it.label.className = 'wr-pin-label ' + (pick ? pick[0] : 'h');
      if (pick) boxes.push(pick[1]);
    }
  }

  // pins shrink a little when the whole chart is in view, so the Danish waters stay legible
  const pinK = () => Math.min(1, Math.max(0.55, 0.45 + v.cam.s * 0.6));
  function update() {
    const k0 = pinK().toFixed(3);
    for (const k in pinEls) {
      const it = pinEls[k], [x, y] = v.toScreen(it.p.x, it.p.y);
      it.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${k0})`;
    }
    for (const s of seaEls) { const [x, y] = v.toScreen(s.x, s.y); s.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${k0})`; }
    if (Math.abs(v.cam.s - lastS) > 1e-4) { lastS = v.cam.s; declutter(); }
    drawOverlay();
  }
  v.onUpdate(update);

  function routeLine(from, to, cls) {
    const info = pathInfo(from, to);
    if (info.points.length < 2) return '';
    const pts = info.points.map(([x, y]) => v.toScreen(x, y).map((n) => n.toFixed(1)).join(',')).join(' ');
    return cls === 'easy'
      ? `<polyline points="${pts}" fill="none" stroke="#e8bd4a" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" opacity=".9"/>`
      : `<polyline points="${pts}" fill="none" stroke="#2a1a0e" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round" opacity=".35"/>
<polyline points="${pts}" fill="none" stroke="#f0c75a" stroke-width="3" stroke-dasharray="9 6" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  let easyTarget = null;
  function drawOverlay() {
    const cur = S().port;
    let s = '';
    if (easyTarget && cur && easyTarget !== cur && easyTarget !== selected) s += routeLine(cur, easyTarget, 'easy');
    if (selected && cur && selected !== cur) s += routeLine(cur, selected, 'sel');
    v.ov.innerHTML = s;
  }

  function select(id) {
    selected = id;
    for (const k in pinEls) pinEls[k].el.classList.toggle('sel', k === id);
    const old = v.ui.querySelector('.wr-card');
    if (old) old.remove();
    v.inset.r = v.inset.b = 0;
    lastS = -1;
    const p = id && ports.find((x) => x.id === id);
    if (!p) { v.apply(); return; }
    const c = card(p);
    v.ui.appendChild(c);
    if (v.size()[0] > v.size()[1] * 1.1) v.inset.r = c.offsetWidth + 12; else v.inset.b = c.offsetHeight + 12;
    v.apply();
    // keep the port visible beside (landscape) or above (portrait) the card
    const [w, h] = v.size(), [sx, sy] = v.toScreen(p.x, p.y), land = w > h * 1.1;
    const freeW = w - v.inset.r, freeH = h - v.inset.b;
    if (sx < 40 || sx > freeW - 40 || sy < 70 || sy > freeH - 30) {
      v.flyTo(p.x + (w / 2 - freeW / 2) / v.cam.s, p.y + (h / 2 - freeH / 2 - (land ? 0 : 12)) / v.cam.s);
    }
  }

  function card(p) {
    const st = S(), cur = st.port, locked = isLocked(st, p.id, D), q = questMarks(D, opts.markers);
    const el = document.createElement('div');
    el.className = 'wr-card';
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => e.stopPropagation());
    el.addEventListener('wheel', (e) => e.stopPropagation());
    const name = locked ? 'Unknown waters' : p.name;
    let body = '';
    if (locked) {
      body += `<p>No one you know has traded here yet. A jarl's favour may open the way.</p>`;
    } else {
      if (p.blurb) body += `<p>${esc(p.blurb)}</p>`;
      if (p.buildings.length) body += `<h3>In town</h3><div class="wr-chips">${p.buildings.map((b) => `<span class="wr-chip">${buildingIcon(b, 20)}${esc(BUILDING_NAMES[b] || b)}</span>`).join('')}</div>`;
      const seen = st.seen && st.seen[p.id], prices = seen && seen.prices ? seen.prices : null;
      const tags = (g) => (p.produces.includes(g) ? '<span class="wr-tag loc">local</span>' : '')
        + (p.demands.includes(g) ? '<span class="wr-tag want">wanted</span>' : '')
        + (p.contraband.includes(g) ? '<span class="wr-tag bad">contraband</span>' : '');
      if (prices && Object.keys(prices).length) {
        const ago = Number.isFinite(seen.day) && Number.isFinite(st.day) ? st.day - seen.day : null;
        body += `<h3>Prices last seen</h3><p style="font-size:13.5px;font-style:italic;margin:0 0 3px">${ago === null ? '' : ago <= 0 ? 'Today.' : ago === 1 ? 'Yesterday.' : `${ago} days ago.`}</p>`;
        body += `<table class="wr-goods">${Object.entries(prices).filter(([, v2]) => v2 != null).map(([g, pr]) => `<tr><td>${esc(goodName(D, g))}${tags(g)}</td><td class="p">${silver(pr)}</td></tr>`).join('')}</table>`;
      } else if (p.produces.length || p.demands.length) {
        body += `<h3>Goods</h3><p style="font-size:13.5px;font-style:italic;margin:0 0 3px">Prices unknown until you have been there.</p>`;
        const all = [...new Set([...p.produces, ...p.demands])];
        body += `<table class="wr-goods">${all.map((g) => `<tr><td>${esc(goodName(D, g))}${tags(g)}</td><td class="p">?</td></tr>`).join('')}</table>`;
      }
    }
    const mk = locked ? [] : q.ports[p.id] || [];
    if (mk.length) {
      body += `<h3>Tasks</h3>` + mk.map((m) => `<div class="wr-q">${questBadge(m.kind, 16)}<span>${m.kind === 'main' ? 'Saga task' : 'Side task'}${m.building ? ` at the ${esc((BUILDING_NAMES[m.building] || m.building).toLowerCase())}` : ''}</span></div>`).join('');
    }
    let why = '', can = !!onSail;
    if (cur && p.id !== cur) {
      const info = pathInfo(cur, p.id), days = travelDays(D, cur, p.id);
      // short river legs at either end are just the way up a fjord or into a harbour
      const near = (i, end) => Math.hypot(info.points[i][0] - end[0], info.points[i][1] - end[1]) < 30;
      const a0 = info.points[0], z0 = info.points[info.points.length - 1];
      const mid = info.kinds.filter((k, i) => !(k === 'river' && ((near(i, a0) && near(i + 1, a0)) || (near(i, z0) && near(i + 1, z0)))));
      const via = mid.includes('portage') ? 'by sea, river and portage' : mid.includes('river') ? 'by sea and river' : 'by sea';
      body += `<h3>Voyage</h3><p>About <b>${days} day${days === 1 ? '' : 's'}</b> ${via}.</p>`;
    }
    const simWhy = cur && p.id !== cur && D.voyage && typeof D.voyage.canSail === 'function' ? tryCall(D.voyage.canSail, p.id) : null;
    if (!cur) { can = false; why = 'You are at sea.'; } else if (p.id === cur) { can = false; why = 'Your fleet is moored here.'; } else if (locked) { can = false; why = 'Not yet unlocked.'; } else if (overloaded(D)) { can = false; why = 'Your fleet is overloaded. Sell or store some cargo.'; } else if (typeof simWhy === 'string' && simWhy) { can = false; why = simWhy; }
    el.innerHTML = `<div class="wr-card-head">${portMedallion(p.culture, {locked, current: p.id === cur, size: 44})}<div><h2>${esc(name)}</h2>${locked ? '' : `<div class="cult">${esc(CULTURE_NAMES[p.culture] || '')} ${p.id === cur ? 'port, your mooring' : 'port'}</div>`}</div>
<button class="wr-mbtn x" aria-label="Close">${svgIcon.close}</button></div><div class="wr-card-body">${body}</div>
<div class="wr-card-foot"><span class="why">${esc(why)}</span><button class="wr-mbtn wr-sail" ${can ? '' : 'disabled'}>Sail</button></div>`;
    el.querySelector('.x').addEventListener('click', () => select(null));
    el.querySelector('.wr-sail').addEventListener('click', () => { if (can && onSail) onSail(p.id); });
    return el;
  }

  const ctl = {
    ready: null,
    close() { if (closed) return; closed = true; v.destroy(); v.el.remove(); },
    refresh() { ports = portList(D); build(); if (selected) select(selected); },
    select: (id) => select(id),
    view: v,
  };
  // first paint immediately with fallbacks, then again when the game modules arrive
  ports = portList(D);
  const start = () => {
    const p = ports.find((x) => x.id === (opts.focus || S().port)) || ports[0];
    v.centerOn(p.x, p.y, v.limits().sCover * 1.05);
  };
  start();
  build();
  ctl.ready = loadDeps().then((deps) => {
    if (closed) return ctl;
    D = deps;
    ports = portList(D);
    start();
    build();
    const st = S(), q = questMarks(D, opts.markers);
    if (st.easy && st.port) {
      const mains = Object.keys(q.ports).filter((id) => q.top(q.ports[id]) === 'main' && id !== st.port);
      mains.sort((a, b) => distance(st.port, a) - distance(st.port, b));
      easyTarget = mains[0] || null;
      drawOverlay();
    }
    if (opts.focus && opts.focus !== st.port) select(opts.focus);
    return ctl;
  });
  return ctl;
}

// ------------------------------------------------------------------ playVoyage
let voyageSpeed = 1;
try { voyageSpeed = +localStorage.getItem('wr-voyage-speed') === 3 ? 3 : 1; } catch (e) { /* storage blocked */ }

/**
 * Animates the fleet along the sea lanes from `from` to `to` over `days` days.
 * onEvent(day) is called once for each day 1..days, at mid-day; if it returns a promise
 * the voyage waits for it. A promise that resolves to false or {stop:true} ends the
 * voyage without onArrive. Returns {done: Promise<'arrived'|'stopped'>, stop(), setSpeed(1|3)}.
 */
export function playVoyage(root, {from, to, days, onEvent, onArrive} = {}) {
  let stopped = false, resolveDone;
  const done = new Promise((r) => { resolveDone = r; });
  const ctl = {done, stop() { stopped = true; }, setSpeed(n) { voyageSpeed = n === 3 ? 3 : 1; }};
  const v = makeView(root);
  v.el.classList.add('moving');
  loadDeps().then((D) => run(D)).catch(() => run({}));

  function run(D) {
    const ports = portList(D), P = Object.fromEntries(ports.map((p) => [p.id, p]));
    const pf = P[from], pt = P[to];
    const info = pathInfo(from, to);
    let pts = info.points, kinds = info.kinds;
    if (pts.length < 2) { pts = [[pf ? pf.x : 500, pf ? pf.y : 380], [pt ? pt.x : 500, pt ? pt.y : 380]]; kinds = ['sea']; }
    const total = Math.max(1, Math.round(days || travelDays(D, from, to)));
    // weighted lengths: river and portage legs take longer per unit
    const segW = [], cum = [0];
    for (let i = 1; i < pts.length; i++) {
      const len = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      segW.push(len * (COST[kinds[i - 1]] || 1));
      cum.push(cum[i - 1] + segW[i - 1]);
    }
    const W = cum[cum.length - 1] || 1;
    const at = (u) => {
      const w = Math.min(1, Math.max(0, u)) * W;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < w) i++;
      const t = segW[i - 1] ? (w - cum[i - 1]) / segW[i - 1] : 1;
      const a = pts[i - 1], b = pts[i];
      return {x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, i, dx: b[0] - a[0]};
    };

    // pins for both ends
    for (const p of [pf, pt]) {
      if (!p) continue;
      const b = document.createElement('div');
      b.className = 'wr-pin' + (p === pt ? ' sel' : '');
      b.style.pointerEvents = 'none';
      b.innerHTML = portMedallion(p.culture, {size: 32}) + `<span class="wr-pin-label b">${esc(p.name)}</span>`;
      v.pins.appendChild(b);
      v.onUpdate(() => { const [x, y] = v.toScreen(p.x, p.y); b.style.transform = `translate(${x}px,${y}px)`; });
    }
    const ship = document.createElement('div');
    ship.className = 'wr-voy-ship';
    const S = stateOf(D), type = (S.fleet && S.fleet[0] && S.fleet[0].type) || 'knarr';
    let art = null;
    if (D.ships && typeof D.ships.shipSVG === 'function') art = tryCall(D.ships.shipSVG, type, {w: 64, sail: '#8e2a22', shields: true, water: false});
    ship.innerHTML = `<div>${typeof art === 'string' && art.includes('<svg') ? art : `<svg viewBox="-30 -30 60 44">${longshipPaths()}</svg>`}</div>`;
    v.pins.appendChild(ship);

    const hud = document.createElement('div');
    hud.className = 'wr-voy-hud';
    hud.innerHTML = `<b>Day 1 of ${total}</b><span>Bound for ${esc(pt ? pt.name : to)}</span><i><u></u></i>`;
    const speedBtn = document.createElement('button');
    speedBtn.className = 'wr-mbtn wr-voy-speed';
    speedBtn.setAttribute('aria-label', 'Sailing speed');
    const showSpeed = () => { speedBtn.textContent = voyageSpeed === 3 ? '3×' : '1×'; };
    showSpeed();
    speedBtn.addEventListener('click', () => {
      voyageSpeed = voyageSpeed === 3 ? 1 : 3;
      try { localStorage.setItem('wr-voyage-speed', String(voyageSpeed)); } catch (e) { /* ignore */ }
      showSpeed();
    });
    v.ui.append(hud, speedBtn);

    // camera: a fixed zoom that keeps the coast readable; follow the ship
    const [w, h] = v.size(), L = v.limits();
    const s = Math.max(L.sMin, Math.min(2.2, Math.max(L.sCover, Math.min(w, h) / 420)));
    let xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const fits = bw * s < w - 120 && bh * s < h - 160;
    const camC = fits ? [(Math.max(...xs) + Math.min(...xs)) / 2, (Math.max(...ys) + Math.min(...ys)) / 2] : [pts[0][0], pts[0][1]];
    v.centerOn(camC[0], camC[1], s);
    xs = ys = null;

    const MS_PER_DAY = 900;
    let dayPos = 0, nextEvent = 1, paused = false, last = performance.now(), finished = false;
    const trail = [];
    function draw() {
      const u = dayPos / total, p = at(u);
      if (!fits) {
        const [vw, vh] = v.size(), [cx, cy] = v.toMap(vw / 2, vh / 2);
        camC[0] = cx + (p.x - cx) * 0.08;
        camC[1] = cy + (p.y - cy) * 0.08;
        v.centerOn(camC[0], camC[1], s);
      }
      const [sx, sy] = v.toScreen(p.x, p.y);
      ship.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`;
      ship.classList.toggle('flip', p.dx < -0.01);
      // full route faint, sailed part as a trail, fresh foam behind the ship
      const scr = (q) => v.toScreen(q[0], q[1]).map((n) => n.toFixed(1)).join(',');
      const sailed = pts.slice(0, p.i).map(scr).concat([`${sx.toFixed(1)},${sy.toFixed(1)}`]).join(' ');
      trail.push([p.x, p.y]);
      if (trail.length > 26) trail.shift();
      const foam = trail.map(scr).join(' ');
      v.ov.innerHTML = `<polyline points="${pts.map(scr).join(' ')}" fill="none" stroke="#2a1a0e" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" opacity=".55"/>
<polyline points="${sailed}" fill="none" stroke="#8e2a22" stroke-width="2.6" stroke-dasharray="7 5" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
<polyline points="${foam}" fill="none" stroke="#f8f4ea" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>`;
      const day = Math.min(total, Math.floor(dayPos) + 1);
      const dl = dateLabel(D, (S.day || 1) + day - 1);
      hud.querySelector('b').textContent = `Day ${day} of ${total}`;
      hud.querySelector('span').textContent = `Bound for ${pt ? pt.name : to}${dl ? ' · ' + dl : ''}`;
      hud.querySelector('u').style.width = `${Math.min(100, u * 100).toFixed(1)}%`;
    }
    function finish(result) {
      finished = true;
      resolveDone(result);
      if (result === 'arrived' && onArrive) setTimeout(() => onArrive(), 450);
    }
    function frame(t) {
      if (stopped) { finish('stopped'); return; }
      const dt = Math.min(100, t - last);
      last = t;
      if (!paused) {
        const target = nextEvent <= total ? nextEvent - 0.5 : total;
        dayPos = Math.min(target, dayPos + (dt / MS_PER_DAY) * voyageSpeed);
        if (nextEvent <= total && dayPos >= nextEvent - 0.5) {
          const d = nextEvent++;
          const r = onEvent ? tryCall(onEvent, d) : undefined;
          if (r && typeof r.then === 'function') {
            paused = true;
            r.then((res) => {
              paused = false;
              last = performance.now();
              if (res === false || (res && res.stop)) stopped = true;
            }, () => { paused = false; last = performance.now(); });
          } else if (r === false || (r && r.stop)) stopped = true;
        }
      }
      draw();
      if (dayPos >= total && !paused) { finish('arrived'); return; }
      requestAnimationFrame(frame);
    }
    draw();
    requestAnimationFrame((t) => { last = t; requestAnimationFrame(frame); });
  }
  return ctl;
}
