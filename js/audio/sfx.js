// Whale Road: procedural sound effects. Short, soft-edged, never shrill.
//
//   Sfx.play(name)      'coin','click','sail','wave','arrow','hit','ram','splash','thunder',
//                       'heal','horn','sink','buy','sell','quest','levelup','error','page'
//   Sfx.setVolume(0..1)
//
// Shares the AudioContext created by Music.init(); if init() has not run yet, play()
// calls it (play is normally triggered by a tap, which is a valid gesture on iOS).

import * as I from './instruments.js';
import {init as musicInit, _bus, _setSfxVolume} from './music.js';

const R = Math.random;
const {mtof} = I;

function osc(ctx, type, f) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; return o; }
function filt(ctx, type, f, Q = 0.7) { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = Q; return n; }
function noise(ctx, kind = 'white') { const s = ctx.createBufferSource(); s.buffer = I.noise(ctx, kind); s.loop = true; return s; }
function nstart(src, t, stop) { src.start(t, R() * 2); src.stop(stop); }
/** quick percussive envelope */
function perc(g, t, peak, att, dec) {
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + att);
  g.gain.setTargetAtTime(0, t + att, dec);
}
/** filtered noise burst */
function burst(ctx, out, t, {kind = 'white', type = 'bandpass', f = 1000, f2, Q = 1, peak = 0.5, att = 0.005, dec = 0.05, len}) {
  const n = noise(ctx, kind), fl = filt(ctx, type, f, Q), g = ctx.createGain();
  if (f2) { fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(f2, t + (len || dec * 4)); }
  perc(g, t, peak, att, dec);
  n.connect(fl); fl.connect(g); g.connect(out);
  nstart(n, t, t + (len || dec * 6) + 0.1);
}
/** sine with pitch glide and percussive envelope */
function tone(ctx, out, t, {type = 'sine', f, f2, glide = 0.1, peak = 0.4, att = 0.004, dec = 0.1, len}) {
  const o = osc(ctx, type, f), g = ctx.createGain();
  if (f2) { o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + glide); }
  perc(g, t, peak, att, dec);
  o.connect(g); g.connect(out);
  o.start(t); o.stop(t + (len || dec * 7) + 0.05);
}
/** metallic clink: inharmonic partials (silver coins) */
function clink(ctx, out, t, f, vel = 1) {
  [[1, 1, 0.09], [2.41, 0.6, 0.06], [3.9, 0.35, 0.045], [6.3, 0.18, 0.03]].forEach(([r, a, d]) =>
    tone(ctx, out, t, {f: f * r, peak: 0.16 * a * vel, att: 0.0015, dec: d}));
  burst(ctx, out, t, {type: 'highpass', f: 6000, peak: 0.06 * vel, att: 0.001, dec: 0.006});
}

const SFX = {
  coin(ctx, o, t) {
    clink(ctx, o.out, t, 2350, 1);
    clink(ctx, o.out, t + 0.075, 2620, 0.75);
    clink(ctx, o.out, t + 0.16, 2480, 0.4);
    clink(ctx, o.wet, t, 2350, 0.4);
  },
  click(ctx, o, t) { // soft wooden tick
    burst(ctx, o.out, t, {f: 1500, Q: 4, peak: 0.35, att: 0.001, dec: 0.012});
    tone(ctx, o.out, t, {type: 'triangle', f: 880, f2: 620, glide: 0.03, peak: 0.12, att: 0.001, dec: 0.015});
  },
  page(ctx, o, t) { // parchment turned
    const n = noise(ctx), bp = filt(ctx, 'bandpass', 2200, 0.9), g = ctx.createGain(), am = osc(ctx, 'square', 38), amg = I.gainNode(ctx, 0.05);
    bp.frequency.setValueAtTime(1500, t); bp.frequency.linearRampToValueAtTime(3800, t + 0.28);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.08); g.gain.linearRampToValueAtTime(0.06, t + 0.2); g.gain.linearRampToValueAtTime(0, t + 0.34);
    am.connect(amg); amg.connect(g.gain);
    n.connect(bp); bp.connect(g); g.connect(o.out); nstart(n, t, t + 0.4); am.start(t); am.stop(t + 0.4);
    burst(ctx, o.out, t + 0.3, {f: 900, Q: 1, peak: 0.08, dec: 0.02});
  },
  sail(ctx, o, t) { // canvas fills with wind: whoosh plus two flaps
    burst(ctx, o.out, t, {kind: 'pink', f: 350, f2: 1300, Q: 1.4, peak: 0.35, att: 0.25, dec: 0.25, len: 0.7});
    [0.32, 0.5].forEach((d, i) => burst(ctx, o.out, t + d, {kind: 'brown', type: 'lowpass', f: 400, peak: 0.55 - i * 0.2, att: 0.004, dec: 0.05}));
    burst(ctx, o.wet, t, {kind: 'pink', f: 600, peak: 0.12, att: 0.3, dec: 0.3, len: 0.8});
  },
  wave(ctx, o, t) {
    const n = noise(ctx, 'brown'), lp = filt(ctx, 'lowpass', 400, 0.6), g = ctx.createGain();
    const w = noise(ctx, 'pink'), hp = filt(ctx, 'highpass', 2500), wg = ctx.createGain();
    lp.frequency.setValueAtTime(350, t); lp.frequency.linearRampToValueAtTime(1500, t + 0.7); lp.frequency.linearRampToValueAtTime(400, t + 1.8);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t + 0.7); g.gain.setTargetAtTime(0, t + 0.75, 0.35);
    wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(0.14, t + 0.8); wg.gain.setTargetAtTime(0, t + 0.85, 0.3);
    n.connect(lp); lp.connect(g); g.connect(o.out); w.connect(hp); hp.connect(wg); wg.connect(o.out);
    nstart(n, t, t + 2.6); nstart(w, t, t + 2.6);
  },
  arrow(ctx, o, t) { // bowstring twang, then a whistle through the air
    I.pluck(ctx, o.out, t, 45, 0.35, 'bass', 0.18);
    burst(ctx, o.out, t + 0.02, {f: 3800, f2: 900, Q: 3, peak: 0.25, att: 0.03, dec: 0.08, len: 0.32});
  },
  hit(ctx, o, t) { // timber struck
    tone(ctx, o.out, t, {f: 150, f2: 60, glide: 0.12, peak: 0.6, dec: 0.08});
    burst(ctx, o.out, t, {f: 1400, Q: 1.2, peak: 0.45, att: 0.001, dec: 0.03});
    burst(ctx, o.out, t + 0.03, {f: 3000, Q: 2, peak: 0.12, att: 0.001, dec: 0.02});
    burst(ctx, o.wet, t, {f: 900, peak: 0.2, dec: 0.05});
  },
  ram(ctx, o, t) { // heavy crunch of hulls and splintering planks
    tone(ctx, o.out, t, {f: 95, f2: 34, glide: 0.35, peak: 0.85, dec: 0.22});
    burst(ctx, o.out, t, {kind: 'brown', type: 'lowpass', f: 700, peak: 0.7, att: 0.003, dec: 0.14});
    for (let i = 0; i < 6; i++) burst(ctx, o.out, t + 0.03 + i * (0.035 + R() * 0.05), {f: 1200 + R() * 2200, Q: 2, peak: 0.25 * (1 - i / 7), att: 0.001, dec: 0.02});
    // creak
    const c = osc(ctx, 'sawtooth', 130), bp = filt(ctx, 'bandpass', 700, 6), g = ctx.createGain();
    c.frequency.setValueAtTime(140, t + 0.25); c.frequency.linearRampToValueAtTime(95, t + 0.75);
    g.gain.setValueAtTime(0, t + 0.25); g.gain.linearRampToValueAtTime(0.09, t + 0.35); g.gain.linearRampToValueAtTime(0, t + 0.8);
    c.connect(bp); bp.connect(g); g.connect(o.out); c.start(t + 0.25); c.stop(t + 0.85);
    burst(ctx, o.wet, t, {kind: 'brown', type: 'lowpass', f: 900, peak: 0.4, dec: 0.2});
  },
  splash(ctx, o, t) {
    burst(ctx, o.out, t, {kind: 'white', type: 'lowpass', f: 5000, f2: 500, Q: 0.8, peak: 0.45, att: 0.01, dec: 0.18, len: 0.7});
    burst(ctx, o.out, t, {kind: 'brown', type: 'lowpass', f: 300, peak: 0.5, att: 0.005, dec: 0.08});
    for (let i = 0; i < 5; i++) {
      const tt = t + 0.12 + R() * 0.45, f = 500 + R() * 700;
      tone(ctx, o.out, tt, {f, f2: f * 1.8, glide: 0.05, peak: 0.07, dec: 0.025});
    }
  },
  thunder(ctx, o, t) {
    I.thunder(ctx, o.out, t, 0.85);
    I.thunder(ctx, o.wet, t, 0.3);
  },
  heal(ctx, o, t) { // gentle rising chimes, major pentatonic
    [0, 4, 7, 9, 12, 16].forEach((s, i) => {
      I.pluck(ctx, o.out, t + i * 0.075, 72 + s, 0.22 - i * 0.015, 'kantele');
      I.pluck(ctx, o.wet, t + i * 0.075, 72 + s, 0.12, 'harp');
    });
    tone(ctx, o.wet, t + 0.3, {f: mtof(96), peak: 0.04, att: 0.15, dec: 0.4});
  },
  horn(ctx, o, t) {
    I.horn(ctx, o.out, t, 50, 0.35, 0.3, {bright: 4});
    I.horn(ctx, o.out, t + 0.42, 57, 0.9, 0.34, {bright: 4.5});
    I.horn(ctx, o.wet, t + 0.42, 57, 0.9, 0.2, {bright: 3});
  },
  sink(ctx, o, t) { // groaning timber and a long gurgle down
    const c = osc(ctx, 'sawtooth', 110), bp = filt(ctx, 'bandpass', 500, 5), g = ctx.createGain();
    c.frequency.setValueAtTime(115, t); c.frequency.exponentialRampToValueAtTime(55, t + 1.4);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.2); g.gain.linearRampToValueAtTime(0, t + 1.4);
    c.connect(bp); bp.connect(g); g.connect(o.out); c.start(t); c.stop(t + 1.5);
    burst(ctx, o.out, t + 0.1, {kind: 'brown', type: 'lowpass', f: 900, f2: 150, peak: 0.5, att: 0.2, dec: 0.5, len: 1.8});
    for (let i = 0; i < 12; i++) {
      const tt = t + 0.3 + i * 0.12 + R() * 0.08, f = 220 + R() * 300 - i * 12;
      tone(ctx, o.out, tt, {f, f2: f * 1.9, glide: 0.06, peak: 0.08 * (1 - i / 14), dec: 0.03});
    }
    burst(ctx, o.wet, t, {kind: 'brown', type: 'lowpass', f: 400, peak: 0.25, att: 0.3, dec: 0.5});
  },
  buy(ctx, o, t) { // coins dropped into the purse, then the purse closes
    clink(ctx, o.out, t, 2620, 0.9);
    clink(ctx, o.out, t + 0.07, 2350, 0.7);
    clink(ctx, o.out, t + 0.13, 2100, 0.5);
    burst(ctx, o.out, t + 0.2, {kind: 'brown', type: 'lowpass', f: 500, peak: 0.45, att: 0.003, dec: 0.04});
  },
  sell(ctx, o, t) { // coins counted out onto the table, bright and rising
    [2100, 2350, 2620, 2950].forEach((f, i) => clink(ctx, o.out, t + i * 0.065, f, 0.6 + i * 0.12));
    clink(ctx, o.wet, t + 0.2, 2950, 0.4);
  },
  quest(ctx, o, t) { // short harp motif, rising, with a soft bell
    [62, 66, 69, 74].forEach((m, i) => I.pluck(ctx, o.out, t + i * 0.11, m, 0.3, 'harp'));
    I.bell(ctx, o.wet, t + 0.33, 86, 0.25);
    I.bell(ctx, o.out, t + 0.33, 86, 0.12);
  },
  levelup(ctx, o, t) { // horn call over a harp flourish
    [55, 59, 62, 67, 71, 74, 79].forEach((m, i) => I.pluck(ctx, o.out, t + i * 0.055, m, 0.24, 'harp'));
    I.horn(ctx, o.out, t + 0.05, 55, 0.25, 0.22);
    I.horn(ctx, o.out, t + 0.33, 62, 0.25, 0.24);
    I.horn(ctx, o.out, t + 0.6, 67, 0.8, 0.28);
    I.horn(ctx, o.wet, t + 0.6, 67, 0.8, 0.2);
    burst(ctx, o.out, t + 0.6, {type: 'highpass', f: 6000, peak: 0.05, att: 0.2, dec: 0.3});
  },
  error(ctx, o, t) { // dull, low double knock; never a harsh buzzer
    [0, 0.13].forEach((d, i) => {
      const x = osc(ctx, 'square', i ? 155 : 185), lp = filt(ctx, 'lowpass', 700, 1), g = ctx.createGain();
      perc(g, t + d, 0.11, 0.005, 0.05);
      x.connect(lp); lp.connect(g); g.connect(o.out); x.start(t + d); x.stop(t + d + 0.35);
    });
  },
};

const last = {};
let volume = 0.8;

/** Play a named effect. Unknown names are ignored. */
export function play(name) {
  const fn = SFX[name];
  if (!fn) return;
  let bus = _bus();
  if (!bus) { try { musicInit(); } catch { /* no audio */ } bus = _bus(); }
  if (!bus) return;
  const ctx = bus.ctx;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  const now = ctx.currentTime;
  if (last[name] && now - last[name] < 0.035) return; // debounce double triggers
  last[name] = now;
  try { fn(ctx, bus, now + 0.01); } catch (e) { console.warn('sfx', name, e); }
}

export function setVolume(v) {
  volume = Math.min(1, Math.max(0, +v || 0));
  _setSfxVolume(0.8 * Math.pow(volume, 1.6));
}
setVolume(volume);

export const list = () => Object.keys(SFX);

/** Test helper: render one effect offline, resolves to an AudioBuffer. */
export async function _renderOffline(name, secs = 2.5, sampleRate = 44100) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OAC(2, Math.floor(secs * sampleRate), sampleRate);
  const {_Engine} = await import('./music.js');
  const e = new _Engine(ctx);
  e.sfxVol.gain.value = 0.8;
  SFX[name](ctx, {ctx, out: e.sfxBus, wet: e.sfxWet}, 0.02);
  return ctx.startRendering();
}
