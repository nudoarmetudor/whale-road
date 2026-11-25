// Rank from renown.
import {S} from '../state.js';
import {RANKS} from '../data/ranks.js';

/** {title, next (title or null), progress 0..1 toward next, renown, nextAt}. */
export function rank(renown = S.renown || 0) {
  let i = 0;
  while (i + 1 < RANKS.length && renown >= RANKS[i + 1].at) i++;
  const r = RANKS[i], n = RANKS[i + 1];
  return {title: r.title, next: n ? n.title : null, renown, nextAt: n ? n.at : null,
    progress: n ? (renown - r.at) / (n.at - r.at) : 1};
}
