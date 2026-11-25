// Whale Road: procedural instruments for the music and sound effects.
// Everything is synthesised with the Web Audio API; nothing is loaded from files.
// Each voice function takes (ctx, out, t, ...) so it works the same in a live
// AudioContext and in an OfflineAudioContext (used by the level tests).

const stores = new WeakMap();
function store(ctx) {
  let s = stores.get(ctx);
  if (!s) { s = {buf: new Map(), wave: new Map()}; stores.set(ctx, s); }
  return s;
}

export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Small seeded RNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const R = Math.random;

// ------------------------------------------------------------------ DSP helpers (offline, JS)

/** RBJ biquad applied in place to a Float32Array. type: lowpass|highpass|bandpass|peak */
export function biquad(data, type, f, Q, sr, gainDb = 0, from = 0, to = data.length, state) {
  const w = 2 * Math.PI * clamp(f, 10, sr * 0.45) / sr, cs = Math.cos(w), sn = Math.sin(w);
  const alpha = sn / (2 * Q), A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lowpass') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; }
  else if (type === 'highpass') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; }
  else if (type === 'bandpass') { b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cs; a2 = 1 - alpha; }
  else { b0 = 1 + alpha * A; b1 = -2 * cs; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cs; a2 = 1 - alpha / A; }
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  const st = state || {x1: 0, x2: 0, y1: 0, y2: 0};
  let {x1, x2, y1, y2} = st;
  for (let i = from; i < to; i++) {
    const x = data[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y; data[i] = y;
  }
  st.x1 = x1; st.x2 = x2; st.y1 = y1; st.y2 = y2;
  return st;
}

function normalize(data, peak = 0.9) {
  let m = 0;
  for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if (a > m) m = a; }
  if (m > 0) { const k = peak / m; for (let i = 0; i < data.length; i++) data[i] *= k; }
}
/** Crossfade the tail into the head so a buffer loops without a click. */
function loopify(data, n) {
  const L = data.length;
  for (let i = 0; i < n; i++) {
    const a = i / n;
    data[i] = data[i] * a + data[L - n + i] * (1 - a);
  }
  return data.subarray(0, L - n);
}
function makeBuf(ctx, chans, len, sr) {
  return ctx.createBuffer(chans, len, sr || ctx.sampleRate);
}

// ------------------------------------------------------------------ cached buffers

/** Looping noise: 'white' | 'pink' | 'brown'. */
export function noise(ctx, kind = 'white') {
  const s = store(ctx), key = 'n_' + kind;
  if (s.buf.has(key)) return s.buf.get(key);
  const sr = ctx.sampleRate, n = Math.floor(sr * 0.05), len = Math.floor(sr * 4) + n;
  const d = new Float32Array(len);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = R() * 2 - 1;
    if (kind === 'white') d[i] = w;
    else if (kind === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
    } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  }
  const out = loopify(d, n);
  normalize(out, 0.8);
  const buf = makeBuf(ctx, 1, out.length);
  buf.getChannelData(0).set(out);
  s.buf.set(key, buf);
  return buf;
}

/** Reverb impulse response: stereo decaying noise that darkens over time. */
export function impulse(ctx, secs = 2.6, bright = 0.9) {
  const s = store(ctx), key = 'ir_' + secs + '_' + bright;
  if (s.buf.has(key)) return s.buf.get(key);
  const sr = ctx.sampleRate, len = Math.floor(secs * sr), pre = Math.floor(0.012 * sr);
  const buf = makeBuf(ctx, 2, len);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const x = (i - pre) / (len - pre);
      const env = Math.exp(-x * 6.5) * (1 - x);
      const a = 0.04 + bright * 0.85 * Math.pow(1 - x, 1.6);
      lp += a * ((R() * 2 - 1) - lp);
      d[i] = lp * env;
    }
    // a few early reflections, different per side
    const taps = c ? [0.019, 0.031, 0.047, 0.067] : [0.023, 0.037, 0.053, 0.071];
    taps.forEach((tt, k) => { const i = Math.floor(tt * sr); if (i < len) d[i] += (0.5 - k * 0.09) * (c ? -1 : 1); });
  }
  s.buf.set(key, buf);
  return buf;
}

/** Karplus-Strong plucked string, rendered once per pitch and kind and cached. */
const KS = {
  lyre: {dur: 2.6, t60: 2.1, bright: 0.36, pick: 0.21, body: 230, lp: 4200, lvl: 1.0},
  harp: {dur: 3.2, t60: 2.9, bright: 0.3, pick: 0.33, body: 300, lp: 4500, lvl: 1.0},
  oud:  {dur: 1.9, t60: 1.25, bright: 0.7, pick: 0.12, body: 180, lp: 6000, lvl: 0.9},
  bass: {dur: 2.2, t60: 1.6, bright: 0.22, pick: 0.27, body: 110, lp: 1100, lvl: 1.1},
  kantele: {dur: 2.8, t60: 2.4, bright: 0.45, pick: 0.17, body: 400, lp: 5000, lvl: 0.9},
};
export function ksBuffer(ctx, midi, kind = 'lyre') {
  const s = store(ctx), P = KS[kind] || KS.lyre, key = 'ks_' + kind + '_' + midi;
  if (s.buf.has(key)) return s.buf.get(key);
  const sr = ctx.sampleRate, f = mtof(midi);
  const N = Math.max(4, Math.floor(sr / f - 0.5));
  const rate = f * (N + 0.5) / sr;
  const len = Math.floor(P.dur * sr);
  const out = new Float32Array(len);
  const rnd = rng(midi * 7919 + kind.length * 31);
  // excitation: filtered noise with a pick-position comb
  const exc = new Float32Array(N);
  let e = 0;
  for (let i = 0; i < N; i++) { e += P.bright * ((rnd() * 2 - 1) - e); exc[i] = e; }
  const M = Math.max(1, Math.round(N * P.pick));
  let mean = 0;
  for (let i = N - 1; i >= M; i--) exc[i] -= exc[i - M];
  for (let i = 0; i < N; i++) mean += exc[i];
  mean /= N;
  let mx = 0;
  for (let i = 0; i < N; i++) { exc[i] -= mean; mx = Math.max(mx, Math.abs(exc[i])); }
  for (let i = 0; i < N; i++) out[i] = exc[i] / (mx || 1);
  const t60 = P.t60 * clamp(Math.pow(262 / f, 0.35), 0.45, 1.8);
  const g = Math.pow(10, -3 * ((N + 0.5) / sr) / t60);
  out[N] = g * out[0];
  for (let n = N + 1; n < len; n++) out[n] = g * 0.5 * (out[n - N] + out[n - N - 1]);
  biquad(out, 'peak', P.body, 1.1, sr, 4);
  biquad(out, 'lowpass', P.lp, 0.6, sr);
  biquad(out, 'highpass', 55, 0.7, sr);
  const fade = Math.floor(0.03 * sr);
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  normalize(out, 0.9);
  const buf = makeBuf(ctx, 1, len);
  buf.getChannelData(0).set(out);
  const res = {buf, rate, lvl: P.lvl};
  s.buf.set(key, res);
  return res;
}

/** Fire crackle: sparse clicks and pops, loopable. */
export function crackleBuffer(ctx) {
  const s = store(ctx);
  if (s.buf.has('crackle')) return s.buf.get('crackle');
  const sr = 22050, len = sr * 5, d = new Float32Array(len);
  let t = 0;
  while (t < len - 400) {
    t += Math.floor(-Math.log(1 - R()) * sr / 9);
    const big = R() < 0.12, n = Math.floor((big ? 0.006 : 0.0015) * sr * (0.5 + R()));
    const a = (big ? 0.9 : 0.35) * Math.pow(R(), 1.5);
    for (let i = 0; i < n && t + i < len; i++) d[t + i] += (R() * 2 - 1) * a * Math.exp(-i / (n * 0.3));
  }
  biquad(d, 'highpass', 900, 0.7, sr);
  // a soft low roar of the fire underneath
  let lp = 0;
  for (let i = 0; i < len; i++) { lp += 0.01 * ((R() * 2 - 1) - lp); d[i] += lp * 0.9; }
  const out = loopify(d, 800);
  normalize(out, 0.8);
  const buf = makeBuf(ctx, 1, out.length, sr);
  buf.getChannelData(0).set(out);
  s.buf.set('crackle', buf);
  return buf;
}

/** Rain: hiss plus droplets, stereo, loopable. */
export function rainBuffer(ctx) {
  const s = store(ctx);
  if (s.buf.has('rain')) return s.buf.get('rain');
  const sr = 22050, len = sr * 4, n = 600;
  const buf = makeBuf(ctx, 2, len - n, sr);
  for (let c = 0; c < 2; c++) {
    const d = new Float32Array(len);
    for (let i = 0; i < len; i++) d[i] = (R() * 2 - 1) * 0.25;
    biquad(d, 'highpass', 1200, 0.6, sr); biquad(d, 'lowpass', 6500, 0.6, sr);
    let t = 0;
    while (t < len - 200) {
      t += Math.floor(-Math.log(1 - R()) * sr / 70);
      const f = 1800 + R() * 3500, a = 0.15 + R() * 0.35, m = Math.floor(sr * 0.012);
      for (let i = 0; i < m && t + i < len; i++) d[t + i] += Math.sin(2 * Math.PI * f * i / sr) * a * Math.exp(-i / (m * 0.25));
    }
    const out = loopify(d, n);
    normalize(out, 0.7);
    buf.getChannelData(c).set(out);
  }
  s.buf.set('rain', buf);
  return buf;
}

/** Distant crowd murmur: voiced pulse trains through moving vowel formants. */
export function murmurBuffer(ctx) {
  const s = store(ctx);
  if (s.buf.has('murmur')) return s.buf.get('murmur');
  const sr = 16000, len = sr * 9, n = 1600;
  const L = new Float32Array(len), Rr = new Float32Array(len);
  const vowels = [[730, 1090], [530, 1840], [270, 2290], [570, 840], [300, 870], [660, 1720], [490, 1350]];
  const voices = 9;
  for (let v = 0; v < voices; v++) {
    const f0base = (v % 3 === 0 ? 190 : 115) + R() * 40, pan = R();
    const src = new Float32Array(len);
    let ph = 0, t = Math.floor(R() * sr);
    // build syllable envelope and glottal source
    const env = new Float32Array(len);
    while (t < len) {
      if (R() < 0.18) { t += Math.floor(sr * (0.3 + R() * 0.9)); continue; }
      const sd = Math.floor(sr * (0.1 + R() * 0.18)), amp = 0.4 + R() * 0.6;
      for (let i = 0; i < sd && t + i < len; i++) env[t + i] = amp * Math.sin(Math.PI * i / sd);
      t += sd;
    }
    let f0 = f0base;
    for (let i = 0; i < len; i++) {
      if (i % 400 === 0) f0 = f0base * (0.85 + R() * 0.3);
      ph += f0 / sr;
      const pulse = ph >= 1 ? 1 : 0;
      if (ph >= 1) ph -= 1;
      src[i] = (pulse * 2 + (R() * 2 - 1) * 0.15) * env[i];
    }
    // formant filtering, coefficients change per syllable chunk
    const a = new Float32Array(src), b = new Float32Array(src);
    let s1, s2;
    const chunk = Math.floor(sr * 0.12);
    for (let i = 0; i < len; i += chunk) {
      const [F1, F2] = vowels[Math.floor(R() * vowels.length)];
      s1 = biquad(a, 'bandpass', F1, 5, sr, 0, i, Math.min(len, i + chunk), s1);
      s2 = biquad(b, 'bandpass', F2, 7, sr, 0, i, Math.min(len, i + chunk), s2);
    }
    for (let i = 0; i < len; i++) { const x = a[i] + b[i] * 0.6; L[i] += x * (1 - pan); Rr[i] += x * pan; }
  }
  const buf = makeBuf(ctx, 2, len - n, sr);
  [L, Rr].forEach((d, c) => {
    biquad(d, 'lowpass', 2200, 0.7, sr);
    biquad(d, 'highpass', 120, 0.7, sr);
    const out = loopify(d, n);
    normalize(out, 0.8);
    buf.getChannelData(c).set(out);
  });
  s.buf.set('murmur', buf);
  return buf;
}

function periodic(ctx, name, harm) {
  const s = store(ctx);
  if (s.wave.has(name)) return s.wave.get(name);
  const real = new Float32Array(harm.length + 1), imag = new Float32Array(harm.length + 1);
  harm.forEach((h, i) => { imag[i + 1] = h; });
  const w = ctx.createPeriodicWave(real, imag);
  s.wave.set(name, w);
  return w;
}

// ------------------------------------------------------------------ node helpers

export function gainNode(ctx, v = 1) { const g = ctx.createGain(); g.gain.value = v; return g; }
export function panNode(ctx, p = 0) {
  if (ctx.createStereoPanner) { const n = ctx.createStereoPanner(); n.pan.value = p; return n; }
  return ctx.createGain();
}
function filt(ctx, type, f, Q = 0.7) {
  const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = Q; return n;
}
function osc(ctx, type, f) {
  const o = ctx.createOscillator();
  if (typeof type === 'string') o.type = type; else o.setPeriodicWave(type);
  o.frequency.value = f;
  return o;
}
function noiseSrc(ctx, kind = 'white', loop = true) {
  const s = ctx.createBufferSource();
  s.buffer = noise(ctx, kind); s.loop = loop;
  return s;
}
function startNoise(src, t, stop) {
  src.start(t, R() * (src.buffer.duration - 0.5));
  if (stop) src.stop(stop);
}
/** attack-hold-release envelope on a GainNode */
function env(g, t, peak, att, holdEnd, rel) {
  const p = g.gain;
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + att);
  if (holdEnd > t + att) p.setValueAtTime(peak, holdEnd);
  p.setTargetAtTime(0, Math.max(holdEnd, t + att), rel / 3);
}

// ------------------------------------------------------------------ melodic voices

/** Plucked string (lyre, harp, oud, bass, kantele). Returns end time. */
export function pluck(ctx, out, t, midi, vel, kind = 'lyre', maxDur = 0) {
  const {buf, rate, lvl} = ksBuffer(ctx, midi, kind);
  const src = ctx.createBufferSource();
  src.buffer = buf; src.playbackRate.value = rate;
  const g = gainNode(ctx, vel * lvl);
  src.connect(g); g.connect(out);
  src.start(t);
  let end = t + buf.duration / rate;
  if (maxDur && t + maxDur < end) {
    g.gain.setValueAtTime(vel * lvl, t + maxDur);
    g.gain.setTargetAtTime(0, t + maxDur, 0.07);
    end = t + maxDur + 0.4;
    src.stop(end);
  }
  return end;
}

/** Bone flute: soft periodic wave, breath noise, delayed vibrato. */
export function flute(ctx, out, t, midi, dur, vel, o = {}) {
  const f = mtof(midi), rel = 0.14, end = t + dur + rel * 2.5;
  const o1 = osc(ctx, periodic(ctx, 'flute', [1, 0.2, 0.07, 0.025, 0.01]), f);
  o1.detune.setValueAtTime(o.scoop ?? -22, t);
  o1.detune.linearRampToValueAtTime(0, t + 0.07);
  const g = ctx.createGain();
  const att = o.att ?? 0.05;
  env(g, t, vel, att, t + dur, rel);
  if (dur > 0.45 && o.vib !== 0) {
    const lfo = osc(ctx, 'sine', 4.6 + R() * 0.8), lg = gainNode(ctx, 0);
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(0, t + Math.min(0.28, dur * 0.4));
    lg.gain.linearRampToValueAtTime(o.vib ?? 13, t + Math.min(0.7, dur * 0.8));
    lfo.connect(lg); lg.connect(o1.detune);
    lfo.start(t); lfo.stop(end);
  }
  // breath: chiff at the start, a little air under the tone
  const n = noiseSrc(ctx, 'white'), bp = filt(ctx, 'bandpass', Math.min(f * 2.2, 6000), 1.1), ng = ctx.createGain();
  const air = vel * (o.air ?? 0.09);
  ng.gain.setValueAtTime(0, t);
  ng.gain.linearRampToValueAtTime(air * 3, t + 0.02);
  ng.gain.setTargetAtTime(air, t + 0.03, 0.05);
  ng.gain.setValueAtTime(air, t + dur);
  ng.gain.setTargetAtTime(0, t + dur, rel / 3);
  n.connect(bp); bp.connect(ng); ng.connect(out);
  o1.connect(g); g.connect(out);
  o1.start(t); o1.stop(end); startNoise(n, t, end);
  return end;
}

/** Lur (long bronze horn): two saws through an opening lowpass, pitch scoops up. */
export function horn(ctx, out, t, midi, dur, vel, o = {}) {
  const f = mtof(midi), rel = o.rel ?? 0.28, end = t + dur + rel * 2.5;
  const lp = filt(ctx, 'lowpass', f * 1.2, 1.4);
  const top = Math.min(f * (o.bright ?? 5), 4200);
  lp.frequency.setValueAtTime(f * 1.1, t);
  lp.frequency.linearRampToValueAtTime(top, t + 0.11);
  lp.frequency.setTargetAtTime(top * 0.55, t + 0.12, 0.35);
  lp.frequency.setValueAtTime(top * 0.55, t + dur);
  lp.frequency.setTargetAtTime(f, t + dur, rel / 2);
  const g = ctx.createGain();
  env(g, t, vel, o.att ?? 0.07, t + dur, rel);
  const oscs = [osc(ctx, 'sawtooth', f), osc(ctx, 'sawtooth', f), osc(ctx, 'triangle', f)];
  oscs[0].detune.value = 5; oscs[1].detune.value = -6;
  const tg = gainNode(ctx, 0.9);
  oscs.forEach((x, i) => {
    x.detune.setValueAtTime((i === 0 ? 5 : i === 1 ? -6 : 0) - 55, t);
    x.detune.linearRampToValueAtTime(i === 0 ? 5 : i === 1 ? -6 : 0, t + 0.09);
    x.connect(i === 2 ? tg : lp);
    x.start(t); x.stop(end);
  });
  const mix = gainNode(ctx, 0.5);
  lp.connect(mix); tg.connect(mix); mix.connect(g); g.connect(out);
  return end;
}

const VOWEL = {
  a: [[800, 1, 7], [1150, 0.5, 9], [2900, 0.18, 12]],
  o: [[450, 1, 7], [800, 0.45, 9], [2830, 0.1, 12]],
  u: [[325, 1, 6], [700, 0.3, 8], [2530, 0.06, 12]],
  e: [[400, 1, 7], [1700, 0.35, 10], [2600, 0.15, 12]],
};
/** Choir: detuned saws per note through three vowel formants. midis: array. */
export function choir(ctx, out, t, midis, dur, vel, o = {}) {
  const att = o.att ?? 1.1, rel = o.rel ?? 1.6, end = t + dur + rel * 2.5;
  const mix = gainNode(ctx, 1 / Math.sqrt(midis.length));
  const lfo = osc(ctx, 'sine', 4.8 + R() * 0.6), lg = gainNode(ctx, o.vib ?? 9);
  lfo.connect(lg); lfo.start(t); lfo.stop(end);
  midis.forEach(m => {
    for (const d of [-7, 6]) {
      const x = osc(ctx, 'sawtooth', mtof(m));
      x.detune.value = d + (R() - 0.5) * 4;
      lg.connect(x.detune);
      x.connect(mix); x.start(t); x.stop(end);
    }
  });
  const g = ctx.createGain();
  env(g, t, vel, att, t + dur, rel);
  const forms = VOWEL[o.vowel || 'a'];
  forms.forEach(([F, amp, Q]) => {
    const bp = filt(ctx, 'bandpass', F, Q), fg = gainNode(ctx, amp * 2.6);
    mix.connect(bp); bp.connect(fg); fg.connect(g);
  });
  const body = filt(ctx, 'lowpass', 700, 0.5), bg = gainNode(ctx, 0.12);
  mix.connect(body); body.connect(bg); bg.connect(g);
  g.connect(out);
  return end;
}

/** Soft pad (no formants): triangles and a filtered saw. 'soft' warm, 'cold' glassy, 'dark' low. */
export function pad(ctx, out, t, midis, dur, vel, o = {}) {
  const att = o.att ?? 1.4, rel = o.rel ?? 1.8, end = t + dur + rel * 2.5;
  const kind = o.kind || 'soft';
  const lp = filt(ctx, 'lowpass', kind === 'cold' ? 2600 : kind === 'dark' ? 500 : 1100, 0.8);
  if (kind === 'dark') { lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(900, t + dur * 0.6); lp.frequency.linearRampToValueAtTime(420, t + dur + rel); }
  const mix = gainNode(ctx, 0.6 / Math.sqrt(midis.length));
  midis.forEach(m => {
    const a = osc(ctx, kind === 'cold' ? 'sine' : 'triangle', mtof(m)); a.detune.value = -5;
    const b = osc(ctx, kind === 'cold' ? 'triangle' : 'sawtooth', mtof(m)); b.detune.value = 6;
    const bg = gainNode(ctx, kind === 'cold' ? 0.5 : 0.35);
    a.connect(mix); b.connect(bg); bg.connect(mix);
    a.start(t); b.start(t); a.stop(end); b.stop(end);
  });
  const g = ctx.createGain();
  env(g, t, vel, att, t + dur, rel);
  mix.connect(lp); lp.connect(g); g.connect(out);
  return end;
}

/** Church/hall bell: inharmonic partials, long decay. */
export function bell(ctx, out, t, midi, vel) {
  const f = mtof(midi);
  const parts = [[0.5, 0.35, 4], [1, 1, 3], [1.19, 0.5, 2.2], [1.5, 0.35, 1.8], [2, 0.4, 1.5], [2.74, 0.22, 0.9], [3.76, 0.12, 0.6], [5.4, 0.06, 0.35]];
  const g = gainNode(ctx, vel * 0.32);
  let end = t;
  parts.forEach(([r, a, d]) => {
    const x = osc(ctx, 'sine', f * r), pg = ctx.createGain();
    pg.gain.setValueAtTime(0, t);
    pg.gain.linearRampToValueAtTime(a, t + 0.004);
    pg.gain.setTargetAtTime(0, t + 0.004, d / 4);
    x.connect(pg); pg.connect(g);
    x.start(t); x.stop(t + d * 1.4); end = Math.max(end, t + d * 1.4);
  });
  g.connect(out);
  return end;
}

// ------------------------------------------------------------------ percussion

// Drum hits are synthesised once into small buffers (JS DSP), then each hit is a single
// buffer source and gain: far cheaper on phones than building oscillators per hit.
const DRUMS = {
  frame: {f: 105, end: 0.62, decay: 0.1, slap: 1100, slapAmt: 0.35, len: 0.6},
  frameHi: {f: 118, end: 0.62, decay: 0.08, slap: 1300, slapAmt: 0.4, len: 0.5},
  tom: {f: 72, end: 0.7, decay: 0.2, low: 0.5, len: 1.1},
  tomLo: {f: 66, end: 0.7, decay: 0.22, low: 0.5, len: 1.1},
  tap: {len: 0.12},
  shaker: {len: 0.12},
};
export function drumBuffer(ctx, kind) {
  const s = store(ctx), key = 'dr_' + kind;
  if (s.buf.has(key)) return s.buf.get(key);
  const P = DRUMS[kind], sr = ctx.sampleRate, len = Math.floor(P.len * sr), d = new Float32Array(len);
  const rnd = rng(hash(kind));
  if (kind === 'tap') {
    const n = new Float32Array(len);
    for (let i = 0; i < len; i++) n[i] = (rnd() * 2 - 1) * Math.exp(-i / (0.012 * sr));
    biquad(n, 'bandpass', 2400, 2.2, sr);
    let ph = 0;
    for (let i = 0; i < len; i++) { ph += 520 / sr; d[i] = n[i] * 1.6 + (Math.abs((ph % 1) * 4 - 2) - 1) * 0.35 * Math.exp(-i / (0.015 * sr)); }
  } else if (kind === 'shaker') {
    for (let i = 0; i < len; i++) {
      const t = i / sr, e = t < 0.012 ? t / 0.012 : Math.exp(-(t - 0.012) / 0.025);
      d[i] = (rnd() * 2 - 1) * e;
    }
    biquad(d, 'highpass', 5200, 0.8, sr);
  } else {
    // pitched skin: exponential pitch drop, fast attack, exponential decay
    let ph = 0, ph2 = 0;
    const isTom = kind.startsWith('tom');
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const f = isTom ? P.f * 1.5 * Math.pow(0.7 / 1.5, Math.min(1, t / 0.25)) : P.f * 1.6 * Math.pow(0.62 / 1.6, Math.min(1, t / 0.14));
      ph += f / sr;
      const e = (t < 0.003 ? t / 0.003 : Math.exp(-(t - 0.003) / P.decay));
      let x = Math.sin(2 * Math.PI * ph) * e;
      if (isTom) {
        const f2 = P.f * 2.2 * Math.pow(1 / 2.2, Math.min(1, t / 0.2));
        ph2 += f2 / sr;
        x += (Math.abs((ph2 % 1) * 4 - 2) - 1) * 0.25 * e;
      }
      d[i] = x;
    }
    const n = new Float32Array(len);
    const nd = isTom ? 0.04 : 0.018;
    for (let i = 0; i < Math.min(len, sr * 0.2); i++) n[i] = (rnd() * 2 - 1) * Math.exp(-i / (nd * sr));
    if (isTom) biquad(n, 'lowpass', 600, 0.7, sr); else biquad(n, 'bandpass', P.slap, 1.2, sr);
    const amt = isTom ? P.low : P.slapAmt * 2.2;
    for (let i = 0; i < len; i++) d[i] += n[i] * amt;
  }
  const fade = Math.floor(0.01 * sr);
  for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
  normalize(d, 0.9);
  const buf = makeBuf(ctx, 1, len);
  buf.getChannelData(0).set(d);
  s.buf.set(key, buf);
  return buf;
}
function hit(ctx, out, t, vel, kind, detune = 0) {
  const src = ctx.createBufferSource(), g = gainNode(ctx, vel);
  src.buffer = drumBuffer(ctx, kind);
  src.playbackRate.value = 1 + detune + (R() - 0.5) * 0.04;
  src.connect(g); g.connect(out); src.start(t);
  return t + src.buffer.duration;
}
/** Frame drum: pitched skin thump plus a short slap. */
export function frame(ctx, out, t, vel, o = {}) { return hit(ctx, out, t, vel * 0.75, o.hi ? 'frameHi' : 'frame'); }
/** Low tom / war drum. */
export function tom(ctx, out, t, vel, o = {}) { return hit(ctx, out, t, vel * 0.8, o.lo ? 'tomLo' : 'tom'); }
/** Rim tap / stick on the frame. */
export function tap(ctx, out, t, vel) { return hit(ctx, out, t, vel * 0.55, 'tap'); }
/** Shaker / seed rattle. */
export function shaker(ctx, out, t, vel) { return hit(ctx, out, t, vel * 0.5, 'shaker', (R() - 0.5) * 0.1); }

// ------------------------------------------------------------------ continuous drones

/** Bowed drone. kind: gurdy (hurdy-gurdy), tagel (tagelharpa, nasal), ison (chant drone),
 *  soft (warm), cold (thin high), dark (storm). Returns {stop(t)}. */
export function drone(ctx, out, t, midis, kind = 'gurdy', level = 0.1) {
  const nodes = [];
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + 3);
  // slow "bow" breathing
  const bow = osc(ctx, 'sine', 0.11 + R() * 0.05), bowG = gainNode(ctx, level * 0.18);
  bow.connect(bowG); bowG.connect(g.gain); nodes.push(bow);
  const lp = filt(ctx, 'lowpass', kind === 'dark' ? 320 : kind === 'cold' ? 2200 : 900, kind === 'gurdy' ? 2.5 : 1);
  const lfo = osc(ctx, 'sine', 0.045 + R() * 0.03), lfoG = gainNode(ctx, kind === 'dark' ? 160 : kind === 'cold' ? 500 : 380);
  lfo.connect(lfoG); lfoG.connect(lp.frequency); nodes.push(lfo);
  const mix = gainNode(ctx, 0.5 / Math.sqrt(midis.length));
  midis.forEach((m, i) => {
    const f = mtof(m);
    const types = kind === 'cold' ? ['sine', 'triangle'] : kind === 'ison' ? ['sawtooth', 'triangle'] : kind === 'soft' ? ['triangle', 'sawtooth'] : ['sawtooth', 'sawtooth'];
    types.forEach((ty, k) => {
      const x = osc(ctx, ty, f);
      x.detune.value = (k ? 4 : -3) + i;
      const xg = gainNode(ctx, k && kind === 'soft' ? 0.3 : 1);
      x.connect(xg); xg.connect(mix); nodes.push(x);
    });
  });
  if (kind === 'tagel' || kind === 'ison') {
    const forms = kind === 'ison' ? VOWEL.o : [[620, 1, 4], [1450, 0.6, 6], [2600, 0.2, 8]];
    forms.forEach(([F, a, Q]) => { const bp = filt(ctx, 'bandpass', F, Q), fg = gainNode(ctx, a * 2.2); mix.connect(bp); bp.connect(fg); fg.connect(g); });
    const body = filt(ctx, 'lowpass', 400), bg = gainNode(ctx, 0.25); mix.connect(body); body.connect(bg); bg.connect(g);
  } else {
    mix.connect(lp); lp.connect(g);
  }
  if (kind === 'gurdy') { // the buzzing "trompette" string: a little nasal resonance
    const bp = filt(ctx, 'bandpass', 1300, 5), bg = gainNode(ctx, 0.35); mix.connect(bp); bp.connect(bg); bg.connect(g);
  }
  g.connect(out);
  nodes.forEach(n => n.start(t));
  return {
    stop(at) {
      g.gain.cancelScheduledValues(at);
      g.gain.setTargetAtTime(0, at, 0.6);
      nodes.forEach(n => { try { n.stop(at + 3); } catch { /* already stopped */ } });
    },
  };
}

// ------------------------------------------------------------------ ambience beds

function loopSrc(ctx, buf) {
  const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; return s;
}

/** Thunder: rolling low noise with several rumbles. */
export function thunder(ctx, out, t, vel = 1) {
  const n = noiseSrc(ctx, 'brown'), lp = filt(ctx, 'lowpass', 900, 0.6), g = ctx.createGain();
  const crack = noiseSrc(ctx, 'white'), hp = filt(ctx, 'bandpass', 1800, 0.5), cg = ctx.createGain();
  const dur = 4 + R() * 3;
  g.gain.setValueAtTime(0, t);
  let tt = t;
  const peaks = 2 + Math.floor(R() * 3);
  for (let i = 0; i < peaks; i++) {
    const a = vel * (i === 0 ? 1 : 0.4 + R() * 0.5);
    g.gain.linearRampToValueAtTime(a, tt + 0.08 + R() * 0.1);
    tt += 0.5 + R() * 0.9;
    g.gain.linearRampToValueAtTime(a * 0.35, tt);
  }
  g.gain.setTargetAtTime(0, tt, dur / 4);
  lp.frequency.setValueAtTime(1100, t);
  lp.frequency.exponentialRampToValueAtTime(140, t + dur);
  cg.gain.setValueAtTime(0, t);
  cg.gain.linearRampToValueAtTime(vel * 0.35, t + 0.02);
  cg.gain.setTargetAtTime(0, t + 0.03, 0.15);
  n.connect(lp); lp.connect(g); g.connect(out);
  crack.connect(hp); hp.connect(cg); cg.connect(out);
  startNoise(n, t, t + dur + 3); startNoise(crack, t, t + 1);
  return t + dur + 3;
}

/** One gull cry series. */
export function gull(ctx, out, t, vel = 1) {
  const p = panNode(ctx, R() * 1.6 - 0.8);
  p.connect(out);
  const cries = 1 + Math.floor(R() * 3);
  const base = 1500 + R() * 500;
  let tt = t;
  for (let i = 0; i < cries; i++) {
    const d = 0.22 + R() * 0.15;
    const x = osc(ctx, 'sawtooth', base), bp = filt(ctx, 'bandpass', base * 1.3, 3), g = ctx.createGain();
    x.frequency.setValueAtTime(base * 0.85, tt);
    x.frequency.linearRampToValueAtTime(base * 1.12, tt + d * 0.25);
    x.frequency.exponentialRampToValueAtTime(base * 0.7, tt + d);
    g.gain.setValueAtTime(0, tt);
    g.gain.linearRampToValueAtTime(vel * 0.5, tt + 0.03);
    g.gain.linearRampToValueAtTime(vel * 0.25, tt + d * 0.7);
    g.gain.linearRampToValueAtTime(0, tt + d);
    x.connect(bp); bp.connect(g); g.connect(p);
    x.start(tt); x.stop(tt + d + 0.05);
    tt += d + 0.06 + R() * 0.12;
  }
  return tt;
}

/** A mug or cup knocked in the tavern. */
export function clink(ctx, out, t, vel = 1, f0 = 0) {
  const f = f0 || 1800 + R() * 1400, g = gainNode(ctx, vel * 0.25);
  [[1, 1, 0.12], [2.76, 0.45, 0.07], [5.4, 0.25, 0.04]].forEach(([r, a, d]) => {
    const x = osc(ctx, 'sine', f * r), pg = ctx.createGain();
    pg.gain.setValueAtTime(a, t); pg.gain.setTargetAtTime(0, t, d);
    x.connect(pg); pg.connect(g); x.start(t); x.stop(t + d * 6);
  });
  g.connect(out);
  return t + 0.6;
}

/**
 * Ambience bed. kinds: sea, wind, gulls, hearth, murmur, rain, thunder, clinks, river.
 * Returns {schedule(until), stop(t)}. Event-driven parts (waves, gusts, gulls, thunder)
 * are scheduled by schedule() a little ahead, like the music.
 */
export function ambience(ctx, out, t0, kind, level, seed = 1) {
  const rnd = rng(seed), nodes = [];
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(level, t0 + 2.5);
  g.connect(out);
  let next = t0 + 0.5, schedule = () => {};
  if (kind === 'sea' || kind === 'river') {
    const river = kind === 'river';
    const b = noiseSrc(ctx, 'brown'), lp = filt(ctx, 'lowpass', 500, 0.5);
    const w = noiseSrc(ctx, 'pink'), hp = filt(ctx, 'highpass', river ? 1500 : 2500, 0.5), hg = gainNode(ctx, river ? 0.25 : 0.12);
    const sw = gainNode(ctx, 0.35);
    b.connect(lp); lp.connect(sw); w.connect(hp); hp.connect(hg); hg.connect(sw); sw.connect(g);
    nodes.push(b, w);
    schedule = until => {
      while (next < until) {
        const rise = (river ? 0.8 : 1.6) + rnd() * 1.6, fall = (river ? 1 : 2.4) + rnd() * 2.4, pk = river ? 0.5 + rnd() * 0.25 : 0.55 + rnd() * 0.45;
        sw.gain.setTargetAtTime(pk, next, rise / 2.5);
        lp.frequency.setTargetAtTime(river ? 700 : 900 + pk * 700, next, rise / 2.5);
        sw.gain.setTargetAtTime(river ? 0.4 : 0.22, next + rise, fall / 3);
        lp.frequency.setTargetAtTime(river ? 500 : 420, next + rise, fall / 3);
        next += rise + fall * (0.6 + rnd() * 0.4);
      }
    };
  } else if (kind === 'wind') {
    const w = noiseSrc(ctx, 'pink'), bp = filt(ctx, 'bandpass', 500, 2.2), wg = gainNode(ctx, 0.5);
    const p = panNode(ctx, 0);
    const wh = noiseSrc(ctx, 'white'), bp2 = filt(ctx, 'bandpass', 1400, 14), whg = gainNode(ctx, 0.0);
    w.connect(bp); bp.connect(wg); wg.connect(p); wh.connect(bp2); bp2.connect(whg); whg.connect(p); p.connect(g);
    nodes.push(w, wh);
    schedule = until => {
      while (next < until) {
        const d = 2 + rnd() * 3.5, s = rnd();
        bp.frequency.setTargetAtTime(280 + s * 700, next, d / 2);
        wg.gain.setTargetAtTime(0.25 + s * 0.75, next, d / 2);
        bp2.frequency.setTargetAtTime(900 + rnd() * 1200, next, d / 2);
        whg.gain.setTargetAtTime(s > 0.6 ? (s - 0.6) * 0.5 : 0, next, d / 2);
        if (p.pan) p.pan.setTargetAtTime(rnd() * 1.2 - 0.6, next, d);
        next += d;
      }
    };
  } else if (kind === 'gulls') {
    next = t0 + 2 + rnd() * 4;
    schedule = until => { while (next < until) { gull(ctx, g, next, 0.6 + rnd() * 0.4); next += 5 + rnd() * 11; } };
  } else if (kind === 'thunder') {
    next = t0 + 3 + rnd() * 5;
    schedule = until => { while (next < until) { thunder(ctx, g, next, 0.6 + rnd() * 0.4); next += 11 + rnd() * 14; } };
  } else if (kind === 'clinks') {
    next = t0 + 1 + rnd() * 3;
    schedule = until => { while (next < until) { clink(ctx, g, next, 0.5 + rnd() * 0.5); if (rnd() < 0.3) clink(ctx, g, next + 0.09, 0.5); next += 2.5 + rnd() * 6; } };
  } else {
    const buf = kind === 'hearth' ? crackleBuffer(ctx) : kind === 'rain' ? rainBuffer(ctx) : murmurBuffer(ctx);
    const s = loopSrc(ctx, buf);
    if (kind === 'murmur') { // two offset copies at different rates hide the loop
      const s2 = loopSrc(ctx, buf); s2.playbackRate.value = 0.93;
      const p2 = panNode(ctx, 0.3), g2 = gainNode(ctx, 0.6);
      s2.connect(g2); g2.connect(p2); p2.connect(g); nodes.push(s2);
      const sw = gainNode(ctx, 1); s.connect(sw); sw.connect(g);
      schedule = until => { while (next < until) { sw.gain.setTargetAtTime(0.6 + rnd() * 0.6, next, 1); next += 2 + rnd() * 3; } };
    } else s.connect(g);
    nodes.push(s);
  }
  nodes.forEach(n => n.start(t0, n.buffer ? rnd() * Math.max(0, n.buffer.duration - 0.5) : 0));
  return {
    schedule: until => schedule(until),
    stop(at) {
      g.gain.cancelScheduledValues(at);
      g.gain.setTargetAtTime(0, at, 0.5);
      next = Infinity;
      nodes.forEach(n => { try { n.stop(at + 2.5); } catch { /* already stopped */ } });
    },
  };
}
