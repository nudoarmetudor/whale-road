// Bank (10%/year, money only reachable in that town), moneylender (up to 2x net worth,
// 10%/month, due date; overdue = collectors at sea and no new loans), and warehouses.

import {S, ok, fail, here, emit, log} from '../state.js';
import {PORTS} from '../data/ports.js';
import {netWorth, cargoFree} from './fleet.js';

export const BANK_RATE = 0.10;      // per year
export const LOAN_RATE = 0.10;      // per 30 days, compounded daily
export const LOAN_DAYS = 60;        // a fresh loan is due in 60 days
export const WAREHOUSE_CAP = 1000;  // units per port
const DAY_BANK = 1 + BANK_RATE / 365;
const DAY_LOAN = Math.pow(1 + LOAN_RATE, 1 / 30);

const int = (n) => Math.floor(n);

// ---------------------------------------------------------------- bank
export function bankHere() {
  const port = S.port;
  return {port, has: here('bank'), amount: int((port && S.bank[port]) || 0), rate: BANK_RATE};
}
export function deposit(n) {
  n = int(n);
  if (!here('bank')) return fail('No bank here.');
  if (!(n > 0)) return fail('Choose an amount.');
  if (n > S.silver) return fail('You do not carry that much.');
  S.silver -= n;
  S.bank[S.port] = (S.bank[S.port] || 0) + n;
  emit('silver', S.silver);
  return ok({amount: int(S.bank[S.port])});
}
export function withdraw(n) {
  n = int(n);
  if (!here('bank')) return fail('No bank here.');
  const have = int(S.bank[S.port] || 0);
  if (!(n > 0)) return fail('Choose an amount.');
  if (n > have) return fail('Your deposit here is smaller.');
  S.bank[S.port] -= n;
  S.silver += n;
  emit('silver', S.silver);
  return ok({amount: int(S.bank[S.port])});
}

// ---------------------------------------------------------------- moneylender
export function loanStatus() {
  const amount = Math.ceil(S.debt.amount || 0);
  return {amount, due: amount ? S.debt.due : 0, overdue: amount > 0 && S.day > S.debt.due,
    daysLeft: amount ? S.debt.due - S.day : 0};
}
/** Most you may borrow now: total debt may not pass 2x net worth; nothing while overdue. */
export function loanMax() {
  if (loanStatus().overdue) return 0;
  return Math.max(0, int(2 * netWorth() - (S.debt.amount || 0)));
}
export function borrow(n) {
  n = int(n);
  if (!here('moneylender')) return fail('No moneylender here.');
  if (loanStatus().overdue) return fail('Pay what you owe first.');
  if (!(n > 0)) return fail('Choose an amount.');
  if (n > loanMax()) return fail('The moneylender will not lend that much.');
  if (!S.debt.amount) S.debt.due = S.day + LOAN_DAYS;
  S.debt.amount = (S.debt.amount || 0) + n;
  S.silver += n;
  S.stats.loans++;
  log(`Borrowed ${n} s, due on day ${S.debt.due}.`);
  emit('silver', S.silver);
  return ok({amount: Math.ceil(S.debt.amount), due: S.debt.due});
}
/** Repay at any moneylender. Paying it all clears the due date and the collectors. */
export function repay(n) {
  n = int(n);
  if (!here('moneylender')) return fail('No moneylender here.');
  const owed = Math.ceil(S.debt.amount || 0);
  if (!owed) return fail('You owe nothing.');
  n = Math.min(n, owed);
  if (!(n > 0)) return fail('Choose an amount.');
  if (n > S.silver) return fail('You do not carry that much.');
  S.silver -= n;
  S.debt.amount -= n;
  if (S.debt.amount < 1) { S.debt = {amount: 0, due: 0}; S.flags.debtRepaid = true; S.flags.overdueWarned = false; log('Debt paid in full.'); }
  emit('silver', S.silver);
  return ok(loanStatus());
}

/** One day of interest on deposits and debt (called by the clock). */
export function dailyInterest() {
  for (const p of Object.keys(S.bank)) S.bank[p] *= DAY_BANK;
  if (S.debt.amount > 0) {
    S.debt.amount *= DAY_LOAN;
    if (S.day > S.debt.due && !S.flags.overdueWarned) {
      S.flags.overdueWarned = true;
      log('Your loan is overdue. The moneylender has sent men to find you.');
    }
  }
}

// ---------------------------------------------------------------- warehouse
export function warehouseHere() {
  return S.port && here('warehouse') ? {...(S.warehouse[S.port] || {})} : {};
}
export function storeGoods(good, qty) {
  qty = int(qty);
  if (!here('warehouse')) return fail('No warehouse here.');
  if (!(qty > 0) || (S.cargo[good] || 0) < qty) return fail('You do not have that many.');
  const wh = (S.warehouse[S.port] ||= {});
  const used = Object.values(wh).reduce((a, b) => a + b, 0);
  if (used + qty > WAREHOUSE_CAP) return fail(`The warehouse holds ${WAREHOUSE_CAP} units.`);
  const paid = (S.whPaid[S.port] ||= {});
  paid[good] = ((paid[good] || 0) * (wh[good] || 0) + (S.cargoPaid[good] || 0) * qty) / ((wh[good] || 0) + qty);
  wh[good] = (wh[good] || 0) + qty;
  S.cargo[good] -= qty;
  if (!S.cargo[good]) { delete S.cargo[good]; delete S.cargoPaid[good]; }
  emit('cargo', S.cargo);
  return ok({stored: wh[good]});
}
export function takeGoods(good, qty) {
  qty = int(qty);
  if (!here('warehouse')) return fail('No warehouse here.');
  const wh = S.warehouse[S.port] || {};
  if (!(qty > 0) || (wh[good] || 0) < qty) return fail('Not that many stored here.');
  if (qty > cargoFree()) return fail('Not enough cargo room.');
  const have = S.cargo[good] || 0, paid = (S.whPaid[S.port] || {})[good] || 0;
  S.cargoPaid[good] = ((S.cargoPaid[good] || 0) * have + paid * qty) / (have + qty);
  S.cargo[good] = have + qty;
  wh[good] -= qty;
  if (!wh[good]) { delete wh[good]; if (S.whPaid[S.port]) delete S.whPaid[S.port][good]; }
  emit('cargo', S.cargo);
  return ok({stored: wh[good] || 0});
}

export const portHas = (port, b) => PORTS[port].buildings.includes(b);
