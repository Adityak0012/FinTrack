import { ApiError } from './ApiError.js';

/** "2026-10" -> { start, end } as UTC dates (end is exclusive). Defaults to the current month. */
export function monthRange(month) {
  const now = new Date();
  let y = now.getUTCFullYear();
  let m = now.getUTCMonth();
  if (month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new ApiError(400, 'Month must look like 2026-10');
    [y, m] = [Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1];
  }
  return { start: new Date(Date.UTC(y, m, 1)), end: new Date(Date.UTC(y, m + 1, 1)), key: `${y}-${String(m + 1).padStart(2, '0')}` };
}

export function shiftMonth(start, delta) {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + delta, 1));
}

export const monthKey = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
