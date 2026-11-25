// Calendar. Day 1 = 1 April 950. A plain 365-day year; month names glossed from the old
// Norse reckoning but laid on the Roman months so seasons are easy to read.
// No imports: state.js depends on this module.

export const MONTHS = ['Thorri', 'Goi', 'Lone Month', 'Cuckoo Month', 'Lambing Month', 'Sun Month',
  'Haymonth', 'Twomonth', 'Harvest Month', 'Slaughter Month', 'Frost Month', 'Yule Month'];
const LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const START = 31 + 28 + 31; // day-of-year index of 1 April (0-based)
const SEASON = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer',
  'autumn', 'autumn', 'autumn', 'winter'];
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export function date(day = 1) {
  const n = START + Math.max(1, Math.floor(day)) - 1;
  const year = 950 + Math.floor(n / 365);
  let doy = n % 365, month = 0;
  while (doy >= LEN[month]) { doy -= LEN[month]; month++; }
  const d = doy + 1;
  return {d, month, monthName: MONTHS[month], year, season: SEASON[month], label: `${d} ${MONTHS[month]} ${year}`};
}

/** Index into the goods' [spring, summer, autumn, winter] season curves. */
export const seasonIndex = (day) => SEASONS.indexOf(date(day).season);
/** Whole weeks since day 1 (prices refresh weekly). */
export const week = (day) => Math.floor((day - 1) / 7);
