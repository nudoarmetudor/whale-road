// Small DOM helpers shared by every screen: element builder, formatting, toasts,
// confirm/prompt dialogs, sheets (bottom sheet on portrait, centred panel otherwise),
// steppers and tabs.
import {Au, A} from './adapters.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// h('div.cls#id', {attrs, onclick}, ...children)
export function h(tag, attrs, ...kids) {
  const m = tag.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement(m?.[1] || 'div');
  for (const part of (m?.[2] || '').match(/[.#][\w-]+/g) || []) {
    if (part[0] === '.') el.classList.add(part.slice(1)); else el.id = part.slice(1);
  }
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, kids);
  return el;
}
export const add = (el, ...kids) => { append(el, kids); return el; };
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export const svgEl = str => { const t = document.createElement('div'); t.innerHTML = str.trim(); return t.firstElementChild; };
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

export function num(n) {
  n = Math.round(Number(n) || 0);
  const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '−' : '') + s;
}
export const silver = n => num(n) + ' s';
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
export const sfx = name => { try { Au.Sfx?.play(name); } catch { /* audio not ready */ } };

export function portraitEl(id, opts = {}) {
  let svg = '';
  try { svg = A.portrait(id, {size: 256, ...opts}); } catch (err) { console.warn('portrait', id, err); }
  return h('div.portrait', {html: svg || '', 'aria-hidden': 'true'});
}

// ------------------------------------------------------------------ layers
let layers = null;
export function initLayers(root) {
  root.innerHTML = '';
  layers = {
    stage: h('div#stage'),
    sheets: h('div#sheets'),
    dialog: h('div#dialog-layer'),
    modal: h('div#modal-layer'),
    toasts: h('div#toasts', {'aria-live': 'polite'}),
  };
  Object.values(layers).forEach(l => root.appendChild(l));
  return layers;
}
export const L = () => layers;

// ------------------------------------------------------------------ toasts
export function toast(msg, kind = '') {
  if (!msg) return;
  const t = h('div.toast' + (kind ? '.' + kind : ''), msg);
  layers.toasts.appendChild(t);
  while (layers.toasts.children.length > 3) layers.toasts.firstChild.remove();
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}
// Show a sim result's failure message (or a success line) as a toast.
export function result(r, okMsg, okSfx = 'click') {
  if (!r || r.ok === false) { sfx('error'); toast(r?.msg || 'That did not work', 'bad'); return false; }
  if (okSfx) sfx(okSfx);
  if (okMsg) toast(okMsg, 'good');
  return true;
}

// ------------------------------------------------------------------ modal dialogs
export function modal(content, {cls = '', dismiss = true} = {}) {
  return new Promise(resolve => {
    const box = h('div.modal.frame' + (cls ? '.' + cls : ''), {role: 'dialog', 'aria-modal': 'true'});
    const back = h('div.modal-back', box);
    const close = v => { back.remove(); document.removeEventListener('keydown', key, true); resolve(v); };
    const key = e => { if (e.key === 'Escape' && dismiss) { e.stopPropagation(); close(null); } };
    document.addEventListener('keydown', key, true);
    if (dismiss) back.addEventListener('click', e => { if (e.target === back) close(null); });
    box.appendChild(content(close));
    layers.modal.appendChild(back);
    (box.querySelector('[autofocus]') || box.querySelector('button'))?.focus();
  });
}
export function confirmDlg(text, {yes = 'Yes', no = 'No', title = '', danger = false} = {}) {
  return modal(close => h('div.parch',
    title && h('h3', title),
    h('p', text),
    h('div.btn-row',
      h('button.btn.ghost', {onclick: () => close(false)}, no),
      h('button.btn' + (danger ? '.danger' : ''), {onclick: () => close(true), autofocus: true}, yes)),
  )).then(v => !!v);
}
export function promptDlg(text, value = '', {ok = 'OK', max = 24} = {}) {
  return modal(close => {
    const inp = h('input.text', {value, maxlength: max, autofocus: true, 'aria-label': text});
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') close(inp.value.trim()); });
    return h('div.parch', h('p', text), inp,
      h('div.btn-row', h('button.btn.ghost', {onclick: () => close(null)}, 'Cancel'), h('button.btn', {onclick: () => close(inp.value.trim())}, ok)));
  });
}
export function alertDlg(text, {title = '', ok = 'OK'} = {}) {
  return modal(close => h('div.parch', title && h('h3', title), typeof text === 'string' ? h('p', text) : text,
    h('div.btn-row', h('button.btn', {onclick: () => close(true)}, ok))));
}

// ------------------------------------------------------------------ sheets
// Opens a carved-wood sheet. `build(body, api)` fills it; api.refresh() rebuilds.
const openSheets = [];
export function sheet({title, portrait, greeting, cls = '', build, onClose, wide = false}) {
  const body = h('div.sheet-body');
  let api = null;
  const head = h('header.sheet-head',
    portrait ? portraitEl(portrait) : null,
    h('div.sheet-title', h('h2', title), greeting ? h('p.greet', greeting) : null),
    h('button.icon-btn.close', {onclick: () => { sfx('page'); api.close(); }, 'aria-label': 'Close', title: 'Close (Esc)'}, '✕'));
  const el = h('section.sheet.frame' + (wide ? '.wide' : '') + (cls ? '.' + cls : ''), {role: 'dialog', 'aria-label': title}, head, body);
  const wrap = h('div.sheet-wrap', h('div.sheet-back', {onclick: () => api.close()}), el);
  api = {
    el, body, closed: false,
    close() {
      if (api.closed) return; api.closed = true;
      const i = openSheets.indexOf(api); if (i >= 0) openSheets.splice(i, 1);
      wrap.classList.add('closing');
      setTimeout(() => wrap.remove(), 160);
      onClose?.();
    },
    refresh() { const st = body.scrollTop; body.innerHTML = ''; build(body, api); body.scrollTop = st; },
    setGreeting(t) { const g = head.querySelector('.greet'); if (g) g.textContent = t; },
  };
  build(body, api);
  layers.sheets.appendChild(wrap);
  openSheets.push(api);
  sfx('page');
  return api;
}
export const topSheet = () => openSheets[openSheets.length - 1];
export function closeAllSheets() { while (openSheets.length) openSheets[openSheets.length - 1].close(); }
export const sheetsOpen = () => openSheets.length;

// ------------------------------------------------------------------ widgets
// Quantity stepper. get/set qty; onChange(qty). max() is evaluated live.
export function stepper({value = 0, min = 0, max = () => 999, onChange, label = 'Quantity'}) {
  let v = value;
  const inp = h('input.qty', {type: 'text', inputmode: 'numeric', value: String(v), 'aria-label': label});
  const set = nv => { v = clamp(Math.round(Number(nv) || 0), min, Math.max(min, max())); inp.value = String(v); onChange?.(v); };
  const rep = (d) => {
    let t, i = 0;
    const go = () => { set(v + d * (i > 10 ? 10 : 1)); i++; t = setTimeout(go, i === 1 ? 380 : 70); };
    return {
      onpointerdown: e => { e.preventDefault(); go(); sfx('click'); },
      onpointerup: () => clearTimeout(t), onpointerleave: () => clearTimeout(t), onpointercancel: () => clearTimeout(t),
      onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(v + d); } },
    };
  };
  inp.addEventListener('change', () => set(inp.value));
  inp.addEventListener('focus', () => inp.select());
  const el = h('div.stepper',
    h('button.step', {...rep(-1), 'aria-label': 'Less', type: 'button'}, '−'), inp,
    h('button.step', {...rep(1), 'aria-label': 'More', type: 'button'}, '+'));
  return {el, get: () => v, set};
}
export function tabs(list, current, onPick) {
  return h('div.tabs', {role: 'tablist'}, list.map(([id, label]) =>
    h('button.tab' + (id === current ? '.on' : ''), {role: 'tab', 'aria-selected': String(id === current), onclick: () => { sfx('page'); onPick(id); }}, label)));
}
export function meter(frac, label, cls = '') {
  const f = clamp(frac || 0, 0, 1);
  return h('div.meter' + (cls ? '.' + cls : '') + (f > 0.999 ? '.full' : ''), {role: 'meter', 'aria-valuenow': Math.round(f * 100), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label || ''},
    h('i', {style: {width: (f * 100).toFixed(1) + '%'}}), label ? h('span', label) : null);
}
export function empty(text) { return h('p.empty', text); }
