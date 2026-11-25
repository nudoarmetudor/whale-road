// Player options (per device) and profiles (each with its own feats, log and unlocks).
// Stored in localStorage; every read/write is guarded so private windows still work.
import {Au, G} from './adapters.js';

const OKEY = 'wr.options';
const DEFAULTS = {music: 0.6, sfx: 0.8, detail: 'high', sailSpeed: 1, dialogueSpeed: 'normal', tutorial: true, easy: true};
export const SAIL_SPEEDS = [[0.5, 'Slow'], [1, 'Normal'], [2, 'Fast'], [4, 'Very fast']];
export const DIALOGUE_SPEEDS = [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']];

const get = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ } };

export const opts = {...DEFAULTS, ...get(OKEY, {})};
export function setOpt(k, v) { opts[k] = v; put(OKEY, opts); applyOptions(); }

export function applyOptions() {
  try { Au.Music?.setVolume?.(opts.music); } catch { /* audio not ready */ }
  try { Au.Sfx?.setVolume?.(opts.sfx); } catch { /* audio not ready */ }
  const low = opts.detail === 'low';
  document.documentElement.classList.toggle('low', low);
  document.querySelectorAll('svg').forEach(svg => {
    try { if (low) svg.pauseAnimations?.(); else svg.unpauseAnimations?.(); } catch { /* not an SVG root */ }
  });
  G.speed = () => opts.sailSpeed;
  // Easy mode is part of the game state too (markers on the map read it).
  const S = G.state?.S;
  if (S?.fleet?.length && S.easy !== opts.easy) { try { G.state.setEasy?.(opts.easy); } catch { /* old state */ } }
}
// Freeze SMIL animations in freshly inserted SVG when detail is low.
export function settleSVG(root) {
  if (opts.detail !== 'low' || !root) return;
  root.querySelectorAll('svg').forEach(svg => { try { svg.pauseAnimations(); svg.setCurrentTime?.(0); } catch { /* ignore */ } });
}
export const typeDelay = () => ({slow: 38, normal: 22, fast: 9, instant: 0}[opts.dialogueSpeed] ?? 22);

// ------------------------------------------------------------------ profiles
// Profiles, saves and the ship's log belong to state.js (listProfiles, currentProfile,
// createProfile, selectProfile, deleteProfile, updateProfile, recordScore, log). The stub
// state implements the same calls, so the UI only ever talks to G.state.
const st = () => G.state || {};
export const profileList = () => { try { return st().listProfiles?.() || []; } catch { return []; } };
export const profile = () => { try { return st().currentProfile?.() || null; } catch { return null; } };
export function createProfile(name) { const r = st().createProfile?.(name); return r?.ok === false ? null : profile(); }
export function selectProfile(id) { return st().selectProfile?.(id); }
export function deleteProfile(id) { return st().deleteProfile?.(id) || {ok: false, msg: 'Cannot delete'}; }
export function updateProfile(fn) { try { return st().updateProfile?.(fn); } catch (err) { console.warn(err); } }
export const sagasDone = p => (p || profile())?.sagasDone || [];
export const heroUnlocked = id => ['ylva', 'bjarki', 'saeunn', 'hrafn'].includes(id) || sagasDone().length > 0;

// Ship's log: S.log [{day, text}], written through state.log().
export function logLine(text) {
  if (!text) return;
  try { st().log?.(String(text)); } catch (err) { console.warn('log', err); }
}
export function readLog() {
  const log = G.state?.S?.log || [];
  return log.slice().reverse().map(l => {
    let t = '';
    try { t = G.time.date(l.day).label; } catch { t = l.day ? 'Day ' + l.day : ''; }
    return {t, text: l.text};
  });
}
export function addScore(worth) {
  try { st().recordScore?.(worth); } catch (err) { console.warn(err); }
}
