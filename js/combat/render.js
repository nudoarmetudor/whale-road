// Canvas renderer for a battle from engine.js. Draws the sea, ships, projectiles and
// effects; owns no game rules. battle.js feeds it the battle object every frame.

import {drawShip, drawEnemy, shipSize, SHIP_SPECS} from '../art/ships.js';
import {alive} from './engine.js';

const SKY = {
  clear: ['#7fa9bd', '#c9d6cf', '#f0dfb8'],
  rain: ['#5c6a72', '#8f9a9a', '#b9b9ad'],
  fog: ['#a7b1b0', '#c9ccc6', '#dcdbd2'],
  storm: ['#20262c', '#3a4246', '#5d6460'],
};
const SEA = {
  clear: ['#6f9aa5', '#3f7284', '#183a48'],
  rain: ['#5d7d86', '#355a66', '#122c36'],
  fog: ['#93a9aa', '#5c7b82', '#2c4650'],
  storm: ['#3b545b', '#22404a', '#0b1b22'],
};

const lerp = (a, b, t) => a + (b - a) * t;
const hpColor = (f) => `hsl(${Math.round(Math.max(0, Math.min(1, f)) * 115)}, 70%, 45%)`;

export class Renderer {
  constructor(canvas, b, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.b = b;
    this.sfx = opts.sfx || (() => {});
    this.hasBackdrop = !!opts.hasBackdrop;
    this.fx = [];
    this.texts = [];
    this.bolts = [];
    this.beams = [];
    this.shake = 0;
    this.flash = 0;
    this.banner = null;
    this.rain = [];
    this.lastSfx = {};
    this.F = {x: 0, y: 0, w: 1, h: 1};
    this.dpr = 1;
    this.W = 1; this.H = 1;
    const nP = b.units.filter((u) => u.side === 'p').length;
    const nE = b.units.filter((u) => u.side === 'e').length;
    this.lanes = Math.max(4, nP, nE);
    this.onToast = opts.onToast || (() => {});
  }

  /** Canvas pixel size and the field rectangle (in CSS px) the ships live in. */
  resize(W, H, field) {
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    this.W = W; this.H = H;
    this.cv.width = Math.round(W * this.dpr);
    this.cv.height = Math.round(H * this.dpr);
    this.cv.style.width = W + 'px';
    this.cv.style.height = H + 'px';
    this.F = field;
    this.laneH = field.h / this.lanes;
    this.horizon = Math.max(field.y * 0.6, Math.min(field.y + this.laneH * 0.35, H * 0.32));
    this.bg = null;
  }

  // ---------------------------------------------------------- layout

  /** Tight lanes: every other lane is pushed back so masts and bars do not collide. */
  stagger(u) {
    if (this.laneH > 115) return 0;
    const n = this.b.units.filter((o) => o.side === u.side && alive(o)).length || 1;
    const idx = Math.round(u.slotTo + (n - 1) / 2);
    // odd lanes step aside: ours forward into open water, theirs back (never off the edge)
    let want = (idx % 2 ? 1 : 0) * this.F.w * (this.laneH < 90 ? 0.12 : 0.08);
    if (u.side === 'e') want = Math.min(want, Math.max(0, (0.95 - u.homeX) * this.F.w));
    if (u._sx === undefined) u._sx = want;
    const now = this.b.t;
    if (u._st !== now) { u._sx += (want - u._sx) * 0.12; u._st = now; }
    return u._sx;
  }

  pos(u) {
    const F = this.F;
    const x = F.x + F.w * u.x + this.stagger(u);
    let y = F.y + F.h / 2 + u.slot * this.laneH + this.laneH * 0.3;
    if (u.fly) y -= this.laneH * 0.35;
    return {x, y};
  }

  scaleFor(u) {
    const art = u.art;
    const sz = shipSize(art);
    const ref = shipSize('drakkar');
    const tight = this.laneH <= 115;
    const room = tight ? 1.08 : 0.66; // staggered lanes may overlap their neighbours' height
    const base = Math.min((this.laneH * room) / ref.top, (this.F.w * 0.24) / ref.w);
    const grow = SHIP_SPECS[art] ? Math.pow(ref.w / sz.w, 0.55) : 1.35;
    return Math.min(base * grow, (this.laneH * room * 1.05) / sz.top, (this.F.w * 0.22) / sz.w);
  }

  box(u) {
    const p = this.pos(u);
    const s = this.scaleFor(u);
    const sz = shipSize(u.art);
    const w = Math.max(44, sz.w * s); const h = Math.max(44, sz.h * s);
    return {x: p.x - w / 2, y: p.y - sz.top * s, w, h, cx: p.x, cy: p.y - (sz.top * s) / 2};
  }

  /** The living unit under a point (CSS px), nearest centre wins. */
  hit(px, py) {
    let best = null; let bd = Infinity;
    for (const u of this.b.units) {
      if (!alive(u) || u.state === 'flee') continue;
      const r = this.box(u);
      if (px < r.x - 6 || px > r.x + r.w + 6 || py < r.y - 6 || py > r.y + r.h + 6) continue;
      const d = Math.hypot(px - r.cx, py - r.cy);
      if (d < bd) { bd = d; best = u; }
    }
    return best;
  }

  // ---------------------------------------------------------- events -> effects

  play(name, gap = 0.08) {
    const now = performance.now() / 1000;
    if (this.lastSfx[name] && now - this.lastSfx[name] < gap) return;
    this.lastSfx[name] = now;
    this.sfx(name);
  }

  consume() {
    const b = this.b;
    const evs = b.events.splice(0);
    for (const e of evs) {
      const u = e.id ? b.units.find((x) => x.id === e.id) : null;
      const p = u ? this.pos(u) : null;
      const s = u ? this.scaleFor(u) : 1;
      switch (e.type) {
        case 'hit': {
          if (!p || !e.dmg) break;
          const top = shipSize(u.art).top * s;
          const col = u.side === 'p' ? '#ff9b8a' : (e.kind === 'talent' ? '#f6c344' : '#fff4d6');
          this.texts.push({x: p.x + (Math.random() - 0.5) * 20, y: p.y - top * 0.6, t: 0, text: String(e.dmg), col, big: e.dmg >= 25 || e.kind === 'ram'});
          if (e.kind !== 'burn' && e.kind !== 'flee') this.sparks(p.x, p.y - top * 0.25, 6, '#e9c48a');
          if (e.kind !== 'burn') this.play('hit', 0.06);
          break;
        }
        case 'miss': if (p) { this.splash(p.x + (Math.random() - 0.5) * 50, p.y + 4, 0.7); this.play('splash', 0.15); } break;
        case 'shot': this.play('arrow', 0.12); break;
        case 'ram': {
          this.shake = Math.max(this.shake, 14);
          const t = b.units.find((x) => x.id === e.target);
          if (t) { const q = this.pos(t); this.splash(q.x, q.y, 1.8); this.sparks(q.x, q.y - 10, 18, '#c9a876'); }
          this.play('ram', 0);
          break;
        }
        case 'sink':
          if (p) { for (let i = 0; i < 4; i++) this.splash(p.x + (Math.random() - 0.5) * 40, p.y, 1.2); }
          this.play('sink', 0);
          if (u && u.side === 'p') this.onToast(`${u.name} goes down!`);
          break;
        case 'thor': {
          this.flash = 1;
          for (const id of e.ids) {
            const t = b.units.find((x) => x.id === id);
            if (!t) continue;
            const q = this.pos(t);
            this.bolts.push({x: q.x, y: q.y - 10, t: 0, seed: Math.random() * 1000});
            this.sparks(q.x, q.y - 10, 14, '#d7ecff');
          }
          this.play('thunder', 0);
          break;
        }
        case 'heal':
          for (const id of e.ids) {
            const t = b.units.find((x) => x.id === id);
            if (!t) continue;
            const q = this.pos(t);
            for (let i = 0; i < 16; i++) this.fx.push({k: 'glow', x: q.x + (Math.random() - 0.5) * 70, y: q.y - Math.random() * 30, vy: -30 - Math.random() * 30, t: 0, life: 1.3});
          }
          this.play('heal', 0);
          break;
        case 'bless':
          if (e.key === 'njord') { this.banner = {text: 'The sea rises with you', t: 0}; this.play('wave', 0); }
          if (e.key === 'odin') { this.banner = {text: 'Odin\'s ravens fly', t: 0}; this.play('horn', 0); for (let i = 0; i < 2; i++) this.fx.push({k: 'raven', x: -40 - i * 60, y: this.F.y + 20 + i * 24, t: 0, life: 4}); }
          if (e.key === 'kari') this.play('wave', 0);
          break;
        case 'gale':
          for (let i = 0; i < 26; i++) this.fx.push({k: 'wind', x: this.F.x + Math.random() * this.F.w * 0.5, y: this.F.y + Math.random() * this.F.h, t: 0, life: 1 + Math.random() * 0.6});
          break;
        case 'talent':
          this.banner = {text: (this.talentName || e.talent).toUpperCase() + '!', t: 0, big: true};
          this.play('levelup', 0);
          if (e.talent === 'seidr') for (let i = 0; i < 20; i++) this.fx.push({k: 'mist', x: this.F.x + this.F.w * (0.55 + Math.random() * 0.45), y: this.F.y + Math.random() * this.F.h, t: 0, life: 3});
          break;
        case 'grip': {
          const t = b.units.find((x) => x.id === e.target);
          if (t) { const q = this.pos(t); this.fx.push({k: 'hand', x: q.x, y: q.y, t: 0, life: 1.4}); this.shake = 10; }
          break;
        }
        case 'siphon': {
          if (!p) break;
          const y = this.F.y + this.F.h / 2 + e.lane * this.laneH + this.laneH * 0.3;
          for (let i = 0; i < 40; i++) {
            const k = Math.random();
            this.fx.push({k: 'fire', x: p.x - 30, y: p.y - 10, tx: this.F.x + this.F.w * 0.2 + (Math.random() - 0.5) * 60, ty: y + (Math.random() - 0.5) * this.laneH * 2.2, t: -k * 0.4, life: 0.8});
          }
          this.play('splash', 0);
          break;
        }
        case 'bite': {
          const y = this.F.y + this.F.h / 2 + e.lane * this.laneH + this.laneH * 0.3;
          this.splash(this.F.x + this.F.w * 0.2, y, 2);
          if (e.target) this.shake = Math.max(this.shake, 8);
          this.play('splash', 0);
          break;
        }
        case 'grab': this.play('splash', 0); break;
        case 'drain': {
          const t = b.units.find((x) => x.id === e.target);
          if (u && t) this.beams.push({from: u.id, to: t.id, t: 0, life: 0.8, col: '#7dffa8'});
          break;
        }
        case 'dive': this.play('hit', 0); break;
        case 'flash': this.flash = 0.8; this.bolts.push({x: this.F.x + this.F.w * e.x, y: this.horizon + 10, t: 0, seed: Math.random() * 1000, far: true}); this.play('thunder', 0.5); break;
        case 'ammo': this.play(e.kind === 'harpoon' ? 'arrow' : 'hit', 0); break;
        case 'msg': this.onToast(e.text); break;
        case 'flee': if (e.ok) this.play('sail', 0); break;
        case 'horn': this.play('horn', 0); break;
        case 'end': this.play(e.result === 'win' ? 'levelup' : e.result === 'lose' ? 'sink' : 'sail', 0); break;
        default: break;
      }
    }
  }

  splash(x, y, size = 1) {
    this.fx.push({k: 'ring', x, y, t: 0, life: 0.9, s: size});
    for (let i = 0; i < 8 * size; i++) {
      this.fx.push({k: 'drop', x, y, vx: (Math.random() - 0.5) * 60 * size, vy: -60 - Math.random() * 80 * size, t: 0, life: 0.8});
    }
  }

  sparks(x, y, n, col) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2; const v = 40 + Math.random() * 90;
      this.fx.push({k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, t: 0, life: 0.5 + Math.random() * 0.3, col});
    }
  }

  // ---------------------------------------------------------- drawing

  paintBackground() {
    const W = this.W; const H = this.H; const dpr = this.dpr;
    const c = document.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const wx = this.b.weather;
    const hz = this.horizon;
    if (!this.hasBackdrop) {
      const sky = g.createLinearGradient(0, 0, 0, hz);
      SKY[wx].forEach((col, i) => sky.addColorStop(i / 2, col));
      g.fillStyle = sky; g.fillRect(0, 0, W, hz + 1);
      // sun glow / clouds
      if (wx === 'clear') {
        const sun = g.createRadialGradient(W * 0.7, hz * 0.55, 2, W * 0.7, hz * 0.55, Math.max(80, hz * 1.4));
        sun.addColorStop(0, 'rgba(255,240,200,0.9)'); sun.addColorStop(0.15, 'rgba(255,230,180,0.45)'); sun.addColorStop(1, 'rgba(255,230,180,0)');
        g.fillStyle = sun; g.fillRect(0, 0, W, hz);
      }
      g.save();
      for (let i = 0; i < 9; i++) {
        const cx = ((i * 0.37 + 0.11) % 1) * W; const cy = hz * (0.2 + ((i * 0.53) % 0.6));
        const r = 30 + ((i * 17) % 40);
        g.fillStyle = wx === 'storm' ? 'rgba(20,24,28,0.35)' : 'rgba(255,250,240,0.22)';
        for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(cx + j * r * 0.6, cy + (j % 2) * 4, r, r * 0.35, 0, 0, Math.PI * 2); g.fill(); }
      }
      g.restore();
      // distant land, in two hazy layers
      const land = (yb, amp, col, seed) => {
        g.fillStyle = col; g.beginPath(); g.moveTo(0, yb);
        for (let x = 0; x <= W; x += 12) {
          const y = yb - amp * (0.5 + 0.5 * Math.sin(x * 0.011 + seed) * Math.sin(x * 0.004 + seed * 2)) - (x > W * 0.15 && x < W * 0.45 ? amp * 0.6 * Math.sin(((x - W * 0.15) / (W * 0.3)) * Math.PI) : 0);
          g.lineTo(x, y);
        }
        g.lineTo(W, yb); g.closePath(); g.fill();
      };
      const fogA = wx === 'fog' ? 0.25 : 1;
      g.globalAlpha = fogA;
      land(hz, Math.min(36, hz * 0.45), wx === 'storm' ? '#2e383c' : '#8fa3a5', 1.3);
      land(hz, Math.min(22, hz * 0.3), wx === 'storm' ? '#253034' : '#6f8789', 4.1);
      g.globalAlpha = 1;
      // sea
      const sea = g.createLinearGradient(0, hz, 0, H);
      SEA[wx].forEach((col, i) => sea.addColorStop(i / 2, col));
      g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
      // sun path on water
      if (wx === 'clear') {
        g.fillStyle = 'rgba(255,240,200,0.12)';
        for (let i = 0; i < 40; i++) {
          const y = hz + 4 + i * i * 0.35; if (y > H) break;
          const w = 10 + i * 3;
          g.fillRect(W * 0.7 - w / 2 + Math.sin(i * 2.1) * 8, y, w, 1.5);
        }
      }
      // horizon haze
      const haze = g.createLinearGradient(0, hz - 10, 0, hz + 30);
      haze.addColorStop(0, 'rgba(255,255,255,0)'); haze.addColorStop(0.4, 'rgba(240,235,220,0.35)'); haze.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = haze; g.fillRect(0, hz - 10, W, 40);
    } else {
      // a translucent sea wash so ships read against the painted backdrop
      const sea = g.createLinearGradient(0, hz, 0, H);
      sea.addColorStop(0, 'rgba(24,58,72,0)'); sea.addColorStop(1, 'rgba(24,58,72,0.45)');
      g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
    }
    // fortress: a headland with a palisade behind the enemy line
    if (this.b.place === 'fortress') {
      const x0 = this.F.x + this.F.w * 0.74;
      g.fillStyle = wx === 'storm' ? '#2a2c2a' : '#4d4a40';
      g.beginPath(); g.moveTo(x0, H);
      g.bezierCurveTo(x0 + 20, hz + 40, x0 + 60, hz - 20, x0 + 140, hz - 30);
      g.lineTo(W, hz - 50); g.lineTo(W, H); g.closePath(); g.fill();
      g.fillStyle = '#5f6b3a'; g.globalAlpha = 0.6;
      g.beginPath(); g.moveTo(x0 + 60, hz - 14); g.bezierCurveTo(x0 + 100, hz - 34, x0 + 160, hz - 36, W, hz - 50); g.lineTo(W, hz - 30); g.closePath(); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = '#3a2414';
      for (let x = x0 + 120; x < W; x += 7) { const yb = hz - 30 - (x - x0 - 120) * 0.08; g.fillRect(x, yb - 16, 5, 18); g.beginPath(); g.moveTo(x, yb - 16); g.lineTo(x + 2.5, yb - 20); g.lineTo(x + 5, yb - 16); g.fill(); }
    }
    this.bg = c;
  }

  drawWaves(g, t) {
    const W = this.W; const H = this.H; const hz = this.horizon;
    const storm = this.b.weather === 'storm';
    g.save();
    g.lineCap = 'round';
    let row = 0;
    for (let y = hz + 6; y < H + 10; row++) {
      const depth = (y - hz) / (H - hz);
      const sp = 26 + depth * 70;
      const amp = (storm ? 2.6 : 1.4) + depth * (storm ? 5 : 3);
      g.strokeStyle = `rgba(240,245,240,${0.08 + depth * 0.16})`;
      g.lineWidth = 0.8 + depth * 1.4;
      const off = ((t * (8 + depth * 20) * (row % 2 ? 1 : -0.6)) % sp + sp) % sp;
      g.beginPath();
      for (let x = -sp + off + (row * 37) % sp; x < W + sp; x += sp) {
        g.moveTo(x, y);
        g.quadraticCurveTo(x + sp * 0.18, y - amp, x + sp * 0.36, y);
      }
      g.stroke();
      y += 7 + depth * 22;
    }
    g.restore();
  }

  drawUnit(g, u, t) {
    const b = this.b;
    const p = this.pos(u);
    const s = this.scaleFor(u);
    const sz = shipSize(u.art);
    const frac = u.hp / u.maxHp;
    const sink = u.state === 'sink' ? Math.min(1, u.sinkT / 2.4) : u.state === 'gone' ? 1 : 0;
    if (u.state === 'gone') return;
    const fled = u.state === 'fled';
    const phase = (u.order + (u.side === 'e' ? 3.3 : 0)) * 1.7;
    const opts = {
      t, phase, damage: 1 - frac, sink, burning: !!u.burn, stunned: u.stun > 0,
      alpha: fled ? Math.max(0, 1 - (u.x - u.homeX) * 4) : undefined,
    };
    // shadow on the water
    if (!u.fly && sink < 1) {
      g.fillStyle = 'rgba(10,25,32,0.28)';
      g.beginPath(); g.ellipse(p.x, p.y + 3 * s, sz.w * s * 0.45, Math.max(3, 8 * s), 0, 0, Math.PI * 2); g.fill();
    } else if (u.fly) {
      g.fillStyle = 'rgba(10,25,32,0.18)';
      g.beginPath(); g.ellipse(p.x, p.y + this.laneH * 0.4, sz.w * s * 0.3, 4, 0, 0, Math.PI * 2); g.fill();
    }
    // selection ring
    if (u.side === 'p' && u.selected && alive(u)) {
      g.save();
      g.strokeStyle = 'rgba(246,205,90,0.9)'; g.lineWidth = 2.5;
      g.setLineDash([8, 5]); g.lineDashOffset = -t * 20;
      g.beginPath(); g.ellipse(p.x, p.y + 4 * s, sz.w * s * 0.5, Math.max(6, 11 * s), 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    // shield wall / njord glow
    let glow;
    if (u.side === 'p' && b.fx.shieldwall > 0) glow = '#9fc8ff';
    if (u.side === 'p' && b.fx.njord > 0) glow = '#5fd0e0';
    if (u.side === 'p' && b.fx.berserk > 0) glow = '#ff5a3a';
    if (u.side === 'e' && b.fx.seidr > 0) glow = '#b28cff';
    if (u.flash > 0.15) glow = '#ffffff';
    opts.glow = glow;
    if (u.side === 'p') {
      drawShip(g, u.art, p.x, p.y, s, {...opts, facing: 1, sail: u.sail});
    } else {
      const st = u.st;
      drawEnemy(g, u.art, p.x, p.y, s, {...opts, facing: -1, sail: st.sail, sail2: st.sail2, shields: st.shields});
    }
    if (!alive(u) || u.state === 'flee') return;

    // health bar + name
    const top = p.y - sz.top * s - 10;
    const bw = Math.max(46, Math.min(110, sz.w * s * 0.7)); const bh = 6;
    const bx = Math.max(bw / 2 + 4, Math.min(this.W - bw / 2 - 4, p.x));
    g.fillStyle = 'rgba(20,14,8,0.75)';
    g.fillRect(bx - bw / 2 - 1.5, top - 1.5, bw + 3, bh + 3);
    g.fillStyle = hpColor(frac);
    g.fillRect(bx - bw / 2, top, bw * Math.max(0, frac), bh);
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(bx - bw / 2, top, bw * Math.max(0, frac), 2);
    const fs = Math.max(10, Math.min(13, this.laneH * 0.2));
    g.font = `600 ${fs}px Alegreya, Georgia, serif`;
    g.textAlign = 'center'; g.textBaseline = 'bottom';
    g.lineWidth = 3; g.strokeStyle = 'rgba(20,14,8,0.8)';
    const tw = g.measureText(u.name).width;
    const nx = Math.max(tw / 2 + 4, Math.min(this.W - tw / 2 - 4, p.x));
    g.strokeText(u.name, nx, top - 2);
    g.fillStyle = u.side === 'p' ? '#f6e7c1' : '#ffd6c8';
    g.fillText(u.name, nx, top - 2);

    // stunned
    if (u.stun > 0) {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + (i * Math.PI * 2) / 3;
        g.fillStyle = u.grabbedBy ? '#e8b8c4' : '#f6e27a';
        g.beginPath(); g.arc(p.x + Math.cos(a) * 16, top + 16 + Math.sin(a) * 4, 2.6, 0, Math.PI * 2); g.fill();
      }
    }
    // focus reticle
    if (u.side === 'e' && b.focus === u.id) {
      const r = Math.max(22, sz.w * s * 0.42);
      const cy = p.y - sz.top * s * 0.4;
      g.save(); g.translate(p.x, cy); g.rotate(t * 0.8);
      g.strokeStyle = '#ff5a3a'; g.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.arc(0, 0, r, -0.45, 0.45); g.stroke(); g.beginPath(); g.moveTo(r - 6, 0); g.lineTo(r + 6, 0); g.stroke(); }
      g.restore();
    }
  }

  drawProjectiles(g) {
    const b = this.b;
    for (const pr of b.projectiles) {
      const a = b.units.find((u) => u.id === pr.from); const c = b.units.find((u) => u.id === pr.to);
      if (!a || !c) continue;
      const pa = this.pos(a); const pc = this.pos(c);
      const sa = this.scaleFor(a); const sc = this.scaleFor(c);
      const x0 = pa.x + (a.side === 'p' ? 20 : -20) * sa; const y0 = pa.y - shipSize(a.art).top * sa * 0.35;
      let x1 = pc.x + pr.j * 12; let y1 = pc.y - shipSize(c.art).top * sc * 0.3;
      if (!pr.hit) { x1 += (pr.j > 0 ? 1 : -1) * 28; y1 = pc.y + 4; }
      const k = Math.min(1, pr.t / pr.T);
      const dist = Math.hypot(x1 - x0, y1 - y0);
      const arc = pr.kind === 'arrow' || pr.kind === 'firearrows' ? dist * 0.28 : pr.kind === 'greekfire' ? dist * 0.22 : pr.kind === 'harpoon' ? dist * 0.08 : dist * 0.14;
      const x = lerp(x0, x1, k); const y = lerp(y0, y1, k) - Math.sin(k * Math.PI) * arc;
      const k2 = Math.max(0, k - 0.04);
      const xp = lerp(x0, x1, k2); const yp = lerp(y0, y1, k2) - Math.sin(k2 * Math.PI) * arc;
      const ang = Math.atan2(y - yp, x - xp);
      g.save(); g.translate(x, y); g.rotate(ang);
      if (pr.kind === 'arrow') {
        g.strokeStyle = '#2a1d10'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(-9, 0); g.lineTo(5, 0); g.stroke();
        g.fillStyle = '#d9d2c0'; g.beginPath(); g.moveTo(-9, 0); g.lineTo(-12, -2.5); g.lineTo(-10, 0); g.lineTo(-12, 2.5); g.fill();
      } else if (pr.kind === 'spear') {
        g.strokeStyle = '#5b3a22'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(-12, 0); g.lineTo(8, 0); g.stroke();
        g.fillStyle = '#bfc4c8'; g.beginPath(); g.moveTo(8, -2.5); g.lineTo(14, 0); g.lineTo(8, 2.5); g.fill();
      } else if (pr.kind === 'axe') {
        g.rotate(pr.t * 18);
        g.strokeStyle = '#5b3a22'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-5, 0); g.lineTo(5, 0); g.stroke();
        g.fillStyle = '#9aa0a6'; g.beginPath(); g.moveTo(3, -4); g.lineTo(7, -3); g.lineTo(7, 3); g.lineTo(3, 2); g.fill();
      } else if (pr.kind === 'harpoon') {
        g.restore();
        g.strokeStyle = 'rgba(230,220,190,0.8)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x) / 2, (y0 + y) / 2 + 20, x, y); g.stroke();
        g.save(); g.translate(x, y); g.rotate(ang);
        g.strokeStyle = '#3a2414'; g.lineWidth = 3; g.beginPath(); g.moveTo(-18, 0); g.lineTo(8, 0); g.stroke();
        g.fillStyle = '#c0c6cc'; g.beginPath(); g.moveTo(6, -5); g.lineTo(16, 0); g.lineTo(6, 5); g.lineTo(9, 0); g.fill();
      } else if (pr.kind === 'firearrows') {
        g.fillStyle = 'rgba(255,170,60,0.5)'; g.beginPath(); g.ellipse(-8, 0, 10, 3, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#2a1d10'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-9, 0); g.lineTo(5, 0); g.stroke();
        g.fillStyle = '#ffd36a'; g.beginPath(); g.arc(5, 0, 2.5, 0, Math.PI * 2); g.fill();
      } else if (pr.kind === 'greekfire') {
        const gr = g.createRadialGradient(0, 0, 1, 0, 0, 10);
        gr.addColorStop(0, '#fff4b0'); gr.addColorStop(0.4, '#ff8a2a'); gr.addColorStop(1, 'rgba(120,40,10,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 10, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(80,60,50,0.4)'; g.beginPath(); g.ellipse(-12, 0, 8, 4, 0, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }
  }

  drawWarns(g, t) {
    const b = this.b;
    for (const w of b.warns) {
      const y = this.F.y + this.F.h / 2 + w.lane * this.laneH + this.laneH * 0.3;
      const k = 1 - w.t / w.T;
      g.save();
      const col = w.kind === 'siphon' ? '255,122,42' : '214,38,58';
      const h = w.kind === 'siphon' ? this.laneH * 2.6 : this.laneH * 0.7;
      const x0 = this.F.x; const x1 = this.F.x + this.F.w * 0.36;
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${0.12 + 0.12 * Math.abs(Math.sin(t * 10))})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr;
      g.fillRect(x0, y - h / 2, x1 - x0, h);
      g.strokeStyle = `rgba(${col},0.8)`; g.lineWidth = 2; g.setLineDash([6, 6]); g.lineDashOffset = -t * 30;
      g.beginPath(); g.moveTo(x0 + 10, y + h / 2); g.lineTo(x1, y + h / 2); g.moveTo(x0 + 10, y - h / 2); g.lineTo(x1, y - h / 2); g.stroke();
      g.setLineDash([]);
      const cx = this.F.x + this.F.w * 0.32; const cy = y - h / 2 - 2;
      g.fillStyle = `rgba(${col},0.95)`; g.beginPath(); g.arc(cx, cy, 11, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(cx, cy, 11, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); g.stroke();
      g.fillStyle = '#fff'; g.font = '700 14px Cinzel, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('!', cx, cy + 1);
      g.restore();
    }
  }

  drawTentacles(g, t) {
    for (const u of this.b.units) {
      if (!u.grab || !alive(u)) continue;
      const v = this.b.units.find((x) => x.id === u.grab);
      if (!v) continue;
      const a = this.pos(u); const c = this.pos(v);
      g.save(); g.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const off = i * 14;
        g.strokeStyle = '#3e1526'; g.lineWidth = 10 - i * 3;
        const sa = this.scaleFor(u);
        const ax = a.x - 25 * sa; const ay = a.y - 10 * sa;
        const mx = (ax + c.x) / 2; const lift = Math.min(90, Math.abs(ax - c.x) * 0.25);
        const path = () => { g.beginPath(); g.moveTo(ax, ay); g.bezierCurveTo(mx + 30, Math.min(ay, c.y) - lift - off + Math.sin(t * 3 + i) * 10, c.x + 60, c.y - lift * 0.6 + off, c.x + 6 - off, c.y - 4); };
        path(); g.stroke();
        g.strokeStyle = '#7a3550'; g.lineWidth = 7 - i * 3; path(); g.stroke();
      }
      g.restore();
    }
  }

  drawFx(g, dt) {
    const keep = [];
    for (const f of this.fx) {
      f.t += dt;
      if (f.t > f.life) continue;
      keep.push(f);
      if (f.t < 0) continue;
      const k = f.t / f.life;
      if (f.k === 'drop') {
        f.vy += 260 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
        g.fillStyle = `rgba(235,245,248,${1 - k})`; g.beginPath(); g.arc(f.x, f.y, 1.8, 0, Math.PI * 2); g.fill();
      } else if (f.k === 'ring') {
        g.strokeStyle = `rgba(235,245,248,${0.8 * (1 - k)})`; g.lineWidth = 1.5;
        g.beginPath(); g.ellipse(f.x, f.y, 6 + k * 26 * f.s, 2 + k * 6 * f.s, 0, 0, Math.PI * 2); g.stroke();
      } else if (f.k === 'spark') {
        f.vy += 200 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
        g.fillStyle = f.col; g.globalAlpha = 1 - k; g.fillRect(f.x - 1.5, f.y - 1.5, 3, 3); g.globalAlpha = 1;
      } else if (f.k === 'glow') {
        f.y += f.vy * dt;
        const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, 7);
        gr.addColorStop(0, `rgba(190,255,190,${1 - k})`); gr.addColorStop(1, 'rgba(120,255,140,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(f.x, f.y, 7, 0, Math.PI * 2); g.fill();
      } else if (f.k === 'wind') {
        const x = f.x + k * this.F.w * 0.6;
        g.strokeStyle = `rgba(240,250,255,${0.6 * Math.sin(k * Math.PI)})`; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x - 40, f.y); g.quadraticCurveTo(x, f.y - 8, x + 40, f.y); g.stroke();
      } else if (f.k === 'mist') {
        g.fillStyle = `rgba(178,140,255,${0.18 * Math.sin(k * Math.PI)})`;
        g.beginPath(); g.ellipse(f.x + k * 20, f.y, 50, 16, 0, 0, Math.PI * 2); g.fill();
      } else if (f.k === 'fire') {
        const x = lerp(f.x, f.tx, k); const y = lerp(f.y, f.ty, k) - Math.sin(k * Math.PI) * 30;
        const gr = g.createRadialGradient(x, y, 0, x, y, 9);
        gr.addColorStop(0, `rgba(255,240,170,${1 - k})`); gr.addColorStop(0.5, `rgba(255,120,30,${0.8 * (1 - k)})`); gr.addColorStop(1, 'rgba(120,30,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill();
      } else if (f.k === 'raven') {
        const x = f.x + k * (this.W + 120); const y = f.y + Math.sin(k * 12) * 6;
        drawEnemy(g, 'crow', x, y, 0.32, {t: f.t, facing: 1});
      } else if (f.k === 'hand') {
        const close = Math.min(1, k * 3);
        g.save(); g.translate(f.x, f.y - 30); g.globalAlpha = 1 - Math.max(0, k - 0.7) / 0.3;
        g.fillStyle = '#6b7a52'; g.strokeStyle = '#2a3020'; g.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const a = -0.9 + i * 0.6; const r = 60 - close * 25;
          g.beginPath(); g.moveTo(Math.cos(a) * 20, -60 + Math.sin(a) * 10);
          g.quadraticCurveTo(Math.cos(a) * r, -30, Math.cos(a) * (r - 10) * 0.6, 10 + close * 5);
          g.lineWidth = 10; g.strokeStyle = '#6b7a52'; g.stroke();
        }
        g.restore();
      }
    }
    this.fx = keep;
  }

  drawBolt(g, b0, dt) {
    b0.t += dt;
    const life = b0.far ? 0.35 : 0.55;
    if (b0.t > life) return false;
    const top = b0.far ? 0 : 0;
    let x = b0.x + Math.sin(b0.seed) * 30; let y = top;
    g.save();
    g.strokeStyle = `rgba(230,240,255,${1 - b0.t / life})`; g.lineWidth = b0.far ? 1.5 : 3;
    g.shadowColor = '#9fd0ff'; g.shadowBlur = 12;
    g.beginPath(); g.moveTo(x, y);
    let i = 0;
    while (y < b0.y) {
      y += 14 + ((Math.sin(b0.seed + i * 7.1) + 1) * 8);
      x += Math.sin(b0.seed * 3 + i * 2.3) * 14 + (b0.x - x) * 0.25;
      g.lineTo(x, Math.min(y, b0.y)); i++;
    }
    g.stroke();
    g.restore();
    return true;
  }

  drawWeather(g, dt, t) {
    const wx = this.b.weather;
    const W = this.W; const H = this.H;
    if (wx === 'rain' || wx === 'storm') {
      const n = wx === 'storm' ? 140 : 80;
      while (this.rain.length < n) this.rain.push({x: Math.random() * W * 1.2, y: Math.random() * H, v: 500 + Math.random() * 300});
      g.strokeStyle = wx === 'storm' ? 'rgba(200,215,225,0.45)' : 'rgba(210,225,235,0.35)'; g.lineWidth = 1;
      g.beginPath();
      for (const r of this.rain) {
        r.y += r.v * dt; r.x -= r.v * 0.25 * dt;
        if (r.y > H) { r.y = -10; r.x = Math.random() * W * 1.2; }
        g.moveTo(r.x, r.y); g.lineTo(r.x + 4, r.y - 14);
      }
      g.stroke();
    }
    if (wx === 'fog') {
      const gr = g.createLinearGradient(this.F.x + this.F.w * 0.35, 0, W, 0);
      gr.addColorStop(0, 'rgba(225,228,222,0)'); gr.addColorStop(1, 'rgba(225,228,222,0.55)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) {
        const x = ((t * 12 + i * 220) % (W + 400)) - 200; const y = this.F.y + (i / 6) * this.F.h;
        g.fillStyle = 'rgba(235,236,230,0.16)';
        g.beginPath(); g.ellipse(x, y, 220, 30, 0, 0, Math.PI * 2); g.fill();
      }
    }
    if (wx === 'storm') {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, 'rgba(10,14,20,0.3)'); gr.addColorStop(1, 'rgba(10,14,20,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
  }

  frame(dt) {
    const b = this.b;
    const g = this.ctx;
    const t = b.t + (this.wall = (this.wall || 0) + (b.paused ? dt * 0.4 : 0));
    this.consume();
    if (!this.bg) this.paintBackground();
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.W, this.H);
    let sx = 0; let sy = 0;
    if (this.shake > 0) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; this.shake = Math.max(0, this.shake - dt * 40); }
    g.save();
    g.translate(sx, sy);
    g.drawImage(this.bg, -8, -8, this.W + 16, this.H + 16);
    this.drawWaves(g, t);
    this.drawWarns(g, t);
    const order = b.units.slice().sort((a, c) => (a.slot - c.slot) || (a.fly ? 1 : 0) - (c.fly ? 1 : 0));
    for (const u of order) if (!u.fly) this.drawUnit(g, u, t);
    this.drawTentacles(g, t);
    for (const u of order) if (u.fly) this.drawUnit(g, u, t);
    this.drawProjectiles(g);
    // drain beams
    this.beams = this.beams.filter((bm) => {
      bm.t += dt; if (bm.t > bm.life) return false;
      const a = b.units.find((u) => u.id === bm.from); const c = b.units.find((u) => u.id === bm.to);
      if (!a || !c) return false;
      const pa = this.pos(a); const pc = this.pos(c);
      g.save(); g.strokeStyle = bm.col; g.globalAlpha = 1 - bm.t / bm.life; g.lineWidth = 4; g.shadowColor = bm.col; g.shadowBlur = 14;
      g.beginPath(); g.moveTo(pa.x - 20, pa.y - 30);
      for (let i = 1; i <= 10; i++) { const k = i / 10; g.lineTo(lerp(pa.x - 20, pc.x, k), lerp(pa.y - 30, pc.y - 20, k) + Math.sin(k * 20 + bm.t * 30) * 5); }
      g.stroke(); g.restore();
      return true;
    });
    this.drawFx(g, dt);
    // damage numbers
    this.texts = this.texts.filter((tx) => {
      tx.t += dt; if (tx.t > 1.1) return false;
      const y = tx.y - tx.t * 40;
      g.font = `700 ${tx.big ? 20 : 15}px Cinzel, Georgia, serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.globalAlpha = Math.min(1, 2.2 - tx.t * 2);
      g.lineWidth = 3; g.strokeStyle = 'rgba(20,14,8,0.85)'; g.strokeText(tx.text, tx.x, y);
      g.fillStyle = tx.col; g.fillText(tx.text, tx.x, y);
      g.globalAlpha = 1;
      return true;
    });
    this.bolts = this.bolts.filter((bo) => this.drawBolt(g, bo, dt));
    g.restore();
    this.drawWeather(g, dt, t);
    if (b.fx.odin > 0) {
      g.fillStyle = 'rgba(30,30,60,0.06)'; g.fillRect(0, 0, this.W, this.H);
    }
    if (this.flash > 0) {
      g.fillStyle = `rgba(235,242,255,${this.flash * 0.55})`; g.fillRect(0, 0, this.W, this.H);
      this.flash = Math.max(0, this.flash - dt * 3);
    }
    if (this.banner) {
      const bn = this.banner; bn.t += dt;
      if (bn.t > 1.8) this.banner = null;
      else {
        const a = Math.min(1, bn.t * 4, (1.8 - bn.t) * 3);
        const fs = Math.min(bn.big ? 46 : 28, this.W / 12);
        g.font = `700 ${fs}px Cinzel, Georgia, serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.globalAlpha = a;
        g.lineWidth = 6; g.strokeStyle = 'rgba(20,14,8,0.85)'; g.strokeText(bn.text, this.W / 2, this.F.y + this.F.h * 0.3);
        g.fillStyle = '#f6d36a'; g.fillText(bn.text, this.W / 2, this.F.y + this.F.h * 0.3);
        g.globalAlpha = 1;
      }
    }
  }
}
