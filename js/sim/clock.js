// The clock: passing days ticks markets, interest and task time limits.

import {S, ok, fail, emit} from '../state.js';
import {tick, recordSeen} from './economy.js';
import {dailyInterest} from './bank.js';
import {checkTimeouts} from './quests.js';

export function passDays(n = 1) {
  for (let i = 0; i < n; i++) {
    S.day++;
    tick(1);
    dailyInterest();
    checkTimeouts();
  }
  if (n > 0) { emit('day', S.day); emit('silver', S.silver); }
}

/** Wait in port for n days (prices move, interest runs). */
export function wait(n = 1) {
  if (!S.port) return fail('You are at sea.');
  passDays(Math.max(1, Math.floor(n)));
  recordSeen(S.port);
  return ok({day: S.day});
}
