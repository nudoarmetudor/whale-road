// Dialogue: speaker portrait on the left (others) or right (the hero), text typed at the
// chosen dialogue speed, tap anywhere to finish the line or advance. Returns a Promise.
import {h, L, portraitEl, sfx} from './dom.js';
import {S, D, cap} from './adapters.js';
import {typeDelay} from './options.js';

const NPC_NAMES = {jarl: 'The jarl', merchant: 'Merchant', shipwright: 'Shipwright', priest: 'Gothi', volva: 'Völva',
  runecarver: 'Rune-carver', guildmaster: 'Guild-master', banker: 'Silver-keeper', moneylender: 'Moneylender',
  barkeep: 'Alewife', skald: 'Skald', warehouse: 'Store-warden', raider: 'Raider', monk: 'Monk',
  byzantine_official: 'Logothete', slav_prince: 'Knyaz', saxon_reeve: 'Reeve', frank_count: 'Count', gael_king: 'King',
  aesti_elder: 'Elder', townsman: 'Townsman', townswoman: 'Townswoman'};
export const npcTitle = id => NPC_NAMES[id] || cap(String(id || '').replace(/_/g, ' '));

export function heroPortraitId() { return S()?.hero || 'ylva'; }
export function heroName() { const s = S(); return s?.name || D.heroes?.[s?.hero]?.name || 'You'; }

// lines: [{who:'npc'|'hero'|portraitId, text, name?}] or strings.
// opts: {npc: portraitId for 'npc' lines, npcName}
let active = false;
export function say(lines, opts = {}) {
  lines = (lines || []).map(l => typeof l === 'string' ? {who: 'npc', text: l} : l).filter(l => l && l.text);
  if (!lines.length) return Promise.resolve();
  return new Promise(resolve => {
    active = true;
    const layer = L().dialog;
    const port = h('div.dlg-portrait');
    const name = h('div.dlg-name');
    const text = h('p.dlg-text', {'aria-live': 'polite'});
    const more = h('span.dlg-more', '▼');
    const skip = h('button.btn.ghost.small.dlg-skip', {type: 'button'}, 'Skip');
    const box = h('div.dlg-box.frame', name, text, more);
    const el = h('div.dlg', {role: 'dialog', 'aria-label': 'Conversation'}, port, box, skip);
    layer.appendChild(el);
    let i = -1, timer = null, full = '', typed = 0;

    const finishLine = () => { clearTimeout(timer); timer = null; typed = full.length; text.textContent = full; el.classList.add('done'); };
    const next = () => {
      i++;
      if (i >= lines.length) return end();
      const l = lines[i];
      const isHero = l.who === 'hero';
      const pid = isHero ? heroPortraitId() : (l.who === 'npc' || !l.who) ? (opts.npc || 'townsman') : l.who;
      el.classList.toggle('right', isHero);
      el.classList.remove('done');
      port.innerHTML = '';
      port.appendChild(portraitEl(pid, isHero && S()?.look ? {look: S().look} : {}));
      name.textContent = l.name || (isHero ? heroName() : (l.who === 'npc' || !l.who) ? (opts.npcName || npcTitle(opts.npc)) : npcTitle(l.who));
      full = String(l.text); typed = 0; text.textContent = '';
      const d = typeDelay();
      if (!d) return finishLine();
      const tick = () => {
        typed = Math.min(full.length, typed + 2);
        text.textContent = full.slice(0, typed);
        if (typed < full.length) timer = setTimeout(tick, d); else finishLine();
      };
      tick();
    };
    const end = () => { clearTimeout(timer); el.remove(); document.removeEventListener('keydown', key, true); active = false; resolve(); };
    const advance = () => { sfx('click'); if (timer) finishLine(); else next(); };
    const key = e => {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); end(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); advance(); }
    };
    el.addEventListener('click', e => { if (e.target === skip) return; advance(); });
    skip.addEventListener('click', e => { e.stopPropagation(); end(); });
    document.addEventListener('keydown', key, true);
    next();
  });
}
export const talking = () => active;
