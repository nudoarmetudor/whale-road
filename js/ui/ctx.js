// Shared hooks between screens. main.js fills `flow` at boot so screens can ask for
// navigation without importing main.js (avoids import cycles).
import {Au, D} from './adapters.js';

export const flow = {
  // filled by main.js
  toTitle() {}, toPort() {}, setSail() {}, newGame() {}, continueGame() {}, quit() {},
  openMenu() {}, refreshHud() {}, openBuilding() {},
};

const CULTURE_THEME = {norse: 'norse', dane: 'dane', svear: 'east', gotlander: 'east', aesti: 'east', wend: 'east',
  slav: 'slav', byzantine: 'byzantine', saxon: 'west', gael: 'west', anglonorse: 'west', frank: 'frank', island: 'island'};
export const themeFor = portId => CULTURE_THEME[D.ports?.[portId]?.culture] || 'norse';

let current = null;
export function music(theme) {
  if (!theme || theme === current) return;
  current = theme;
  try { Au.Music?.play?.(theme); } catch (err) { console.warn('music', err); }
}
let audioReady = false;
export function initAudio() {
  if (audioReady) return;
  audioReady = true;
  try { Au.Music?.init?.(); } catch (err) { console.warn('audio init', err); }
}
